"""
Task scheduler for background tasks.
"""
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Try to import APScheduler, but don't fail if it's not available
try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    SCHEDULER_AVAILABLE = True
except ImportError:
    logger.warning("APScheduler not installed. Scheduled tasks will not run automatically.")
    SCHEDULER_AVAILABLE = False

from app.tasks.inspection_tasks import check_inspection_dates

class TaskScheduler:
    """
    Scheduler for background tasks.
    """
    def __init__(self):
        if not SCHEDULER_AVAILABLE:
            self.scheduler = None
            logger.warning("Scheduler not available. Install APScheduler package to enable scheduled tasks.")
            return
            
        self.scheduler = AsyncIOScheduler()
        self._setup_tasks()
        
    def _setup_tasks(self):
        """Set up scheduled tasks"""
        if not SCHEDULER_AVAILABLE or not self.scheduler:
            return
            
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
        if not SCHEDULER_AVAILABLE or not self.scheduler:
            logger.warning("Cannot start scheduler: APScheduler not available")
            return
            
        self.scheduler.start()
        logger.info("Task scheduler started")
        
    def shutdown(self):
        """Shutdown the scheduler"""
        if not SCHEDULER_AVAILABLE or not self.scheduler:
            logger.warning("Cannot shutdown scheduler: APScheduler not available")
            return
            
        self.scheduler.shutdown()
        logger.info("Task scheduler shutdown")
        
    def run_inspection_check_now(self):
        """Manually run the inspection check"""
        try:
            logger.info("Manually running inspection check")
            check_inspection_dates()
            logger.info("Manual inspection check completed")
            return True
        except Exception as e:
            logger.error(f"Error running manual inspection check: {str(e)}")
            return False
        
# Singleton instance
scheduler = TaskScheduler()
