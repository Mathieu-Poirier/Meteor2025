from fastapi import FastAPI

app = FastAPI()

@app.get("/items/{item_id}")
def read_item():
    return {"item_id": item_id, "q": q}