"""Email domain configuration for RideShare."""

# Base domain for all RideShare emails
SYSTEM_DOMAIN = "rideshare.com"

# Driver subdomain
DRIVER_DOMAIN = f"driver.{SYSTEM_DOMAIN}"

# Enterprise domains
ENTERPRISE_DOMAINS = {
    "volvo": f"volvo.{SYSTEM_DOMAIN}",
    "ikea": f"ikea.{SYSTEM_DOMAIN}",
    "saab": f"saab.{SYSTEM_DOMAIN}",
    "ericsson": f"ericsson.{SYSTEM_DOMAIN}",
}

# System email addresses
ADMIN_EMAIL = f"admin@{SYSTEM_DOMAIN}"
SUPPORT_EMAIL = f"support@{SYSTEM_DOMAIN}"
NOREPLY_EMAIL = f"noreply@{SYSTEM_DOMAIN}"

def is_system_email(email):
    """Check if an email is a system email."""
    return email.endswith(f"@{SYSTEM_DOMAIN}") and not is_driver_email(email) and not is_enterprise_email(email)

def is_driver_email(email):
    """Check if an email is a driver email."""
    return email.endswith(f"@{DRIVER_DOMAIN}")

def is_enterprise_email(email):
    """Check if an email is an enterprise email."""
    for domain in ENTERPRISE_DOMAINS.values():
        if email.endswith(f"@{domain}"):
            return True
    return False

def get_enterprise_from_email(email):
    """Get the enterprise key from an email address."""
    for key, domain in ENTERPRISE_DOMAINS.items():
        if email.endswith(f"@{domain}"):
            return key
    return None

def generate_driver_email(first_name, last_name, driver_id=None):
    """Generate a driver email address."""
    if driver_id:
        return f"driver{driver_id}@{DRIVER_DOMAIN}"
    return f"{first_name.lower()}.{last_name.lower()}@{DRIVER_DOMAIN}"

def generate_enterprise_email(first_name, last_name, enterprise_key):
    """Generate an enterprise email address."""
    if enterprise_key not in ENTERPRISE_DOMAINS:
        # Use the enterprise key as a custom domain
        domain = f"{enterprise_key.lower()}.{SYSTEM_DOMAIN}"
    else:
        domain = ENTERPRISE_DOMAINS[enterprise_key]
    
    return f"{first_name.lower()}.{last_name.lower()}@{domain}"

def generate_system_email(role="support"):
    """Generate a system email address."""
    if role == "admin":
        return ADMIN_EMAIL
    elif role == "noreply":
        return NOREPLY_EMAIL
    else:
        return SUPPORT_EMAIL
