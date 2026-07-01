from flask import Flask, jsonify, request
from flask_cors import CORS

import sqlite3

app = Flask(__name__)
CORS(app)

DB_FILE = "government.db"

def query_db(query, params=()):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.route("/nation_congress_members")
def get_members():
    state = request.args.get("state")

    if state:
        members = query_db(
            "SELECT * FROM congress_members WHERE state = ?",
            (state,)
        )
    else:
        members = query_db("SELECT * FROM congress_members")

    return jsonify(members)

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
    #app.run(debug=True)