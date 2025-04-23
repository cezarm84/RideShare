"""API endpoints for testing email domains."""

from datetime import datetime, timezone
from typing import Dict, Any, Optional

from faker import Faker
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.email_domains import (DRIVER_DOMAIN, ENTERPRISE_DOMAINS,
                                   SYSTEM_DOMAIN, generate_driver_email,
                                   generate_enterprise_email, generate_system_email)
from app.core.security import get_current_admin_user
from app.db.session import get_db
from app.models.driver import DriverProfile
from app.models.enterprise import Enterprise
from app.models.inbox_email import InboxEmail
from app.models.test_email import TestEmail
from app.models.user import User

router = APIRouter()


@router.get("/domain-info")
async def get_domain_info(
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get information about the email domains.
    """
    return {
        "system_domain": SYSTEM_DOMAIN,
        "driver_domain": DRIVER_DOMAIN,
        "enterprise_domains": ENTERPRISE_DOMAINS,
        "system_emails": {
            "admin": generate_system_email("admin"),
            "support": generate_system_email("support"),
            "noreply": generate_system_email("noreply")
        }
    }


@router.post("/test-domain-email")
async def test_domain_email(
    email_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Test sending an email between domains.
    
    This endpoint allows testing sending emails between:
    - System to user/driver/enterprise
    - User to system
    - Driver to system
    - Enterprise to system
    """
    from_type = email_data.get("from_type", "system")  # system, user, driver, enterprise
    to_type = email_data.get("to_type", "user")  # system, user, driver, enterprise
    subject = email_data.get("subject", "Test Email")
    content = email_data.get("content", "This is a test email")
    
    # Generate HTML content
    html_content = f"<h1>{subject}</h1><p>{content}</p>"
    
    # Get or generate from_email
    from_email = email_data.get("from_email")
    if not from_email:
        if from_type == "system":
            from_email = generate_system_email()
        elif from_type == "driver":
            # Get a random driver or generate a fake one
            driver = db.query(DriverProfile).first()
            if driver and driver.user:
                from_email = driver.user.email
            else:
                fake = Faker()
                from_email = generate_driver_email(fake.first_name(), fake.last_name())
        elif from_type == "enterprise":
            # Get a random enterprise user or generate a fake one
            enterprise_user = db.query(User).filter(User.user_type == "enterprise").first()
            if enterprise_user:
                from_email = enterprise_user.email
            else:
                fake = Faker()
                # Get a random enterprise
                enterprise = db.query(Enterprise).first()
                if enterprise:
                    enterprise_key = enterprise.name.lower().replace(" ", "")
                else:
                    enterprise_key = "volvo"  # Default if no enterprises exist
                from_email = generate_enterprise_email(fake.first_name(), fake.last_name(), enterprise_key)
        else:  # Regular user
            # Get a random user or generate a fake one
            user = db.query(User).filter(User.user_type == "private").first()
            if user:
                from_email = user.email
            else:
                fake = Faker()
                from_email = fake.email()
    
    # Get or generate to_email
    to_email = email_data.get("to_email")
    if not to_email:
        if to_type == "system":
            to_email = generate_system_email()
        elif to_type == "driver":
            # Get a random driver or generate a fake one
            driver = db.query(DriverProfile).first()
            if driver and driver.user:
                to_email = driver.user.email
            else:
                fake = Faker()
                to_email = generate_driver_email(fake.first_name(), fake.last_name())
        elif to_type == "enterprise":
            # Get a random enterprise user or generate a fake one
            enterprise_user = db.query(User).filter(User.user_type == "enterprise").first()
            if enterprise_user:
                to_email = enterprise_user.email
            else:
                fake = Faker()
                # Get a random enterprise
                enterprise = db.query(Enterprise).first()
                if enterprise:
                    enterprise_key = enterprise.name.lower().replace(" ", "")
                else:
                    enterprise_key = "volvo"  # Default if no enterprises exist
                to_email = generate_enterprise_email(fake.first_name(), fake.last_name(), enterprise_key)
        else:  # Regular user
            # Get a random user or generate a fake one
            user = db.query(User).filter(User.user_type == "private").first()
            if user:
                to_email = user.email
            else:
                fake = Faker()
                to_email = fake.email()
    
    # Create the test email
    test_email = TestEmail(
        to_email=to_email,
        from_email=from_email,
        subject=subject,
        html_content=html_content,
        text_content=content,
        created_at=datetime.now(timezone.utc)
    )
    
    # Create the inbox email
    inbox_email = InboxEmail(
        to_email=to_email,
        from_email=from_email,
        subject=subject,
        html_content=html_content,
        text_content=content,
        created_at=datetime.now(timezone.utc),
        read=False,
        replied=False
    )
    
    db.add(test_email)
    db.add(inbox_email)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Test email sent from {from_email} to {to_email}",
        "email_id": test_email.id,
        "inbox_id": inbox_email.id,
        "from_type": from_type,
        "to_type": to_type
    }


@router.post("/generate-domain-users")
async def generate_domain_users(
    user_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Generate users with specific domain emails.
    
    This endpoint allows generating:
    - Driver users with @driver.rideshare.com emails
    - Enterprise users with @enterprise.rideshare.com emails
    """
    domain_type = user_data.get("domain_type", "driver")  # driver, enterprise
    count = min(int(user_data.get("count", 5)), 50)  # Limit to 50 users
    enterprise_id = user_data.get("enterprise_id")
    
    fake = Faker()
    created_users = []
    
    if domain_type == "driver":
        # Generate driver users
        for i in range(count):
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = generate_driver_email(first_name, last_name, i+1)
            
            # Create user
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_verified=True,
                user_type="driver",
                hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # "password"
            )
            db.add(user)
            db.flush()  # Get the user ID
            
            # Create driver profile
            driver = DriverProfile(
                user_id=user.id,
                phone_number=fake.phone_number(),
                address=fake.address(),
                city=fake.city(),
                postal_code=fake.postcode(),
                country="Sweden",
                license_number=fake.uuid4(),
                license_expiry=fake.future_date(),
                is_active=True,
                rating=round(fake.random.uniform(3.5, 5.0), 1)
            )
            db.add(driver)
            
            created_users.append({
                "id": user.id,
                "email": email,
                "name": f"{first_name} {last_name}",
                "type": "driver"
            })
    
    elif domain_type == "enterprise":
        # Get the enterprise
        if enterprise_id:
            enterprise = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
            if not enterprise:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Enterprise not found"
                )
        else:
            # Get a random enterprise
            enterprise = db.query(Enterprise).first()
            if not enterprise:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No enterprises found"
                )
        
        enterprise_key = enterprise.name.lower().replace(" ", "")
        
        # Generate enterprise users
        for i in range(count):
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = generate_enterprise_email(first_name, last_name, enterprise_key)
            
            # Create user
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_verified=True,
                user_type="enterprise",
                hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # "password"
            )
            db.add(user)
            
            created_users.append({
                "id": user.id,
                "email": email,
                "name": f"{first_name} {last_name}",
                "type": "enterprise",
                "enterprise": enterprise.name
            })
    
    db.commit()
    
    return {
        "status": "success",
        "message": f"Generated {len(created_users)} {domain_type} users",
        "users": created_users
    }
