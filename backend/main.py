import sys, os
sys.dont_write_bytecode = True

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from api.v1.router import getrouter

app = FastAPI(title="Report Dashboard API", version="1.0.0")


# middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #front-end app url 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(getrouter())


@app.get("/")
async def gethello():
    return {"message" : "python kos nanat"}
