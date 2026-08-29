# Populate a new table with congressional data form Congress.gov

# Import Libraries and Modules
from dotenv import load_dotenv
import os
import csv
import time
import requests
from datetime import datetime, UTC

'''
Goals:

Create funtion to:
    # Call API
    # Input data into a dataframe
    # Place data into a csv
'''

load_dotenv() # Looks for .env in the current working directory

API_KEY = os.getenv("CONGRESS_API_KEY")

if not API_KEY:
    raise RuntimeError("Missing CONGRESS_API_KEY environment variable")

# Structure obtained from Congress.gov website
params = {
    "api_key": API_KEY,
    "format": "json",
    "limit": 250,
    "offset": 0,
    "currentMember": "true",
}

BASE_URL = "https://api.congress.gov/v3/member?"

rows = []
retrieved_at = datetime.now(UTC).isoformat()

while True:
    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()

    data = response.json()
    members = data.get("members", [])

    if not members:
        break

    for member in members:
        rows.append({
            "bioguide_id": member.get("bioguideId"),
            "name": member.get("name"),
            "party": member.get("partyName"),
            "state": member.get("state"),
            "district": member.get("district"),
            "chamber": member.get("terms").get("item")[0].get("chamber"),
            "startYear": member.get("terms").get("item")[0].get("startYear"),
            "image_url": member.get("depiction", {}).get("imageUrl"), # '{}' represents that if there are no depictions, return empty.
            "url": member.get("url"),
            "retrieved_at": retrieved_at,
            "data_source": "Congress.gov API"
        })

        pagination = data.get("pagination", {})
        next_url = pagination.get("next")

        if not next_url:
            break

        params["offset"] += params["limit"]
        time.sleep(0.2) # to prevent issues with API requests.

with open("congress_members.csv", "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=[
        "bioguide_id",
        "name",
        "party",
        "state",
        "district",
        "chamber",
        "startYear",
        "image_url",
        "url",
        "retrieved_at",
        "data_source"
    ])
    writer.writeheader()
    writer.writerows(rows)

print(f"Saved {len(rows)} members to congress_members.csv")