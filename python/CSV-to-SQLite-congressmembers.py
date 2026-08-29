import csv
import sqlite3
import pandas as pd

encodings = ["utf-8", "utf-8-sig", "latin1", "cp1252"]

for enc in encodings:
    try:
        df = pd.read_csv("congress_members.csv", encoding=enc, header=0, dtype={
            "bioguide_id": str,
            "name": str,
            "party": str,
            "state": str,
            "district": str,
            "chamber": str,
            "startYear": str,
            "image_url": str,
            "url": str,
            "retrieved_at": str,
            "data_source": str
        })

        print(f"Worked: {enc}")
        print(df.head())
        break
    except UnicodeDecodeError as e:
        print(f"Failed: {enc} -> {e}")

# Connect to specified data (creates the file if it doesn't exist)
conn = sqlite3.connect("government.db")
cursor = conn.cursor()

# Create a table if it doesn't exist.
cursor.execute("""
CREATE TABLE IF NOT EXISTS congress_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bioguide_id TEXT,
    name TEXT,
    party TEXT,
    state TEXT,
    district TEXT,
    chamber TEXT,
    startYear TEXT,
    image_url TEXT,
    url TEXT,
    retrieved_at TEXT,
    data_source TEXT
)
""")

# For However many rows in the dataframe, place the data into this table
# VALUES (?, ?, ?) represents placeholders <-- (in this case 3 columns)
for _, row in df.iterrows():
    cursor.execute("""
    INSERT OR REPLACE INTO congress_members (
        bioguide_id,
        name,
        party,
        state,
        district,
        chamber,
        startYear,
        image_url,
        url,
        retrieved_at,
        data_source
    )    
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        row["bioguide_id"],
        row["name"],
        row["party"],
        row["state"],
        row["district"],
        row["chamber"],
        row["startYear"],
        row["image_url"],
        row["url"],
        row["retrieved_at"],
        row["data_source"]
    ))

conn.commit()
conn.close()