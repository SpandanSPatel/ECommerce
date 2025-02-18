import pymongo 
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb+srv://Spandan:s201666155NC@ecommerce.b6osl.mongodb.net/?retryWrites=true&w=majority&appName=ECommerce"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
    db=client['ECommerce']
    users = db['Users']
    users.insert_one({"Name":"Spandan","Password":"s201666155NC","Email":"spandanspatel14122006@gmail.com"})
except Exception as e:
    print(e)
