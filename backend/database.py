from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import quote_plus

username = quote_plus('nikhildubey183')
password = quote_plus('N1i2k3h4i5l6@')

MONGO_URI = f"mongodb+srv://{username}:{password}@cluster.mw4vj.mongodb.net/newAppDB?retryWrites=true&w=majority"

client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()
