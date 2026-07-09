# Bimba AI - Reflect Your Best Self

Welcome to the **Bimba AI** Fullstack Resume Builder project foundation.

The project is structured as a monorepo containing separate folders for the frontend and backend:
*   **`frontend/`**: Vite + React + TypeScript + Tailwind CSS v4 + Zustand + Framer Motion
*   **`backend/`**: FastAPI + SQLAlchemy + Alembic + PostgreSQL

---

## How to Run the Project

You will need two separate terminal windows/tabs to run the frontend and backend simultaneously.

### 1. Running the Frontend

Navigate to the `frontend` directory, install dependencies (if not already installed), and run the Vite development server:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will run at [http://localhost:5173](http://localhost:5173).

---

### 2. Running the Backend

Navigate to the `backend` directory, activate the Python virtual environment, install dependencies, and run the FastAPI server:

```bash
# Navigate to backend folder
cd backend

# Activate virtual environment (Windows Powershell)
.\venv\Scripts\Activate.ps1

# (Alternative for Command Prompt)
# .\venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server using uvicorn
uvicorn app.main:app --reload
```

The backend API will run at [http://127.0.0.1:8000](http://127.0.0.1:8000).
*   **Health check endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
*   **Swagger API documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
