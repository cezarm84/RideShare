from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
import uuid

# Address schema for structured address handling
class AddressBase(BaseModel):
    recipient_name: Optional[str] = None
    street: str
    house_number: str
    post_code: str
    city: str
    country: Optional[str] = "Sweden"

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    recipient_name: Optional[str] = None
    street: Optional[str] = None
    house_number: Optional[str] = None
    post_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

class AddressInDBBase(AddressBase):
    id: int
    coordinates: Optional[str] = None
    
    class Config:
        from_attributes = True

class AddressResponse(AddressInDBBase):
    @property
    def formatted_address(self):
        """Return formatted address as a string"""
        parts = []
        if self.recipient_name:
            parts.append(self.recipient_name)
        parts.append(f"{self.street} {self.house_number}")
        parts.append(f"{self.post_code} {self.city}")
        if self.country:
            parts.append(self.country)
        return "\n".join(parts)

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: str
    home_address: Optional[str] = None
    work_address: Optional[str] = None
    user_type: str = "private"  # "private", "enterprise", or "admin"
    
    # Explicit location coordinates
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    work_latitude: Optional[float] = None
    work_longitude: Optional[float] = None

# Extended user base with structured address support
class UserBaseExtended(UserBase):
    # Legacy fields for backward compatibility
    home_address: Optional[str] = None
    work_address: Optional[str] = None
    
    # New structured fields
    home_street: Optional[str] = None
    home_house_number: Optional[str] = None
    home_post_code: Optional[str] = None
    home_city: Optional[str] = None
    
    work_street: Optional[str] = None
    work_house_number: Optional[str] = None
    work_post_code: Optional[str] = None
    work_city: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    enterprise_id: Optional[int] = None
    employee_id: Optional[str] = None
    
    # Structured address fields (optional to maintain backward compatibility)
    home_street: Optional[str] = None
    home_house_number: Optional[str] = None
    home_post_code: Optional[str] = None
    home_city: Optional[str] = None
    
    work_street: Optional[str] = None
    work_house_number: Optional[str] = None
    work_post_code: Optional[str] = None
    work_city: Optional[str] = None
    
    @validator('user_type')
    def validate_user_type(cls, v):
        valid_types = ["private", "enterprise", "admin"]
        if v not in valid_types:
            raise ValueError(f"User type must be one of {valid_types}")
        return v
    
    @validator('enterprise_id', 'employee_id')
    def validate_enterprise_fields(cls, v, values):
        # If user_type is enterprise, enterprise_id and employee_id should be provided
        if 'user_type' in values and values['user_type'] == 'enterprise':
            if v is None:
                raise ValueError("Enterprise ID and employee ID are required for enterprise users")
        return v

# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None
    home_address: Optional[str] = None
    work_address: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Structured address fields
    home_street: Optional[str] = None
    home_house_number: Optional[str] = None
    home_post_code: Optional[str] = None
    home_city: Optional[str] = None
    
    work_street: Optional[str] = None
    work_house_number: Optional[str] = None
    work_post_code: Optional[str] = None
    work_city: Optional[str] = None
    
    # Explicit location coordinates
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    work_latitude: Optional[float] = None
    work_longitude: Optional[float] = None
    
    # Enterprise fields
    enterprise_id: Optional[int] = None
    employee_id: Optional[str] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    user_id: str = Field(default_factory=lambda: f"UID-{uuid.uuid4().hex[:8].upper()}")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Config:
        from_attributes = True

# Properties to return via API
class UserResponse(UserInDBBase):
    home_coordinates: Optional[tuple] = None
    work_coordinates: Optional[tuple] = None
    
    @property
    def full_name(self):
        """Return user's full name"""
        return f"{self.first_name} {self.last_name}"
        
    @property
    def formatted_home_address(self):
        """Return formatted home address as a string if components are available"""
        if all([self.home_street, self.home_city]):
            parts = []
            parts.append(f"{self.home_street} {self.home_house_number or ''}")
            parts.append(f"{self.home_post_code or ''} {self.home_city}")
            return ", ".join(filter(None, parts))
        return self.home_address
        
    @property
    def formatted_work_address(self):
        """Return formatted work address as a string if components are available"""
        if all([self.work_street, self.work_city]):
            parts = []
            parts.append(f"{self.work_street} {self.work_house_number or ''}")
            parts.append(f"{self.work_post_code or ''} {self.work_city}")
            return ", ".join(filter(None, parts))
        return self.work_address

class TokenResponse(BaseModel):
    """Schema for token response after authentication"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    user_type: str

# Enterprise properties
class EnterpriseBase(BaseModel):
    name: str
    is_active: bool = True

class EnterpriseCreate(EnterpriseBase):
    # Structured address fields
    street: Optional[str] = None
    house_number: Optional[str] = None
    post_code: Optional[str] = None
    city: Optional[str] = None
    # Legacy field for backward compatibility
    address: Optional[str] = None

class EnterpriseUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    # Structured address fields
    street: Optional[str] = None
    house_number: Optional[str] = None
    post_code: Optional[str] = None
    city: Optional[str] = None
    # Legacy field for backward compatibility
    address: Optional[str] = None

class EnterpriseInDBBase(EnterpriseBase):
    id: int
    
    class Config:
        from_attributes = True

class EnterpriseResponse(EnterpriseInDBBase):
    address: Optional[AddressResponse] = None

# Enterprise User properties
class EnterpriseUserBase(BaseModel):
    user_id: int
    enterprise_id: int
    employee_id: str
    department: Optional[str] = None
    position: Optional[str] = None

class EnterpriseUserCreate(EnterpriseUserBase):
    pass

class EnterpriseUserUpdate(BaseModel):
    department: Optional[str] = None
    position: Optional[str] = None

class EnterpriseUserInDBBase(EnterpriseUserBase):
    id: int
    
    class Config:
        from_attributes = True

class EnterpriseUserResponse(EnterpriseUserInDBBase):
    pass

# Full user response with enterprise details
class UserWithEnterpriseResponse(UserResponse):
    enterprise: Optional[EnterpriseResponse] = None
    enterprise_user: Optional[EnterpriseUserResponse] = None
