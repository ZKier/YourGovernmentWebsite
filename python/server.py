from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

import geopandas as gpd
import sqlite3

import os
from dotenv import load_dotenv
#import psycopg
from sqlalchemy import create_engine, URL, text

app = Flask(__name__)
CORS(app)

DB_FILE = "/app/government.db"
GPKG_PATH = Path("data/cb_2025_us_all_5m.gpkg")

# Get the env variable to reach the PostgreSQL database
env = Path(__file__).resolve().parent / ".env"
load_dotenv(env)

# Variables for the PostgreSQL server connection
db_name = os.getenv("POSTGRES_DB")
db_user = os.getenv("POSTGRES_USER")
db_password = os.getenv("POSTGRES_PASSWORD")
db_port = os.getenv("POSTGRES_PORT")
db_host = "database"

# Connect to the PostgreSQL server
url = URL.create(
    drivername="postgresql+psycopg",
    username=db_user,
    password=db_password,
    host=db_host,
    port=db_port,
    database=db_name
)

# The query engine for PostgreSQL
engine = create_engine(url)

# Verify sqlalchemy create_engine() connection
with engine.connect() as connection:
    result = connection.execute(text("SELECT current_database(), current_user;"))

    print(result.fetchone())

# SQLite query
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
    country = request.args.get("nation")

    if country:
        members = query_db(
            "SELECT * FROM congress_members WHERE country = ?",
            (country,)
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

# I want to "GET the place in this location at a certain zoom" (it should never show ALL of the places on the map at once)
@app.get("/api/geography/place")
def get_place():
    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)
    try:
        # Build the query for the data that is desired by creating a box
            # Returns (GeoID, Place Name, StateFP, PlaceFP, Geographic Boundaries, and a calculated longitude and latitude for the boundary)
        query = """
            SELECT p.geoid, p.name, p.statefp, p.placefp, p.boundary,
                ST_X(ST_PointOnSurface(largest.geom)) AS label_longitude,
                ST_Y(ST_PointOnSurface(largest.geom)) AS label_latitude
            FROM us.place as p

            CROSS JOIN LATERAL (
                SELECT geom
                FROM ST_Dump(p.boundary)
                ORDER BY ST_Area(geom::geography) DESC
                LIMIT 1
            ) AS largest

            WHERE boundary && ST_MakeEnvelope(
            %(west)s,
            %(south)s,
            %(east)s,
            %(north)s,
            4269
            )"""

        # Convert the Query into data that converts into a dataframe
        gdf = gpd.read_postgis(
            query,
            con=engine,
            geom_col="boundary",
            params={
                "west": west,
                "south": south,
                "east": east,
                "north": north
            }
        )

        # Convert the dataframe data into JSON for the JavaScript to understand
        return jsonify(gdf.__geo_interface__)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True, 
        use_reloader=False
    )
