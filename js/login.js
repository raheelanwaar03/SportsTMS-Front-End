import {
    AUTHENTICATION_API,
    getApiErrorMessage,
    requestJson,
    saveAuthSession
} from './ApiServices.js';

const form = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const submitButton = form?.querySelector('button[type="submit"]');

form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'danger');
        return;
    }

    if (!password) {
        showMessage('Please enter your password.', 'danger');
        return;
    }

    setLoading(true);

    try {
        const data = await requestJson(`${AUTHENTICATION_API.BASE_URL}${AUTHENTICATION_API.LOGIN}`, {
            method: 'POST',
            token: null,
            body: { email, password }
        });

        if (!data?.token) {
            showMessage(data?.msg || data?.message || 'Login succeeded, but no session token was returned.', 'warning');
            return;
        }

        saveAuthSession(data);
        showMessage('Login successful. Opening your dashboard...', 'success');

        window.setTimeout(() => {
            window.location.href = 'index.html';
        }, 600);
    } catch (error) {
        showMessage(getApiErrorMessage(error, 'An error occurred during login.'), 'danger');
    } finally {
        setLoading(false);
    }
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(isLoading) {
    if (!submitButton) return;
    submitButton.disabled = isLoading;
    submitButton.innerHTML = isLoading
        ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Signing in'
        : '<i class="bi bi-box-arrow-in-right me-2"></i>Sign in';
}

function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `auth-message alert alert-${type}`;
}
