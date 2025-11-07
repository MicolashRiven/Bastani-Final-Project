from fastapi import APIRouter, Depends

from core.auth import get_current_user, require_roles
from service.returnrawdata import getrawdataJson

router = APIRouter()

def getrouter():
    return router

@router.get("/test")
async def testrouter():
    return  getrawdataJson() 



@router.get("/me")
async def who_am_i(payload: dict = Depends(get_current_user)):
    return {"user": payload.get("preferred_username"), 
            "claims": payload}

@router.get("/admin-only")
async def admin_only(payload: dict = Depends(require_roles(["admin"]))):
    return {"msg": "admin", "user": payload.get("preferred_username")}
