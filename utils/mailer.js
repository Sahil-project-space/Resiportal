const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "resiportalnotify@gmail.com",
    pass: "kvmpsxangaqcrwtm"
  }
});

module.exports = transporter;
