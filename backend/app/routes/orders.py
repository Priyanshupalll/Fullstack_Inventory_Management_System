from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, services

router = APIRouter(prefix="/orders", tags=["Orders"])

def serialize_order(order: models.Order) -> dict:
    """Helper to convert Order ORM to schema dict, avoiding complex lazy-loading issues."""
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name if order.customer else "Unknown Customer",
        "total_amount": order.total_amount,
        "created_at": order.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Deleted Product",
                "product_sku": item.product.sku if item.product else "N/A",
                "price_at_order": item.product.price if item.product else 0.00,
                "quantity": item.quantity
            } for item in order.items
        ]
    }

@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_new_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = services.create_order(db, order_data)
    return serialize_order(db_order)

@router.get("", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.id.desc()).all()
    return [serialize_order(order) for order in orders]

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return serialize_order(db_order)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_order(order_id: int, db: Session = Depends(get_db)):
    services.delete_order(db, order_id)
    return None
