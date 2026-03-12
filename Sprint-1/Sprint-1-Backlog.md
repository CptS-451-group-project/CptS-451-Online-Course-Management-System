# Sprint 1 Backlog Document

## Project Information
**Source Requirements:** [Database-Design-&-Schema-Specification.md](./Database-Design-&-Schema-Specification.md)  
**Sprint Duration:** 21 Days

---

## 1. Product Backlog (Full List)
*Derived from Functional Requirements (FR) and Non-Functional Requirements (NFR)*

| ID | Type | Priority | Description | Acceptance Criteria | Source FR |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-001** | Feature | High | **Browse Courses:** As a student, I want to browse available courses so I can see what I can register for. | - List of courses is displayed.<br>- Includes course name, ID, and availability. | FR-1.1, FR-1.5 |
| **US-002** | Feature | High | **Enroll in Course:** As a student, I want to enroll in a course. | - Student can select a course.<br>- System checks eligibility.<br>- Enrollment status set to 'pending' or 'enrolled'. | FR-1.2, FR-1.3 |
| **US-003** | Feature | High | **View Pending Enrollments:** As an administrator, I want to view pending enrollments. | - List of students with 'pending' status is visible.<br>- Filtering by course is possible. | FR-3.1 |
| **US-004** | Feature | High | **Approve/Reject Enrollment:** As an administrator, I want to approve or reject course enrollments. | - Admin can change status from 'pending' to 'enrolled' or 'rejected'.<br>- System updates database. | FR-3.2 |
| **US-005** | Feature | Medium | **Log User Activity:** As a system admin, I want all user logins logged for security. | - Login events are recorded in `Logs` table.<br>- Includes timestamp and user ID. | FR-2.1 |
| **US-006** | Feature | Medium | **Activity Logging:** As a system, I want to log enrollment actions and course changes. | - Enrollment/withdrawal actions recorded.<br>- Course modification events recorded. | FR-2.2, FR-2.3 |
| **SYS-001**| Task | **Critical**| **Database Implementation:** Create the initial database schema. | - Tables created: Users, Course_Details, Course_Terms, Enrollment_Status, Logs, Roles, Log_Types.<br>- Foreign keys and constraints applied. | Sect 2 |
| **SYS-002**| Task | High | **Authentication Setup:** Implement basic login/auth structure. | - Password hashing (NFR-1.5).<br>- Role-based access control setup (NFR-1.1). | NFR-1.1 |

---

## 2. Sprint 1 Selected Items (Sprint Backlog)
*Items selected for immediate implementation in this 21-day sprint.*

| ID | Assignee | Est. Effort (Hours) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **SYS-001** (DB Setup) | [Member A] | 5 | To Do | Prerequisite for all other tasks. Use schema from Week 5. |
| **US-001** (Browse) | [Member B] | 8 | To Do | Frontend list view + Backend API to fetch courses. |
| **US-002** (Enroll) | [Member B] | 10 | To Do | Dependent on US-001. Requires 'Enrollment_Status' table. |
| **US-003** (View Pending)| [Member C] | 6 | To Do | Admin view for enrollments. |
| **US-004** (Approve) | [Member C] | 8 | To Do | Admin action to update status. |
| **US-005** (Login Logs) | [Member A] | 4 | To Do | Implement middleware/hook to log logins. |

---

## 3. Implementation Plan
1.  **Database:** Initialize the MySQL/SQLite database using the SQL provided in the Week 5 document.
2.  **API/Backend:** key endpoints needed:
    *   `GET /courses` (US-001)
    *   `POST /enroll` (US-002)
    *   `GET /admin/enrollments?status=pending` (US-003)
    *   `PUT /admin/enrollments/:id` (US-004)
3.  **Frontend:**
    *   Student Dashboard (List of courses).
    *   Admin Dashboard (List of pending requests).
