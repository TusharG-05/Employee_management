import sys
import os
import csv
import random # Kept in case we need it, though mostly replacing with CSV data

# Add parent dir to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import crud, schemas, models

# CSV File Path
CSV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "employees.csv")
CREDENTIALS_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "dummy_data.txt")

def seed_employees_from_csv():
    # Check if CSV exists
    if not os.path.exists(CSV_FILE_PATH):
        print(f"Error: CSV file not found at {CSV_FILE_PATH}")
        return

    db = SessionLocal()
    try:
        # print("Clearing existing data...")
        # # Clear tables in order of dependencies (child first)
        # db.query(models.ChatMessage).delete()
        # db.query(models.Notifications).delete()
        # db.query(models.Leave).delete()
        # db.query(models.Attendance).delete()
        # db.query(models.Employee).delete()
        # db.query(models.Department).delete()
        # db.commit()

        # We need to collect unique departments from CSV to seed them first
        departments = set()
        employees_to_create = []

        print(f"Reading data from {CSV_FILE_PATH}...")
        with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Basic validation or defaults can go here
                dept_name = row['dept'].strip().upper()
                departments.add(dept_name)
                employees_to_create.append(row)

        print("Seeding Departments...")
        for d_name in departments:
            # Check if dept exists (in case) or just add since we cleared DB
            if not db.query(models.Department).filter(models.Department.name == d_name).first():
                dept = models.Department(name=d_name)
                db.add(dept)
                print(f"  Created Department: {d_name}")
            else:
                print(f"  Skipped Department (Existing): {d_name}")
        db.commit()
        
        print("Seeding Employees...")
        
        # Open file to write credentials (APPEND MODE)
        file_exists = os.path.exists(CREDENTIALS_FILE_PATH) and os.path.getsize(CREDENTIALS_FILE_PATH) > 0
        with open(CREDENTIALS_FILE_PATH, "a") as f:
            if not file_exists:
                f.write("EMP_ID | PASSWORD | ROLE | DEPT\n")
                f.write("-" * 40 + "\n")

            count = 0
            for row in employees_to_create:
                name = row['name'].strip()
                age = int(row['age'])
                dept = row['dept'].strip().upper()
                salary = float(row['salary'])
                role = row['role'].strip().lower()

                # Check if employee already exists
                existing_employee = db.query(models.Employee).filter(models.Employee.name == name).first()
                if existing_employee:
                     print(f"  Skipped Employee (Existing): {name}")
                     continue

                employee_data = schemas.EmployeeCreate(
                    name=name,
                    age=age,
                    dept=dept,
                    salary=salary,
                    role=role
                )

                # Create employee uses the CRUD which handles hashing & ID generation
                result = crud.create_employee(db, employee_data)
                count += 1
                
                # Write to file
                f.write(f"{result['emp_id']} | {result['password']} | {role} | {dept}\n")
                print(f"  Created Employee: {name} ({result['emp_id']})")

        print(f"Successfully created {count} new employees from CSV.")
        print(f"Credentials appended to {CREDENTIALS_FILE_PATH}")
        print("Done!")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_employees_from_csv()
