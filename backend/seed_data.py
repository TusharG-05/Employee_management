import random
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import create_employee
from schemas import EmployeeCreate
from models import Employee, Department, Attendance, DeptMaster

# List of sample names
names = [
    "John Doe", "Jane Smith", "Alice Johnson", "Bob Brown", "Charlie Wilson",
    "Diana Davis", "Eve Miller", "Frank Garcia", "Grace Martinez", "Henry Lopez",
    "Ivy Gonzalez", "Jack Anderson", "Kate Thomas", "Liam Jackson", "Mia White",
    "Noah Harris", "Olivia Martin", "Parker Thompson", "Quinn Moore", "Ryan Taylor",
    "Sophia Lee", "Tyler Perez", "Uma Clark", "Victor Lewis", "Wendy Robinson",
    "Xander Walker", "Yara Hall", "Zane Young", "Ava King", "Benjamin Wright",
    "Chloe Scott", "David Green", "Emma Adams", "Felix Baker", "Gabriella Nelson",
    "Hunter Carter", "Isabella Mitchell", "Jacob Perez", "Kylie Roberts", "Logan Turner",
    "Madison Phillips", "Nathan Campbell", "Olivia Parker", "Patrick Evans", "Quinn Edwards",
    "Rachel Collins", "Samuel Stewart", "Taylor Morris", "Ulysses Rogers", "Victoria Reed",
    "William Cook", "Ximena Morgan", "Yusuf Bell", "Zara Murphy", "Aaron Bailey",
    "Brianna Rivera", "Caleb Cooper", "Delilah Richardson", "Ethan Cox", "Fiona Howard",
    "Gavin Ward", "Hannah Torres", "Ian Peterson", "Julia Gray", "Kevin Ramirez",
    "Luna James", "Mason Watson", "Nora Brooks", "Owen Kelly", "Piper Sanders",
    "Quincy Price", "Riley Bennett", "Sebastian Wood", "Tessa Barnes", "Uriah Henderson",
    "Violet Coleman", "Wyatt Jenkins", "Xanthe Perry", "Yosef Powell", "Zoe Long",
    "Asher Patterson", "Bella Hughes", "Cody Flores", "Daisy Washington", "Eli Butler",
    "Faith Simmons", "Gideon Foster", "Hazel Gonzales", "Isaac Bryant", "Jasmine Russell",
    "Kai Griffin", "Lila Diaz", "Miles Hayes", "Nadia Myers", "Oscar Ford",
    "Peyton Hamilton", "Quentin Graham", "Ruby Sullivan", "Sawyer Wallace", "Thea Woods",
    "Uriel Coleman", "Violet Jenkins", "Wyatt Perry", "Xanthe Powell", "Yosef Long"
]

departments = ["HR", "IT", "Finance", "Marketing", "Sales", "Operations"]

def seed_employees():
    db = SessionLocal()
    try:
        # Clear existing employees
        db.query(Attendance).delete()
        db.query(Department).delete()
        db.query(Employee).delete()
        db.query(DeptMaster).delete()
        db.commit()
        
        # Shuffle the names to randomize
        shuffled_names = names.copy()
        random.shuffle(shuffled_names)
        
        for i, name in enumerate(shuffled_names[:100]):  # Take first 100
            age = random.randint(22, 60)
            dept = random.choice(departments)
            salary = round(random.uniform(30000, 150000), 2)
            role = "admin" if i >= 95 else "employee"  # First 95 are employees, last 5 are admins

            employee_data = EmployeeCreate(
                name=name,
                age=age,
                dept=dept,
                salary=salary,
                role=role
            )

            result = create_employee(db, employee_data)
            print(f"Created employee: {result['emp_id']} with password: {result['password']}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_employees()