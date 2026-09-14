import psycopg

from pathlib import Path
from dotenv import load_dotenv
import os

import geopandas as gpd
from shapely import force_2d

from sqlalchemy import create_engine, URL, text

# root_env = Path(__file__).resolve().parent.parent / ".env"
env = Path(__file__).resolve().parent / ".env"

load_dotenv(env)
print(env)

db_name = os.getenv("POSTGRES_DB")
db_user = os.getenv("POSTGRES_USER")
db_password = os.getenv("POSTGRES_PASSWORD")
db_port = os.getenv("POSTGRES_PORT")
db_host = "localhost"

# Connect to the PostgreSQL server
conn = psycopg.connect(
    host=db_host,
    port=db_port,
    dbname=db_name,
    user=db_user,
    password=db_password
)

# Creates a schema if it doesn't already exisi
with conn.cursor() as cursor:
    cursor.execute("""
        CREATE SCHEMA IF NOT EXISTS us;
    """)

    # If the geoid changes over time how to I make sure I'm updating the info properly?
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS us.place (
            geoid TEXT PRIMARY KEY,
            name TEXT,
            statefp TEXT,
            placefp TEXT,
            boundary geometry(MultiPolygon, 4269)
        );
    """)
                    # 4269 is commonly the CRS used by TIGER/Line data: NAD83
conn.commit()

# Connects to the data
gpkg_path = "data/tlgpkg_2026_us_substategeo.gpkg"

# reads the place layer of the file.
gdf = gpd.read_file(
    gpkg_path,
    layer="place"
)

print(gdf.head())
print(gdf.columns)
print(gdf.crs)

# Flatten the geometry of the area so that it can be on the map
gdf["geometry"] = gdf.geometry.apply(force_2d)

# Renamed the geometry so that other packages can read the geometry data
gdf = gdf.rename_geometry("boundary")
# Rename columns to match PostgreSQL
gdf = gdf.rename(columns={
    "GEOID": "geoid",
    "NAME": "name",
    "STATEFP": "statefp",
    "PLACEFP": "placefp",
    "geometry": "boundary"
})

# Keep only the columns that the PostgreSQL table expects
gdf = gdf[
    ["geoid", "name", "statefp", "placefp", "boundary"]
]

# Check the updates
print(gdf.head())
print(gdf.crs)

# Connect to PostgreSQL
url = URL.create(
    drivername="postgresql+psycopg",
    username=db_user,
    password=db_password,
    host=db_host,
    port=db_port,
    database=db_name
)
engine = create_engine(url)

# Verify sqlalchemy create_engine() connection
with engine.connect() as connection:
    result = connection.execute(text("SELECT current_database(), current_user;"))

    print(result.fetchone())

# Check the table to see if it contains data
with engine.connect() as connection:
    result = connection.execute(
        text("SELECT COUNT(*) FROM us.place;")
    )

    print(result.fetchone())

# Writes the .gpkg data into PostgreSQL / PostGIS
gdf.to_postgis(
    name="place",
    con=engine,
    schema="us",
    if_exists="append",
    index=False
)

# Check the table to see if it contains data again
with engine.connect() as connection:
    result = connection.execute(
        text("SELECT COUNT(*) FROM us.place;")
    )

    print(result.fetchone())

# Check a few records to see if the data was implemented properly
with engine.connect() as connection:
    result = connection.execute(
        text("""
            SELECT geoid, name, statefp, placefp
            FROM us.place
            LIMIT 10;
        """)
    )

    for row in result:
        print(row)
        
