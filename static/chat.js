const currentUser = new URLSearchParams(window.location.search).get("user");

if (!currentUser) {
    window.location.href = "/";
}

let selectedUser = null;
// =====================
// GET USER FROM URL (?user=)
// =====================
function getUserFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("user");
}

// init selected user ONCE
selectedUser = getUserFromURL();

console.log("CURRENT USER =", currentUser);
console.log("CHAT WITH =", selectedUser);

// =====================
// LOAD USERS (SIDEBAR)
// =====================
async function loadUsers() {

    const res = await fetch("/users");
    const users = await res.json();

    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = "";

    users.forEach(u => {

        const username = u.username || u;

        const div = document.createElement("div");
        div.innerText = username;

        // highlight current chat user
        if (username === selectedUser) {
            div.style.fontWeight = "bold";
        }

        div.onclick = () => {

            // change ONLY URL (no reload loop)
            window.history.pushState({}, "", `/chat?user=${username}`);

            selectedUser = username;

            loadMessages();
        };

        sidebar.appendChild(div);
    });
}

// =====================
// LOAD MESSAGES
// =====================
async function loadMessages() {

    if (!selectedUser || !currentUser) return;

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
                <div class="username">${m.from ?? "unknown"}</div>
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
        headers: {
            "Content-Type": "application/json"
        },
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
// INIT (NO LOOP)
// =====================
window.onload = () => {

    loadUsers();
    loadMessages();

    setInterval(() => {
        loadMessages();
    }, 3000);
};