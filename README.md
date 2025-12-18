# Flask Casino App 🎰 (Windows)

Simple Flask web app with user registration & login, session-based authentication, balance system, and basic casino games (Blackjack & Roulette). Uses Flask, SQLAlchemy, and SQLite.

---

## Requirements

- Windows 10 / 11  
- Python 3.9+  
- Git  

Check Python:
python --version

---

## Local Setup (Windows Only)

1) Clone the repository

git clone <REPO_URL>  
cd <REPO_FOLDER>

---

2) Create virtual environment

python -m venv venv

Activate it (CMD or PowerShell):

venv\Scripts\activate

If PowerShell blocks activation, run once:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

---

3) Install dependencies

pip install -r requirements.txt

---

4) Create .env file

In the project root, create a file named .env (NO file extension) with this content:

SECRET_KEY=your-super-secret-key

Notes:
- .env is ignored by git
- Each teammate can use their own SECRET_KEY
- Do NOT commit the .env file

---

5) Run the app

python app.py

Open in browser:
http://127.0.0.1:5000

---

## Database

- Uses SQLite
- Database file: database.db
- Created automatically on first run
- Each developer has their own local database

---

## Default Behavior

- New users start with a balance of 1000
- Session-based authentication using signed cookies
- Flask runs with debug=True (development only)

---

## Notes / Limitations

- Not production-ready
- Balance updates are client-triggered (learning project)
- No CSRF protection
- Passwords are hashed using Werkzeug

---

## Project Structure

.
├── app.py
├── models.py
├── database.db
├── templates/
├── static/
├── .env
├── .gitignore
└── requirements.txt

---

Happy hacking 🚀
