CREATE DATABASE resiportal;
USE resiportal;

-- Residents Table
CREATE TABLE residents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    flat_no VARCHAR(20),
    username VARCHAR(50),
    password VARCHAR(100)
);

select * from residents;

delete from residents where id=9;

-- Admin Table
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(100)
);

INSERT INTO admin (username, password) VALUES ("admin", "admin123");
select * from admin;
delete from admin where id=2;

-- Payments
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT,
    amount INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

select * from payments;
delete from payments where id=40;

-- Notices
CREATE TABLE notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    message TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

select * from notices;
delete from notices where id=6;

-- Bookings
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT,
    facility VARCHAR(100),
    date DATE,
    status VARCHAR(20) DEFAULT 'Pending'
);

select * from bookings;
delete from bookings;

-- Complaints
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT,
    message TEXT,
    reply TEXT DEFAULT NULL
);

select * from complaints;
delete from complaints where id=8; 

Show databases;