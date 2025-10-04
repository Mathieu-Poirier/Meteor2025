from fastapi import FastAPI
import httpx

# Opening the APIKey
f = open("../api.txt")
KEY: str = f.read().strip(" ")

app = FastAPI()

# @app.get("/cross_keplarian")
# def read_item(asteroid_id: int):
    
#     return {"item_id": item_id, "q": q}

