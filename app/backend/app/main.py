from fastapi import FastAPI
from app.api import sheets

app = FastAPI()

app.include_router(sheets.router)
