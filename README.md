# Employee Management System

A full-stack web application for managing employee data, built with FastAPI backend and vanilla JavaScript frontend.

## Features

- **Employee Management**: Add, view, update, and manage employee records
- **Authentication**: Secure login system for employees and admins
- **Attendance Tracking**: Record and monitor employee attendance
- **Department Management**: Organize employees by departments
- **Admin Dashboard**: Administrative interface for system management
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Relational database
- **JWT**: JSON Web Tokens for authentication
- **PassLib**: Password hashing

### Frontend
- **HTML5**: Structure and content
- **CSS3**: Styling and responsive design
- **Vanilla JavaScript**: Client-side logic and API interactions
- **Fetch API**: HTTP requests

## Project Structure

```
employee_management/
├── app/
│   ├── __init__.py      # Package initialization
│   ├── main.py          # FastAPI application entry point
│   ├── dependencies.py  # Dependency injection utilities
│   ├── models.py        # SQLAlchemy database models
│   ├── schemas.py       # Pydantic schemas for request/response
│   ├── crud.py          # Database operations
│   ├── security.py      # Authentication utilities
│   ├── database.py      # Database connection and session management
│   └── routers/         # API route modules
│       ├── __init__.py
│       ├── auth.py      # Authentication routes (login)
│       ├── admin.py     # Admin-only routes
│       └── employee.py  # Employee routes
├── scripts/
│   └── seed.py          # Database seeding script
├── tests/
│   └── __init__.py      # Test package
├── data/
│   └── dummy_data.txt   # Dummy data file
├── tests/
│   └── __init__.py      # Test package
├── data/
│   └── dummy_data.txt   # Dummy data file
├── frontend/
│   ├── index.html       # Landing page
│   ├── employee-login.html    # Employee login page
│   ├── admin-login.html       # Admin login page
│   ├── employee-dashboard.html # Employee dashboard
│   ├── admin-dashboard.html   # Admin dashboard
│   ├── employee-details.html  # Employee details view
│   ├── attendance.html        # Attendance management
│   ├── add-employee.html      # Add new employee form
│   ├── admin-register.html    # Admin registration
│   ├── css/
│   │   └── style.css    # Application styles
│   └── js/
│       ├── config.js    # Configuration settings
│       ├── employee.js  # Employee-specific JavaScript
│       └── admin.js     # Admin-specific JavaScript
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── .gitignore          # Git ignore file
└── myenv/              # Virtual environment (ignored)
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- PostgreSQL database
- Git

### Backend Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd employee_management
   ```

2. **Create and activate virtual environment**:
   ```bash
   python3 -m venv myenv
   source myenv/bin/activate  # On Windows: myenv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL database**:
   - Create a new database named `employee_db`
   - Update database connection details in `app/database.py` if needed

5. **Start the backend server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory(current directory - employee_management)**:
   ```bash
   cd frontend
   ```

2. **Open index.html in a web browser** or serve via a local server:
   ```bash
   python3 -m http.server 8080
   ```
   Access at `http://localhost:8080`

## Usage

### Accessing the Application

1. Open your browser and go to `http://localhost:8080`
2. Choose login type: Employee or Admin

### Admin Login

- Use admin credentials 
emp_id : ADMINOLIVIAPARKER096 with password: Y8wQWzVr || 
emp_id : ADMINWYATTJENKINS097 with password: a9HnDB1T || 
emp_id : ADMINGABRIELLANELSON098 with password: NjM2m#g# || 
emp_id : ADMINPATRICKEVANS099 with password: oHzIpOse || 
emp_id : ADMINKYLIEROBERTS100 with password: d1AKQWgq
- Admins can manage all employees, departments, and attendance
- Can add employees and generate credentials 

### Employee Login

- Use credentials generated during employee creation by admin
- Employees can view their profile and attendance
- Credentials for testing :- employee: HUNTERCARTER001 with password: gNydXXUN
                             employee: JANESMITH002 with password: P9wjWeGN
                             employee: URIELCOLEMAN003 with password: HQqTgBht

### API Documentation

When the backend is running, visit `http://localhost:8000/docs` for interactive API documentation powered by Swagger UI.

## API Endpoints

### Authentication
- `POST /token` - Login and get access token

### Employees
- `GET /employees/` - Get all employees (admin only)
- `POST /employees/` - Create new employee (admin only)
- `GET /employees/{emp_id}` - Get employee by ID
- `PUT /employees/{emp_id}` - Update employee (admin only)
- `DELETE /employees/{emp_id}` - Delete employee (admin only)

### Attendance
- `GET /attendance/` - Get attendance records
- `POST /attendance/` - Mark attendance

### Departments
- `GET /departments/` - Get department information

### Database Schema

The application uses the following main tables:
- `employees`: Employee information
- `departments`: Department assignments
- `attendance`: Attendance records
- `dept_master`: Department master data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

