from flask import Flask, request
import pandas as pd
import os

app = Flask(__name__)


def analyze_dataset(file_path):
    df = pd.read_csv(file_path)

    result = {}

    result["rows"] = df.shape[0]
    result["columns"] = df.shape[1]

    columns = []
    for col in df.columns:
        columns.append({
            "name": col,
            "datatype": str(df[col].dtype),
            "missing_values": int(df[col].isnull().sum()),
            "unique_values": int(df[col].nunique())
        })

    result["column_details"] = columns

    result["statistics"] = (
        df.describe(include="all")
        .fillna("")
        .to_dict()
    )

    return result


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    file_path = data.get("file_path")

    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    try:
        result = analyze_dataset(file_path)  # ✅ USE YOUR FUNCTION
        return result

    except Exception as e:
        return {"error": str(e)}


app.run(port=5000)
