"""
Task scheduler for background tasks.
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.tasks.inspection_tasks import check_inspection_dates

logger = logging.getLogger(__name__)

class TaskScheduler:
    """
    Scheduler for background tasks.
    """
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._setup_tasks()
        
    def _setup_tasks(self):
        """Set up scheduled tasks"""
        # Run inspection check daily at 1:00 AM
        self.scheduler.add_job(
            check_inspection_dates,
            CronTrigger(hour=1, minute=0),
            id="check_inspection_dates",
            replace_existing=True
        )
        
        logger.info("Scheduled tasks have been set up")
        
    def start(self):
        """Start the scheduler"""
        self.scheduler.start()
        logger.info("Task scheduler started")
        
    def shutdown(self):
        """Shutdown the scheduler"""
        self.scheduler.shutdown()
        logger.info("Task scheduler shutdown")
        
# Singleton instance
scheduler = TaskScheduler()
