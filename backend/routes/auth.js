const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_cpts451';

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, role_name } = req.body;

        // Basic validation
        if (!email || !password || !role_name) {
            return res.status(400).json({ message: 'Please provide email, password, and role_name' });
        }

        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert user into database
        const newUser = await pool.query(
            'INSERT INTO Users (email, password_hash, role_name) VALUES ($1, $2, $3) RETURNING user_id, email, role_name',
            [email, password_hash, role_name]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error during registration');
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

        // Check for user
        const userResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
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
        res.status(500).send('Server error during login');
    }
});

module.exports = router;