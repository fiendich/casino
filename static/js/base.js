async function submitLogin() {
    const body = new FormData();
    body.append("username", document.getElementById("loginUsername").value);
    body.append("password", document.getElementById("loginPassword").value);

    const res = await fetch("/login", { method: "POST", body });
    const data = await res.json();

    if (data.success) {
        window.location.reload();
    } else {
        const err = document.getElementById("loginError");
        err.textContent = data.error;
        err.style.display = "block";
    }
}

async function submitRegister() {
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;
    const err = document.getElementById("registerError");

    if (username.length < 3) {
        err.textContent = "Username must be at least 3 characters.";
        err.style.display = "block"; return;
    }
    if (username.length > 20) {
        err.textContent = "Username must be under 20 characters.";
        err.style.display = "block"; return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        err.textContent = "Username can only contain letters, numbers, and underscores.";
        err.style.display = "block"; return;
    }

    // Password checks
    if (password.length < 8) {
        err.textContent = "Password must be at least 8 characters.";
        err.style.display = "block"; return;
    }
    if (!/[A-Z]/.test(password)) {
        err.textContent = "Password must contain at least one uppercase letter.";
        err.style.display = "block"; return;
    }
    if (!/[0-9]/.test(password)) {
        err.textContent = "Password must contain at least one number.";
        err.style.display = "block"; return;
    }

    // Clear any previous error
    err.style.display = "none";

    const body = new FormData();
    body.append("username", username);
    body.append("password", password);

    const res = await fetch("/register", { method: "POST", body });
    const data = await res.json();

    if (data.success) {
        window.location.reload();
    } else {
        err.textContent = data.error;
        err.style.display = "block";
    }
}

// Modal functions
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        switchTab(tab);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        // Remove modal param from URL
        const url = new URL(window.location);
        url.searchParams.delete('modal');
        url.searchParams.delete('tab');
        window.history.replaceState({}, '', url);
    }
}

function switchTab(tabName) {
    // Remove active from all tabs and contents
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active to selected tab
    const tabButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`${tabName}Form`);
    
    if (tabButton) tabButton.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

// Tab button click handlers
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
        switchTab(this.dataset.tab);
    });
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
        closeAuthModal();
    }
}

// Check URL params on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('modal') === 'auth') {
        const tab = urlParams.get('tab') || 'login';
        openAuthModal(tab);
    }
});