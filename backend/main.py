from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta

from auth import create_access_token, get_password_hash, verify_password
from models import User
from database import db

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from pydantic import BaseModel
from auth import create_access_token, get_password_hash, verify_password
from database import db
import openai
import os

# Load OpenAI API key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client
openai.api_key = OPENAI_API_KEY

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


# Define a request model for JD generation
class JDRequest(BaseModel):
    profile: str

@app.post("/generate-jd")
async def generate_jd(request: JDRequest):
    profile = request.profile
    prompt = f"Generate a job description for a {profile} role suitable for a hiring platform."
    
    try:
        response = openai.Completion.create(
            engine="text-davinci-003",  # या जो भी मॉडल आप इस्तेमाल कर रहे हैं
            prompt=prompt,
            max_tokens=150
        )
        jd_text = response.choices[0].text.strip()
        return {"profile": profile, "job_description": jd_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))