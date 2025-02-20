const API_URL = 'https://ecommerce-11ak.onrender.com'; // Update to your Flask API URL

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


async function addNewProduct() {
    const sellerUsername = sessionStorage.getItem("username");
    const productName = document.getElementById('productName').value;
    const productDescription = document.getElementById('productDescription').value;
    const price = document.getElementById('price').value;
    const stockQuantity = document.getElementById('stockQuantity').value;
    const productImage = document.getElementById('productImage').files[0];

    if (!productName || !productDescription || !price || !stockQuantity || !productImage) {
        alert("Please fill in all fields.");
        return;
    }

    const formData = new FormData();
    formData.append('seller_username', sellerUsername);
    formData.append('product_name', productName);
    formData.append('product_description', productDescription);
    formData.append('price', price);
    formData.append('stock_quantity', stockQuantity);
    formData.append('product_image', productImage);

    try {
        const response = await fetch(`${API_URL}/add_product`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            window.location.href = "dashboard_seller.html"; // Redirect to seller's dashboard
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);  // Log the error to the console
        alert("An unexpected error occurred while adding the product.");
    }
}




async function fetchSellerProducts() {
    const sellerUsername = sessionStorage.getItem("username");

    if (!sellerUsername) {
        alert("No active session found. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/seller_products`, {
            method: 'POST', // Changed to POST
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ seller_username: sellerUsername }) // Sending data in POST body
        });

        const data = await response.json();
        if (response.ok) {
            displaySellerProducts(data.products);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while fetching seller products.");
    }
}

function displaySellerProducts(products) {
    const productContainer = document.getElementById('productContainer');
    productContainer.innerHTML = '';

    if (products.length === 0) {
        productContainer.innerHTML = "<p>No products added yet.</p>";
    } else {
        products.forEach(product => {
            const productCard = `
                <div class="col-sm-6 col-md-4 col-lg-3">
                    <div class="card shadow-lg border-0 rounded-3">
                        <div class="card-image">
                            <img src="${product.image_url}" class="card-img-top" alt="${product.product_name}" style="height: 250px; object-fit: cover;">
                        </div>
                        <div class="card-body">
                            <h5 class="card-title text-truncate text-info">${product.product_name}</h5>
                            <p class="card-text text-muted small">${product.product_description}</p>
                            <div class="mb-3">
                                <label for="price-${product._id}" class="form-label text-primary">Price ($)</label>
                                <input type="number" class="form-control" id="price-${product._id}" value="${product.price}">
                            </div>
                            <div class="mb-3">
                                <label for="stock-${product._id}" class="form-label text-secondary">Stock</label>
                                <input type="number" class="form-control" id="stock-${product._id}" value="${product.stock_quantity}">
                            </div>
                            <div class="d-flex justify-content-between">
                                <button class="btn btn-sm btn-success me-2" onclick="updateProduct('${product._id}')">Save</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            productContainer.innerHTML += productCard;
        });
    }
}
async function updateProduct(productId) {
    const price = document.getElementById(`price-${productId}`).value;
    const stock = document.getElementById(`stock-${productId}`).value;

    if (!price || !stock) {
        alert("Price and stock cannot be empty!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/update_product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: productId, price, stock_quantity: stock }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.message || "Error updating product.");
        }
    } catch (error) {
        console.error("Error updating product:", error);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_URL}/delete_product`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id: productId })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            location.reload(); // Reload the page to reflect changes
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('An error occurred while deleting the product.');
    }
}

async function fetchAllProducts() {
    try {
        const response = await fetch(`${API_URL}/all_products`, {
            method: 'POST', // Changed to POST
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (response.ok) {
            displayAllProducts(data.products);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while fetching products.");
    }
}

function displayAllProducts(products) {
    const productContainer = document.getElementById('productContainer');
    productContainer.innerHTML = ''; // Clear existing products

    if (products.length === 0) {
        productContainer.innerHTML = "<p>No products available for purchase.</p>";
    } else {
        products.forEach(product => {
            const productCard = ` 
    <div class="col-sm-6 col-md-4 col-lg-3">
        <div class="card shadow-lg border-0 rounded-3">
            <div class="card-image">
                <img src="${product.image_url}" class="card-img-top" alt="${product.product_name}" style="height: 250px; object-fit: cover;">
            </div>
            <div class="card-body">
                <h5 class="card-title text-truncate">${product.product_name}</h5>
                <p class="card-text text-muted small">${product.product_description}</p>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="text-primary fw-bold">$${product.price}</span>
                </div>
                <div class="input-group mb-3">
                    <input type="number" class="form-control" id="quantity-${product._id}" min="1" max="${product.stock_quantity}" value="1" aria-label="Quantity" style="max-width: 100px;">
                    <button class="btn btn-sm btn-outline-primary" onclick="addToCart('${product._id}', document.getElementById('quantity-${product._id}').value)">
                        Add to Cart
                    </button>
                </div>
                
            </div>
        </div>
    </div>
`;

            productContainer.innerHTML += productCard;
        });
    }
}




async function fetchWalletBalance(username) {
    try {
        const response = await fetch(`${API_URL}/wallet/get_wallet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username })
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById("wallet-balance").textContent = `$${data.balance.toFixed(2)}`;
        } else {
            alert("Failed to fetch wallet balance.");
        }
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
    }
}

async function addMoneyToWallet() {
    try {
        const userId = sessionStorage.getItem("username");
        const amount = parseFloat(document.getElementById('amount').value);

        const response = await fetch(`${API_URL}/wallet/add_money`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, amount })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            fetchWalletBalance(sessionStorage.getItem("username"));
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error adding money to wallet:", error);
    }
}

async function sendMoneyFromWallet() {
    try {
        const userId = sessionStorage.getItem("username");
        const amount = parseFloat(document.getElementById('amount').value);
        const response = await fetch(`${API_URL}/wallet/send_money`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, amount })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            fetchWalletBalance(sessionStorage.getItem("username"));
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error sending money from wallet:", error);
    }
}

async function addToCart(productId, quantity) {
    const username = sessionStorage.getItem("username");
    if (!username) {
        alert("Please log in to add items to your cart.");
        return;
    }

    if (quantity <= 0) {
        alert("Please select a valid quantity.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, product_id: productId, quantity: parseInt(quantity) })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Item added to cart successfully!");
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        alert("An error occurred while adding the item to the cart.");
    }
}


async function fetchCartItems() {
    const username = sessionStorage.getItem("username");
    if (!username) {
        alert("Please log in to view your cart.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (response.ok) {
            displayCartItems(data.cart_items);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error fetching cart items:", error);
        alert("An error occurred while fetching your cart.");
    }
}

function displayCartItems(cartItems) {
    const cartContainer = document.getElementById("cartContainer");
    const totalPriceElement = document.getElementById("totalPrice");
    cartContainer.innerHTML = "";
    var totalPrice=0.00;
    if (cartItems.length === 0) {
        cartContainer.innerHTML = "<center><p>Your cart is empty.</p></center>";
        totalPriceElement.textContent = "$0.00";
        return;
    }

    cartItems.forEach(item => {
        const itemPrice = parseFloat(item.price) * parseFloat(item.quantity);
        totalPrice += itemPrice;
        const cartItem = `
            <div class="card mb-3">
                <div class="row g-0">
                    <div class="col-md-4 ">
                        <img src="${item.image_url}" class="img-fluid rounded-start" alt="${item.product_name}"style="height: 300px; object-fit: cover;">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${item.product_name}</h5>
                            <p class="card-text">${item.product_description}</p>
                            <p class="card-text">
                                Price: $${item.price} <br>
                                Quantity: ${item.quantity} <br>
                                Subtotal: $${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.product_id}')">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        cartContainer.innerHTML += cartItem;
    });
    totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;

}

async function removeFromCart(productId) {
    const username = sessionStorage.getItem("username");
    if (!username) {
        alert("Please log in to remove items from your cart.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, product_id: productId })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Item removed from cart.");
            fetchCartItems(); // Refresh the cart
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error removing from cart:", error);
        alert("An error occurred while removing the item from the cart.");
    }
}

async function purchaseCart() {
    const username = sessionStorage.getItem("username");
    if (!username) {
        alert("Please log in to complete your purchase.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/purchase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Purchase successful!");
            window.location.href = "dashboard_buyer.html"; // Redirect after purchase
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error completing purchase:", error);
        alert("An error occurred while completing the purchase.");
    }
}

async function fetchBuyerOrders() {
    const username = sessionStorage.getItem("username");
    if (!username) {
        alert("Please log in to view your orders.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/buyer_orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (response.ok) {
            displayBuyerOrders(data.orders, "orderList");
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error fetching buyer orders:", error);
        alert("An error occurred while fetching your orders.");
    }
}

async function fetchSellerOrders() {
    const username = sessionStorage.getItem("username");
    if (!username) {
        alert("Please log in to view your sales history.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/seller_orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (response.ok) {
            displaySellerOrders(data.orders, "salesList");
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error fetching seller orders:", error);
        alert("An error occurred while fetching your sales history.");
    }
}

function displayBuyerOrders(orders, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (orders.length === 0) {
        container.innerHTML = "<p class='text-center'>No orders found.</p>";
        return;
    }

    orders.forEach(order => {
        
        const orderCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow-sm border-0 rounded-3">
                        <div class="card-body">
                        <img src="${order.image_url}" class="img-fluid rounded-start" alt="${order.product_name}"style="height: 300px; object-fit: cover;">
                            <h5 class="card-title text-info">${order.product_name}</h5>
                            <p class="card-text text-muted small">Ordered on: ${new Date(order.order_date).toLocaleDateString()}</p>
                            <p class="card-text text-secondary">Quantity: <span class="fw-bold">${order.quantity}</span></p>
                            <p class="card-text text-success">Total Price: $<span class="fw-bold">${order.total_price}</span></p>
                            <p class="card-text">
                                Status: <span class="badge ${
                                    order.status === "Delivered" ? "bg-success" : "bg-warning"
                                }" id="status-${order._id}">${order.status}</span>
                            </p>
                        </div>
                    </div>
                </div>
            `;
        container.innerHTML += orderCard;
    });
}

function displaySellerOrders(orders, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (orders.length === 0) {
        container.innerHTML = "<p class='text-center'>No orders found.</p>";
        return;
    }

    orders.forEach(order => {
        
        const orderCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow-sm border-0 rounded-3">
                        <div class="card-body">
                        <img src="${order.image_url}" class="img-fluid rounded-start" alt="${order.product_name}"style="height: 300px; object-fit: cover;">
                            <h5 class="card-title text-info">${order.product_name}</h5>
                            <p class="card-text text-muted small">Ordered on: ${new Date(order.order_date).toLocaleDateString()}</p>
                            <p class="card-text text-secondary">Quantity: <span class="fw-bold">${order.quantity}</span></p>
                            <p class="card-text text-success">Total Price: $<span class="fw-bold">${order.total_price}</span></p>
                            <p class="card-text">
                                Status: <span class="badge ${
                                    order.status === "Delivered" ? "bg-success" : "bg-warning"
                                }" id="status-${order._id}">${order.status}</span>
                            </p>
                            <div class="d-flex justify-content-between mt-3">
                                <button class="btn btn-outline-warning btn-sm" onclick="updateOrderStatus('${order._id}', 'Out for Delivery')">Out for Delivery</button>
                                <button class="btn btn-outline-success btn-sm" onclick="updateOrderStatus('${order._id}', 'Delivered')">Delivered</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        container.innerHTML += orderCard;
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/update_order_status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId, status: newStatus }),
        });

        const data = await response.json();
        if (response.ok) {
            // Update status on the frontend
            const statusElement = document.getElementById(`status-${orderId}`);
            if (statusElement) {
                statusElement.textContent = newStatus;
                statusElement.className = `badge ${
                    newStatus === "Delivered" ? "bg-success" : newStatus === "Out for Delivery" ? "bg-warning" : "bg-secondary"
                }`;
            }
            alert(data.message);
        } else {
            alert(data.message || "Failed to update status.");
        }
    } catch (error) {
        console.error("Error updating order status:", error);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.endsWith("dashboard_buyer.html")) {
        fetchAllProducts();
    } else if (window.location.pathname.endsWith("dashboard_seller.html")) {
        fetchSellerProducts();
    }
    if(window.location.pathname.endsWith("wallet_seller.html")||window.location.pathname.endsWith("wallet_buyer.html")){
        const username = sessionStorage.getItem("username");
        if (username) {
            fetchWalletBalance(username);
        }
    }
    if (window.location.pathname.endsWith("cart.html")){
        fetchCartItems();
    }
    if (window.location.pathname.endsWith("myorder.html")) {
        fetchBuyerOrders();
    } else if (window.location.pathname.endsWith("sales_history.html")) {
        fetchSellerOrders();
    }
    if (window.location.pathname.endsWith("dashboard_buyer.html") || window.location.pathname.endsWith("dashboard_seller.html")) {
        const username = sessionStorage.getItem("username");
        if (!username) {
            alert("No active session found. Please log in again.");
            window.location.href = "login.html";
        }
    }
});