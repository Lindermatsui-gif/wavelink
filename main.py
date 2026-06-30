from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import json
import random
import string
import os
import uuid

app = FastAPI()

# =====================
# CORS
# =====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# STATIC FILES
# =====================
app.mount("/static", StaticFiles(directory="static"), name="static")

# =====================
# UPLOAD FILES
# =====================
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# =====================
# MEMORY TOKEN STORE
# =====================
TOKENS = {}

def generate_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=16))

# =====================
# PAGES
# =====================
@app.get("/")
def index():
    return FileResponse("index.html")

@app.get("/chat")
def chat():
    return FileResponse("chat.html")

# =====================
# USERS
# =====================
@app.get("/users")
def users():
    with open("data/users.json", "r", encoding="utf-8") as f:
        return json.load(f)

# =====================
# MESSAGES
# =====================
@app.get("/messages")
def get_messages():
    with open("data/messages.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/send_message")
def send_message(data: dict):

    with open("data/messages.json", "r", encoding="utf-8") as f:
        messages = json.load(f)

    # ✅ VERSION SAFE (TEXT + IMAGE + VIDEO + FILE)
    messages.append({
        "from": data.get("from"),
        "to": data.get("to"),
        "type": data.get("type", "text"),
        "text": data.get("text", ""),
        "content": data.get("content", "")
    })

    with open("data/messages.json", "w", encoding="utf-8") as f:
        json.dump(messages, f, indent=4)

    return {"success": True}

# =====================
# UPLOAD SYSTEM
# =====================
@app.post("/upload")
async def upload(file: UploadFile = File(...)):

    ext = file.filename.split(".")[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()

    with open(path, "wb") as f:
        f.write(content)

    return {
        "url": f"/uploads/{filename}",
        "type": ext,
        "filename": file.filename
    }

# =====================
# AUTH
# =====================
@app.post("/login")
def login(data: dict):

    with open("data/users.json", "r", encoding="utf-8") as f:
        users = json.load(f)

    for u in users:
        if u["username"] == data["username"] and u["password"] == data["password"]:

            token = generate_token()
            TOKENS[token] = u["username"]

            return {
                "success": True,
                "token": token
            }

    return {"success": False}

@app.get("/me/{token}")
def me(token: str):

    username = TOKENS.get(token)

    if not username:
        return {"valid": False}

    return {
        "valid": True,
        "username": username
    }