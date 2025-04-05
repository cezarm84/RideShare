import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models.ride import Ride, RideBooking
from app.models.user import User
from app.models.payment import Payment
from typing import Dict, List

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_ride_usage_summary(self, start_date: datetime = None, end_date: datetime = None) -> Dict:
        """
        Get a summary of ride usage over a specified period.
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)  # Default: last 30 days
        if not end_date:
            end_date = datetime.utcnow()

        try:
            total_rides = self.db.query(Ride).filter(
                Ride.departure_time.between(start_date, end_date)
            ).count()

            completed_rides = self.db.query(Ride).filter(
                Ride.departure_time.between(start_date, end_date),
                Ride.status == "completed"
            ).count()

            total_bookings = self.db.query(RideBooking).filter(
                RideBooking.booking_time.between(start_date, end_date)
            ).count()

            total_revenue = self.db.query(func.sum(Payment.amount)).filter(
                Payment.payment_time.between(start_date, end_date),
                Payment.status == "completed"
            ).scalar() or 0.0

            summary = {
                "total_rides_scheduled": total_rides,
                "completed_rides": completed_rides,
                "total_bookings": total_bookings,
                "total_revenue_sek": float(total_revenue),
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat()
            }
            logger.info(f"Ride usage summary generated: {summary}")
            return summary
        except Exception as e:
            logger.error(f"Failed to generate ride usage summary: {str(e)}")
            return {"error": "Failed to generate summary"}

    def get_user_activity(self, user_id: int) -> Dict:
        """
        Get activity statistics for a specific user.
        """
        try:
            bookings = self.db.query(RideBooking).filter(RideBooking.user_id == user_id).all()
            payments = self.db.query(Payment).filter(Payment.user_id == user_id).all()

            total_bookings = len(bookings)
            completed_bookings = len([b for b in bookings if b.status == "completed"])
            total_spent = sum(p.amount for p in payments if p.status == "completed")

            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"User {user_id} not found for activity report")
                return {"error": "User not found"}

            activity = {
                "user_id": user_id,
                "email": user.email,
                "total_bookings": total_bookings,
                "completed_bookings": completed_bookings,
                "total_spent_sek": float(total_spent),
                "last_booking": max((b.booking_time for b in bookings), default=None)
            }
            logger.info(f"User activity generated for user {user_id}: {activity}")
            return activity
        except Exception as e:
            logger.error(f"Failed to generate user activity for {user_id}: {str(e)}")
            return {"error": "Failed to generate activity"}

    def get_enterprise_usage(self, enterprise_id: int) -> Dict:
        """
        Get ride usage statistics for an enterprise.
        """
        try:
            enterprise_users = self.db.query(User).join(
                EnterpriseUser, User.id == EnterpriseUser.user_id
            ).filter(EnterpriseUser.enterprise_id == enterprise_id).all()

            user_ids = [u.id for u in enterprise_users]
            bookings = self.db.query(RideBooking).filter(RideBooking.user_id.in_(user_ids)).all()
            payments = self.db.query(Payment).filter(Payment.user_id.in_(user_ids)).all()

            total_bookings = len(bookings)
            total_spent = sum(p.amount for p in payments if p.status == "completed")

            summary = {
                "enterprise_id": enterprise_id,
                "total_users": len(user_ids),
                "total_bookings": total_bookings,
                "total_spent_sek": float(total_spent),
                "average_bookings_per_user": total_bookings / len(user_ids) if user_ids else 0
            }
            logger.info(f"Enterprise usage generated for enterprise {enterprise_id}: {summary}")
            return summary
        except Exception as e:
            logger.error(f"Failed to generate enterprise usage for {enterprise_id}: {str(e)}")
            return {"error": "Failed to generate enterprise usage"}