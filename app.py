from flask import Flask, request, jsonify
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime
import uuid
from flask_cors import CORS
import os
from bson import ObjectId
from bson.errors import InvalidId


uri = "mongodb+srv://Spandan:33aFkXe2GQbd4khe@ecommerce.b6osl.mongodb.net/?retryWrites=true&w=majority&appName=ECommerce"
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['ECommerce']
users_collection = db['Users']
products_collection = db['Products']  # New collection for products
wallet_collection = db['Wallet']
cart_collection=db['cart']
orders_collection=db['orders']

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = './Images/'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER



def create_user(username, password, role):
    if users_collection.find_one({"username": username}):
        return False
    users_collection.insert_one({"username": username, "password": password, "role": role})
    return True

def authenticate_user(username, password):
    user = users_collection.find_one({"username": username})
    if user and user['password'] == password:
        return {"username": user["username"], "role": user["role"]}
    return None

def add_product(seller_username, product_name, product_description, price, stock_quantity,image_URL):
    product = {
        "seller": seller_username,
        "product_name": product_name,
        "product_description": product_description,
        "price": price,
        "stock_quantity": stock_quantity,
        "image_url": image_URL
    }
    products_collection.insert_one(product)
    return True

def get_products_for_seller(seller_username):
    products = products_collection.find(
        {"seller": seller_username} 
    )
    return list(products)  # Convert cursor to a list for easy manipulation

def get_all_products():
    # Retrieve all products from all sellers (for buyer's homepage)
    products = products_collection.find({}, {"_id": 1,"seller":1, "product_name": 1, "product_description": 1, "price": 1,"stock_quantity":1, "image_url": 1})
    return list(products)

def get_or_create_wallet(user_id):
    wallet = wallet_collection.find_one({"user_id": user_id})
    if wallet:
        return wallet
    else:
        # Create new wallet
        new_wallet = {
            "user_id": user_id,
            "wallet_id": str(uuid.uuid4()),  # Generate unique wallet ID
            "balance": 0,
            "created_at": datetime.now(),
        }
        wallet_collection.insert_one(new_wallet)
        return new_wallet


def add_money_to_wallet(user_id, amount):
    wallet = wallet_collection.find_one({"user_id": user_id})
    if wallet:
        # Update wallet balance
        wallet_collection.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": amount}, "$set": {"updated_at": datetime.now()}}
        )
        return True
    return False

def send_money_from_wallet(user_id, amount):
    wallet = wallet_collection.find_one({"user_id": user_id})
    if wallet and wallet["balance"] >= amount:
        # Update wallet balance
        wallet_collection.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": -amount}, "$set": {"updated_at": datetime.now()}}
        )
        return True
    return False

def convert_objectid_to_string(doc):
    """Convert ObjectId in a document to string."""
    if isinstance(doc, dict):
        return {key: (str(value) if isinstance(value, ObjectId) else value) for key, value in doc.items()}
    elif isinstance(doc, list):
        return [convert_objectid_to_string(item) for item in doc]
    return doc

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required!"}), 400

    user = authenticate_user(username, password)
    if user:
        return jsonify({"message": "Login successful!", "role": user['role']})
    else:
        return jsonify({"message": "Invalid credentials!"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    if not username or not password or not role:
        return jsonify({"message": "All fields are required!"}), 400

    if create_user(username, password, role):
        return jsonify({"message": "Registration successful!"})
    else:
        return jsonify({"message": "Username already exists!"}), 400

@app.route('/add_product', methods=['POST'])
def add_new_product():
    if 'product_image' not in request.files:
        return jsonify({"message": "Product image is required!"}), 400

    product_image = request.files['product_image']

    if product_image.filename == '':
        return jsonify({"message": "No selected file!"}), 400

    if not allowed_file(product_image.filename):
        return jsonify({"message": "Invalid file format!"}), 400

    filename = product_image.filename
    product_image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    data = request.form
    seller_username = data.get('seller_username')
    product_name = data.get('product_name')
    product_description = data.get('product_description')
    price = data.get('price')
    stock_quantity = data.get('stock_quantity')

    if not seller_username or not product_name or not product_description or not price or not stock_quantity:
        return jsonify({"message": "All fields are required!"}), 400

    image_url = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if add_product(seller_username, product_name, product_description, price, stock_quantity, image_url):
        return jsonify({"message": "Product added successfully!"})
    else:
        return jsonify({"message": "Error adding product!"}), 500

@app.route('/seller_products', methods=['POST'])
def seller_products():
    data = request.get_json()
    seller_username = data.get('seller_username')
    
    if not seller_username:
        return jsonify({"message": "Seller username is required!"}), 400

    products = convert_objectid_to_string(get_products_for_seller(seller_username))
    return jsonify({"products": products})

@app.route('/all_products', methods=['POST'])
def all_products():
    products = convert_objectid_to_string(get_all_products())
    return jsonify({"products": products})

@app.route('/wallet/get_wallet', methods=['POST'])
def get_wallet():
    data = request.get_json()
    username=data.get('username')
    wallet = get_or_create_wallet(username)
    if wallet:
        return jsonify({"balance": wallet["balance"]}), 200
    return jsonify({"message": "Wallet not found."}), 404

@app.route('/wallet/add_money', methods=['POST'])
def add_money():
    data = request.get_json()
    user_id = data.get("user_id")
    amount = data.get("amount")
    if not user_id or not amount:
        return jsonify({"message": "Missing required parameters."}), 400

    success = add_money_to_wallet(user_id, amount)
    if success:
        return jsonify({"message": "Money added to wallet successfully."}), 200
    return jsonify({"message": "Failed to add money to wallet."}), 400

@app.route('/wallet/send_money', methods=['POST'])
def send_money():
    data = request.get_json()
    user_id = data.get("user_id")
    amount = data.get("amount")
    if not user_id  or not amount:
        return jsonify({"message": "Missing required parameters."}), 400

    success = send_money_from_wallet(user_id, amount)
    if success:
        return jsonify({"message": "Money sent from wallet successfully."}), 200
    return jsonify({"message": "Failed to send money from wallet."}), 400


@app.route('/cart/add', methods=['POST'])
def add_to_cart():
    data = request.get_json()
    username = data.get("username")
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 0))

    if not username or not product_id or quantity <= 0:
        return jsonify({"message": "Invalid input!"}), 400

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found!"}), 404

    # Check product stock
    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"message": "Product not found!"}), 404

    if int(product["stock_quantity"]) < quantity:
        return jsonify({"message": "Not enough stock available!"}), 400

    # Update cart in MongoDB
    cart_collection.update_one(
        {"username": username},
        {"$push": {"items": {"product_id": product_id, "quantity": quantity}}},
        upsert=True
    )
    return jsonify({"message": "Item added to cart successfully!"})

@app.route('/cart', methods=['POST'])
def fetch_cart():
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"message": "Invalid input!"}), 400

    cart = cart_collection.find_one({"username": username}, {"_id": 0, "items": 1})
    if not cart:
        return jsonify({"cart_items": []})

    items = []
    for cart_item in cart.get("items", []):
        product = products_collection.find_one({"_id": ObjectId(cart_item["product_id"])})
        if product:
            items.append({
                "product_id": cart_item["product_id"],
                "product_name": product["product_name"],
                "product_description": product["product_description"],
                "price": product["price"],
                "image_url": product["image_url"],
                "quantity": cart_item["quantity"]
            })

    return jsonify({"cart_items": items})

@app.route('/cart/remove', methods=['POST'])
def remove_from_cart():
    data = request.get_json()
    username = data.get("username")
    product_id = data.get("product_id")

    if not username or not product_id:
        return jsonify({"message": "Invalid input!"}), 400

    cart_collection.update_one(
        {"username": username},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return jsonify({"message": "Item removed from cart successfully!"})

@app.route('/cart/purchase', methods=['POST'])
def purchase_cart():
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"message": "Invalid input!"}), 400

    # Fetch buyer's cart
    cart = cart_collection.find_one({"username": username})
    if not cart or not cart.get("items"):
        return jsonify({"message": "Cart is empty!"}), 400

    # Fetch buyer's wallet
    buyer_wallet = wallet_collection.find_one({"user_id": username})
    if not buyer_wallet:
        return jsonify({"message": "Buyer wallet not found!"}), 404

    total_cost = 0
    orders = []
    updated_products = []

    # Process each item in the cart
    for item in cart["items"]:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            return jsonify({"message": f"Product not found: {item['product_id']}!"}), 404

        seller_username = product["seller"]
        seller_wallet = wallet_collection.find_one({"user_id": seller_username})

        if not seller_wallet:
            return jsonify({"message": f"Seller wallet not found for product {product['product_name']}!"}), 404

        # Check stock availability
        if int(product["stock_quantity"]) < item["quantity"]:
            return jsonify({"message": f"Insufficient stock for {product['product_name']}!"}), 400

        # Calculate total cost
        item_cost = int(product["price"]) * item["quantity"]
        total_cost += item_cost

        # Prepare order
        orders.append({
            "buyer": username,
            "seller": seller_username,
            "product_id": str(product["_id"]),
            "product_name": product["product_name"],
            "image_url": product["image_url"],
            "quantity": item["quantity"],
            "total_cost": item_cost,
            "order_date": datetime.now(),
            "status": "Order Placed"  # Initial status
        })

        # Update product stock
        updated_products.append({
            "product_id": product["_id"],
            "new_stock": str(int(product["stock_quantity"]) - item["quantity"])
        })

    # Check buyer wallet balance
    if buyer_wallet["balance"] < total_cost:
        return jsonify({"message": "Insufficient wallet balance!"}), 400

    # Perform wallet transactions
    for order in orders:
        # Deduct from buyer's wallet
        wallet_collection.update_one(
            {"user_id": username},
            {"$inc": {"balance": -order["total_cost"]}}
        )

        # Credit to seller's wallet
        wallet_collection.update_one(
            {"user_id": order["seller"]},
            {"$inc": {"balance": order["total_cost"]}}
        )

    # Update product stocks
    for update in updated_products:
        products_collection.update_one(
            {"_id": update["product_id"]},
            {"$set": {"stock_quantity": update["new_stock"]}}
        )

    # Insert orders into the orders collection
    orders_collection.insert_many(orders)

    # Clear buyer's cart
    cart_collection.delete_one({"username": username})

    return jsonify({"message": "Purchase completed successfully!"})

@app.route('/buyer_orders', methods=['POST'])
def buyer_orders():
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"message": "Invalid input!"}), 400

    orders = orders_collection.find({"buyer": username})
    result = []

    for order in orders:
            result.append({
                "product_name": order["product_name"],
                "quantity": order["quantity"],
                "total_price": order["total_cost"],
                "order_date": order["order_date"],
                "status": order["status"],
                "image_url":order["image_url"]
            })

    return jsonify({"orders": result})



@app.route('/seller_orders', methods=['POST'])
def seller_orders():
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"message": "Invalid input!"}), 400

    orders = orders_collection.find({"seller": username})
    result = []

    for order in orders:
            result.append({
                "product_name": order["product_name"],
                "quantity": order["quantity"],
                "total_price": order["total_cost"],
                "order_date": order["order_date"],
                "status": order["status"],
                "image_url":order["image_url"],
                "_id":order["_id"]
            })

    return jsonify({"orders": convert_objectid_to_string(result)})

@app.route('/update_order_status', methods=['POST'])
def update_order_status():
    data = request.get_json()
    order_id = data.get("order_id")
    new_status = data.get("status")

    if not order_id or not new_status:
        return jsonify({"message": "Invalid input!"}), 400
    # Update the status in the database
    try:
        object_id = ObjectId(order_id)  # Validate the ObjectId
    except InvalidId:
        return jsonify({"message": "Invalid Order ID!"}), 400

    # Update the status in the database
    result = orders_collection.update_one(
        {"_id": object_id},
        {"$set": {"status": new_status}}
    )

    if result.matched_count > 0:
        return jsonify({"message": "Order status updated successfully!"})
    else:
        return jsonify({"message": "Order not found!"}), 404

@app.route('/update_product', methods=['POST'])
def update_product():
    data = request.get_json()
    product_id = data.get("product_id")
    new_price = data.get("price")
    new_stock = data.get("stock_quantity")

    if not product_id or new_price is None or new_stock is None:
        return jsonify({"message": "Invalid input!"}), 400

    result = products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"price": new_price, "stock_quantity": new_stock}}
    )

    if result.matched_count > 0:
        return jsonify({"message": "Product updated successfully!"})
    else:
        return jsonify({"message": "Product not found!"}), 404

@app.route('/delete_product', methods=['POST'])
def delete_product():
    data = request.get_json()
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"message": "Product ID is required!"}), 400

    try:
        # Delete the product from the database
        result = products_collection.delete_one({"_id": ObjectId(product_id)})

        if result.deleted_count == 1:
            return jsonify({"message": "Product deleted successfully!"}), 200
        else:
            return jsonify({"message": "Product not found!"}), 404
    except Exception as e:
        print(f"Error deleting product: {e}")
        return jsonify({"message": "An error occurred while deleting the product."}), 500


if __name__ == '__main__':
    app.run(debug=True)

