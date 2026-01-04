from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from datetime import timedelta, datetime
from pydantic import BaseModel
from typing import List
import os
from bson import ObjectId

from jose import jwt

from auth import create_access_token, get_password_hash, verify_password, SECRET_KEY, ALGORITHM
from models import User
from database import db

# OpenAI (openai>=1.0.0)
from openai import OpenAI

# Resume parsing
import fitz  # PyMuPDF
import docx  # python-docx
import io

# -------------------------
# App + CORS
# -------------------------
app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://smarthire-cojo.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# OpenAI
# -------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# -------------------------
# JWT (Protect Routes)
# -------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")  # token from /login


def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token: missing subject")
        return username
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_username(token: str = Depends(oauth2_scheme)) -> str:
    return decode_token(token)


# -------------------------
# Models
# -------------------------
class JDRequest(BaseModel):
    profile: str


class SaveJDRequest(BaseModel):
    profile: str
    jd_text: str


class MatchRequest(BaseModel):
    jd_id: str
    top_k: int = 5


# -------------------------
# Root
# -------------------------
@app.get("/")
async def home():
    return {"message": "FastAPI backend is running successfully!"}


# -------------------------
# Auth
# -------------------------
@app.post("/register")
async def register(user: User):
    exists = await db.users.find_one({"username": user.username})
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")

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


# -------------------------
# OpenAI check
# -------------------------
@app.get("/check-openai")
async def check_openai():
    return {"has_key": bool(os.getenv("OPENAI_API_KEY"))}


# -------------------------
# JD Generate (PROTECTED)
# -------------------------
@app.post("/generate-jd")
async def generate_jd(request: JDRequest, username: str = Depends(get_current_username)):
    if not OPENAI_API_KEY or not client:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set in environment")

    profile = request.profile.strip()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile is required")

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
        return {"profile": profile, "job_description": jd_text, "generated_for": username}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------
# Save JD + My JDs (PROTECTED)
# -------------------------
@app.post("/save-jd")
async def save_jd(data: SaveJDRequest, username: str = Depends(get_current_username)):
    doc = {
        "username": username,
        "profile": data.profile,
        "jd_text": data.jd_text,
        "created_at": datetime.utcnow()
    }
    result = await db.jds.insert_one(doc)
    return {"message": "JD saved successfully", "id": str(result.inserted_id)}


@app.get("/my-jds")
async def my_jds(username: str = Depends(get_current_username)):
    cursor = db.jds.find({"username": username}).sort("created_at", -1)
    items = []
    async for jd in cursor:
        items.append({
            "id": str(jd["_id"]),
            "profile": jd.get("profile"),
            "jd_text": jd.get("jd_text"),
            "created_at": str(jd.get("created_at")),
        })
    return {"items": items}


# -------------------------
# Resume Upload (PROTECTED)
# -------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    parts = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            parts.append(page.get_text("text"))
    return "\n".join(parts).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    f = io.BytesIO(file_bytes)
    d = docx.Document(f)
    return "\n".join([p.text for p in d.paragraphs]).strip()


@app.post("/upload-resumes")
async def upload_resumes(
    files: List[UploadFile] = File(...),
    username: str = Depends(get_current_username)
):
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files received")

    inserted_ids = []
    skipped = 0

    for file in files:
        filename = (file.filename or "")
        low = filename.lower()
        content = await file.read()

        if low.endswith(".pdf"):
            text = extract_text_from_pdf(content)
            file_type = "pdf"
        elif low.endswith(".docx"):
            text = extract_text_from_docx(content)
            file_type = "docx"
        else:
            skipped += 1
            continue

        if not text or len(text) < 50:
            skipped += 1
            continue

        doc = {
            "username": username,
            "filename": filename,
            "file_type": file_type,
            "text": text,
            "created_at": datetime.utcnow(),
        }
        result = await db.resumes.insert_one(doc)
        inserted_ids.append(str(result.inserted_id))

    return {
        "message": "Upload finished",
        "uploaded_count": len(inserted_ids),
        "skipped": skipped,
        "resume_ids": inserted_ids,
    }



@app.get("/my-resumes")
async def my_resumes(username: str = Depends(get_current_username)):
    cursor = db.resumes.find({"username": username}).sort("created_at", -1)
    items = []
    async for r in cursor:
        items.append({
            "id": str(r["_id"]),
            "filename": r.get("filename"),
            "file_type": r.get("file_type"),
            "created_at": str(r.get("created_at")),
            # optional preview (front-end alert के लिए)
            "text_preview": (r.get("text") or "")[:800]
        })
    return {"items": items}


# -------------------------
# Matching (Pure Python TF-IDF + Cosine) - NO sklearn
# -------------------------
import re
import math
from collections import Counter, defaultdict

_STOPWORDS = set("""
a an the and or but if then else when while of to in on for with without from by as at is are was were be been being
this that these those it its we you they he she his her them our your their
""".split())

def _tokenize(text: str) -> List[str]:
    text = (text or "").lower()
    words = re.findall(r"[a-z0-9]+", text)
    return [w for w in words if w not in _STOPWORDS and len(w) > 2]

def _tfidf_vectors(corpus: List[str]) -> List[dict]:
    tokenized = [_tokenize(t) for t in corpus]
    df = defaultdict(int)
    for toks in tokenized:
        for w in set(toks):
            df[w] += 1

    N = len(corpus)
    idf = {w: math.log((N + 1) / (dfw + 1)) + 1 for w, dfw in df.items()}

    vectors = []
    for toks in tokenized:
        tf = Counter(toks)
        vec = {}
        if not tf:
            vectors.append(vec)
            continue
        max_tf = max(tf.values())
        for w, c in tf.items():
            vec[w] = (c / max_tf) * idf.get(w, 0.0)
        vectors.append(vec)
    return vectors

def _cosine(v1: dict, v2: dict) -> float:
    if not v1 or not v2:
        return 0.0
    # dot
    dot = 0.0
    # iterate smaller dict
    if len(v1) > len(v2):
        v1, v2 = v2, v1
    for k, val in v1.items():
        dot += val * v2.get(k, 0.0)
    # norms
    n1 = math.sqrt(sum(x*x for x in v1.values()))
    n2 = math.sqrt(sum(x*x for x in v2.values()))
    if n1 == 0.0 or n2 == 0.0:
        return 0.0
    return dot / (n1 * n2)

def compute_scores(jd_text: str, resume_texts: List[str]) -> List[float]:
    corpus = [jd_text] + resume_texts
    vecs = _tfidf_vectors(corpus)
    jd_vec = vecs[0]
    res_vecs = vecs[1:]
    return [_cosine(jd_vec, rv) for rv in res_vecs]


# -------------------------
# Match Resumes against a JD (PROTECTED)
# -------------------------
@app.post("/match-resumes")
async def match_resumes(payload: MatchRequest, username: str = Depends(get_current_username)):
    try:
        jd_obj_id = ObjectId(payload.jd_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid jd_id")

    jd = await db.jds.find_one({"_id": jd_obj_id, "username": username})
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")

    resumes_cursor = db.resumes.find({"username": username}).sort("created_at", -1)
    resumes = []
    async for r in resumes_cursor:
        resumes.append(r)

    if not resumes:
        return {"items": [], "message": "No resumes uploaded yet"}

    scores = compute_scores(jd.get("jd_text", ""), [r.get("text", "") for r in resumes])

    scored = []
    for r, s in zip(resumes, scores):
        scored.append({
            "resume_id": str(r["_id"]),
            "filename": r.get("filename"),
            "score": round(float(s) * 100, 2),
            "created_at": str(r.get("created_at")),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    top_k = max(1, min(payload.top_k, 50))
    top_items = scored[:top_k]

    await db.matches.insert_one({
        "username": username,
        "jd_id": payload.jd_id,
        "profile": jd.get("profile"),
        "created_at": datetime.utcnow(),
        "results": top_items,
    })

    return {"jd_id": payload.jd_id, "profile": jd.get("profile"), "items": top_items}


@app.get("/my-matches")
async def my_matches(username: str = Depends(get_current_username)):
    cursor = db.matches.find({"username": username}).sort("created_at", -1)
    items = []
    async for m in cursor:
        items.append({
            "id": str(m["_id"]),
            "jd_id": m.get("jd_id"),
            "profile": m.get("profile"),
            "created_at": str(m.get("created_at")),
            "results": m.get("results", []),
        })
    return {"items": items}

from bson import ObjectId
from fastapi import HTTPException, Depends

@app.get("/resume-text/{resume_id}")
async def resume_text(resume_id: str, username: str = Depends(get_current_username)):
    try:
        rid = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume_id")

    r = await db.resumes.find_one({"_id": rid, "username": username})
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "id": str(r["_id"]),
        "filename": r.get("filename"),
        "text": r.get("text", ""),
        "created_at": str(r.get("created_at")),
    }
