from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "ML API is running"}

@app.post("/predict")
def predict(data: dict):
    value = data.get("input")

    # Example logic (replace with ML later)
    result = value * 2

    return {"prediction": result}