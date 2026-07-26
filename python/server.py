from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

import geopandas as gpd
import sqlite3

app = Flask(__name__)
CORS(app)

DB_FILE = "government.db"
GPKG_PATH = Path("data/cb_2025_us_all_5m.gpkg")

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

@app.get("/api/geography/nation")
def get_nation():
    try:
        gdf = gpd.read_file(GPKG_PATH, layer="nation")

        # Cesium expects longitude/latitude coordinates.
        if gdf.crs is None:
            return jsonify({"error": "The layer has no CRS defined."}), 500

        gdf = gdf.to_crs(epsg=4326)

        # Convert to a Python dictionary so Flask returns real JSON.
        return jsonify(gdf.__geo_interface__)

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
    #app.run(debug=True)