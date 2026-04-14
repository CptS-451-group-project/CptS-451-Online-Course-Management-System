# 🗺️ Project Roadmap & To-Do List

This is a living document to track project progress, goals, and upcoming tasks. 

## 🎯 High-Level Project Goals
- Build a full-stack Course Management System (CMS) focusing on simplicity (MVP).
- Support core roles: Student and Professor (Admin optional/low-priority).
- Implement robust, secure REST APIs using Node.js & Express.
- Manage data and enforce business rules effectively with PostgreSQL on Render.
- Create a functional, interactive frontend (starting with Vanilla HTML/JS, optionally migrating to React later).

---

### Sprint 1: Planning & Mockups
- [x] Define backend architecture & database schema (`Database-Design-&-Schema-Specification.md`).
- [x] Create static HTML/CSS mockups for the Student View (`Sprint-1/student-view`).
- [x] Create static HTML/CSS mockups for the Professor View (`Sprint-1/prof-view`).

### Sprint 2: Core Backend API & Basic UI Integration (CRUD)
**Goals:** Build backend API logic, enforce database constraints, and wire up the basic UI using plain JavaScript (`fetch()`) to prove real-world operations and edge case handling.
- [x] Initialize backend Node.js workspace & set up PostgreSQL database on Render.
- [x] Write SQL initialization script (`db-init.sql`) with strong `CHECK` constraints to prevent invalid data.
- [x] Build Courses API (`GET /api/courses`, `POST /api/courses`).
- [x] Build Enrollments API (`POST /api/enroll`, `GET /api/enroll/:id`, `PUT /api/enroll/status`).
- [ ] **TODO:** Restart database initialization script to apply new constraints.
- [ ] **TODO:** Wire Student View `index.html` to backend using Vanilla JS `fetch()` (GET courses, POST enrollments).
- [ ] **TODO:** Wire Professor View `index.html` to backend using Vanilla JS `fetch()` (POST courses, PUT enrollment status).
- [ ] **TODO:** Display API errors nicely in the UI (e.g., alert "Course is full") to demonstrate failure/edge case handling.

### Sprint 3:
- [x] Build basic Authentication API (`/api/auth/register`, `/api/auth/login`) with `bcrypt` & JWT.

---

*(Update this document as tasks are started, completed, or added!)*