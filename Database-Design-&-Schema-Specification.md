## **Database Design & Schema Specification for Project**

## **1. Requirements-to-Data Mapping**

### **1.1 Functional Requirements:**

### **1.1.1 Enrollment and Access Management** 

| Functional Requirement ID | Requirement Description | Data Needed | Supporting Table(s) |
| :---- | :---- | :---- | :---- |
| FR-1.1 | The system shall allow students to browse available courses. | course name, class availability, course id | Users, Course_Details |
| FR-1.2 | The system shall allow students to enroll in courses. | student id, courses, course availability | Users, Course_Details, |
| FR-1.3 | The system shall validate enrollment eligibility before granting access. | Course availability, course id, user id | Users, Enrollment_Status, Course_Details |
| FR-1.4 | The system shall maintain the current enrollment status of each student per course. | user id, course id | Enrollment_Status |
| FR-1.5 | The system shall provide a searchable catalog of all available courses | search query, courses | Course_Details |

### **1.1.2 Activity and Usage Logging**

| Functional Requirement ID | Requirement Description | Data Needed | Supporting Table(s) |
| :---- | :---- | :---- | :---- |
| FR-2.1 | The system shall log all user activity for auditing and accountability purposes. | Login time, user id | Logs, Users |
| FR-2.2 | The system shall record course changed events, including user ID, course ID, and timestamp. | Interaction, courseID,Time, userID, | Logs |
| FR-2.3 | The system shall log enrollment-related actions, including enrollments, withdrawals, and approvals. | interaction, course id, time stamp, user id | Logs |

### **1.1.3 Administrative Features**

| Functional Requirement ID | Requirement Description | Data Needed | Supporting Table(s) |
| :---- | :---- | :---- | :---- |
| FR-3.1 | The system shall allow administrators to view pending course enrollments. | unapproved course enrollments, users, roles | Users, Enrollment_Status |
| FR-3.2 | The system shall allow administrators to approve, reject, or modify course enrollments. | course enrollments, users, roles | Users, Enrollment_Status |
| FR-3.3 | The system shall provide course engagement metrics (e.g., enrollment frequency); | log | Logs, Log_types |
| FR-3.4 | The system shall allow administrators to monitor individual and aggregate student activity. | Logs | Logs, Log_types, Users |

### **1.1 Non-Functional Requirements:**

### **1.2.1 Administrative Features**

| Functional Requirement ID | Requirement Description | Data Needed | Supporting Table(s) |
| :---- | :---- | :---- | :---- |
| NFR-1.1 | The system shall enforce role-based access control (RBAC) for students and administrators. | roles, password, user id | Users, Roles |
| NFR-1.2 | Activity logs shall be accessible only to authorized administrative users. | roles, user id, passwords, logs | Users, Logs, Log_Types, Roles |
| NFR-1.3 | All user actions shall be securely stored to prevent unauthorized modification. | logs | Logs |
| NFR-1.4 | The system shall encrypt all user login credentials during transmission using industry-standard encryption protocols (e.g., TLS). | N/A | N/A |
| NFR-1.5 | The system shall store user passwords in a hashed and salted format and shall never store passwords in plaintext. | passwords, user id | Users |
| NFR-1.6 | The system shall protect authentication data from unauthorized access or disclosure. | user id, password, roles | Users, Roles |

### **1.2.2 Performance**

| Functional Requirement ID | Requirement Description | Data Needed | Supporting Table(s) |
| :---- | :---- | :---- | :---- |
| NFR-2.1 | Enrollment actions shall be processed within an acceptable response time (e.g., under 2 seconds). | enrollment status, course id, user id | Enrollment_Status, Users |
| NFR-2.2 | Logging of user activities shall not degrade system performance. | logs | Logs, Log_types |
| NFR-2.3 | Analytics and reporting features shall load within a defined time threshold. | logs | Logs, Log_types |

### **1.2.2 Reliability & Availability**

| Functional Requirement ID | Requirement Description | Data Needed | Supporting Table(s) |
| :---- | :---- | :---- | :---- |
| NFR-3.1 | The system shall reliably record all enrollment and activity events without data loss. | log type, log times, user id, course id, enrollment status,  enrollments | Enrollment_Status, Logs |
| NFR-3.2 | Logs shall be retained for a configurable period to support auditing and compliance. | logs, log timestamp | Logs |
| NFR-3.3 | The system shall be available during defined operational hours (e.g., 99.5% uptime). | N/A | N/A |

### **1.2.2 Scalability**

| Functional Requirement ID | Requirement Description | Data Needed | Supporting Table(s) |
| :---- | :---- | :---- | :---- |
| NFR-4.1 | The system shall support concurrent access by multiple students and administrators. | No data, server will support this | N/A |
| NFR-4.2 | The logging and analytics subsystem shall scale as the number of users and courses increases. | N/A | Logs, Log_type |

### **1.2.2 Usability**

| Functional Requirement ID | Requirement Description | Data Needed | Supporting Table(s) |
| :---- | :---- | :---- | :---- |
| NFR-4.1 | The enrollment process shall be intuitive and require minimal user training. | N/A | N/A |
| NFR-4.2 | Administrative dashboards shall present analytics in a clear and understandable format. | logs, users, enrollments, enrollment status | Logs, Log_Types, Users, Enrollment_Status |

## **2. Table Design**

**Table Name:** Course_Details  
**Purpose:** Store the details of each course's general information.

| Attribute Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| course_id | INT | AUTO INCREMENT, PK | Unique course identifier |
| course_name | VARCHAR(255) | UNIQUE | Unique course name |
| description | VARCHAR(255) |  | Course Description |

**Table Name:** Course_Terms  
**Purpose:** Stores the details of a class offered on a specific term.

| Attribute Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| course_term_id | INT | PRIMARY KEY AUTO_INCREMENT | Unique identifier for the course term |
| course_id | INT | FK REFERENCES Course_Details.course_id | The unique course identifier |
| term | VARCHAR(64) | NOT NULL | What term(semester / quarter) this course is taking place |
| professor_id | INT | FK REFERENCES user_id in Users NOT NULL ON DELETE NULL | Professor identification number |
| start_date | DATE | NOT NULL | Course begin date |
| end_date | DATE | NOT NULL CHECK end_date > start_date | Course end date |
| location | VARCHAR(64) | NOT NULL | Where the course is being held |
| class_times | VARCHAR(64) | NOT NULL | lecture session schedule |
| availability | BOOLEAN | NOT NULL | If course is still being offered |
| max_students | INT |  | Maximum of allowed students, NULL if no limit |

**Table Name:** Enrollment_Status  
**Purpose:** Shows the enrollment status for students applying to courses. 

| Attribute Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| course_term_id | INT | FK REFERENCES course_id IN Course_Terms.course_term_id NOT NULL | Course term being enrolled in Primary key with user_id |
| user_id | INT | FK REFERENCES User_id in Users ON DELETE RESTRICT NOT NULL | User which has enrolled Primary key with course_term_id |
| status | VARCHAR(1) | NOT NULL, DEFAULT 'p' | (e) enrolled (w) waitlist |
| timestamp | TIMESTAMP | NOT NULL | When enrollment was requested |

**Table Name:** Users  
**Purpose:** Stores the details of each user

| Attribute Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| user_id | INT | PK, AUTO INCREMENT | Unique user id |
| email | VARCHAR(45) | CHECK (email LIKE '%@%') | User email |
| password_hash | VARCHAR(64) | NOT NULL | User password hash |
| role_name | VARCHAR(32) | FK REFERENCES role_name IN Roles NOT NULL | Role for permission management |

**Table Name:** Logs  
**Purpose:** Stores the details of each log

| Attribute Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| log_id | INT | PK, AUTO INCREMENT | Id for log lookup |
| log_type | INT | FK REFERENCES log_type IN Log_Types NOT NULL | Type of log |
| timestamp | TIMESTAMP | NOT NULL | When the log was created |
| user_id | INT | FK REFERENCES user_id IN Users NOT NULL | User triggering the log |
| course_term_id | INT | FK REFERENCES course_term_id IN Course terms NOT NULL | Course term triggering the log |
| content | VARCHAR(32) |  | Contains additional data if needed (Ex: search query, login IP), dependent on log type |

**Table Name:** Roles  
**Purpose:** Allows the addition and removal of roles.

| Attribute Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| role_name | VARCHAR(32) | PK | Professor, Student, Graduate Student |

**Table Name:** Log_Types  
**Purpose:** Allows the addition and removal of log types

| Attribute Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| log_type | INT | PK | Type of log |
| log_type_name | VARCHAR(32) | NOT NULL | Full name of log type |

## **3. Foreign Key Relationships**

Course_Terms.professor_Id→User.user_id  
Users.role_name→Roles.role_name  
Logs.log_type→Log_type.log_type  
Logs.user_id→Users.user_id  
Logs.course_id→Course_Terms.course_term_id 
Users.role_name→Roles.role_name  
EnrollmentStatus.user_id→Users.User_id  
EnrollmentStatus.course_id→Course_Details.course_id

## 

## **4. SQL Table Creation**

### **4.1 Courses table**

CREATE TABLE Course_Details   
(  
    course_id INT AUTO_INCREMENT PRIMARY KEY,  
    course_name VARCHAR(255) UNIQUE,  
    description VARCHAR(255)  
 );

CREATE TABLE Course_Terms  
(  
    course_term_id INT AUTO_INCREMENT PRIMARY KEY,  
    course_id INT,  
    term VARCHAR(64) NOT NULL,  
    professor_id INT,  
    start_date DATE NOT NULL,  
    end_date DATE NOT NULL,   
    CHECK end_date > start_date,   
    location VARCHAR(64) NOT NULL,  
    class_times VARCHAR(64) NOT NULL,  
    availability BOOLEAN NOT NULL,  
    max_students INT,  
    FOREIGN KEY (course_id) REFERENCES Course_Details(course_id),  
    FOREIGN KEY (professor_id) REFERENCES Users(user_id) ON DELETE RESTRICT  
);

### **4.2 Enrollment status table**

CREATE TABLE Enrollment_Status   
(  
    course_term_id INT NOT NULL,  
    user_id INT NOT NULL,  
    status VARCHAR(1) NOT NULL DEFAULT 'p',  
    FOREIGN KEY (course_term_id) REFERENCES Course_Terms(course_term_id),  
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE  
);

### **4.3 Users table**

CREATE TABLE Users   
(  
    user_id INT AUTO_INCREMENT PRIMARY KEY,  
    email VARCHAR(45) CHECK (email LIKE '%@%'),  
    password_hash VARCHAR(64) NOT NULL,  
    role_name VARCHAR(32) NOT NULL,  
    CONSTRAINT fk_role   
        FOREIGN KEY (role_name)   
        REFERENCES Roles(role_name)  
);

### **4.4 Logs table**

CREATE TABLE Logs   
(  
    log_id INT AUTO_INCREMENT PRIMARY KEY,  
    log_type INT NOT NULL,  
    timestamp TIMESTAMP NOT NULL,  
    user_id INT NOT NULL,  
    course_term_id INT NOT NULL,  
    content VARCHAR(32),  
    FOREIGN KEY (log_type) REFERENCES Log_Types(log_type),  
    FOREIGN KEY (user_id) REFERENCES Users(user_id),  
    FOREIGN KEY (course_term_id) REFERENCES Course_Terms (course_term_id)  
);

### **4.5 Roles table**

CREATE TABLE Roles   
(  
    role_name VARCHAR(32) PRIMARY KEY  
);

### **4.6 Log Types table**

CREATE TABLE Log_Types   
(  
    log_type INT PRIMARY KEY,  
    log_type_name VARCHAR(32) NOT NULL  
);

## **5. Design Justification**

* The schema separates users, courses, logs, and enrollments to avoid redundancy and maintain normalization.  
* Foreign keys allow for expansion/removal of log types and roles as the user requirements change.  
* Log type is an INT, rather than the full name, to reduce the size of the log db.  
* Foreign keys enforce valid relationships between users and courses.  
* Constraints such as UNIQUE, CHECK, AUTO INCREMENT and NOT NULL ensure data integrity and consistency as required by the functional and non-functional requirements.  
* Enrollment capacity constraints (enrollment count ≤ max_students) cannot be enforced using standard CHECK constraints because they require aggregate evaluation across rows. Therefore, this constraint will be enforced using a database trigger that validates enrollment count before insert or update operations.