import pandas as pd
import math

# ==========================================
# CONFIGURATION
# ==========================================
INPUT_FILE = 'inventory.xlsx'  # Change to .csv if necessary
OUTPUT_FILE = 'import.sql'
TABLE_NAME = 'inventory_items'
BATCH_SIZE = 1000  # Number of rows per INSERT statement

# ==========================================
# HELPER FUNCTION: FORMAT SQL VALUES
# ==========================================
def format_sql_value(val):
    # 1. Handle Nulls / NaNs
    if pd.isna(val) or val == '' or str(val).strip().lower() == 'nan':
        return 'NULL'
    
    # 2. Handle Booleans
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    if str(val).strip().upper() == 'TRUE':
        return 'TRUE'
    if str(val).strip().upper() == 'FALSE':
        return 'FALSE'
    
    # 3. Handle Numerics (Pandas often converts ints with missing rows to floats like 3.0)
    if isinstance(val, (int, float)):
        if isinstance(val, float) and val.is_integer():
            return str(int(val))
        return str(val)
    
    # 4. Handle Strings & Dates (Escape single quotes for SQL)
    cleaned_str = str(val).replace("'", "''").strip()
    return f"'{cleaned_str}'"

# ==========================================
# MAIN SCRIPT
# ==========================================
def main():
    print(f"Reading data from '{INPUT_FILE}'...")
    if INPUT_FILE.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(INPUT_FILE)
    else:
        df = pd.read_csv(INPUT_FILE)

    print("Cleaning and formatting constraints...")
    
    # Strip whitespace for CHECK constrained columns
    constrained_cols = ['puchase_type', 'std_kt', 'indent_source', 'type']
    for col in constrained_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            df.loc[df[col].str.lower() == 'nan', col] = None

    # Format Date/Time columns to standard ISO strings
    if 'created_at' in df.columns:
        df['created_at'] = pd.to_datetime(df['created_at']).dt.strftime('%Y-%m-%d %H:%M:%S%z')
    if 'updated_at' in df.columns:
        df['updated_at'] = pd.to_datetime(df['updated_at']).dt.strftime('%Y-%m-%d %H:%M:%S%z')
    if 'short_exp' in df.columns:
        df['short_exp'] = pd.to_datetime(df['short_exp']).dt.strftime('%Y-%m-%d')

    # Get the column names exactly as they appear in the DataFrame
    columns = df.columns.tolist()
    columns_joined = ", ".join(columns)

    print(f"Generating SQL file '{OUTPUT_FILE}'...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("-- ==================================================\n")
        f.write(f"-- Auto-generated SQL Insert Script for {TABLE_NAME}\n")
        f.write(f"-- Total Rows: {len(df)}\n")
        f.write("-- ==================================================\n\n")

        # Process in batches
        total_batches = math.ceil(len(df) / BATCH_SIZE)
        
        for batch_num in range(total_batches):
            start_idx = batch_num * BATCH_SIZE
            end_idx = start_idx + BATCH_SIZE
            batch_df = df.iloc[start_idx:end_idx]
            
            f.write(f"INSERT INTO {TABLE_NAME} ({columns_joined}) VALUES\n")
            
            # Format each row in the batch
            row_values_list = []
            for _, row in batch_df.iterrows():
                formatted_values = [format_sql_value(row[col]) for col in columns]
                row_values_list.append(f"({', '.join(formatted_values)})")
            
            # Join rows with commas, end the statement with a semicolon
            f.write(",\n".join(row_values_list) + ";\n\n")
            
            # Print progress
            if (batch_num + 1) % 10 == 0 or (batch_num + 1) == total_batches:
                print(f"Processed batch {batch_num + 1}/{total_batches}...")

    print(f"✅ Success! SQL script generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()