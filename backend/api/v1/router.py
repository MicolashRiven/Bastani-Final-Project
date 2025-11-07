from fastapi import APIRouter, Query, Depends

from core.auth import get_current_user, require_roles
from service.returnrawdata import getrawdataJson
from service.returnrawsensordata import getrawsensordataJson
from service.analytics.analytic_demo import calculate_methanol_kpi
from service.analytics.biogenAiOptimizer.biogen_feed_optimizer import get_biogen_optimized_feeds_dataframe


router = APIRouter()

def getrouter():
    return router

# @router.get("/test")
# async def testrouter_test(complex: int = Query(None), material: int = Query(None)):
#     return getrawdataJson(complex, material)


# EX-> call like this: http://127.0.0.1:8000/measurement?complex=1&material=1
@router.get("/measurement")
async def testrouter_test( complex: int = Query(None),  material: int = Query(None), payload: dict = Depends(get_current_user)):
    return getrawdataJson(complex, material)


# EX-> call like this: http://127.0.0.1:8000/sensor?complex=1
@router.get("/sensor")
async def testrouter( complex: int = Query(None), payload: dict = Depends(get_current_user)):
    return getrawsensordataJson(complex_id=complex)


# EX-> call like this: http://127.0.0.1:8000/analytic
@router.get("/analytic")
async def analyricRouter(payload: dict = Depends(get_current_user)):
    return calculate_methanol_kpi()

# EX-> call like this: http://127.0.0.1:8000/alert
@router.get("/aioptimizer")
async def alertRouter():
    return get_biogen_optimized_feeds_dataframe()


# EX-> call like this: http://127.0.0.1:8000/alert
@router.get("/alert")
async def alertRouter(payload: dict = Depends(get_current_user)):
    return calculate_methanol_kpi()





@router.get("/me")
async def who_am_i(payload: dict = Depends(get_current_user)):
    return {"user": payload.get("preferred_username"), 
            "claims": payload}

@router.get("/admin-only")
async def admin_only(payload: dict = Depends(require_roles(["admin"]))):
    return {"msg": "admin", "user": payload.get("preferred_username")}
