import logging

from fastapi import FastAPI

from app.core.middleware import register_exception_handlers

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Student Management System",
    version="1.0.0",
)

register_exception_handlers(app)
