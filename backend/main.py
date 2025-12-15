from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta

from auth import create_access_token, get_password_hash, verify_password
from models import User
from database import db

app = FastAPI()

origins = [
    "http://localhost:3000",                     # local React
    "https://smarthire-cojo.onrender.com",  # deployed React
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return {"message": "FastAPI backend is running successfully!"}

@app.post("/register")
async def register(user: User):
    hashed_password = get_password_hash(user.password)
    await db.users.insert_one({"username": user.username, "password": hashed_password})
    return {"message": "User created"}

@app.post("/login")
async def login(user: User):
    db_user = await db.users.find_one({"username": user.username})
    if db_user and verify_password(user.password, db_user["password"]):
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    raise HTTPException(status_code=400, detail="Incorrect username or password")
