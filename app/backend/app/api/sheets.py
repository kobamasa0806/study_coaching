# app/api/sheets.py
from fastapi import APIRouter
from app.services.google_sheets import create_full_sheet

router = APIRouter(prefix="/api/sheets", tags=["sheets"])

@router.post("/create")
def create_user_sheet(user_id: str):
    return create_full_sheet(user_id)