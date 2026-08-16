require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {Registration, Contact } = require('./mongo');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3005',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files with proper headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:");
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || 'http://localhost:3005');
  }
}));

// Create uploads folder if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// MongoDB connection
// backend/server.js (top already has require('dotenv').config())
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('MONGODB_URI is required');
console.log('Mongo URI:', mongoUri.replace(/:[^:]*@/, ':***@')); // Hide password in logs
mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully');
    console.log('Database:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err);
    process.exit(1); // Exit if connection fails
  });

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});

// Routes
app.post('/api/register', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    console.log('Received registration data:', req.body);
    console.log('Received file:', req.file);
    
    let parsedTeamMembers = [];
    if (req.body.teamMembers) {
      try {
        parsedTeamMembers = JSON.parse(req.body.teamMembers);
      } catch {
        parsedTeamMembers = Array.isArray(req.body.teamMembers) ? req.body.teamMembers : [];
      }
    }

    const required = ['teamName', 'teamLeader', 'email', 'phone', 'college'];
    const missing = required.filter(field => !String(req.body[field] || '').trim());
    if (missing.length) return res.status(400).json({ message: 'Missing required registration details', error: `Required: ${missing.join(', ')}` });
    
    const normalizedUtr = String(req.body.utrNumber || '').trim().toUpperCase();
    if (normalizedUtr && await Registration.exists({ utrNumber: normalizedUtr })) return res.status(409).json({ message: 'Payment reference already used', error: 'This UTR is already registered' });
    
    const registrationData = {
      teamName: req.body.teamName,
      teamLeader: req.body.teamLeader,
      email: req.body.email,
      phone: req.body.phone,
      college: req.body.college,
      participationType: req.body.participationType,
      trainingOption: req.body.trainingOption,
      memberCount: req.body.memberCount,
      teamMembers: parsedTeamMembers,
      utrNumber: normalizedUtr,
      paymentScreenshot: req.file ? req.file.path : '',
      nationality: req.body.nationality || 'Indian',
    };

    const registration = new Registration(registrationData);
    const saved = await registration.save();
    console.log('Saved registration:', saved);

    res.status(201).json({ message: 'Registration successful', registration });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});


app.post('/api/contact', async (req, res) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.subject || !req.body.message) return res.status(400).json({ message: 'All contact fields are required' });
    const contact = new Contact(req.body);
    const saved = await contact.save();
    res.status(201).json({ message: 'Contact message saved', contact: saved });
  } catch (error) {
    res.status(500).json({ message: 'Contact save failed', error: error.message });
  }
});


// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
