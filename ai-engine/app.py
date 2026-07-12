from flask import Flask, request
import pandas as pd
import numpy as np
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")


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


def auto_eda(df):
    eda_result = {}

    # 🔹 Step 1: Detect numerical vs categorical columns
    numerical_cols = df.select_dtypes(
        include=["int64", "float64"]).columns.tolist()
    categorical_cols = df.select_dtypes(
        include=["object", "bool", "category"]).columns.tolist()

    eda_result["numerical_columns"] = numerical_cols
    eda_result["categorical_columns"] = categorical_cols

    # 🔹 Step 2: Outlier detection (IQR method) for numeric columns
    outliers = {}
    for col in numerical_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        outlier_rows = df[(df[col] < lower_bound) | (df[col] > upper_bound)]

        outliers[col] = {
            "count": int(outlier_rows.shape[0]),
            "lower_bound": float(lower_bound),
            "upper_bound": float(upper_bound)
        }

    eda_result["outliers"] = outliers

    # 🔹 Step 3: Chart-ready data
    charts = {}

    for col in numerical_cols:
        counts, bin_edges = np.histogram(df[col].dropna(), bins=10)
        charts[col] = {
            "type": "histogram",
            "bins": [round(float(b), 2) for b in bin_edges],
            "counts": [int(c) for c in counts]
        }

    for col in categorical_cols:
        value_counts = df[col].value_counts().head(10)
        charts[col] = {
            "type": "bar",
            "labels": value_counts.index.astype(str).tolist(),
            "counts": value_counts.values.tolist()
        }

    eda_result["charts"] = charts

    # 🔹 Step 4: Auto recommendations (text insights)
    insights = []

    for col in df.columns:
        missing = df[col].isnull().sum()
        if missing > 0:
            pct = round((missing / df.shape[0]) * 100, 1)
            insights.append(
                f"'{col}' has {missing} missing values ({pct}%) — consider imputing or dropping.")

    for col in numerical_cols:
        if outliers[col]["count"] > 0:
            insights.append(
                f"'{col}' has {outliers[col]['count']} outliers detected — review before modeling.")

    for col in categorical_cols:
        unique_count = df[col].nunique()
        if unique_count == df.shape[0]:
            insights.append(
                f"'{col}' looks like a unique identifier (every value is different) — likely not useful for analysis.")
        elif unique_count > 50:
            insights.append(
                f"'{col}' has high cardinality ({unique_count} unique values) — consider grouping rare categories.")

    if len(numerical_cols) == 0:
        insights.append(
            "No numerical columns found — this dataset is mostly categorical/text.")

    eda_result["insights"] = insights

    # 🔹 Step 4.5: Duplicate rows + suspicious data types
    duplicate_count = int(df.duplicated().sum())
    if duplicate_count > 0:
        dup_pct = round((duplicate_count / df.shape[0]) * 100, 1)
        insights.append(
            f"Dataset contains {duplicate_count} duplicate rows ({dup_pct}%) — consider removing before analysis.")

    eda_result["duplicate_rows"] = duplicate_count

    # Detect columns that look numeric but are stored as text (wrong dtype)
    suspicious_dtypes = []
    for col in categorical_cols:
        sample = df[col].dropna().astype(str).head(50)
        numeric_like = sample.str.replace('.', '', regex=False).str.replace(
            '-', '', regex=False).str.isnumeric()
        if len(sample) > 0 and numeric_like.mean() > 0.8:
            suspicious_dtypes.append(col)
            insights.append(
                f"'{col}' looks numeric but is stored as text — consider converting its data type.")

    eda_result["suspicious_dtypes"] = suspicious_dtypes

    # 🔹 Step 5: Correlation detection (numeric columns only)
    correlations = {}
    if len(numerical_cols) >= 2:
        corr_matrix = df[numerical_cols].corr().round(3)
        correlations["matrix"] = corr_matrix.fillna(0).to_dict()

        strong_pairs = []
        for i in range(len(numerical_cols)):
            for j in range(i + 1, len(numerical_cols)):
                col_a = numerical_cols[i]
                col_b = numerical_cols[j]
                corr_value = corr_matrix.loc[col_a, col_b]
                if pd.notna(corr_value) and abs(corr_value) > 0.7:
                    strong_pairs.append({
                        "column_a": col_a,
                        "column_b": col_b,
                        "correlation": float(corr_value)
                    })

        correlations["strong_pairs"] = strong_pairs

        for pair in strong_pairs:
            direction = "positively" if pair["correlation"] > 0 else "negatively"
            insights.append(
                f"'{pair['column_a']}' and '{pair['column_b']}' are strongly {direction} correlated ({pair['correlation']})."
            )
    else:
        correlations["matrix"] = {}
        correlations["strong_pairs"] = []
        insights.append(
            "Not enough numerical columns to compute correlations.")

    eda_result["correlations"] = correlations

    eda_result["insights"] = insights
    return eda_result


# 🔹 Step 6: AI-generated natural-language insights (Gemini)
def generate_ai_insights(result):
    summary_for_ai = {
        "rows": result["rows"],
        "columns": result["columns"],
        "column_details": result["column_details"],
        "numerical_columns": result["eda"]["numerical_columns"],
        "categorical_columns": result["eda"]["categorical_columns"],
        "outliers": result["eda"]["outliers"],
        "strong_correlations": result["eda"]["correlations"]["strong_pairs"],
        "rule_based_insights": result["eda"]["insights"]
    }

    prompt = f"""You are a data analyst. Here is a summary of a dataset:

{summary_for_ai}

Write 3-5 concise, natural-language insights about this dataset a business user would find useful.
Focus on patterns, data quality issues, and anything notable. Avoid restating raw numbers robotically.
Return ONLY a JSON array of strings, nothing else. Example format:
["Insight one.", "Insight two.", "Insight three."]
"""

    try:
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()

        if response_text.startswith("```"):
            response_text = response_text.strip(
                "`").replace("json", "", 1).strip()

        ai_insights = json.loads(response_text)
        return ai_insights

    except Exception as e:
        print("AI insights error:", str(e))
        return ["AI insights unavailable right now."]


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    file_path = data.get("file_path")

    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    try:
        df = pd.read_csv(file_path)

        result = analyze_dataset(file_path)
        result["eda"] = auto_eda(df)
        result["ai_insights"] = generate_ai_insights(result)

        return result

    except Exception as e:
        return {"error": str(e)}


app.run(port=5000)
