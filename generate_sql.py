import pandas as pd
import uuid
import os

path = r"C:\Users\wacan\Downloads\_Konsulta Development Kit v1.1-20260427T031038Z-3-001\_Konsulta Development Kit v1.1\LIBRARIES"

file_to_category = {
    "lib_skin_extremities.xlsx": "SKIN",
    "lib_heent.xlsx": "HEENT",
    "lib_chest.xlsx": "CHEST",
    "lib_heart.xlsx": "HEART",
    "lib_abdomen.xlsx": "ABDOMEN",
    "lib_neuro.xlsx": "NEURO",
    "lib_digital_rectal.xlsx": "RECTAL",
    "lib_genitourinary.xlsx": "GU"
}

sql_file = r"f:\projects\github\clinicez.ui\seed_physical_exams.sql"

def clean_desc(v):
    if pd.isna(v):
        return 'NULL'
    v = str(v).strip()
    v = v.replace("'", "''")
    return f"'{v}'"

with open(sql_file, 'w', encoding='utf-8') as f:
    f.write('-- DELETE FROM "PhysicalExamLibrary";\n\n')
    
    for filename, category in file_to_category.items():
        filepath = os.path.join(path, filename)
        if os.path.exists(filepath):
            try:
                df = pd.read_excel(filepath)
                df = df.iloc[:, :3]
                
                first_col = df.columns[0]
                df = df[df[first_col].notna()]
                df = df[~df[first_col].astype(str).str.contains('Note', na=False, case=False)]
                
                f.write(f"-- Seeding {category}\n")
                
                for index, row in df.iterrows():
                    code_raw = str(row.iloc[0]).strip()
                    if code_raw.endswith('.0'): 
                        code_raw = code_raw[:-2]
                    code = f"'{code_raw.replace(chr(39), chr(39)+chr(39))}'"
                    
                    desc = clean_desc(row.iloc[1])
                    
                    status_raw = row.iloc[2]
                    lib_status = 0
                    if not pd.isna(status_raw):
                        try:
                            if float(status_raw) == 1.0:
                                lib_status = 1
                        except:
                            pass
                    
                    is_active = 'true' if lib_status == 1 else 'false'
                    record_id = str(uuid.uuid4())
                    
                    f.write(f'INSERT INTO "PhysicalExamLibrary" ("id", "category", "code", "description", "libraryStatus", "isActive") VALUES (\'{record_id}\', \'{category}\', {code}, {desc}, {lib_status}, {is_active});\n')
                f.write("\n")
                print(f"Processed {category}")
            except Exception as e:
                print(f"Error processing {category}: {e}")
        else:
            print(f"File not found: {filepath}")

print("SQL generation complete! Saved to:", sql_file)
