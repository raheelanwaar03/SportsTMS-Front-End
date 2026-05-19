import { AUTHENTICATION_API } from './ApiServices.js';

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const registerMessage = document.getElementById('registerMessage');

    // Basic validation
    if (!username || !email || !password || !role) {
        registerMessage.textContent = 'Please fill in all fields.';
        registerMessage.className = 'alert alert-danger';
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        registerMessage.textContent = 'Please enter a valid email address.';
        registerMessage.className = 'alert alert-danger';
        return;
    }

    fetch(`${AUTHENTICATION_API.BASE_URL}${AUTHENTICATION_API.REGISTER}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, role })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            registerMessage.textContent = 'Registration successful! Please login.';
            registerMessage.className = 'alert alert-success';
        } else {
            registerMessage.textContent = data.message || 'Registration failed!';
            registerMessage.className = 'alert alert-danger';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        registerMessage.textContent = 'An error occurred during registration.';
        registerMessage.className = 'alert alert-danger';
    });
});
