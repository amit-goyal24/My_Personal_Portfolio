require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

// Setup upload parser for FormData submissions
const upload = multer();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static website files from the project directory
app.use(express.static(__dirname));

// POST contact endpoint
app.post('/api/contact', upload.none(), (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).send('Error: All form fields are required.');
  }

  // Save to database/JSON backup
  db.saveSubmission({ name, email, subject, message }, (err, insertId) => {
    if (err) {
      console.error('Failed to store submission in database:', err);
      return res.status(500).send('Error: Failed to save your message. Please try again.');
    }

    console.log(`Saved submission #${insertId} from ${email}`);

    // Attempt to send email
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = process.env.SMTP_PORT || 587;
    const receiverEmail = process.env.RECEIVER_EMAIL || 'amitpvt0150@gmail.com';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('--------------------------------------------------');
      console.log('WARNING: SMTP credentials are not fully configured in .env file.');
      console.log('Skipping email notification step.');
      console.log('Submission saved successfully to database/fallback JSON.');
      console.log('--------------------------------------------------');
      return res.send('OK');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"${name}" <${smtpUser}>`, // Use authenticated SMTP sender
      to: receiverEmail,
      replyTo: email, // Set visitor email as Reply-To
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="border-left: 4px solid #00a8cc; padding-left: 10px; margin-top: 10px; white-space: pre-wrap;">
          ${message}
        </div>
      `
    };

    transporter.sendMail(mailOptions, (mailErr, info) => {
      if (mailErr) {
        console.error('Nodemailer Error: Failed to send email:', mailErr);
        // Note: We still return 'OK' because the database write succeeded,
        // and we don't want to show an error to the user for SMTP issues.
        console.log('Note: Data remains saved in local storage.');
      } else {
        console.log('Email sent successfully:', info.messageId);
      }
      return res.send('OK');
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
