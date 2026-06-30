let currentUser = null;
let selectedUser = null;

// =====================
// INIT SAFE AUTH
// =====================
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

    currentUser = data.username;

    selectedUser = new URLSearchParams(window.location.search).get("user");

    loadUsers();
    loadMessages();

    setInterval(loadMessages, 3000);
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

        if (username === selectedUser) {
            div.style.fontWeight = "bold";
        }

        div.onclick = () => {
            selectedUser = username;
            history.pushState({}, "", `/chat?user=${username}`);
            loadMessages();
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

            if (m.from === currentUser) div.classList.add("me");

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
    const text = input.value;

    if (!text || !selectedUser || !currentUser) return;

    await fetch("/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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