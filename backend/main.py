from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from pydantic import BaseModel
import os

from auth import create_access_token, get_password_hash, verify_password
from models import User
from database import db

# ✅ New OpenAI SDK (openai>=1.0.0)
from openai import OpenAI

# Load OpenAI API key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

origins = [
    "http://localhost:3000",              # local React
    "https://smarthire-cojo.onrender.com" # deployed React
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⭐ Default root route
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
            data={"sub": user.username},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    raise HTTPException(status_code=400, detail="Incorrect username or password")


# ✅ JD generation request model
class JDRequest(BaseModel):
    profile: str


@app.post("/generate-jd")
async def generate_jd(request: JDRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set in environment")

    profile = request.profile

    prompt = f"""
Generate a professional Job Description (JD) for the role: {profile}.
Include:
1) Job Title
2) Role Summary
3) Responsibilities (6-10 bullet points)
4) Required Skills
5) Preferred Skills
6) Experience
7) Education
8) Nice-to-have
Make it hiring-ready and structured.
"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert HR recruiter and job description writer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=700
        )

        jd_text = resp.choices[0].message.content.strip()
        return {"profile": profile, "job_description": jd_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Optional: check key quickly
@app.get("/check-openai")
async def check_openai():
    return {"has_key": bool(os.getenv("OPENAI_API_KEY"))}
