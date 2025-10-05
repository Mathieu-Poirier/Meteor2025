from fastapi import FastAPI
from fastapi import Query
import httpx
import asyncio
import math

# Opening the APIKey
f = open("../api.txt")
KEY: str = f.read().strip(" ")

# Date to search
date_str_start: str = "2025-09-29"
date_str_end: str = "2025-10-04"

# Earth orbitals
earth = {
  "a": 1.00000011,
  "e": 0.01671022,
  "i": 0.00005,
  "om": -11.26064,
  "w": 102.94719,
  "ma": 100.46435,
  "epoch": 2451545.0
}

app = FastAPI()
@app.get("/cross_keplarian")
async def cross_keplarian(asteroid_id: str):
    async with httpx.AsyncClient() as client:
        neo_resp, sbdb_resp = await asyncio.gather(
            client.get(f"https://api.nasa.gov/neo/rest/v1/neo/{asteroid_id}?api_key={KEY}"),
            client.get(f"https://ssd-api.jpl.nasa.gov/sbdb.api?sstr={asteroid_id}")
        )
        neo, sbdb = neo_resp.json(), sbdb_resp.json()

    # ---- Filter + flatten orbit ----
    orbit = {e["name"]: float(e["value"])
             for e in sbdb["orbit"]["elements"]
             if e["name"] in ["a", "e", "i", "om", "w", "ma"]}
    orbit["epoch"] = float(sbdb["orbit"]["epoch"])

    # ---- Filter closest Earth approach ----
    earth_approaches = [
        a for a in neo["close_approach_data"]
        if a["orbiting_body"] == "Earth"
    ]
    closest = None
    if earth_approaches:
        closest = min(
            earth_approaches,
            key=lambda x: float(x["miss_distance"]["kilometers"])
        )
        # keep only essentials
        closest = {
            "date": closest["close_approach_date_full"],
            "miss_km": float(closest["miss_distance"]["kilometers"]),
            "vel_kps": float(closest["relative_velocity"]["kilometers_per_second"])
        }

    # ---- Minimal return ----
    return {
        "id": asteroid_id,
        "name": neo["name"],
        "hazardous": neo["is_potentially_hazardous_asteroid"],
        "diameter_km": {
            "min": neo["estimated_diameter"]["kilometers"]["estimated_diameter_min"],
            "max": neo["estimated_diameter"]["kilometers"]["estimated_diameter_max"],
        },
        "orbit": orbit,
        "closest": closest,
    }

@app.get("/asteroid_position")
def asteroid_position(
    a: float = Query(...), e: float = Query(...), i: float = Query(...),
    om: float = Query(...), w: float = Query(...), ma: float = Query(...)
):
    # Convert angles to radians
    i, om, w, ma = map(math.radians, (i, om, w, ma))

    # Solve Kepler’s equation (approx) to get eccentric anomaly
    E = ma
    for _ in range(10):  # Newton-Raphson refine
        E = E - (E - e * math.sin(E) - ma) / (1 - e * math.cos(E))

    # Position in orbital plane
    x_orb = a * (math.cos(E) - e)
    y_orb = a * (math.sqrt(1 - e**2) * math.sin(E))

    # Rotate into 3D space
    X = (math.cos(om) * math.cos(w) - math.sin(om) * math.sin(w) * math.cos(i)) * x_orb \
        + (-math.cos(om) * math.sin(w) - math.sin(om) * math.cos(w) * math.cos(i)) * y_orb
    Y = (math.sin(om) * math.cos(w) + math.cos(om) * math.sin(w) * math.cos(i)) * x_orb \
        + (-math.sin(om) * math.sin(w) + math.cos(om) * math.cos(w) * math.cos(i)) * y_orb
    Z = (math.sin(w) * math.sin(i)) * x_orb + (math.cos(w) * math.sin(i)) * y_orb

    return {"x": X, "y": Y, "z": Z}
