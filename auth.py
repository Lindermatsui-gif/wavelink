import json
import random
import string

TOKENS_FILE = "data/tokens.json"


def load_users():
    with open("data/users.json", "r", encoding="utf-8") as f:
        return json.load(f)


def load_tokens():
    try:
        with open(TOKENS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}


def save_tokens(tokens):
    with open(TOKENS_FILE, "w", encoding="utf-8") as f:
        json.dump(tokens, f)


def generate_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=16))


def login(username, password):
    users = load_users()
    tokens = load_tokens()

    for user in users:
        if user["username"] == username and user["password"] == password:

            token = generate_token()
            tokens[token] = username

            save_tokens(tokens)

            return {
                "success": True,
                "token": token
            }

    return {"success": False}


def verify_token(token):
    tokens = load_tokens()
    return token in tokens