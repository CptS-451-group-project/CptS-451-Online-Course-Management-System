-- 1. Create Roles Table (Reference table without FKs yet)
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

-- 3. Create Course_Details Table
CREATE TABLE IF NOT EXISTS Course_Details (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- 4. Create Course_Terms Table
CREATE TABLE IF NOT EXISTS Course_Terms (
    course_term_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    term VARCHAR(64) NOT NULL,
    professor_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(64) NOT NULL,
    class_times VARCHAR(64) NOT NULL,
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    max_students INT,
    CHECK (end_date > start_date),
    FOREIGN KEY (course_id) REFERENCES Course_Details(course_id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 5. Create Enrollment_Status Table
CREATE TABLE IF NOT EXISTS Enrollment_Status (
    course_term_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(1) NOT NULL DEFAULT 'p', -- p: pending, e: enrolled, w: waitlist
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_term_id, user_id),
    FOREIGN KEY (course_term_id) REFERENCES Course_Terms(course_term_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 6. Create Log_Types Table
CREATE TABLE IF NOT EXISTS Log_Types (
    log_type SERIAL PRIMARY KEY,
    log_type_name VARCHAR(32) UNIQUE NOT NULL
);

-- Insert default log types safely
INSERT INTO Log_Types (log_type_name) 
VALUES ('Login'), ('Enrollment'), ('Course_Update') 
ON CONFLICT do NOTHING;

-- 7. Create Logs Table
CREATE TABLE IF NOT EXISTS Logs (
    log_id SERIAL PRIMARY KEY,
    log_type INT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    course_term_id INT,
    content VARCHAR(255),
    FOREIGN KEY (log_type) REFERENCES Log_Types(log_type) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_term_id) REFERENCES Course_Terms(course_term_id) ON DELETE SET NULL
);