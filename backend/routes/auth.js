const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { sendPgError } = require('../utils/pgErrors'); // duplicate email race, bad role FK → JSON errors


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_cpts451';

// Must match seed rows in Roles (db-init.sql); avoids FK failures on typos like "student".
const ALLOWED_ROLES = ['Professor', 'Student', 'Administrator'];

/** Trim + lowercase so " User@School.edu " matches login and can't duplicate accounts. */
function normalizeEmail(email) {
    return String(email).replace(/\s+/g, '').toLowerCase();
}

/** Remove all spaces so "s d f g" becomes "sdfg". */
function normalizeCompactText(value) {
    if (value === undefined || value === null) return null;
    const compact = String(value).replace(/\s+/g, '');
    return compact === '' ? null : compact;
}

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, role_name, first_name, middle_initial, last_name } = req.body;

        // Basic validation
        if (!email || !password || !role_name) {
            return res.status(400).json({ message: 'Please provide email, password, and role_name' });
        }

        // Normalize input once, then use normalized values for all DB operations.
        const emailNorm = normalizeEmail(email);
        const firstNameNorm = normalizeCompactText(first_name);
        const middleInitialNorm = normalizeCompactText(middle_initial);
        const lastNameNorm = normalizeCompactText(last_name);

        if (!ALLOWED_ROLES.includes(role_name)) {
            return res.status(400).json({
                message: `role_name must be one of: ${ALLOWED_ROLES.join(', ')}`
            });
        }

        // Enforce email uniqueness on normalized value so spacing/case variants map to one account.
        const userExists = await pool.query(
            'SELECT * FROM Users WHERE lower(trim(email)) = $1',
            [emailNorm]
        );
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Save normalized names/email to keep data consistent for search/login/display.
        const newUser = await pool.query(
            `INSERT INTO Users (first_name, middle_initial, last_name, email, password_hash, role_name)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING user_id, first_name, middle_initial, last_name, email, role_name`,
            [firstNameNorm, middleInitialNorm, lastNameNorm, emailNorm, password_hash, role_name]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.rows[0]
        });
    } catch (err) {
        // bcrypt failure falls through to defaultMessage; unique/FK use friendly text
        sendPgError(res, err, {
            duplicateMessage: 'User already exists',
            fkMessage: 'Invalid role_name',
            defaultMessage: 'Server error during registration',
        });
    }

});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Login uses the same email normalization as registration.
        const emailNorm = normalizeEmail(email);

        // Match register lookup so login works regardless of spacing/casing in request or DB
        const userResult = await pool.query(
            'SELECT * FROM Users WHERE lower(trim(email)) = $1',
            [emailNorm]
        );
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const user = userResult.rows[0];

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.user_id,
                email: user.email,
                role: user.role_name
            }
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '10h' }, (err, token) => {
            if (err) throw err;
            res.json({
                message: 'Login successful',
                token,
                user: { id: user.user_id, email: user.email, role: user.role_name }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            error: 'Server error during login',
            message: 'Server error during login',
        });
    }
});

module.exports = router;
