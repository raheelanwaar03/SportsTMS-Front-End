document.addEventListener('DOMContentLoaded', function() {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        // If no token is found, redirect to the login page
        window.location.href = 'index.html';
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Remove the token from localStorage
            localStorage.removeItem('authToken');
            // Redirect to the login page
            window.location.href = 'index.html';
        });
    }
});
