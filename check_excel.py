import pandas as pd
import glob
import os

path = r"C:\Users\wacan\Downloads\_Konsulta Development Kit v1.1-20260427T031038Z-3-001\_Konsulta Development Kit v1.1\LIBRARIES"
files_to_check = [
    "lib_skin_extremities.xlsx",
    "lib_heent.xlsx",
    "lib_chest.xlsx",
    "lib_heart.xlsx",
    "lib_abdomen.xlsx",
    "lib_neuro.xlsx",
    "lib_digital_rectal.xlsx",
    "lib_genitourinary.xlsx"
]

for filename in files_to_check:
    filepath = os.path.join(path, filename)
    if os.path.exists(filepath):
        try:
            df = pd.read_excel(filepath)
            print(f"\n--- {filename} ---")
            print("Columns:", df.columns.tolist())
            print("Sample data (first row):")
            print(df.head(1).to_dict(orient='records'))
        except Exception as e:
            print(f"Error reading {filename}: {e}")
    else:
        print(f"File not found: {filepath}")
