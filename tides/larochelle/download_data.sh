#!/bin/bash

# Set the year for which to download data
YEAR=2025

# Base URL with placeholders for month and year
BASE_URL="https://www.portlarochelle.com/marees/?d=MONTHYEAR"

# Create a temporary directory for HTML files
TEMP_DIR="html_temp"
mkdir -p "$TEMP_DIR"

# Loop through months 1 to 12
for MONTH in {1..12}; do
  # Format the month with leading zero if needed
  MONTH_PADDED=$(printf "%02d" $MONTH)

  # Replace placeholders in the URL
  URL=$(echo $BASE_URL | sed "s/MONTH/$MONTH_PADDED/" | sed "s/YEAR/$YEAR/")

  # Define the output file names
  HTML_FILE="$TEMP_DIR/${MONTH_PADDED}_${YEAR}.html"
  OUTPUT_FILE="${MONTH_PADDED}_${YEAR}.json"

  # Use wget to download the HTML file
  echo "Downloading data for $MONTH_PADDED/$YEAR..."
  wget -q "$URL" -O "$HTML_FILE"

  # Check if the download was successful
  if [[ $? -eq 0 ]]; then
    echo "Parsing HTML and generating JSON for $MONTH_PADDED/$YEAR..."

    # Export variables to be used by Python
    export MONTH_PADDED YEAR HTML_FILE OUTPUT_FILE

    # Use Python to parse the HTML and extract the table data



python3 <<EOF
import os
import json
from bs4 import BeautifulSoup
from datetime import datetime

# Retrieve variables passed from Bash
MONTH_PADDED = os.getenv("MONTH_PADDED")
YEAR = os.getenv("YEAR")
HTML_FILE = os.getenv("HTML_FILE")
OUTPUT_FILE = os.getenv("OUTPUT_FILE")

# Debugging: Ensure variables are not None
print(f"MONTH_PADDED: {MONTH_PADDED}")
print(f"YEAR: {YEAR}")
print(f"HTML_FILE: {HTML_FILE}")
print(f"OUTPUT_FILE: {OUTPUT_FILE}")

if not HTML_FILE or not OUTPUT_FILE:
    raise ValueError("HTML_FILE or OUTPUT_FILE is not set.")

# Read the HTML file
with open(HTML_FILE, "r") as f:
    soup = BeautifulSoup(f, "html.parser")

# Extract table rows
data = {}
rows = soup.select("tr.jour")
for row in rows:
    try:
        # Parse the date
        day_elem = row.select_one("td span:first-child")
        if day_elem:
            day = day_elem.text.strip()
            full_date = datetime.strptime(f"{day} {MONTH_PADDED} {YEAR}", "%d %m %Y").strftime("%Y-%m-%d")

            tides = []
            cells = row.find_all("td")

            # Morning coefficients
            coef_matin = cells[1].text.strip() if len(cells) > 1 else "---"

            # Morning tides (Basse mer and Pleine mer)
            if len(cells) > 2:
                bm_matin = cells[2].select_one("em.hauteur")
                time_matin_bm = cells[2].text.strip().split("\n")[0] if bm_matin else "---"
                height_matin_bm = bm_matin.text.split()[-1].replace("Hauteur", "") if bm_matin else "---"
                if time_matin_bm != "---":
                    # Strip 'Hauteur' from time
                    time_matin_bm = time_matin_bm.split("Hauteur")[0].strip()
                    tides.append(["tide.low", time_matin_bm, height_matin_bm, "---"])

            if len(cells) > 3:
                pm_matin = cells[3].select_one("em.hauteur")
                time_matin_pm = cells[3].text.strip().split("\n")[0] if pm_matin else "---"
                height_matin_pm = pm_matin.text.split()[-1].replace("Hauteur", "") if pm_matin else "---"
                if time_matin_pm != "---":
                    # Strip 'Hauteur' from time
                    time_matin_pm = time_matin_pm.split("Hauteur")[0].strip()
                    tides.append(["tide.high", time_matin_pm, height_matin_pm, coef_matin])

            # Evening coefficients
            coef_soir = cells[4].text.strip() if len(cells) > 4 else "---"

            # Evening tides (Basse mer and Pleine mer)
            if len(cells) > 5:
                bm_soir = cells[5].select_one("em.hauteur")
                time_soir_bm = cells[5].text.strip().split("\n")[0] if bm_soir else "---"
                height_soir_bm = bm_soir.text.split()[-1].replace("Hauteur", "") if bm_soir else "---"
                if time_soir_bm != "---":
                    # Strip 'Hauteur' from time
                    time_soir_bm = time_soir_bm.split("Hauteur")[0].strip()
                    tides.append(["tide.low", time_soir_bm, height_soir_bm, "---"])

            if len(cells) > 6:
                pm_soir = cells[6].select_one("em.hauteur")
                time_soir_pm = cells[6].text.strip().split("\n")[0] if pm_soir else "---"
                height_soir_pm = pm_soir.text.split()[-1].replace("Hauteur", "") if pm_soir else "---"
                if time_soir_pm != "---":
                    # Strip 'Hauteur' from time
                    time_soir_pm = time_soir_pm.split("Hauteur")[0].strip()
                    tides.append(["tide.high", time_soir_pm, height_soir_pm, coef_soir])


            # Add data for the day if tides were found
            if tides:
                data[full_date] = tides
    except Exception as e:
        print(f"Error parsing row: {row}")
        print(f"Exception: {e}")

# Write the data to a JSON file
with open(OUTPUT_FILE, "w") as f:
    json.dump(data, f, indent=4)
EOF


    echo "Saved JSON to $OUTPUT_FILE"
  else
    echo "Failed to download or parse data for $MONTH_PADDED/$YEAR"
  fi

done

# Cleanup temporary directory
rm -rf "$TEMP_DIR"
echo "All downloads and conversions complete."
