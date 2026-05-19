import { AUTHENTICATION_API } from './ApiServices.js';

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        loginMessage.textContent = 'Please enter a valid email address.';
        loginMessage.className = 'alert alert-danger';
        return;
    }

    if (!password) {
        loginMessage.textContent = 'Please enter your password.';
        loginMessage.className = 'alert alert-danger';
        return;
    }

    fetch(`${AUTHENTICATION_API.BASE_URL}${AUTHENTICATION_API.LOGIN}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            loginMessage.textContent = 'Login successful!';
            loginMessage.className = 'alert alert-success';
            // You can save the token to localStorage for future authenticated requests
            // localStorage.setItem('authToken', data.token);
        } else {
            loginMessage.textContent = data.message || 'Login failed!';
            loginMessage.className = 'alert alert-danger';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        loginMessage.textContent = 'An error occurred during login.';
        loginMessage.className = 'alert alert-danger';
    });
});