const express = require('express');
const router = express.Router();
const pool = require('../db');

// Advanced Query Route: Fetch high-demand / near-capacity courses
//
router.get('/high-demand', async (req, res) => {
    try {
        const query = `
            SELECT 
                cd.course_name, 
                ct.course_term_id,
                ct.professor_id,
                ct.availability,
                ct.max_students, 
                COUNT(es.user_id) AS currently_enrolled
            FROM Course_Details cd
            JOIN Course_Terms ct ON cd.course_id = ct.course_id
            LEFT JOIN Enrollment_Status es 
                ON ct.course_term_id = es.course_term_id AND es.status = 'e'
            GROUP BY 
                cd.course_name, 
                ct.course_term_id,
                ct.professor_id,
                ct.availability,
                ct.max_students
            HAVING COUNT(es.user_id) >= (ct.max_students * 0.9)
            ORDER BY currently_enrolled DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching high-demand courses" });
    }
});


// @route   GET /api/courses
// @desc    Get all courses with their terms and professors
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                ct.course_term_id,
                ct.professor_id,
                cd.course_name,
                cd.description,
                ct.availability,
                ct.max_students
            FROM course_terms ct
            JOIN course_details cd ON ct.course_id = cd.course_id
            ORDER BY cd.course_name ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error retrieving courses." });
    }
});



// @route   POST /api/courses
// @desc    Create a new course and term (simplified for MVP CRUD)
router.post('/', async (req, res) => {
    const { course_name, description, professor_id, location, class_times, max_students } = req.body;
    
    try {
        // Start a transaction since we insert into two tables
        await pool.query('BEGIN');

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
            `INSERT INTO Course_Terms 
            (course_id, professor_id, location, max_students) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
            [courseId, professor_id, location, max_students]
        );

        await pool.query('COMMIT');
        res.status(201).json(newTerm.rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        // Error handling edge cases (e.g. invalid dates violated CHECK constraint)
        res.status(400).json({ error: "Failed to create course. Please check your data constraints." });
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
        console.error(err.message);
        res.status(500).json({ error: "Failed to delete course." });
    }
});

module.exports = router;