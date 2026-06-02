import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

db_url = settings.DATABASE_URL

# Vercel specific SQLite handling: copy template DB to writeable /tmp directory
if db_url.startswith("sqlite") and os.environ.get("VERCEL"):
    tmp_db_path = "/tmp/inventory.db"
    source_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../inventory.db"))
    
    if not os.path.exists(tmp_db_path):
        try:
            if os.path.exists(source_db_path):
                shutil.copy2(source_db_path, tmp_db_path)
                print(f"[Vercel DB Init] Copied seed database to {tmp_db_path}")
            else:
                print(f"[Vercel DB Init] Seed database not found at {source_db_path}")
        except Exception as e:
            print(f"[Vercel DB Copy Error] {str(e)}")
            
    db_url = f"sqlite:///{tmp_db_path}"

# Modify PostgreSQL URL if necessary
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Create engine
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True
    )

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
