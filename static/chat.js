let currentUser = null;
let selectedUser = null;
let stagedFile = null;

// =====================
// UPLOAD FILE
// =====================
async function uploadFile(file) {

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    return await res.json();
}

// =====================
// INIT AUTH
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
    localStorage.setItem("username", currentUser);

    const urlUser = new URLSearchParams(window.location.search).get("user");

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

        if (username === currentUser) {
            div.style.opacity = "0.5";
            div.innerText += " (vous)";
        }

        if (selectedUser && username === selectedUser) {
            div.style.fontWeight = "bold";
            div.style.color = "#4f8cff";
        }

        div.onclick = () => {

            if (username === currentUser) return;

            selectedUser = username;

            window.history.pushState({}, "", `/chat?user=${username}`);

            loadMessages();
            loadUsers();
        };

        sidebar.appendChild(div);
    });
}

// =====================
// LOAD MESSAGES
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

            let html = `<div class="username">${m.from}</div>`;

            switch (m.type) {

                case "image":
                case "gif":
                    html += `<img src="${m.content}" style="max-width:250px;border-radius:10px;">`;
                    break;

                case "video":
                    html += `
                        <video controls style="max-width:250px;border-radius:10px;">
                            <source src="${m.content}">
                        </video>
                    `;
                    break;

                case "file":
                    html += `<a href="${m.content}" target="_blank">📎 ${m.text}</a>`;
                    break;

                default:
                    html += `<div class="text">${m.text}</div>`;
            }

            div.innerHTML = html;
            box.appendChild(div);
        });

    box.scrollTop = box.scrollHeight;
}

// =====================
// STAGE FILE (aperçu sans envoyer)
// =====================
function stageFile(file) {

    if (!file) return;

    stagedFile = file;

    const preview = document.getElementById("preview");
    const img = document.getElementById("previewImg");
    const name = document.getElementById("previewName");

    preview.style.display = "flex";

    if (file.type.startsWith("image")) {
        img.src = URL.createObjectURL(file);
        img.style.display = "inline";
        name.textContent = "";
    } else {
        img.style.display = "none";
        name.textContent = "📎 " + file.name;
    }
}

function clearStaged() {

    stagedFile = null;

    document.getElementById("preview").style.display = "none";
    document.getElementById("previewImg").src = "";
    document.getElementById("previewName").textContent = "";
    document.getElementById("fileInput").value = "";
}

// =====================
// SEND ALL (texte + fichier)
// =====================
async function sendAll() {

    if (!selectedUser) return alert("Choisis un utilisateur");

    // Fichier stagé
    if (stagedFile) {

        const file = stagedFile;
        clearStaged();

        const uploaded = await uploadFile(file);
        const ext = file.name.split(".").pop().toLowerCase();

        let type = "file";
        if (["png","jpg","jpeg","webp","svg"].includes(ext)) type = "image";
        else if (ext === "gif") type = "gif";
        else if (["mp4","webm","mov"].includes(ext)) type = "video";

        await fetch("/send_message", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                from: currentUser,
                to: selectedUser,
                type: type,
                text: file.name,
                content: uploaded.url
            })
        });

        loadMessages();
    }

    // Texte
    const input = document.getElementById("msgInput");
    const text = input.value.trim();

    if (text) {

        await fetch("/send_message", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                from: currentUser,
                to: selectedUser,
                type: "text",
                text: text,
                content: ""
            })
        });

        input.value = "";
        loadMessages();
    }
}

// =====================
// ENTER TO SEND
// =====================
document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("msgInput");

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendAll();
    });
});

// =====================
// CTRL+V → aperçu seulement
// =====================
document.addEventListener("paste", (e) => {

    const items = e.clipboardData.items;

    for (let item of items) {
        if (item.type.startsWith("image")) {
            const file = item.getAsFile();
            stageFile(file);
        }
    }
});

// =====================
// DRAG & DROP → aperçu seulement
// =====================
const inputArea = document.getElementById("inputArea");

if (inputArea) {

    inputArea.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    inputArea.addEventListener("drop", (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) stageFile(file);
    });
}
