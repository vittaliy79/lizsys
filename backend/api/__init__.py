from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {"message": "LIZSYS API running"}
