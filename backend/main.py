from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta, datetime
from pydantic import BaseModel
import os

from auth import create_access_token, get_password_hash, verify_password
from models import User
from database import db

# ✅ OpenAI SDK (openai >= 1.0.0)
from openai import OpenAI

# ======================
# OpenAI Setup
# ======================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("⚠️ WARNING: OPENAI_API_KEY not set")

client = OpenAI(api_key=OPENAI_API_KEY)

# ======================
# FastAPI App
# ======================
app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://smarthire-cojo.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# Health Check
# ======================
@app.get("/")
async def root():
    return {"message": "SmartHire backend is running ✅"}

# ======================
# Auth APIs
# ======================
@app.post("/register")
async def register(user: User):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = get_password_hash(user.password)
    await db.users.insert_one({
        "username": user.username,
        "password": hashed_password
    })
    return {"message": "User registered successfully"}

@app.post("/login")
async def login(user: User):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": token, "token_type": "bearer"}

# ======================
# JD Generation
# ======================
class JDRequest(BaseModel):
    profile: str

@app.post("/generate-jd")
async def generate_jd(req: JDRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    prompt = f"""
Generate a professional Job Description (JD) for the role: {req.profile}.
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
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert HR recruiter."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=700
        )

        jd_text = response.choices[0].message.content.strip()
        return {"profile": req.profile, "job_description": jd_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ======================
# Save JD
# ======================
class SaveJDRequest(BaseModel):
    username: str
    profile: str
    jd_text: str

@app.post("/save-jd")
async def save_jd(req: SaveJDRequest):
    doc = {
        "username": req.username,
        "profile": req.profile,
        "jd_text": req.jd_text,
        "created_at": datetime.utcnow().isoformat()
    }
    result = await db.jds.insert_one(doc)
    return {"message": "JD saved successfully", "id": str(result.inserted_id)}

# ======================
# Fetch User JDs
# ======================
@app.get("/my-jds")
async def my_jds(username: str):
    cursor = db.jds.find({"username": username}).sort("created_at", -1)
    items = []

    async for jd in cursor:
        items.append({
            "id": str(jd["_id"]),
            "username": jd["username"],
            "profile": jd["profile"],
            "jd_text": jd["jd_text"],
            "created_at": jd["created_at"]
        })

    return {"items": items}

# ======================
# Debug OpenAI Key
# ======================
@app.get("/check-openai")
async def check_openai():
    return {"has_key": bool(os.getenv("OPENAI_API_KEY"))}
