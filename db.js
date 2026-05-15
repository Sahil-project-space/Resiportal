/*const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Sahil@123",   // <--- VERY IMPORTANT
    database: "resiportal"
});

db.getConnection((err, connection) => {
    if (err) {
        console.log("❌ MySQL Connection Failed:", err.message);
    } else {
        console.log("✅ MySQL Connected Successfully!");
        connection.release();
    }
});

module.exports = db;
*/




const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: true
    }
});

// Test connection

db.getConnection((err, connection) => {
    if (err) {
        console.log("❌ Database Connection Failed:", err.message);
    } else {
        console.log("✅ Database Connected Successfully!");
        connection.release();
    }
});

module.exports = db;