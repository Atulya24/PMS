const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: [true, 'Goal ID is required']
  },
  givenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Given by is required']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Rating is required']
  },
  comments: {
    type: String,
    required: [true, 'Comments are required'],
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['self', 'manager'],
    required: [true, 'Feedback type is required']
  }
}, {
  timestamps: true
});

// Index for better query performance
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ goalId: 1 });
feedbackSchema.index({ givenBy: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
