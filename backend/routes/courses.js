const express = require('express');
const router = express.Router();
const pool = require('../db');

// @route   GET /api/courses
// @desc    Get all courses with their terms and professors
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                ct.course_term_id,
                cd.course_name,
                cd.description,
                ct.term,
                ct.start_date,
                ct.end_date,
                ct.location,
                ct.class_times,
                ct.availability,
                ct.max_students,
                u.email as professor_email
            FROM Course_Terms ct
            JOIN Course_Details cd ON ct.course_id = cd.course_id
            LEFT JOIN Users u ON ct.professor_id = u.user_id
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
    const { course_name, description, term, professor_id, start_date, end_date, location, class_times, max_students } = req.body;
    
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
            (course_id, term, professor_id, start_date, end_date, location, class_times, max_students) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [courseId, term, professor_id, start_date, end_date, location, class_times, max_students]
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

module.exports = router;