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


// Advanced Query Route: Fetch overloaded students
// KEY: 'having count' is where we look for student's that pass the amount of courses enrolled
// which triggers the filter
app.get('/api/users/overloaded', async (req, res) => {
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

app.use('/api/auth', require('./routes/auth'));


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