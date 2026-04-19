const express = require('express');
const router = express.Router();
const pool = require('../db');
const { sendPgError } = require('../utils/pgErrors'); // constraint failures from inserts/deletes


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
        // Undo partial inserts if Course_Details or Course_Terms failed
        await pool.query('ROLLBACK').catch(() => {});
        sendPgError(res, err, {
            defaultStatus: 400,
            defaultMessage: 'Could not create course.',
            duplicateMessage: 'A course with this name already exists.',
            fkMessage: 'Invalid professor or related data.',
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