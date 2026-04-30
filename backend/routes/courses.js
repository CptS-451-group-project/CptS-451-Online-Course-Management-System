const express = require('express');
const router = express.Router();
const pool = require('../db');
const { sendPgError } = require('../utils/pgErrors'); // constraint failures from inserts/deletes


// For advanced query #1 - high demand courses
// @route   GET /api/courses/high-demand
// @desc    Fetch high-demand / near-capacity courses
router.get('/high-demand', async (req, res) => {
    try {
        const query = `
            SELECT 
                ct.course_term_id,
                ct.professor_id,
                u.email AS professor_email,
                cd.course_name,
                cd.description,
                ct.location,
                ct.availability,
                ct.max_students,
                t.term_name,
                COALESCE(
                    string_agg(DISTINCT cs.day_of_week || ' ' || to_char(cs.start_time, 'HH12:MI AM') || '-' || to_char(cs.end_time, 'HH12:MI AM'), ', '), 
                    'TBA'
                ) as schedule_times,
                COUNT(es.user_id) AS currently_enrolled
            FROM Course_Terms ct
            JOIN Course_Details cd ON ct.course_id = cd.course_id
            LEFT JOIN Terms t ON ct.term_id = t.term_id
            LEFT JOIN Course_Schedules cs ON ct.course_term_id = cs.course_term_id
            LEFT JOIN Users u ON ct.professor_id = u.user_id
            LEFT JOIN Enrollment_Status es 
                ON ct.course_term_id = es.course_term_id AND es.status = 'e'
            GROUP BY 
                ct.course_term_id, cd.course_name, cd.description, 
                ct.location, ct.availability, ct.max_students, 
                t.term_name, ct.professor_id, u.email
            HAVING COUNT(es.user_id) >= (ct.max_students * 0.7)
            ORDER BY currently_enrolled DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching high-demand courses" });
    }
});

// For advanced Query #4 - enrollment totals
// @route   GET /api/courses/enrollment-totals
// @desc    Fetch total enrollments grouped by each course
router.get('/enrollment-totals', async (req, res) => {
    try {
        const query = `
            SELECT 
                cd.course_name, 
                t.term_name, 
                ct.max_students,
                COUNT(es.user_id) AS total_enrolled
            FROM Course_Terms ct
            JOIN Course_Details cd ON ct.course_id = cd.course_id
            -- NEW: Changed to LEFT JOIN so courses without terms don't vanish!
            LEFT JOIN Terms t ON ct.term_id = t.term_id 
            LEFT JOIN Enrollment_Status es 
                ON ct.course_term_id = es.course_term_id AND es.status = 'e'
            GROUP BY 
                cd.course_name, 
                t.term_name,
                ct.max_students
            ORDER BY total_enrolled DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching enrollment totals" });
    }
});

// @route   GET /api/courses
// @desc    Get all courses with their terms, schedules, and professors (Default View)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                ct.course_term_id,
                ct.professor_id,
                u.email AS professor_email,
                cd.course_name,
                cd.description,
                ct.location,
                ct.availability,
                ct.max_students,
                t.term_name,
                COALESCE(
                    string_agg(DISTINCT cs.day_of_week || ' ' || to_char(cs.start_time, 'HH12:MI AM') || '-' || to_char(cs.end_time, 'HH12:MI AM'), ', '), 
                    'TBA'
                ) as schedule_times
            FROM Course_Terms ct
            JOIN Course_Details cd ON ct.course_id = cd.course_id
            LEFT JOIN Terms t ON ct.term_id = t.term_id
            LEFT JOIN Course_Schedules cs ON ct.course_term_id = cs.course_term_id
            LEFT JOIN Users u ON ct.professor_id = u.user_id
            GROUP BY 
                ct.course_term_id, cd.course_name, cd.description, 
                ct.location, ct.availability, ct.max_students, 
                t.term_name, ct.professor_id, u.email
            ORDER BY cd.course_name ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error retrieving courses." });
    }
});


// New
// @route   GET /api/courses/terms
// @desc    Get all available terms for dropdown menus
router.get('/terms', async (req, res) => {
    try {
        const query = `SELECT term_id, term_name FROM Terms ORDER BY start_date DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching terms." });
    }
});

// NEW
// @route   POST /api/courses/terms
// @desc    Create a new academic term
router.post('/terms', async (req, res) => {
    const { term_name, start_date, end_date } = req.body;
    
    try {
        const newTerm = await pool.query(
            `INSERT INTO Terms (term_name, start_date, end_date) 
             VALUES ($1, $2, $3) RETURNING *`,
            [term_name, start_date, end_date]
        );
        res.status(201).json(newTerm.rows[0]);
    } catch (err) {
        console.error(err.message);
        // The DB schema enforces that end_date > start_date and term_name is unique
        res.status(400).json({ 
            error: "Could not create term. Ensure the term name is unique and the End Date is after the Start Date." 
        });
    }
});

// NEW
// @route   DELETE /api/courses/terms/:id
// @desc    Delete an academic term
router.delete('/terms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Terms WHERE term_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Term not found." });
        }
        res.json({ message: "Term deleted successfully!" });
    } catch (err) {
        // Postgres Error 23503 is a Foreign Key Violation
        // This catches the ON DELETE RESTRICT constraint if courses are still using this term
        if (err.code === '23503') {
            return res.status(400).json({ 
                error: "Cannot delete this term because it is currently assigned to one or more courses. Remove the courses first." 
            });
        }
        console.error(err.message);
        res.status(500).json({ error: "Server error deleting term." });
    }
});


// @route   POST /api/courses
// @desc    Create a new course, term, and schedule 
router.post('/', async (req, res) => {
    const { 
        course_name, description, // Course_Details
        term_id, professor_id, location, max_students, // Course_Terms
        day_of_week, start_time, end_time // Course_Schedules
    } = req.body;
    
    try {
        await pool.query('BEGIN'); // Start transaction

        // 1. Insert or Get Course Details
        let courseRes = await pool.query('SELECT course_id FROM Course_Details WHERE course_name = $1', [course_name]);
        let courseId;
        if (courseRes.rows.length === 0) {
            const newCourse = await pool.query(
                'INSERT INTO Course_Details (course_name, description) VALUES ($1, $2) RETURNING course_id',
                [course_name, description]
            );
            courseId = newCourse.rows[0].course_id;
        } else {
            courseId = courseRes.rows[0].course_id;
        }

        // 2. Insert Course Term
        const newTerm = await pool.query(
            `INSERT INTO Course_Terms (course_id, term_id, professor_id, location, max_students) 
            VALUES ($1, $2, $3, $4, $5) RETURNING course_term_id`,
            [courseId, term_id, professor_id, location, max_students]
        );
        const courseTermId = newTerm.rows[0].course_term_id;

        // 3. Insert Course Schedule (If schedule data is provided)
        if (day_of_week && start_time && end_time) {
            await pool.query(
                `INSERT INTO Course_Schedules (course_term_id, day_of_week, start_time, end_time) 
                 VALUES ($1, $2, $3, $4)`,
                [courseTermId, day_of_week, start_time, end_time]
            );
        }

        await pool.query('COMMIT');
        res.status(201).json({ message: "Course, Term, and Schedule created successfully!" });
    } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        sendPgError(res, err, {
            defaultStatus: 400,
            defaultMessage: 'Could not create course.',
            duplicateMessage: 'A course with this name already exists.',
            fkMessage: 'Invalid professor, term ID, or related data.',
        });
    }
});


// @route   DELETE /api/courses/:id
// @desc    Delete a course term
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Course_Terms WHERE course_term_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Course term not found." });
        }
        res.json({ message: "Course deleted successfully!" });
    } catch (err) {
        // Rare: FK block if something still references this course_term row
        sendPgError(res, err, {
            fkMessage: 'Cannot delete this offering: enrollments or schedules still reference it.',
            defaultMessage: 'Failed to delete course.',
        });
    }
});

module.exports = router;