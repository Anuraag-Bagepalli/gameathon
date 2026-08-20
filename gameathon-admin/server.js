import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import 'dotenv/config';

// ES6 module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

// MongoDB Connection String (embedded directly)
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI is required');

// Email Configuration - UPDATE THESE WITH YOUR DETAILS
const EMAIL_CONFIG = {
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
};

// WhatsApp Group Link - UPDATE THIS WITH YOUR GROUP LINK
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/your-group-invite-link';

// Event/Competition Details - UPDATE THESE
const EVENT_CONFIG = {
  eventName: 'Gameathon 8.0',
  organizerName: 'Gameathon Team',
  organizerEmail: '',
  eventDate: 'Coming soon · 2026',
  venue: 'Jyothy Institute of Technology, Thataguni, Bengaluru'
};

// Create email transporter
const transporter = nodemailer.createTransport({

  service: EMAIL_CONFIG.service,
  auth: EMAIL_CONFIG.auth
});

// Verify email connection
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, '..', 'gameathon', 'backend', 'uploads')));

// MongoDB Schema
const registrationSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  teamLeader: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: String,
    required: true,
    trim: true
  },
  participationType: {
    type: String,
    required: true,
    trim: true
  },
  trainingOption: {
    type: String,
    required: true,
    trim: true
  },
  memberCount: {
    type: String,
    required: true
  },
  teamMembers: [{
    type: String,
    trim: true
  }],
  utrNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  paymentScreenshot: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    enum: ['Indian', 'Foreign'],
    default: 'Indian'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: {
    type: Date
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
registrationSchema.index({ email: 1 });
registrationSchema.index({ utrNumber: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ registrationDate: -1 });

// Pre-save middleware
registrationSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

const Registration = mongoose.model('Registration', registrationSchema);

// Email Templates
function getAcceptanceEmailTemplate(application) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Congratulations - Application Accepted!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; margin: 20px 0; }
            .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details h3 { margin-top: 0; color: #1e293b; }
            .detail-item { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-item:last-child { border-bottom: none; }
            .detail-label { font-weight: bold; color: #475569; }
            .whatsapp-section { background: #dcfce7; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .whatsapp-button { display: inline-block; background: #25d366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 10px 0; transition: background 0.3s; }
            .whatsapp-button:hover { background: #128c7e; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            .celebrate { font-size: 48px; text-align: center; margin: 20px 0; }
            @media (max-width: 600px) { .container { margin: 10px; } .content { padding: 20px; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Congratulations! 🎉</h1>
                <p>Your application has been accepted!</p>
            </div>
            
            <div class="content">
                <div class="celebrate">🎊🎈✨🎊</div>
                
                <div class="success-badge">✅ APPLICATION APPROVED</div>
                
                <p>Dear <strong>${application.teamLeader}</strong>,</p>
                
                <p>We are thrilled to inform you that your team "<strong>${application.teamName}</strong>" has been <strong>successfully selected</strong> for the <strong>${EVENT_CONFIG.eventName}</strong>!</p>
                
                <p>After reviewing your registration, we're excited to have your team join this global game-building contest.</p>
                
                <div class="details">
                    <h3>📋 Your Registration Details</h3>
                    <div class="detail-item">
                        <span class="detail-label">Team Name:</span> ${application.teamName}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Team Leader:</span> ${application.teamLeader}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span> ${application.email}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">College:</span> ${application.college}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Team Members:</span> ${application.memberCount}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Registration Date:</span> ${new Date(application.registrationDate).toLocaleDateString('en-IN')}
                    </div>
                </div>

                <div class="details">
                    <h3>🎯 Event Information</h3>
                    <div class="detail-item">
                        <span class="detail-label">Event:</span> ${EVENT_CONFIG.eventName}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date:</span> ${EVENT_CONFIG.eventDate}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Venue:</span> ${EVENT_CONFIG.venue}
                    </div>
                </div>
                
                <div class="whatsapp-section">
                    <h3>📱 Join Our WhatsApp Group</h3>
                    <p>Stay connected with updates, announcements, and connect with other participants by joining our official WhatsApp group:</p>
                    
                    <a href="${WHATSAPP_GROUP_LINK}" class="whatsapp-button" target="_blank">
                        📱 Join WhatsApp Group
                    </a>
                    
                    <p><small>Or copy this link: <a href="${WHATSAPP_GROUP_LINK}" target="_blank">${WHATSAPP_GROUP_LINK}</a></small></p>
                </div>

                <div class="details">
                    <h3>📝 Next Steps</h3>
                    <ol>
                        <li><strong>Join the WhatsApp group</strong> immediately for important updates</li>
                        <li><strong>Save the event date</strong> in your calendar</li>
                        <li><strong>Prepare your team</strong> and review event guidelines</li>
                        <li><strong>Bring required documents</strong> on the event day</li>
                        <li><strong>Arrive 30 minutes early</strong> for check-in</li>
                    </ol>
                </div>
                
                <p>We're looking forward to seeing your team's amazing performance at the ${EVENT_CONFIG.eventName}!</p>
                
                <p>Questions? Contact Prof. Jayanth K (+91 9731937147), Sathvik Vasishta (+91 9606018932), or Priyanka T S (+91 7349710985).</p>
                
                <p><strong>Best wishes and congratulations once again!</strong></p>
                
                <p>Warm regards,<br>
                <strong>${EVENT_CONFIG.organizerName}</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated confirmation email for ${EVENT_CONFIG.eventName}</p>
                <p>Please do not reply to this email. For support, contact us via WhatsApp group.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function getRejectionEmailTemplate(application) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status - ${EVENT_CONFIG.eventName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details h3 { margin-top: 0; color: #1e293b; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Application Update</h1>
            </div>
            
            <div class="content">
                <h2>Dear ${application.teamLeader},</h2>
                <p>Thank you for your interest in <strong>${EVENT_CONFIG.eventName}</strong>.</p>
                <p>We have carefully reviewed your application for team <strong>${application.teamName}</strong>. Unfortunately, we are unable to accept your registration at this time. This is typically due to duplicate UTR entries, an invalid payment screenshot, or capacity constraints.</p>
                
                <p>If you believe this is an error regarding your payment verification, please contact the organizing team immediately.</p>
                
                <p>We appreciate your interest and hope to see you at future events.</p>
                <p>Best regards,<br><strong>The ${EVENT_CONFIG.organizerName}</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply directly to this email.</p>
                <p>&copy; ${new Date().getFullYear()} ${EVENT_CONFIG.eventName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Function to send emails
async function sendStatusEmail(application, status) {
  try {
    const isApproved = status === 'approved';
    const mailOptions = {
      from: {
        name: EVENT_CONFIG.organizerName,
        address: EMAIL_CONFIG.auth.user
      },
      to: application.email,
      subject: isApproved 
        ? `🎉 Congratulations! Your application for ${EVENT_CONFIG.eventName} has been accepted!` 
        : `Update on your application for ${EVENT_CONFIG.eventName}`,
      html: isApproved ? getAcceptanceEmailTemplate(application) : getRejectionEmailTemplate(application),
      attachments: []
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ ${status} email sent to ${application.email}`);
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      recipient: application.email
    };
  } catch (error) {
    console.error(`❌ Error sending ${status} email:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// MongoDB Connection
async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Connect to database
connectDB();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== API ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    email: 'Configured',
    whatsappGroup: WHATSAPP_GROUP_LINK ? 'Configured' : 'Not Set'
  });
});

// Register new application
app.post('/api/register', async (req, res) => {
  try {
    const data = req.body;
    
    // Parse teamMembers if it's sent as a JSON string (for backwards compatibility if FormData is still used)
    if (typeof data.teamMembers === 'string') {
      try { data.teamMembers = JSON.parse(data.teamMembers); } catch(e) {}
    }

    // Convert UTR to uppercase if provided
    if (data.utrNumber) {
      data.utrNumber = data.utrNumber.toUpperCase();
    }

    // Check UTR uniqueness if Indian
    if (data.nationality === 'Indian' && data.utrNumber) {
      const existing = await Registration.findOne({ utrNumber: data.utrNumber });
      if (existing) {
        return res.status(400).json({ message: 'UTR number already exists. Please verify your payment details.' });
      }
    } else if (data.nationality === 'Foreign') {
      // Force UTR to be empty or a marker for foreign nationals
      data.utrNumber = 'FOREIGN-N/A';
    }

    const registration = new Registration(data);
    await registration.save();

    console.log(`✅ New Registration: ${registration.teamName} (${registration.nationality})`);
    res.status(201).json({ message: 'Registration successful', registration });
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ 
      message: 'Failed to submit registration',
      error: error.message 
    });
  }
});

// Get all applications
app.get('/api/applications', async (req, res) => {
  try {
    const applications = await Registration.find({})
      .sort({ registrationDate: -1 })
      .lean();
    
    console.log(`📋 Found ${applications.length} applications`);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      message: 'Failed to fetch applications',
      error: error.message 
    });
  }
});

// Get application by ID
app.get('/api/applications/:id', async (req, res) => {
  try {
    const application = await Registration.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      message: 'Failed to fetch application',
      error: error.message 
    });
  }
});

// Check UTR uniqueness
app.post('/api/applications/check-utr', async (req, res) => {
  try {
    const { utrNumber, excludeId } = req.body;
    
    if (!utrNumber) {
      return res.status(400).json({ 
        message: 'UTR number is required',
        isUnique: false 
      });
    }

    const query = { utrNumber: utrNumber.toUpperCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingApplications = await Registration.find({ 
      utrNumber: utrNumber.toUpperCase() 
    });
    
    const isUnique = excludeId 
      ? existingApplications.filter(app => app._id.toString() !== excludeId).length === 0
      : existingApplications.length === 0;
    
    const count = existingApplications.length;

    console.log(`🔍 UTR Check: ${utrNumber} - Unique: ${isUnique}, Count: ${count}`);
    
    res.json({ 
      isUnique,
      count,
      status: isUnique ? 'unique' : 'duplicate'
    });
  } catch (error) {
    console.error('Error checking UTR:', error);
    res.status(500).json({ 
      message: 'Failed to check UTR uniqueness',
      error: error.message,
      isUnique: false 
    });
  }
});

// Update application status (ENHANCED WITH EMAIL)
app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Registration.findByIdAndUpdate(
      req.params.id,
      { status, lastModified: new Date() },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log(`✅ Status Updated: ${application.teamName} - ${status}`);
    
    // Send email if application is approved or rejected
    if ((status === 'approved' || status === 'rejected') && !application.emailSent) {
      console.log(`📧 Sending ${status} email to ${application.email}...`);
      
      const emailResult = await sendStatusEmail(application, status);
      
      if (emailResult.success) {
        // Update application to mark email as sent
        application.emailSent = true;
        application.emailSentDate = new Date();
        await application.save();
        
        console.log(`✅ Email sent successfully to ${application.email}`);
        
        res.json({
          ...application.toObject(),
          emailStatus: 'sent',
          emailDetails: emailResult
        });
      } else {
        console.log(`❌ Failed to send email to ${application.email}: ${emailResult.error}`);
        
        res.json({
          ...application.toObject(),
          emailStatus: 'failed',
          emailError: emailResult.error
        });
      }
    } else {
      res.json(application);
    }
    
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ 
      message: 'Failed to update application status',
      error: error.message 
    });
  }
});

// Resend acceptance email (new endpoint)
app.post('/api/applications/:id/resend-email', async (req, res) => {
  try {
    const application = await Registration.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    if (application.status !== 'approved') {
      return res.status(400).json({ message: 'Can only send emails to approved applications' });
    }
    
    console.log(`📧 Resending acceptance email to ${application.email}...`);
    
    const emailResult = await sendAcceptanceEmail(application);
    
    if (emailResult.success) {
      application.emailSent = true;
      application.emailSentDate = new Date();
      await application.save();
      
      res.json({
        success: true,
        message: 'Email sent successfully',
        emailDetails: emailResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: emailResult.error
      });
    }
    
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({ 
      message: 'Failed to resend email',
      error: error.message 
    });
  }
});

// Update entire application
app.put('/api/applications/:id', async (req, res) => {
  try {
    const updateData = { 
      ...req.body, 
      lastModified: new Date() 
    };
    
    // Convert UTR to uppercase if provided
    if (updateData.utrNumber) {
      updateData.utrNumber = updateData.utrNumber.toUpperCase();
    }

    const application = await Registration.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log(`📝 Application Updated: ${application.teamName}`);
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ 
      message: 'Failed to update application',
      error: error.message 
    });
  }
});

// Delete application
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const application = await Registration.findByIdAndDelete(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log(`🗑️ Application Deleted: ${application.teamName}`);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ 
      message: 'Failed to delete application',
      error: error.message 
    });
  }
});

// Get statistics
app.get('/api/stats/overview', async (req, res) => {
  try {
    const stats = await Registration.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { 
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
          },
          approved: { 
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } 
          },
          rejected: { 
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } 
          },
          emailsSent: { 
            $sum: { $cond: ['$emailSent', 1, 0] } 
          }
        }
      }
    ]);

    res.json(stats[0] || { total: 0, pending: 0, approved: 0, rejected: 0, emailsSent: 0 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      error: error.message 
    });
  }
});

// ==================== FRONTEND ROUTES ====================

// Serve main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,  'index.html'));
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
  // If it's an API route that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Otherwise serve the main HTML file
  res.sendFile(path.join(__dirname,  'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
🔗 Admin Dashboard: http://localhost:${PORT}
📡 API Health Check: http://localhost:${PORT}/health
📊 Applications API: http://localhost:${PORT}/api/applications
💾 Database: Gameathon registrations (MongoDB Atlas)
📧 Email Service: ${EMAIL_CONFIG.service} (${EMAIL_CONFIG.auth.user})
📱 WhatsApp Group: ${WHATSAPP_GROUP_LINK ? 'Configured' : 'Not Set'}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
