from datetime import datetime
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

from pathlib import Path

import unzip_file

### Get this script to import the most recent TIGER/line GeoPackage sub-state data ###

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIRECTORY = SCRIPT_DIR.parent / "data"
print("Output Director = ", OUTPUT_DIRECTORY)
download_url = ''

# Determine the time (In UTC for consistency)
utc_now = datetime.now(ZoneInfo("UTC"))
print(utc_now.year)
this_year = utc_now.year

# This is the direct link and pattern of the link of the TIGER/line data 
# for the past 3 years.
page_url = (
    f"https://www.census.gov/geographies/mapping-files/"
    f"time-series/geo/tiger-geopackage-file.{this_year}.html"
)

# Call for the website
response = requests.get(page_url)

# If the page exists run the below code
if response.status_code == 200:
    # This is the HTML data converted using html.parser
    soup = BeautifulSoup(response.text, "html.parser")

    # This is the usual label of the data I'm looking for
    target_text = "National Sub-State Geography GeoPackage"

    # Parse the links to see if the words that I'm looking for exist.
    for link in soup.find_all("a", href=True):
        text = link.get_text(" ", strip=True)

        # Implents consistency in the naming
        if target_text.lower() in text.lower():

            # Grabs the link for the download
            download_url = urljoin(page_url, link["href"])
            print(download_url)

            # Removes all text preceeding the last '/' to leave the filename alone
            filename = download_url.split("/")[-1]
            output_path = OUTPUT_DIRECTORY / filename

            # Breaks the loop early because the file is already present in the storage
            if output_path.exists():
                print(f"Already downloaded: {output_path}")
                break

            # Make the HTTP request
            response = requests.get(download_url, stream=True, timeout=60)
            response.raise_for_status()

            # Downloads the data in chunks 1MB specifically 
            with open(output_path, "wb") as file:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        file.write(chunk)

            print(f"Downloaded: {output_path}")
            break # break the loop.

file_path = output_path
while True:
    unzip = input(f"Do you want to un-zip this file?: \"{download_url.split("/")[-1]}\" [Y/N]?\n").lower().strip()
    if unzip in ['yes', 'y']:
        output_path = unzip_file.unzip_file(file_path)
        print(f"Unzipped: {output_path}")
        break
    elif unzip in ['no', 'n']:
        print("User stated NO!")
        break
    else:
        print("Please enter Y or N.\n")
