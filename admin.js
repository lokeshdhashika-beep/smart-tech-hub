// Protect Route
const user = DB.getCurrentUser();
if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
}

// Initialize Data asynchronously in the DOMContentLoaded

// State
let products = [];
let orders = DB.getOrders();
let inquiries = DB.getInquiries();
let currentView = 'dashboard';
let editingId = null;
let salesChart = null;

// DOM Elements
const views = {
    dashboard: document.getElementById('view-dashboard'),
    products: document.getElementById('view-products'),
    orders: document.getElementById('view-orders'),
    inquiries: document.getElementById('view-inquiries'),
    users: document.getElementById('view-users')
};
const navItems = document.querySelectorAll('.nav-item[data-view]');
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');
let editingUserId = null;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await DB.init();
    loadData();
    setupNavigation();
    setupDashboard();
    setupProductManagement();
    setupUserManagement();
    setupOrderManagement();
});

function loadData() {
    products = DB.getAllProducts();
    orders = DB.getOrders();
    inquiries = DB.getInquiries();
}

// Navigation
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active class
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class
            item.classList.add('active');

            // Hide all views
            Object.values(views).forEach(view => view.classList.add('hidden'));

            // Show selected view
            const viewName = item.getAttribute('data-view');
            views[viewName].classList.remove('hidden');

            // Refresh data
            if (viewName === 'products') renderProductsTable();
            if (viewName === 'orders') renderOrdersTable();
            if (viewName === 'inquiries') renderInquiriesTable();
            if (viewName === 'users') renderUsersTable();
            if (viewName === 'dashboard') updateDashboardStats();
        });
    });
}

// Dashboard
function setupDashboard() {
    updateDashboardStats();
    renderSalesChart();
}

function updateDashboardStats() {
    // Recalculate every time we view dashboard
    products = DB.getAllProducts(); // Refresh in case changed
    orders = DB.getOrders();

    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;

    document.getElementById('total-revenue').textContent = '₹' + totalRevenue.toLocaleString();
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-products').textContent = totalProducts;
}

function renderSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');

    // Mock monthly data for demonstration since we don't have historical data
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [120000, 190000, 150000, 250000, 220000, 300000];

    // If we had real data, we would aggregate 'orders' by month here

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (₹)',
                data: data,
                borderColor: '#00D9FF',
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0aec0' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0aec0' }
                }
            }
        }
    });
}

// Product Management
function setupProductManagement() {
    // Populate Category Select
    const catSelect = document.getElementById('product-category');
    CATEGORIES.forEach(cat => {
        if (cat.id !== 'all') {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            catSelect.appendChild(option);
        }
    });

    // Add Product Button
    document.getElementById('add-product-btn').addEventListener('click', () => {
        openModal();
    });

    // Cancel Button
    document.getElementById('cancel-product-btn').addEventListener('click', () => {
        productModal.classList.remove('open');
    });

    // Form Submit
    productForm.addEventListener('submit', handleProductSubmit);

    // Initial Render
    renderProductsTable();
}

function renderProductsTable() {
    products = DB.getAllProducts();
    const tbody = document.getElementById('products-table-body');

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><img src="${p.image}" class="table-img" onerror="this.src='https://via.placeholder.com/40/141a25/00D9FF?text=Img'"></td>
            <td>${p.name}</td>
            <td>${getCategoryName(p.category)}</td>
            <td>₹${p.price.toLocaleString()}</td>
            <td>${p.stock}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct('${p.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProduct('${p.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openModal(product = null) {
    productModal.classList.add('open');
    const title = document.getElementById('modal-title');

    if (product) {
        title.textContent = 'Edit Product';
        editingId = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-desc').value = product.description;
    } else {
        title.textContent = 'Add Product';
        editingId = null;
        productForm.reset();
        document.getElementById('product-image').value = 'images/placeholder.jpg';
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const newProduct = {
        id: editingId || 'prod-' + Date.now(),
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: Number(document.getElementById('product-price').value),
        stock: Number(document.getElementById('product-stock').value),
        image: document.getElementById('product-image').value,
        description: document.getElementById('product-desc').value
    };

    if (editingId) {
        // Update existing
        // We need to keep the ID
        newProduct.id = editingId;
    }

    DB.saveProduct(newProduct);

    productModal.classList.remove('open');
    renderProductsTable();
    updateDashboardStats(); // Update counts
}

window.editProduct = function (id) {
    const product = DB.getProduct(id);
    if (product) openModal(product);
};

window.deleteProduct = function (id) {
    if (confirm('Are you sure you want to delete this product?')) {
        DB.deleteProduct(id);
        renderProductsTable();
        updateDashboardStats();
    }
};

function getCategoryName(id) {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
}

// Orders View
function renderOrdersTable() {
    orders = DB.getOrders();
    const tbody = document.getElementById('orders-table-body');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">No orders found</td></tr>';
        return;
    }

    // Sort by date desc
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sortedOrders.map(order => {
        const itemCount = order.items.reduce((acc, item) => acc + (item.qty || 1), 0);
        const productCount = order.items.length;
        
        return `
            <tr>
                <td>#${order.id.slice(-6)}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>
                    <div style="font-weight: 500;">${productCount} products</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${itemCount} total units</div>
                </td>
                <td>₹${order.total.toLocaleString()}</td>
                <td><span class="status-badge status-${(order.status || 'Pending').toLowerCase()}">${order.status || 'Processing'}</span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="action-btn view-btn" title="View Details" onclick="viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Edit Status" onclick="editOrder('${order.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete" onclick="deleteOrder('${order.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Order Management
function setupOrderManagement() {
    const detailsModal = document.getElementById('order-details-modal');
    const editModal = document.getElementById('order-edit-modal');
    const editForm = document.getElementById('order-edit-form');

    // Add Manual Order Button
    document.getElementById('add-order-btn').addEventListener('click', () => {
        alert('Manual order creation will be implemented in the next phase. For now, please use the store to place orders.');
    });

    // Close Details
    document.getElementById('close-details-btn').addEventListener('click', () => {
        detailsModal.classList.remove('open');
    });

    // Cancel Edit
    document.getElementById('cancel-order-edit-btn').addEventListener('click', () => {
        editModal.classList.remove('open');
    });

    // Save Edit
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-order-id').value;
        const status = document.getElementById('edit-order-status').value;
        const note = document.getElementById('edit-order-note').value;

        const order = DB.getOrders().find(o => o.id === id);
        if (order) {
            order.status = status;
            order.internalNote = note;
            DB.saveOrder(order);
            editModal.classList.remove('open');
            renderOrdersTable();
            updateDashboardStats();
        }
    });

    // Print Invoice
    document.getElementById('print-order-btn').addEventListener('click', () => {
        window.print();
    });
}

window.viewOrder = function(id) {
    const order = DB.getOrders().find(o => o.id === id);
    if (!order) return;

    const modal = document.getElementById('order-details-modal');
    
    // Fill Info
    document.getElementById('details-order-id').textContent = `#${order.id.slice(-6)}`;
    document.getElementById('details-customer-name').textContent = order.customer.name;
    document.getElementById('details-customer-email').textContent = order.customer.email || 'N/A';
    document.getElementById('details-customer-phone').textContent = order.customer.phone || 'N/A';
    document.getElementById('details-customer-address').textContent = order.customer.address || 'N/A';
    document.getElementById('details-customer-city-pin').textContent = `${order.customer.city || ''}, ${order.customer.pin || ''}`;
    document.getElementById('details-order-date').textContent = `Date: ${new Date(order.date).toLocaleString()}`;
    document.getElementById('details-payment-method').textContent = `Payment: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD'}`;
    document.getElementById('details-order-status').textContent = `Status: ${order.status || 'Processing'}`;
    document.getElementById('details-order-total').textContent = `₹${order.total.toLocaleString()}`;

    // Fill Items
    const itemsBody = document.getElementById('order-items-body');
    itemsBody.innerHTML = order.items.map(item => `
        <tr>
            <td><img src="${item.image}" style="width: 30px; height: 30px; object-fit: contain;"></td>
            <td>
                <div style="font-weight: 500; font-size: 13px;">${item.name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${item.id}</div>
            </td>
            <td>₹${item.price.toLocaleString()}</td>
            <td>${item.qty || 1}</td>
            <td>₹${((item.price) * (item.qty || 1)).toLocaleString()}</td>
        </tr>
    `).join('');

    modal.classList.add('open');
};

window.editOrder = function(id) {
    const order = DB.getOrders().find(o => o.id === id);
    if (!order) return;

    const modal = document.getElementById('order-edit-modal');
    document.getElementById('edit-order-id').value = order.id;
    document.getElementById('edit-order-status').value = order.status || 'Processing';
    document.getElementById('edit-order-note').value = order.internalNote || '';

    modal.classList.add('open');
};

window.deleteOrder = function(id) {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        DB.deleteOrder(id);
        renderOrdersTable();
        updateDashboardStats();
    }
};
// --- INQUIRIES ---

function renderInquiriesTable() {
    const tbody = document.getElementById('inquiries-table-body');
    inquiries = DB.getInquiries();

    if (inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No direct buy requests found.</td></tr>';
        return;
    }

    inquiries.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

    tbody.innerHTML = inquiries.map(inq => {
        const date = new Date(inq.date).toLocaleDateString();
        const productImg = inq.product ? inq.product.image : '';
        const productName = inq.product ? inq.product.name : 'Unknown Product';
        const customer = inq.customer;
        const paymentLabel = customer.paymentMethod ? customer.paymentMethod.toUpperCase() : 'N/A';

        return `
        <tr>
            <td style="font-size: 11px;">${date}</td>
            <td>
                <div style="font-weight: bold;">${customer.name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${customer.email || 'No Email'}</div>
                <div style="font-size: 11px; color: var(--primary);">${customer.phone}</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${productImg}" style="width: 30px; height: 30px; object-fit: contain; border-radius: 4px;">
                    <span style="font-size: 12px;">${productName}</span>
                </div>
            </td>
            <td>
                <div style="font-size: 12px; font-weight: bold; color: var(--accent);">${paymentLabel}</div>
            </td>
            <td style="max-width: 250px; font-size: 11px; color: var(--text-muted);">
                <div>${customer.city}, ${customer.pin}</div>
                <div style="font-style: italic;">LM: ${customer.landmark}</div>
                <div style="margin-top: 4px; color: white;">${customer.address}</div>
            </td>
            <td>
                <button class="delete-btn" onclick="deleteInquiry('${inq.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

window.deleteInquiry = function (id) {
    if (confirm('Are you sure you want to delete this direct buy request?')) {
        DB.deleteInquiry(id);
        renderInquiriesTable();
    }
};

// --- USERS ---

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    const users = DB.getUsers();

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No users found.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(u => {
        const roleColor = u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)';
        const phone = u.phone || 'No Phone';
        const address = u.city ? `${u.city}, ${u.pin}` : (u.address || 'No Address');
        return `
        <tr>
            <td><div style="font-weight: bold; color: white;">${u.name}</div></td>
            <td>${u.email}</td>
            <td>
                <span style="padding: 4px 8px; background: rgba(255,255,255,0.05); border: 1px solid ${roleColor}; color: ${roleColor}; border-radius: 4px; font-size: 11px; text-transform: uppercase;">
                    ${u.role}
                </span>
            </td>
            <td style="font-size: 12px; color: var(--text-muted);">
                <div>${phone}</div>
                <div>${address}</div>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser('${u.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteUser('${u.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

function setupUserManagement() {
    if(!userForm) return;

    // Cancel Button
    document.getElementById('cancel-user-btn').addEventListener('click', () => {
        userModal.classList.remove('open');
    });

    // Form Submit
    userForm.addEventListener('submit', handleUserSubmit);

    // Initial Render
    renderUsersTable();
}

function openUserModal(user) {
    userModal.classList.add('open');
    editingUserId = user.id;
    document.getElementById('user-name').value = user.name || '';
    document.getElementById('user-email').value = user.email || '';
    document.getElementById('user-role').value = user.role || 'client';
    document.getElementById('user-phone').value = user.phone || '';
    document.getElementById('user-address').value = user.address || '';
    document.getElementById('user-city').value = user.city || '';
    document.getElementById('user-pin').value = user.pin || '';
    document.getElementById('user-landmark').value = user.landmark || '';
}

function handleUserSubmit(e) {
    e.preventDefault();

    const user = DB.findUser(u => u.id === editingUserId);
    if (!user) return; // Only allow editing existing users via admin for now

    // Update fields
    user.name = document.getElementById('user-name').value;
    user.email = document.getElementById('user-email').value;
    user.role = document.getElementById('user-role').value;
    user.phone = document.getElementById('user-phone').value;
    user.address = document.getElementById('user-address').value;
    user.city = document.getElementById('user-city').value;
    user.pin = document.getElementById('user-pin').value;
    user.landmark = document.getElementById('user-landmark').value;

    DB.saveUser(user);

    userModal.classList.remove('open');
    renderUsersTable();
}

window.editUser = function (id) {
    const user = DB.findUser(u => u.id === id);
    if (user) openUserModal(user);
};

window.deleteUser = function (id) {
    if (confirm('Are you sure you want to completely delete this user?')) {
        DB.deleteUser(id);
        renderUsersTable();
    }
};
