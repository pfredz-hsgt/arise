import pandas as pd
from sqlalchemy import create_engine
import time

# ==========================================
# CONFIGURATION
# ==========================================
DB_USERNAME = 'postgres'
DB_PASSWORD = 'user'
DB_HOST = 'localhost'      
DB_PORT = '5432'           
DB_NAME = 'arise'
TABLE_NAME = 'inventory_items'
FILE_PATH = 'inventory.xlsx' 

# ==========================================
# SCRIPT
# ==========================================
def main():
    print(f"Connecting to database '{DB_NAME}'...")
    engine = create_engine(f'postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}')
    
    print(f"Loading data from '{FILE_PATH}'...")
    start_time = time.time()
    
    if FILE_PATH.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(FILE_PATH)
    else:
        df = pd.read_csv(FILE_PATH)
    
    print("Cleaning and formatting data...")
    
    # 1. Format Datetime & Date Columns
    if 'created_at' in df.columns:
        df['created_at'] = pd.to_datetime(df['created_at'])
    if 'updated_at' in df.columns:
        df['updated_at'] = pd.to_datetime(df['updated_at'])
    if 'short_exp' in df.columns:
        df['short_exp'] = pd.to_datetime(df['short_exp']).dt.date
    
    # 2. Strip whitespace from text columns to prevent CHECK constraint failures
    # (e.g., changes "LP " to "LP")
    constrained_cols = ['puchase_type', 'std_kt', 'indent_source', 'type']
    for col in constrained_cols:
        if col in df.columns:
            # Convert to string, strip whitespace, replace 'nan' with proper nulls
            df[col] = df[col].astype(str).str.strip()
            df.loc[df[col] == 'nan', col] = None 
            
    print(f"Total rows to insert: {len(df)}")
    print("Starting bulk insert into PostgreSQL...")
    
    # Write to PostgreSQL
    try:
        df.to_sql(
            name=TABLE_NAME, 
            con=engine, 
            if_exists='append', 
            index=False, 
            chunksize=10000, 
            method='multi'
        )
        end_time = time.time()
        print(f"✅ Success! Inserted {len(df)} rows in {round(end_time - start_time, 2)} seconds.")
    except Exception as e:
        print("❌ Error during insertion. This is often caused by data violating a CHECK constraint.")
        print(f"Details: {e}")

if __name__ == "__main__":
    main()