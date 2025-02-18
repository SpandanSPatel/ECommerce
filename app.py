from flask import Flask, request, jsonify
from mongoDB import get_db, create_user, authenticate_user
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# MongoDB setup
db = get_db()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required!"}), 400

    user = authenticate_user(username, password)
    if user:  # Check if user is not None (i.e., authentication successful)
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

if __name__ == '__main__':
    app.run(debug=True)
