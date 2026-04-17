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
    first_name VARCHAR(255),
    middle_initial VARCHAR(1),
    last_name VARCHAR(255),
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
    term_id INT,
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
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (course_term_id) REFERENCES Course_Terms(course_term_id) ON DELETE SET NULL
);

-- -- race condition - if 2 students enroll in a course at the exact same time
-- -- Create the custom function to check capacity (max_students)
-- CREATE OR REPLACE FUNCTION check_course_capacity()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     v_max_capacity INT;
--     v_current_enrolled INT;
-- BEGIN
--     -- Only check capacity if the student is actually trying to enroll ('e')
--     -- We don't care about limits if they are just pending ('p') or waitlisting ('w')
--     IF NEW.status != 'e' THEN
--         RETURN NEW;
--     END IF;

--     -- 1. Lock the Course_Terms row and get the max capacity
--     SELECT max_students INTO v_max_capacity
--     FROM Course_Terms
--     WHERE course_term_id = NEW.course_term_id
--     FOR UPDATE;

--     -- 2. If max_students is NULL, it means infinite capacity. Let them in.
--     IF v_max_capacity IS NULL THEN
--         RETURN NEW;
--     END IF;

--     -- 3. Count how many students are currently enrolled in this specific term
--     SELECT COUNT(*) INTO v_current_enrolled
--     FROM Enrollment_Status
--     WHERE course_term_id = NEW.course_term_id 
--       AND status = 'e';

--     -- 4. Check if the class is full
--     IF v_current_enrolled >= v_max_capacity THEN
--         -- This aborts the transaction and sends an error message back to the application
--         RAISE EXCEPTION 'Enrollment failed: Course is at maximum capacity (%)', v_max_capacity;
--     END IF;

--     -- 5. If we get here, there is space! Allow the insert/update to proceed.
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Attach the function to the Enrollment_Status table
-- CREATE TRIGGER trg_enforce_capacity
-- BEFORE INSERT OR UPDATE ON Enrollment_Status
-- FOR EACH ROW
-- EXECUTE FUNCTION check_course_capacity();

-- For testing only - inserting dummy enrollment data

-- 1. Create a dummy Course Detail
INSERT INTO Course_Details (course_name, description) 
VALUES ('CPTS 451 - Introduction to Databases', 'Introduction Database Design')
ON CONFLICT (course_name) DO NOTHING;

-- 1.5 Create a Term (Required since the schema was normalized)
INSERT INTO Terms (term_name, start_date, end_date) 
VALUES ('Spring 2026', '2026-01-10', '2026-05-01')
ON CONFLICT (term_name) DO NOTHING;

-- 2. Create a Course Term with a max_students of 5 so we can easily hit 90%
INSERT INTO Course_Terms (course_id, term_id, location, availability, max_students) 
VALUES (
    (SELECT course_id FROM Course_Details WHERE course_name = 'CPTS 451 - Introduction to Databases' LIMIT 1),
    (SELECT term_id FROM Terms WHERE term_name = 'Spring 2026' LIMIT 1),
    'Spark 102', TRUE, 5
);

-- 3. Insert Dummy Students (Ensure the 'Student' role exists in your Roles table)
INSERT INTO Users (email, password_hash, role_name) VALUES 
('david@wsu.edu', 'hash_pw', 'Student'),
('nick@wsu.edu', 'hash_pw', 'Student'),
('panashe@wsu.edu', 'hash_pw', 'Student'),
('jaden@wsu.edu', 'hash_pw', 'Student'),
('PK@wsu.edu', 'hash_pw', 'Student')
ON CONFLICT (email) DO NOTHING;

-- 4. Enroll all 5 students in the class so it hits 100% capacity (which is >= 90%)
INSERT INTO Enrollment_Status (course_term_id, user_id, status, timestamp)
SELECT 
    (SELECT course_term_id FROM Course_Terms ct JOIN Course_Details cd ON ct.course_id = cd.course_id WHERE cd.course_name = 'CPTS 451 - Introduction to Databases' ORDER BY course_term_id DESC LIMIT 1),
    user_id,
    'e',
    CURRENT_TIMESTAMP
FROM Users WHERE email IN ('david@wsu.edu', 'nick@wsu.edu', 'panashe@wsu.edu', 'jaden@wsu.edu', 'PK@wsu.edu')
ON CONFLICT DO NOTHING;


--- For testing only - deleting dummy enrollment data
-- -- Delete the dummy students. This will CASCADE and delete their pending/enrolled statuses too!

-- DELETE FROM Users 
-- WHERE email IN ('dummy1@wsu.edu', 'dummy2@wsu.edu', 'dummy3@wsu.edu', 'dummy4@wsu.edu', 'dummy5@wsu.edu');

-- -- Delete the dummy course. This will CASCADE and delete the Course_Terms and any remaining enrollments!
-- DELETE FROM Course_Details 
-- WHERE course_name = 'CPTS 451 - Introduction to Database Systems';

-- -- (Optional) Clean up the dummy term
-- DELETE FROM Terms 
-- WHERE term_name = 'Spring 2026';



