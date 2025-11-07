from fastapi import APIRouter, Query, Depends

from core.auth import get_current_user, require_roles
from service.returnrawdata import getrawdataJson
from service.returnrawsensordata import getrawsensordataJson


router = APIRouter()

def getrouter():
    return router

# @router.get("/test")
# async def testrouter_test(complex: int = Query(None), material: int = Query(None)):
#     return getrawdataJson(complex, material)


# EX-> call like this: http://127.0.0.1:8000/test?complex=1&material=1
@router.get("/measurement")
async def testrouter_test(complex: int = Query(None), material: int = Query(None)):
    return getrawdataJson(complex, material)


# EX-> call like this: http://127.0.0.1:8000/sensor?complex=1
@router.get("/sensor")
async def testrouter(complex: int = Query(None)):
    return getrawsensordataJson (complex_id=complex) 



@router.get("/me")
async def who_am_i(payload: dict = Depends(get_current_user)):
    return {"user": payload.get("preferred_username"), 
            "claims": payload}

@router.get("/admin-only")
async def admin_only(payload: dict = Depends(require_roles(["admin"]))):
    return {"msg": "admin", "user": payload.get("preferred_username")}
