"""
Background tasks for vehicle inspection management.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.driver import DriverVehicle
from app.services.notification_service import NotificationService
import logging

logger = logging.getLogger(__name__)

def check_inspection_dates():
    """
    Check vehicle inspection dates and update statuses.
    This task should run daily.
    """
    db = SessionLocal()
    try:
        # Get current date
        today = datetime.now().date()
        
        # 1. Find vehicles with passed inspection but expired next_inspection_date
        expired_vehicles = db.query(DriverVehicle).filter(
            DriverVehicle.inspection_status == "passed",
            DriverVehicle.next_inspection_date < today
        ).all()
        
        # Update expired vehicles to pending status
        for vehicle in expired_vehicles:
            logger.info(f"Updating vehicle {vehicle.id} inspection status from passed to pending (expired)")
            vehicle.inspection_status = "pending"
            
            # Notify driver and admin
            try:
                NotificationService.send_inspection_expired_notification(db, vehicle)
            except Exception as e:
                logger.error(f"Failed to send expired notification for vehicle {vehicle.id}: {str(e)}")
        
        # 2. Find vehicles approaching inspection deadline (within 7 days)
        approaching_deadline = today + timedelta(days=7)
        upcoming_vehicles = db.query(DriverVehicle).filter(
            DriverVehicle.inspection_status == "passed",
            DriverVehicle.next_inspection_date <= approaching_deadline,
            DriverVehicle.next_inspection_date >= today
        ).all()
        
        # Send notifications for upcoming inspections
        for vehicle in upcoming_vehicles:
            days_remaining = (vehicle.next_inspection_date - today).days
            logger.info(f"Vehicle {vehicle.id} inspection expires in {days_remaining} days")
            
            try:
                NotificationService.send_inspection_reminder_notification(db, vehicle, days_remaining)
            except Exception as e:
                logger.error(f"Failed to send reminder notification for vehicle {vehicle.id}: {str(e)}")
        
        # Commit all changes
        db.commit()
        logger.info(f"Updated {len(expired_vehicles)} expired vehicles and notified about {len(upcoming_vehicles)} upcoming inspections")
        
    except Exception as e:
        logger.error(f"Error in check_inspection_dates task: {str(e)}")
        db.rollback()
    finally:
        db.close()
