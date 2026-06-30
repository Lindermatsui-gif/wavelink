window.addEventListener("load", async () => {

    const token = localStorage.getItem("token");

    if (!token) return;

    const res = await fetch(`/me/${token}`);
    const data = await res.json();

    if (data.valid) {
        window.location.href = "/chat?user=" + data.username;
    } else {
        localStorage.clear();
    }
});

window.addEventListener("DOMContentLoaded", () => {

    const button = document.querySelector(".button7");

    if (!button) return;

    button.addEventListener("click", async () => {

        const inputs = document.querySelectorAll("input");

        const username = inputs[0].value.trim();
        const password = inputs[1].value.trim();

        const res = await fetch("/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!data.success) {
            alert("Wrong username or password");
            return;
        }

        localStorage.setItem("token", data.token);

        window.location.href = "/chat?user=" + username;
    });
});