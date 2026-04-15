const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { startDeadlineReminderJob } = require('./jobs/deadlineReminderJob');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes (useful for Render / uptime checks)
app.get('/', (req, res) => {
  res.status(200).send('PMS Backend is running. Use /api/* endpoints.');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  try {
    startDeadlineReminderJob();
  } catch (e) {
    console.error('Failed to start deadline reminder job:', e?.message || e);
  }
});
