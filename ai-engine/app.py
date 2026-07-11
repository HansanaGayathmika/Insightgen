from flask import Flask, request, jsonify
from analyzer import analyze_dataset


app = Flask(__name__)


@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.json

    file_path = data["file_path"]

    result = analyze_dataset(file_path)

    return jsonify(result)


app.run(port=5000)
