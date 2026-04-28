document.addEventListener("DOMContentLoaded", function () {

    const form = document.querySelector("form");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.querySelector("input[type='email']").value;
        const password = document.querySelector("input[type='password']").value;

        try {
            const response = await fetch("http://localhost:5000/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Login successful!");

                // Save token (if your API returns one)
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }

                // Redirect after login
                window.location.href = "dashboard.html";
            } else {
                alert(data.message || "Login failed");
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong!");
        }
    });

});