const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  teamName: String,
  teamLeader: String,
  email: String,
  phone: String,
  college: String,
  participationType: String,
  trainingOption: String,
  memberCount: String,
  teamMembers: [String],
  utrNumber: String,
  paymentScreenshot: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  registrationDate: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  submittedAt: { type: Date, default: Date.now }
});

const Registration = mongoose.model('Registration', registrationSchema);
const Contact = mongoose.model('Contact', contactSchema);

module.exports = { Registration, Contact };
