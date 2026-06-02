import os
import sys

# Ensure backend folder is in PYTHONPATH for serverless import resolution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app
