let currentUser = null;
let selectedUser = null;

window.addEventListener("load", async () => {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/";
        return;
    }

    const res = await fetch(`/me/${token}`);
    const data = await res.json();

    if (!data.valid) {
        localStorage.clear();
        window.location.href = "/";
        return;
    }

    // 💥 TOI = TOUJOURS BACKEND
    currentUser = data.username;
    localStorage.setItem("username", currentUser);

    // 💥 CHAT TARGET = URL UNIQUEMENT
    const urlUser = new URLSearchParams(window.location.search).get("user");

    // ❌ sécurité anti auto-chat
    if (urlUser === currentUser) {
        selectedUser = null;
        window.history.replaceState({}, "", "/chat");
    } else {
        selectedUser = urlUser;
    }

    loadUsers();
    loadMessages();

    setInterval(loadMessages, 2000);

    const theme = localStorage.getItem("theme") || "light";
    document.body.className = theme;
});

// =====================
// USERS
// =====================
async function loadUsers() {

    const res = await fetch("/users");
    const users = await res.json();

    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = "";

    users.forEach(u => {

        const username = u.username;

        const div = document.createElement("div");
        div.innerText = username;

        // =====================
        // TOI (CURRENT USER)
        // =====================
        if (username === currentUser) {
            div.style.opacity = "0.5";
            div.innerText += " (vous)";
        }

        // =====================
        // CHAT ACTIF
        // =====================
        if (selectedUser && username === selectedUser) {
            div.style.fontWeight = "bold";
            div.style.color = "#4f8cff";
        }

        div.onclick = () => {

            // interdit de se sélectionner soi-même
            if (username === currentUser) return;

            selectedUser = username;

            window.history.pushState(
                {},
                "",
                `/chat?user=${username}`
            );

            loadMessages();
            loadUsers(); // refresh UI propre
        };

        sidebar.appendChild(div);
    });
}

// =====================
// MESSAGES
// =====================
async function loadMessages() {

    if (!currentUser || !selectedUser) return;

    const res = await fetch("/messages");
    const data = await res.json();

    const box = document.getElementById("messages");
    box.innerHTML = "";

    data
        .filter(m =>
            (m.from === currentUser && m.to === selectedUser) ||
            (m.from === selectedUser && m.to === currentUser)
        )
        .forEach(m => {

            const div = document.createElement("div");
            div.classList.add("msg");

            if (m.from === currentUser) {
                div.classList.add("me");
            }

            div.innerHTML = `
                <div class="username">${m.from}</div>
                <div class="text">${m.text}</div>
            `;

            box.appendChild(div);
        });
}

// =====================
// SEND MESSAGE
// =====================
async function sendMessage() {

    const input = document.getElementById("msgInput");
    const text = input.value.trim();

    if (!text || !selectedUser) return;

    await fetch("/send_message", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            from: currentUser,
            to: selectedUser,
            text: text
        })
    });

    input.value = "";
    loadMessages();
}

// =====================
// THEME
// =====================
function changeTheme() {
    const theme = document.getElementById("themeSelect").value;
    localStorage.setItem("theme", theme);
    document.body.className = theme;
}