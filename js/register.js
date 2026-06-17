import {
    AUTHENTICATION_API,
    getApiErrorMessage,
    requestJson,
    saveAuthSession
} from './ApiServices.js';

const form = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');
const submitButton = form?.querySelector('button[type="submit"]');

form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    if (!username || !email || !password || !role) {
        showMessage('Please fill in all fields.', 'danger');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'danger');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters.', 'danger');
        return;
    }

    setLoading(true);

    try {
        const data = await requestJson(`${AUTHENTICATION_API.BASE_URL}${AUTHENTICATION_API.REGISTER}`, {
            method: 'POST',
            token: null,
            body: { username, email, password, role }
        });

        const registeredUser = data?.user || data?.data?.user || data;
        const succeeded = data?.success === true || Boolean(data?.token || registeredUser?.id || registeredUser?._id);

        if (!succeeded) {
            showMessage(data?.msg || data?.message || 'Registration failed.', 'danger');
            return;
        }

        if (data?.token) {
            saveAuthSession(data);
            showMessage('Account created. Opening your dashboard...', 'success');
            window.setTimeout(() => {
                window.location.href = 'index.html';
            }, 700);
            return;
        }

        showMessage('Account created. Please sign in.', 'success');
        window.setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    } catch (error) {
        showMessage(getApiErrorMessage(error, 'An error occurred during registration.'), 'danger');
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
        ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Creating'
        : '<i class="bi bi-person-plus me-2"></i>Create account';
}

function showMessage(message, type) {
    registerMessage.textContent = message;
    registerMessage.className = `auth-message alert alert-${type}`;
}
