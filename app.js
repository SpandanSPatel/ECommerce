// Function to handle the login form submission
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    fetch('/login.html', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Login successful!") {
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("An error occurred during login.");
    });
}

// Function to handle the registration form submission
function handleRegistration() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.querySelector('input[name="role"]:checked')?.value;
    
    fetch('/register.html', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Registration successful!") {
            window.location.href = '/login.html';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("An error occurred during registration.");
    });
}

// Function to handle the logout
function handleLogout() {
    fetch('/logout', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Logged out successfully!") {
            window.location.href = '/login.html';
        } else {
            alert("An error occurred while logging out.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("An error occurred while logging out.");
    });
}
