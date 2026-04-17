# CptS 451: Online Course Management System

Welcome to the Course Management System repository! This project is being developed as a unified Full-Stack application designed to provide separate interfaces and operations for Students, Professors, and Administrators.

This is a **living document** and serves as the primary onboarding guide for all developers on the team.

---

## 🛠 Tech Stack

This project follows a standard **PERN** (Postgres, Express, React, Node.js) architecture:

*   **Frontend**: ReactJS (Vite framework - *Coming Soon*)
*   **Backend**: Node.js with Express.js
*   **Database**: PostgreSQL
*   **Hosting**: Render (Web Service and Managed Database)
*   **Security**: `bcrypt` for password hashing, `jsonwebtoken` for session management

---

## 🚀 Local Development Setup

To get up and running on your local machine, follow these steps:

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (Use the LTS Version)
*   [PostgreSQL](https://www.postgresql.org/download/) (Optional, since we connect to Render, but useful for local tools)
*   VS Code (or your preferred IDE)

### 2. Clone the Repository
```bash
git clone https://github.com/CptS-451-group-project/CptS-451-Online-Course-Management-System.git
cd CptS-451-Online-Course-Management-System
```

### 3. Backend Setup
Navigate to the `backend` folder and install the required dependencies:
```bash
cd backend
npm install
```

### 4. Environment Variables
You need to configure your local environmental variables to connect to the remote Render PostgreSQL database and establish your JWT secret:
1. Inside the `backend/` directory, create a file named `.env`.
2. Add the following keys inside `.env` (Reach out to the team lead for the exact Render Database URL):
```env
PORT=5000
DATABASE_URL=postgres://<USER>:<PASSWORD>@<HOST_NAME>.render.com/<DB_NAME>
JWT_SECRET=super_secret_jwt_key_for_cpts451
```

### 5. (First Time Only) Initialize the Database
If you are connecting to a fresh/empty database, you need to build the schemas based on our `Database-Design-&-Schema-Specification.md`:
```bash
node run-init-db.js
```
*Note: This command is safe and idempotent. It creates tables and inserts default Roles and Log_Types if they do not exist.*

### 6. Run the Server
Once your environment is set up, start the backend in development mode (which auto-refreshes on save):
```bash
npm run dev
```
The server will now be running at `http://localhost:5000`

---

## ⚙️ Available API Endpoints

### General
*   `GET /health`: Checks if the API is running and connected to the database.

### Authentication (`/api/auth`)
*   `POST /register`: Registers a new user.
    *   **Body**: `{ "email": "user@school.edu", "password": "password123", "role_name": "Student" }`
*   `POST /login`: Authenticates a user and issues a JWT token.
    *   **Body**: `{ "email": "user@school.edu", "password": "password123" }`

*(More routes regarding Courses, Enrollments, and Logs will go here soon!)*

---

## 📚 Project Structure

```text
├── Database-Design-&-Schema-Specification.md   # SQL logic and constraints
├── README.md                                   # This living document
├── Sprint-1/                                   # Initial HTML/CSS Mockups
├── backend/                                    # Express API server workspace
│   ├── .env                                    # Local environment variables
│   ├── db-init.sql                             # SQL schema scripts
│   ├── db.js                                   # Postgres connection pool instance
│   ├── run-init-db.js                          # Node script to execute SQL schema
│   ├── server.js                               # Express starting point & middlewares
│   ├── package.json                            # Backend dependency manager
│   └── routes/
│       └── auth.js                             # Registration & login logic
└── frontend/                                   # React workspace (TBD)
```
>>>>>>> Backend-start
