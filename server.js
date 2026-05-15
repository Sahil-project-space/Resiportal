const express = require("express");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const db = require("./db");
const transporter = require("./utils/mailer");


const app = express();
app.use(cors());
app.use(express.json());
// Log incoming requests for debugging
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url);
    next();
});
// Serve static files (index.html, assets, admin/, residents/)
app.use(express.static(path.join(__dirname)));

// Ensure root returns index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// ----------------------------
// RESIDENT REGISTER
// ----------------------------
app.post("/resident/register", (req, res) => {
    const { name, email, phone, flat_no, username, password } = req.body;

    const sql = `INSERT INTO residents (name,email,phone,flat_no,username,password) VALUES (?,?,?,?,?,?)`;

    db.query(sql, [name, email, phone, flat_no, username, password], (err) => {
        if (err) return res.json({ success: false, error: err });
        res.json({ success: true, message: "Registration successful!" });
    });
});


// ----------------------------
// RESIDENT LOGIN
// ----------------------------
app.post("/resident/login", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM residents WHERE username=? AND password=?";
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.json({ success: false });

        if (result.length > 0) {
            res.json({ success: true, resident_id: result[0].id });
        } else {
            res.json({ success: false });
        }
    });
});


// ----------------------------
// RESIDENT FORGOT PASSWORD
// ----------------------------
app.post("/resident/forgot-password", (req, res) => {
    let { username, email, new_password } = req.body;

    if (!username || !email || !new_password) {
        return res.status(400).json({ success: false, message: "username, email and new_password are required" });
    }

    // Trim inputs to avoid whitespace mismatch and normalize
    username = String(username).trim();
    email = String(email).trim();

    console.log('Forgot-password request for:', { username, email });

    const sql = "SELECT id, username, email FROM residents WHERE username=? AND email=?";
    db.query(sql, [username, email], (err, result) => {
        if (err) {
            console.error('DB error during forgot-password SELECT:', err);
            return res.status(500).json({ success: false, error: err });
        }

        console.log('forgot-password SELECT result rows:', result.length);

        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, message: "User not found with provided username and email." });
        }

        const residentId = result[0].id;
        db.query("UPDATE residents SET password=? WHERE id=?", [new_password, residentId], (err2, upd) => {
            if (err2) {
                console.error('DB error during forgot-password UPDATE:', err2);
                return res.status(500).json({ success: false, error: err2 });
            }
            console.log('forgot-password UPDATE affectedRows:', upd && upd.affectedRows);
            res.json({ success: true, message: "Password reset successful." });
        });
    });
});


// ----------------------------
// ADMIN LOGIN
// ----------------------------
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM admin WHERE username=? AND password=?";
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.json({ success: false });

        if (result.length > 0) {
            res.json({ success: true, admin_id: result[0].id });
        } else {
            res.json({ success: false });
        }
    });
});



// ----------------------------
// POST NOTICE + EMAIL NOTIFICATION
// ----------------------------
app.post("/notices", async (req, res) => {
    const { title, message } = req.body;

    if (!title || !message) {
        return res.status(400).json({ message: "Title and message required" });
    }

    try {
        // 1️⃣ Save notice in database
        await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO notices (title,message) VALUES (?,?)",
                [title, message],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // 2️⃣ Get all resident emails
        const residents = await new Promise((resolve, reject) => {
            db.query("SELECT email FROM residents", (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const emailList = residents.map(r => r.email);

        // 3️⃣ Send email notification
        if (emailList.length > 0) {
            await transporter.sendMail({
                from: '"ResiPortal" <resiportalnotify@gmail.com>',
                to: emailList,
                subject: "📢 New Notice: " + title,
                html: `
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <hr>
                    <p style="font-size:13px;color:#555;">
                        This is an automated email from ResiPortal.
                    </p>
                `
            });
        }

        res.json({ message: "Notice posted & email sent to residents!" });

    } catch (error) {
        console.error("Notice email error:", error);
        res.status(500).json({ message: "Notice posted but email failed." });
    }
});


// ----------------------------
// GET NOTICES
// ----------------------------
app.get("/notices", (req, res) => {
    db.query("SELECT * FROM notices ORDER BY id DESC", (err, result) => {
        if (err) return res.json(err);
        res.json(result);
    });
});


// ----------------------------
// DELETE NOTICE
// ----------------------------
app.delete("/notices/:id", (req, res) => {
    const noticeId = req.params.id;

    db.query(
        "DELETE FROM notices WHERE id = ?",
        [noticeId],
        (err, result) => {
            if (err) {
                console.error("Error deleting notice:", err);
                return res.status(500).json({ message: "Failed to delete notice" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Notice not found" });
            }

            res.json({ message: "Notice deleted successfully" });
        }
    );
});


// ----------------------------
// ADD PAYMENT
// ----------------------------
app.post("/payments", (req, res) => {
    const { resident_id, amount } = req.body;

    db.query("INSERT INTO payments (resident_id, amount) VALUES (?,?)",
        [resident_id, amount],
        (err) => {
            if (err) return res.json(err);
            res.json({ message: "Payment Successful!" });
        }
    );
});


// ----------------------------
// VIEW PAYMENTS
// ----------------------------
app.get("/payments", (req, res) => {
    const sql = `
    SELECT payments.*, residents.name, residents.flat_no
    FROM payments
    JOIN residents ON payments.resident_id = residents.id
    ORDER BY payments.id DESC`;

    db.query(sql, (err, result) => {
        if (err) return res.json(err);
        res.json(result);
    });
});


// ----------------------------
// ADD BOOKING
// ----------------------------
app.post("/bookings", (req, res) => {
    const { resident_id, facility, date } = req.body;

    db.query(`INSERT INTO bookings (resident_id,facility,date) VALUES (?,?,?)`,
        [resident_id, facility, date],
        (err) => {
            if (err) return res.json(err);
            res.json({ message: "Booking Request Submitted!" });
        }
    );
});


// ----------------------------
// VIEW BOOKINGS
// ----------------------------
app.get("/bookings", (req, res) => {
    const sql = `
    SELECT bookings.*, residents.name
    FROM bookings
    JOIN residents ON bookings.resident_id = residents.id
    ORDER BY bookings.id DESC`;

    db.query(sql, (err, result) => {
        if (err) return res.json(err);
        res.json(result);
    });
});


// ----------------------------
// APPROVE BOOKING
// ----------------------------
app.put("/bookings/:id/approve", (req, res) => {
    db.query("UPDATE bookings SET status='Approved' WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) return res.json(err);
            res.json({ message: "Booking Approved!" });
        }
    );
});


// ----------------------------
// REJECT BOOKING
// ----------------------------
app.put("/bookings/:id/reject", (req, res) => {
  const bookingId = req.params.id;
  const sql = "UPDATE bookings SET status = 'Rejected' WHERE id = ?";
  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      console.error("DB error rejecting booking:", err);
      return res.status(500).json({ success: false, error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
    res.json({ success: true, message: "Booking Rejected!" });
  });
});

// ----------------------------
// SUBMIT COMPLAINT
// ----------------------------
app.post("/complaints", (req, res) => {
    const { resident_id, message } = req.body;

    db.query("INSERT INTO complaints (resident_id,message) VALUES (?,?)",
        [resident_id, message],
        (err) => {
            if (err) return res.json(err);
            res.json({ message: "Complaint Submitted!" });
        }
    );
});


// ----------------------------
// VIEW COMPLAINTS
// ----------------------------
app.get("/complaints", (req, res) => {
    const sql = `
    SELECT complaints.*, residents.name, residents.flat_no
    FROM complaints
    JOIN residents ON complaints.resident_id = residents.id
    ORDER BY complaints.id DESC`;

    db.query(sql, (err, result) => {
        if (err) return res.json(err);
        res.json(result);
    });
});


// ----------------------------
// REPLY TO COMPLAINT
// ----------------------------
app.put("/complaints/:id/reply", (req, res) => {
    db.query("UPDATE complaints SET reply=? WHERE id=?",
        [req.body.reply, req.params.id],
        (err) => {
            if (err) return res.json(err);
            res.json({ message: "Reply Sent!" });
        }
    );
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

