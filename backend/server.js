require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required by Render to connect from outside
    }
});

// Middleware
app.use(cors()); // Allow cross-origin requests (e.g. from your React frontend)
app.use(express.json()); // Parse incoming JSON requests

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

// Basic test route
app.get('/api/courses', (req, res) => {
    // In the future, this will be replaced with a real database query
    const mockCourses = [
        { id: 'CPTS 224', name: 'Data Structures IV', availability: 'Open' },
        { id: 'CPTS 225', name: 'Data Structures V', availability: 'Waitlist' }
    ];
    res.json(mockCourses);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});