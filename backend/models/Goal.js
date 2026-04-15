const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Goal description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Active', 'Completed'],
    default: 'Draft'
  },
  weightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  deadline: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Manager ID is required']
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  createdEmailSent: {
    type: Boolean,
    default: false
  },
  deadlineReminderEmailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
goalSchema.index({ createdBy: 1, status: 1 });
goalSchema.index({ managerId: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
