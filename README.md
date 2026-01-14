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
├── app/                  # Backend FastAPI application
│   ├── main.py           # Application entry point
│   ├── database.py       # Database connection
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── security.py       # Authentication logic
│   ├── crud.py           # Database operations
│   └── routers/          # API routes
├── frontend/             # Frontend static files
│   ├── index.html        # Landing page
│   ├── css/              # Styles
│   └── js/               # JavaScript logic
├── alembic/              # Database migrations
│   └── env.py            # Migration environment
├── data/                 # Data files
├── scripts/              # Utility scripts
│   └── seed_db.py        # Database seeding script
├── compose.yaml          # Docker Compose configuration
├── Dockerfile            # Backend Docker image definition
├── requirements.txt      # Python dependencies
├── alembic.ini           # Alembic configuration
└── .gitignore            # Git ignore rules
```

## Setup Instructions (Docker)

This project is fully dockerized for easy setup.

### Prerequisites
- Docker & Docker Compose
- Git

### Quick Start

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd employee_management
    ```

2.  **Start the Application**:
    ```bash
    docker compose up --build -d
    ```
    - **Frontend**: [http://localhost](http://localhost)
    - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

3.  **Initialize Database** (First run only):
    Apply the database schema migrations:
    ```bash
    docker compose exec app alembic upgrade head
    ```

4.  **Seed Data** (Optional):
    Populate the database with sample employees from `data/employees.csv`:
    ```bash
    docker compose exec app python scripts/seed_db.py
    ```
    - Generated credentials will be saved to `data/dummy_data.txt` (this file is ignored by git).

### Stopping the App
- Stop containers (keep data): `docker compose stop`
- Stop and **delete data** (clean slate): `docker compose down -v`

## Local Development (Optional)

If you wish to run scripts locally (outside Docker), create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:Tush%234184@localhost/FastAPI_pdb
SECRET_KEY=your_secret_key
ALGORITHM=HS256
```

Then install dependencies and run:
```bash
pip install -r requirements.txt
python scripts/seed_db.py
```

## Usage

### Login
After seeding the database, check `data/dummy_data.txt` for the generated login credentials.
1. Open your browser and go to [http://localhost](http://localhost)
2. Choose login type: Employee or Admin
3. Use the generated credentials.

## API Documentation

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

## Database Schema

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
