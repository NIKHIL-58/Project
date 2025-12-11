import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env file
load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")

if not MONGO_URI:
    raise ValueError("❌ MONGODB_URI environment variable not set")

client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()
