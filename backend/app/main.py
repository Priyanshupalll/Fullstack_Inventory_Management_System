from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import os

from .database import engine, Base, get_db
from .config import settings
from .routes import products, customers, orders, auth
from . import models, schemas

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Create all database tables on startup if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Auto-seed a default administrator profile if not already present
        from .database import SessionLocal
        from . import auth as auth_utils
        db = SessionLocal()
        try:
            admin_email = "admin@enterprise.com"
            if not db.query(models.User).filter(models.User.email == admin_email).first():
                db_user = models.User(
                    email=admin_email,
                    hashed_password=auth_utils.hash_password("adminpassword"),
                    full_name="System Administrator"
                )
                db.add(db_user)
                db.commit()
        except Exception as e:
            print(f"[Lifespan Seed Alert] {str(e)}")
        finally:
            db.close()
    except Exception as e:
        print(f"[Database Init Alert] {str(e)}")
        
    yield

app = FastAPI(
    title="Inventory & Order Management System API",
    description="A highly-performant production-ready API for managing products, customers, and transactions.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = settings.cors_origins_list
allow_all = "*" in origins or (len(origins) == 1 and origins[0] == "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (Mount API endpoints first)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)

# Health check endpoint
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENV,
        "database": "connected"
    }

# Dashboard API endpoint
@app.get("/dashboard/stats", response_model=schemas.SystemStats, tags=["System"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    low_stock_products = db.query(models.Product).filter(models.Product.quantity_in_stock < 10).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }

# Dynamic Frontend Serving System
# Locate compiled React Vite dist folder
frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

# Mount assets directory for CSS, JS, and image loading
assets_path = os.path.join(frontend_dist_path, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

# Catch-all route to serve the built index.html for client-side React Router navigation
@app.get("/{catchall:path}", tags=["Frontend"])
async def serve_frontend(catchall: str):
    # Skip matching common API prefix routes just in case to avoid circular routing
    if catchall.startswith(("products", "customers", "orders", "health", "dashboard")):
        return FileResponse(os.path.join(frontend_dist_path, "index.html")) # Serve index.html or raise 404
        
    index_file = os.path.join(frontend_dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "status": "error",
        "detail": "Frontend static build not found. Please compile the frontend by running 'npm run build'."
    }
