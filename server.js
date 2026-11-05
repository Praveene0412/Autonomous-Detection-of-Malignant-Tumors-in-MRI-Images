// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { execFile } = require('child_process');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
  secret: 'brainTumorSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// MongoDB setup
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brain_tumor_app';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, sparse: true },
  phone: { type: String, sparse: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
userSchema.index({ email: 1, phone: 1 }, {
  unique: true,
  partialFilterExpression: {
    $or: [
      { email: { $exists: true, $ne: null } },
      { phone: { $exists: true, $ne: null } }
    ]
  }
});
const User = mongoose.model('User', userSchema);

const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filename: String,
  originalName: String,
  analysisResult: Object,
  createdAt: { type: Date, default: Date.now }
});
const Analysis = mongoose.model('Analysis', analysisSchema);

// Initialize admin user
async function initializeAdmin() {
  try {
    const adminEmail = 'adminbt2025@gmail.com';
    const adminPhone = '9036948454';
    const adminExists = await User.findOne({
      $or: [{ email: adminEmail }, { phone: adminPhone }]
    });

    if (!adminExists) {
      const hashed = await bcrypt.hash('PPSU1234', 10);
      const adminUser = new User({
        email: adminEmail,
        phone: adminPhone,
        password: hashed
      });
      await adminUser.save();
      console.log('👑 Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}
initializeAdmin();

// Helpers
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
}
function isValidPhone(phone) {
  const phoneRegex = /^\d{10}$/;
  return typeof phone === 'string' && phoneRegex.test(phone.trim().replace(/[\s\-]/g, ''));
}
function getLoginType(identifier) {
  if (!identifier) return null;
  if (isValidEmail(identifier)) return 'email';
  if (isValidPhone(identifier)) return 'phone';
  return null;
}

// Middleware: require admin
function requireAdmin(req, res, next) {
  if (req.session?.user?.isAdmin) next();
  else res.status(403).json({ success: false, message: 'Access denied: Admins only.' });
}

// ---------------- AUTH ROUTES ----------------

// Register
app.post('/register', async (req, res) => {
  try {
    const { identifier, password, confirmPassword } = req.body;
    if (!identifier || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: 'All fields required' });

    if (password !== confirmPassword)
      return res.json({ success: false, message: 'Passwords do not match' });

    if (password.length < 6)
      return res.json({ success: false, message: 'Password too short (min 6 chars)' });

    const loginType = getLoginType(identifier);
    if (!loginType)
      return res.json({ success: false, message: 'Invalid email or phone format' });

    const cleanIdentifier = identifier.trim().replace(/[\s\-]/g, '');
    const exists = await User.findOne({ [loginType]: cleanIdentifier });
    if (exists) return res.json({ success: false, message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ [loginType]: cleanIdentifier, password: hashed });
    await user.save();

    res.json({ success: true, message: 'Registration successful!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ success: false, message: 'Email/Phone and password required' });

    const loginType = getLoginType(identifier);
    if (!loginType) return res.json({ success: false, message: 'Invalid login format' });

    const cleanIdentifier = identifier.trim().replace(/[\s\-]/g, '');
    const user = await User.findOne({ [loginType]: cleanIdentifier });
    if (!user) return res.json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: 'Invalid password' });

    const isAdmin = (cleanIdentifier === 'adminbt2025@gmail.com' || cleanIdentifier === '9036948454');

    req.session.user = { 
      identifier: cleanIdentifier, 
      isAdmin,
      userId: user._id.toString()
    };
    
    res.json({ success: true, message: 'Login successful', isAdmin });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// WhoAmI
app.get('/whoami', (req, res) => {
  res.json(req.session.user || { isAdmin: false });
});

// Forgot Password - Send reset instructions
app.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier)
      return res.status(400).json({ success: false, message: 'Email or phone required' });

    const loginType = getLoginType(identifier);
    if (!loginType)
      return res.json({ success: false, message: 'Invalid email or phone format' });

    const cleanIdentifier = identifier.trim().replace(/[\s\-]/g, '');
    const user = await User.findOne({ [loginType]: cleanIdentifier });
    
    if (!user) {
      // For security, don't reveal if user exists or not
      return res.json({ 
        success: true, 
        message: 'If an account exists with this credential, reset instructions have been sent.' 
      });
    }

    // In a real app, you'd send an email/SMS here
    // For now, we'll just return success
    res.json({ 
      success: true, 
      message: 'Password reset instructions have been sent to your registered contact.' 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---------------- ANALYSIS ROUTES ----------------

// Analyze image
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });

    const savedPath = req.file.path;
    const originalName = req.file.originalname;
    const modelPath = path.join(__dirname, 'python', 'BrainTumor_Model.keras');

    const pythonExecutable = process.env.PYTHON_CMD || 'python';
    const predictScript = path.join(__dirname, 'predict.py');

    console.log(`🧠 Running prediction:
  Python: ${pythonExecutable}
  Script: ${predictScript}
  Model: ${modelPath}
  Image: ${savedPath}`);

    execFile(pythonExecutable, [predictScript, savedPath, modelPath], { maxBuffer: 1024 * 1024 * 10 },
      async (error, stdout, stderr) => {
        if (error) {
          console.error('Prediction script error:', error);
          console.error('stderr:', stderr.toString());
          return res.status(500).json({ success: false, message: 'Error running prediction script' });
        }

        let prediction;
        try {
          prediction = JSON.parse(stdout);
        } catch (err) {
          console.error('Prediction output parse error:', err);
          console.error('Raw stdout:', stdout);
          return res.status(500).json({ success: false, message: 'Invalid prediction output' });
        }

        const analysisResult = {
          filename: path.basename(savedPath),
          originalName,
          tumorDetected: prediction.tumorDetected,
          confidence: prediction.confidence,
          message: prediction.message || 'Prediction complete'
        };

        const analysis = new Analysis({ 
          userId: req.session.user?.userId,
          filename: analysisResult.filename, 
          originalName, 
          analysisResult 
        });
        await analysis.save();

        res.json({ success: true, message: 'Image analysis complete!', result: analysisResult });
      }
    );
  } catch (err) {
    console.error('Image processing error:', err);
    res.status(500).json({ success: false, message: 'Error processing image' });
  }
});

// Admin-only: fetch analysis history
app.get('/analysis-history', requireAdmin, async (req, res) => {
  try {
    const analyses = await Analysis.find().sort({ createdAt: -1 });
    res.json({ success: true, analyses });
  } catch (err) {
    console.error('Error fetching analyses:', err);
    res.status(500).json({ success: false, message: 'Error fetching analyses' });
  }
});

// Admin-only: clear history
app.delete('/clear-history', requireAdmin, async (req, res) => {
  try {
    await Analysis.deleteMany({});
    res.json({ success: true, message: 'All analysis history cleared.' });
  } catch (err) {
    console.error('Error clearing history:', err);
    res.status(500).json({ success: false, message: 'Error clearing history.' });
  }
});

// Admin-only: list users (for admin panel)
app.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users, count: users.length });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Brain Tumor Detection app running at http://localhost:${PORT}`));