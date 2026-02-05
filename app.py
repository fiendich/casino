from flask import Flask, render_template, request, redirect, session, jsonify
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()


# Helper function to get username for templates
def get_template_context():
    """Returns common template context with username if logged in"""
    context = {}
    if "user_id" in session:
        user = User.query.get(session["user_id"])
        if user:
            context["username"] = user.username
    return context


# ------------------------
# ROUTES
# ------------------------

@app.route("/")
def index():
    if "user_id" not in session:
        # Not logged in: render index with no balance, modal will open via JS
        return render_template("index.html", balance=0, **get_template_context())

    user = User.query.get(session["user_id"])
    return render_template("index.html", balance=user.balance, **get_template_context())


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = generate_password_hash(request.form["password"])

        # Check if username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return redirect("/")

        user = User(username=username, password=password, balance=1000)
        db.session.add(user)
        db.session.commit()

        # Auto-login after registration
        session["user_id"] = user.id
        return redirect("/")

    # GET request: redirect to index
    return redirect("/")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            session["user_id"] = user.id
            return redirect("/")
        else:
            # Failed login: go back to index, JS will detect no session and reopen modal
            return redirect("/")

    # GET request: redirect to index
    return redirect("/")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/?no_modal=1")


@app.route("/blackjack")
def blackjack():
    if "user_id" not in session:
        return render_template("blackjack.html", balance=0, **get_template_context())

    user = User.query.get(session["user_id"])
    return render_template("blackjack.html", balance=user.balance, **get_template_context())


@app.route("/roulette")
def roulette():
    if "user_id" not in session:
        return render_template("roulette.html", balance=0, **get_template_context())

    user = User.query.get(session["user_id"])
    return render_template("roulette.html", balance=user.balance, **get_template_context())


@app.route("/plinko")
def plinko():
    if "user_id" not in session:
        return render_template("plinko.html", balance=0, **get_template_context())

    user = User.query.get(session["user_id"])
    return render_template("plinko.html", balance=user.balance, **get_template_context())

# ------------------------
# API ENDPOINTS
# ------------------------

@app.route("/get_balance")
def get_balance():
    if "user_id" not in session:
        return jsonify({"error": "not logged in"}), 403

    user = User.query.get(session["user_id"])
    return jsonify({"balance": user.balance})


@app.route("/update_balance", methods=["POST"])
def update_balance():
    if "user_id" not in session:
        return jsonify({"error": "not logged in"}), 403

    data = request.get_json()
    amount = data.get("amount", 0)

    user = User.query.get(session["user_id"])
    user.balance += amount
    db.session.commit()

    return jsonify({"balance": user.balance})


if __name__ == "__main__":
    app.run(debug=True)