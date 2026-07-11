from flask import Flask, request
import pandas as pd
import os

app = Flask(__name__)


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    file_path = data.get("file_path")

    print("Received path:", file_path)

    # ✅ check if file exists
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    try:
        df = pd.read_csv(file_path)

        return {
            "rows": df.shape[0],
            "columns": df.shape[1]
        }

    except Exception as e:
        return {"error": str(e)}


app.run(port=5000)
