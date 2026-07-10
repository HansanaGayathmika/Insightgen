import pandas as pd


def analyze_dataset(file_path):

    df = pd.read_csv(file_path)

    result = {}

    # Basic information
    result["rows"] = df.shape[0]
    result["columns"] = df.shape[1]

    # Column information
    columns = []

    for col in df.columns:

        columns.append({
            "name": col,
            "datatype": str(df[col].dtype),
            "missing_values": int(df[col].isnull().sum()),
            "unique_values": int(df[col].nunique())
        })

    result["column_details"] = columns

    # Statistical summary
    result["statistics"] = (
        df.describe(include="all")
        .fillna("")
        .to_dict()
    )

    return result
