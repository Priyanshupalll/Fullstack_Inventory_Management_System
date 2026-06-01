from pydantic import BaseModel, EmailStr, Field, field_validator
from decimal import Decimal
from typing import List, Optional
from datetime import datetime

# ==========================================
# PRODUCT SCHEMAS
# ==========================================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    sku: str = Field(..., min_length=1, max_length=100, description="Unique stock keeping unit")
    price: Decimal = Field(..., description="Product unit price")
    quantity_in_stock: int = Field(..., description="Quantity available in inventory")

    @field_validator('price')
    @classmethod
    def validate_price(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @field_validator('quantity_in_stock')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# CUSTOMER SCHEMAS
# ==========================================
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name of customer")
    email: EmailStr = Field(..., description="Unique email address")
    phone_number: Optional[str] = Field(None, max_length=50, description="Optional phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# ORDER SCHEMAS
# ==========================================
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="ID of the product being ordered")
    quantity: int = Field(..., description="Quantity of product being ordered")

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity ordered must be greater than zero")
        return v

class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order")

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    price_at_order: Decimal
    quantity: int

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


# ==========================================
# UTILITY SCHEMAS
# ==========================================
class SystemStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]


# ==========================================
# USER & AUTH SCHEMAS
# ==========================================
class UserRegister(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, max_length=100, description="Secure account password")
    full_name: Optional[str] = Field(None, max_length=255, description="Optional full name")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="Account password")

class GoogleAuth(BaseModel):
    credential: str = Field(..., description="Google ID Token / Credential string")

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
