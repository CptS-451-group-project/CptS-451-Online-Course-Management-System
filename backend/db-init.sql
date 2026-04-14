-- 1. Create Roles Table 
CREATE TABLE IF NOT EXISTS Roles (
    role_name VARCHAR(32) PRIMARY KEY
);

-- Insert default roles safely
INSERT INTO Roles (role_name) 
VALUES ('Professor'), ('Student'), ('Administrator') 
ON CONFLICT DO NOTHING;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(45) UNIQUE CHECK (email LIKE '%@%'),
    password_hash VARCHAR(255) NOT NULL,
    role_name VARCHAR(32) NOT NULL,
    FOREIGN KEY (role_name) REFERENCES Roles(role_name)
);

-- 3. Create Terms Table (NEW: Fixes 3NF Violation / Update Anomaly)
CREATE TABLE IF NOT EXISTS Terms (
    term_id SERIAL PRIMARY KEY,
    term_name VARCHAR(64) UNIQUE NOT NULL, -- e.g., 'Fall 2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CHECK (end_date > start_date)
);

-- 4. Create Course_Details Table
CREATE TABLE IF NOT EXISTS Course_Details (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- 5. Create Course_Terms Table (MODIFIED: Removed redundant dates and non-atomic class times)
CREATE TABLE IF NOT EXISTS Course_Terms (
    course_term_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    term_id INT NOT NULL,
    professor_id INT,
    location VARCHAR(64) NOT NULL,
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    max_students INT,
    FOREIGN KEY (course_id) REFERENCES Course_Details(course_id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES Terms(term_id) ON DELETE RESTRICT,
    FOREIGN KEY (professor_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 6. Create Course_Schedules Table (NEW: Fixes 1NF Violation for class times)
CREATE TABLE IF NOT EXISTS Course_Schedules (
    schedule_id SERIAL PRIMARY KEY,
    course_term_id INT NOT NULL,
    day_of_week VARCHAR(9) NOT NULL, -- e.g., 'Monday', 'Tuesday', or 'M', 'T', 'W'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time),
    FOREIGN KEY (course_term_id) REFERENCES Course_Terms(course_term_id) ON DELETE CASCADE
);

-- 7. Create Enrollment_Status Table
CREATE TABLE IF NOT EXISTS Enrollment_Status (
    course_term_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(1) NOT NULL DEFAULT 'p' CHECK (status IN ('p', 'e', 'w')), -- p: pending, e: enrolled, w: waitlist
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_term_id, user_id),
    FOREIGN KEY (course_term_id) REFERENCES Course_Terms(course_term_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 8. Create Log_Types Table
CREATE TABLE IF NOT EXISTS Log_Types (
    log_type SERIAL PRIMARY KEY,
    log_type_name VARCHAR(32) UNIQUE NOT NULL
);

-- Insert default log types safely
INSERT INTO Log_Types (log_type_name) 
VALUES ('Login'), ('Enrollment'), ('Course_Update') 
ON CONFLICT DO NOTHING;

-- 9. Create Logs Table (Already fixed: course_term_id allows NULL)
CREATE TABLE IF NOT EXISTS Logs (
    log_id SERIAL PRIMARY KEY,
    log_type INT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    course_term_id INT, -- Left as NULLable so system logs (like Login) don't require a course
    content VARCHAR(255),
    FOREIGN KEY (log_type) REFERENCES Log_Types(log_type) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_term_id) REFERENCES Course_Terms(course_term_id) ON DELETE SET NULL
);