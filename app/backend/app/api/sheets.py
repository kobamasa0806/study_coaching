from fastapi import APIRouter
from app.services.google_sheets import create_full_sheet

router = APIRouter()


@router.post("/api/sheets/create")
def create_user_sheet(user_id: str):
    result = create_full_sheet(user_id)
    return result
