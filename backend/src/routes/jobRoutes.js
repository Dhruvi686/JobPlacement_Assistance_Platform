const express = require('express');
const router = express.Router();
const JobController = require('../controllers/jobController');
const JobApplication = require('../models/JobApplication'); // Create this model
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Files will be saved in /uploads
const jobController = new JobController();
const path = require('path');
const nodemailer = require('nodemailer');

router.get('/', jobController.getJobs.bind(jobController));
router.post('/', jobController.createJob.bind(jobController));
router.post('/apply', upload.single('cv'), async (req, res) => {
  try {
    const applicationData = JSON.parse(req.body.data);
    const application = new JobApplication({
      ...applicationData,
      cvUrl: req.file ? req.file.path : null,
    });
    await application.save();
    res.status(201).json({ message: 'Application submitted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/applications', async (req, res) => {
  try {
    const applications = await JobApplication.find();
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update application status (accepted/rejected/pending)
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['accepted', 'rejected', 'pending'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Application not found' });
    res.json({ ok: true, application: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk email to selected job applications
router.post('/applications/bulk-email', async (req, res) => {
  try {
    const { ids = [], subject, message } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No candidate IDs provided' });
    }
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Load SMTP settings from env
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, DEV_EMAIL_FALLBACK } = process.env;
    let transporter;
    let fromEmail = FROM_EMAIL;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
      // Optional dev fallback using Ethereal test account
      if (String(DEV_EMAIL_FALLBACK).toLowerCase() === 'true') {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
        fromEmail = `Dev Test <${testAccount.user}>`;
      } else {
        return res.status(503).json({ error: 'Email service not configured' });
      }
    } else {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });
    }

    // Fetch candidates
    const candidates = await JobApplication.find({ _id: { $in: ids } });
    const emails = candidates.map(c => c.email).filter(Boolean);
    if (emails.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses found' });
    }

    // Send individually to avoid exposing recipients
    let sent = 0;
    const previewUrls = [];
    for (const to of emails) {
      try {
        const info = await transporter.sendMail({
          from: fromEmail,
          to,
          subject,
          text: message
        });
        sent += 1;
        // Collect preview URLs in dev fallback
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) previewUrls.push(preview);
      } catch (e) {
        // continue sending others
        console.error('Failed to send to', to, e.message);
      }
    }

    res.json({ ok: true, sent, total: emails.length, previewUrls });
  } catch (err) {
    console.error('bulk-email error', err);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});
router.patch('/applications/:id/remarks', async (req, res) => {
  try {
    const { remarks } = req.body;
    await JobApplication.findByIdAndUpdate(req.params.id, { remarks });
    res.json({ message: 'Remarks updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', '..', 'uploads', req.params.filename); // <-- fix here
  console.log('Download request for:', filePath);
  res.download(filePath, req.params.filename, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});
router.get('/view/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', '..', 'uploads', req.params.filename);
  console.log('View request for:', filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});
router.get('/api/jobs/view/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename); // adjust path as needed
  res.sendFile(filePath, err => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

module.exports = () => router;