from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from mongoDB import get_db, create_user, authenticate_user

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# MongoDB setup
db = get_db()

@app.route('/login.html', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data['username']
        password = data['password']
        if authenticate_user(username, password):
            session['user'] = username
            return jsonify({"message": "Login successful!"})
        else:
            return jsonify({"message": "Invalid credentials!"}), 401
    return render_template('login.html')

@app.route('/register.html', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data['username']
        password = data['password']
        role = data['role']
        if create_user(username, password, role):
            return jsonify({"message": "Registration successful!"})
        else:
            return jsonify({"message": "Username already exists!"}), 400
    return render_template('register.html')

@app.route('/dashboard.html')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"message": "Logged out successfully!"})

if __name__ == '__main__':
    app.run(debug=True)
