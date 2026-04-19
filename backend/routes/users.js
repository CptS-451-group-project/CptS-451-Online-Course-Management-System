const express = require('express');
const router = express.Router();
const pool = require('../db');
const { sendPgError } = require('../utils/pgErrors'); // RESTRICT from Logs / Enrollment blocks delete


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
        // User still referenced by Enrollment_Status or Logs → Postgres 23503
        sendPgError(res, err, {
            fkMessage:
                'Cannot delete user: related enrollments or logs still reference this account.',
            defaultMessage: 'Failed to delete user.',
        });
    }
});

module.exports = router;