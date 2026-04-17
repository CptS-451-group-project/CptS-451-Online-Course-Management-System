require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log("Reading SQL file...");
        const sqlPath = path.join(__dirname, 'db-init.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing SQL queries to initialize the database tables...");
        await client.query(sqlQuery);
        
        console.log("✅ Database initialized successfully!");
    } catch (err) {
        console.error("❌ Error initializing database:", err);
    } finally {
        client.release();
        pool.end();
    }
}

// Run the function
initializeDatabase();