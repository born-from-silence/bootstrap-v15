from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="My API", version="1.0.0")

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/items")
def create_item(item: Item):
    return {"item": item, "message": "Created successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)