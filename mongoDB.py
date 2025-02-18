from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb+srv://Spandan:s201666155NC@ecommerce.b6osl.mongodb.net/?retryWrites=true&w=majority&appName=ECommerce"
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['ECommerce']
users_collection = db['Users']

def get_db():
    return db

def create_user(username, password, role):
    if users_collection.find_one({"username": username}):
        return False
    users_collection.insert_one({"username": username, "password": password, "role": role})
    return True

def authenticate_user(username, password):
    user = users_collection.find_one({"username": username})
    if user and user['password'] == password:
        return True
    return False
