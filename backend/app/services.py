from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from . import models, schemas

def create_order(db: Session, order_data: schemas.OrderCreate) -> models.Order:
    """
    Creates an order in a thread-safe database transaction.
    """
    try:
        # 1. Validate Customer
        customer = db.query(models.Customer).filter(models.Customer.id == order_data.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {order_data.customer_id} does not exist."
            )

        total_amount = Decimal("0.00")
        order_items_to_create = []

        # Group order items by product_id to handle duplicates in the same order request
        grouped_items = {}
        for item in order_data.items:
            grouped_items[item.product_id] = grouped_items.get(item.product_id, 0) + item.quantity

        # 2. Process and lock products
        for product_id, quantity in grouped_items.items():
            # Use with_for_update() to lock the product row for concurrency safety
            product = db.query(models.Product).filter(models.Product.id == product_id).with_for_update().first()
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product with ID {product_id} does not exist."
                )

            if product.quantity_in_stock < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Available: {product.quantity_in_stock}, Requested: {quantity}."
                )

            # Deduct inventory
            product.quantity_in_stock -= quantity
            
            # Calculate item cost and add to total
            item_total = product.price * quantity
            total_amount += item_total

            # Stage OrderItem
            order_item = models.OrderItem(
                product_id=product_id,
                quantity=quantity
            )
            order_items_to_create.append(order_item)

        # 3. Create Order
        db_order = models.Order(
            customer_id=order_data.customer_id,
            total_amount=total_amount
        )
        db.add(db_order)
        db.flush() # Populate db_order.id

        # 4. Save items with populated order_id
        for item in order_items_to_create:
            item.order_id = db_order.id
            db.add(item)

        db.commit()
        db.refresh(db_order)
        return db_order

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while placing the order: {str(e)}"
        )

def delete_order(db: Session, order_id: int):
    """
    Deletes an order and restores the product quantities in stock.
    Runs inside a transactional rollback safety net.
    """
    try:
        order = db.query(models.Order).filter(models.Order.id == order_id).with_for_update().first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {order_id} does not exist."
            )

        # Restore product quantities
        for item in order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if product:
                product.quantity_in_stock += item.quantity

        db.delete(order)
        db.commit()
        return True
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while deleting the order: {str(e)}"
        )
