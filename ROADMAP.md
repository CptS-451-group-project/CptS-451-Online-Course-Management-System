# 🗺️ Project Roadmap & To-Do List

This is a living document to track project progress, goals, and upcoming tasks. 

## 🎯 High-Level Project Goals
- Build a full-stack Course Management System (CMS).
- Support three distinct roles: Student, Professor, Administrator.
- Implement robust, secure REST APIs using Node.js & Express.
- Manage data effectively with PostgreSQL on Render.
- Create an interactive, responsive frontend using ReactJS.

---

### Planning & Mockups
- [x] Define backend architecture & database schema (`Database-Design-&-Schema-Specification.md`).
- [x] Create static HTML/CSS mockups for the Student View (`Sprint-1/student-view`).
- [x] Create static HTML/CSS mockups for the Professor View (`Sprint-1/prof-view`).

### Core Backend API
**Goals:** Establish the Node.js/Express server, connect to PostgreSQL, and build all necessary REST APIs.
- [x] Initialize backend Node.js workspace.
- [x] Set up PostgreSQL database on Render.
- [x] Write SQL initialization script (`db-init.sql`) & Node executor.
- [x] Build Authentication API (`/api/auth/register`, `/api/auth/login`) with `bcrypt` & JWT.
- [ ] **TODO:** Create JWT Middleware to protect private routes.
- [ ] **TODO:** Build Courses API (`GET /api/courses`, `POST /api/courses`).
- [ ] **TODO:** Build Enrollments API (`POST /api/enroll`, `PUT /api/enroll/status`).
- [ ] **TODO:** Implement Role-Based Access Control (RBAC) (e.g., only Professors/Admins can add courses or approve students).
- [ ] **TODO:** Build Logging API to track activities based on NFRs.

### React Frontend Integration
**Goals:** Replace static HTML/CSS with a dynamic React app and connect it to the new backend APIs.
- [ ] **TODO:** Initialize React app using Vite.
- [ ] **TODO:** Set up React Router for navigation (Login, Student Dashboard, Professor Dashboard).
- [ ] **TODO:** Create React Context / Global State for managing User Authentication (JWT storage).
- [ ] **TODO:** Convert Sprint 1 HTML/CSS mockups into reusable React components.
- [ ] **TODO:** Connect frontend UI buttons to backend endpoints.

### Polish & Deployment
**Goals:** Move from local development to full web deployment, polish UI, and fix bugs.
- [ ] **TODO:** Deploy Express Backend to Render Web Service.
- [ ] **TODO:** Deploy React Frontend to Render Static Site.
- [ ] **TODO:** End-to-end testing of Professor, Student, and Admin flows.
- [ ] **TODO:** Finalize documentation and presentations.

---

*(Update this document as tasks are started, completed, or added!)*