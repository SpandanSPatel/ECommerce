const API_URL = 'http://127.0.0.1:5000'; // Update to your Flask API URL


async function register() {
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;
    const role = document.querySelector('input[name="role"]:checked')?.value;

    if (!username || !password || !role) {
        alert("Please fill in all fields and select a role.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role })
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message);
            window.location.href = "login.html";
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}


async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("role", data.role); // Store role for future use
            alert(data.message);

            // Redirect based on role
            if (data.role === "buyer") {
                window.location.href = "dashboard_buyer.html";
            } else if (data.role === "seller") {
                window.location.href = "dashboard_seller.html";
            } else {
                alert("Unknown role. Please contact support.");
            }
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An unexpected error occurred during login.");
    }
}



function logout() {
    sessionStorage.clear();
    alert("You have been logged out.");
    window.location.href = "login.html"; 
}


document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.endsWith("dashboard.html")) {
        const username = sessionStorage.getItem("username");
        if (!username) {
            alert("No active session found. Please log in again.");
            window.location.href = "login.html";
        }
    }
});
