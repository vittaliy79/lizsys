from fastapi import FastAPI
from app.api import router as api_router
from app.db import init_db

app = FastAPI(title="LIZSYS Backend")

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(api_router, prefix="/api")
