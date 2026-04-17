require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests (e.g. from your React frontend)
app.use(express.json()); // Parse incoming JSON requests

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enroll', require('./routes/enrollments'));

const path = require('path');
// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check route for Render to know your server is up
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        
        res.status(200).json({ 
            status: 'OK', 
            message: 'Course Management API is running', 
            dbTime: result.rows[0].now 
        });
    } catch (err) {
        console.error("Database connection error: ", err);
        res.status(500).json({ status: 'ERROR', message: 'Database connection failed' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});