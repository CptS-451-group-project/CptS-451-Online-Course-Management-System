const express = require('express');
const router = express.Router();
const pool = require('../db');
// Central place for duplicate enroll, FK bad ids, capacity trigger text → alert-friendly JSON
const { sendPgError } = require('../utils/pgErrors');

// For advanced query #3 - pending enrollments queue
// @route   GET /api/enroll/pending-queue
// @desc    Fetch pending enrollments queue
router.get('/pending-queue', async (req, res) => {
    try {
        const query = `
            SELECT 
                ct.course_term_id,
                cd.course_name, 
                t.term_name, 
                COUNT(es.user_id) AS pending_requests_count
            FROM Course_Details cd
            JOIN Course_Terms ct ON cd.course_id = ct.course_id
            JOIN Terms t ON ct.term_id = t.term_id
            JOIN Enrollment_Status es ON ct.course_term_id = es.course_term_id
            WHERE es.status = 'p'
            GROUP BY 
                ct.course_term_id,
                cd.course_name, 
                t.term_name
            ORDER BY pending_requests_count DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching pending queue" });
    }
});

// For advanced query #5 - enrollments by term
// @route   GET /api/enroll/by-term
// @desc    Fetch all enrollments organized by class term
router.get('/by-term', async (req, res) => {
    try {
        const query = `
            SELECT 
                es.status, 
                es.timestamp, 
                es.course_term_id, 
                es.user_id, 
                u.email as student_email, 
                cd.course_name,
                t.term_name
            FROM Enrollment_Status es
            JOIN Users u ON es.user_id = u.user_id
            JOIN Course_Terms ct ON es.course_term_id = ct.course_term_id
            JOIN Course_Details cd ON ct.course_id = cd.course_id
            JOIN Terms t ON ct.term_id = t.term_id
            ORDER BY t.start_date DESC, cd.course_name ASC, u.email ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error getting enrollments by term." });
    }
});

// @route   POST /api/enroll
// @desc    A student enrolls in a course
router.post('/', async (req, res) => {
    const { course_term_id, user_id } = req.body;
    
    try {
        const query = `
            INSERT INTO Enrollment_Status (course_term_id, user_id, status) 
            VALUES ($1, $2, 'p') -- Default to 'p' (pending)
            RETURNING *;
        `;
        const result = await pool.query(query, [course_term_id, user_id]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // 23505 = duplicate PK; 23503 = bad FK; trigger may fire on status change elsewhere
        sendPgError(res, err, {
            duplicateMessage: 'You are already enrolled or pending in this course.',
            fkMessage: 'Invalid course or user (check course_term_id and user_id).',
            defaultMessage: 'Failed to process enrollment.',
        });
    }
});

// @route   GET /api/enroll 
// @desc    Get all enrollments across all courses (for admin)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT es.status, es.timestamp, es.course_term_id, es.user_id, u.email as student_email, cd.course_name
            FROM Enrollment_Status es
            JOIN Users u ON es.user_id = u.user_id
            JOIN Course_Terms ct ON es.course_term_id = ct.course_term_id
            JOIN Course_Details cd ON ct.course_id = cd.course_id
            ORDER BY cd.course_name ASC, u.email ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error getting all enrollments." });
    }
});

// @route   GET /api/enroll/:user_id  
// @desc    Get all enrolled courses for a specific student
router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const query = `
            SELECT es.status, es.timestamp, ct.*, cd.course_name
            FROM Enrollment_Status es
            JOIN Course_Terms ct ON es.course_term_id = ct.course_term_id
            JOIN Course_Details cd ON ct.course_id = cd.course_id
            WHERE es.user_id = $1;
        `;
        const result = await pool.query(query, [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error getting enrollments." });
    }
});

// @route   PUT /api/enroll/:course_term_id/:user_id
// @desc    Update an enrollment status (e.g., Prof approves a pending student)
router.put('/:course_term_id/:user_id', async (req, res) => {
    const { course_term_id, user_id } = req.params;
    const { status } = req.body; // 'e' (enrolled), 'p' (pending), 'w' (waitlist)

    // Example of simple validation
    if (!['e', 'p', 'w'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value. Must be 'e', 'p', or 'w'." });
    }

    try {
        const query = `
            UPDATE Enrollment_Status 
            SET status = $1 
            WHERE course_term_id = $2 AND user_id = $3
            RETURNING *;
        `;
        const result = await pool.query(query, [status, course_term_id, user_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Enrollment not found." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        // Class full → trigger RAISE; CHECK on status; capacity lock inside DB
        sendPgError(res, err, {
            defaultStatus: 400,
            defaultMessage: 'Failed to update enrollment status.',
            checkMessage: 'Invalid enrollment status for database rules.',
        });
    }
});

// @route   DELETE /api/enroll/:course_term_id/:user_id
// @desc    Admin or Student removes an enrollment entirely
router.delete('/:course_term_id/:user_id', async (req, res) => {
    const { course_term_id, user_id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM Enrollment_Status WHERE course_term_id = $1 AND user_id = $2 RETURNING *',
            [course_term_id, user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Enrollment not found." });
        }
        res.json({ message: "Enrollment removed successfully!" });
    } catch (err) {
        // Unusual here; plain DELETE rarely raises unless FK setup changes
        sendPgError(res, err, { defaultMessage: 'Failed to delete enrollment.' });
    }

});

module.exports = router;