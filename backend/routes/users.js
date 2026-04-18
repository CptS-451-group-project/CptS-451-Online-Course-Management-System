const express = require('express');
const router = express.Router();
const pool = require('../db');

// @route   GET /api/users/overloaded
// @desc    Fetch overloaded students
router.get('/overloaded', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.user_id,
                u.email, 
                u.role_name,
                t.term_name, 
                COUNT(es.course_term_id) AS total_enrolled_classes
            FROM Users u
            JOIN Enrollment_Status es ON u.user_id = es.user_id
            JOIN Course_Terms ct ON es.course_term_id = ct.course_term_id
            JOIN Terms t ON ct.term_id = t.term_id
            WHERE u.role_name = 'Student' 
              AND es.status = 'e'
            GROUP BY 
                u.user_id, 
                u.email, 
                u.role_name,
                t.term_name
            HAVING COUNT(es.course_term_id) > 1
            ORDER BY total_enrolled_classes DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching overloaded students" });
    }
});

// @route   GET /api/users
// @desc    Get all students/users for Admin View
router.get('/', async (req, res) => {
    try {
        // Exclude passwords from return logic
        const query = `
            SELECT user_id, email, role_name 
            FROM Users 
            ORDER BY user_id ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error retrieving users." });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Users WHERE user_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json({ message: "User deleted successfully!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to delete user." });
    }
});

module.exports = router;