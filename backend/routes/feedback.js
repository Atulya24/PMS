const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  createFeedback,
  getUserFeedback,
  getGoalFeedback,
  getPendingFeedback
} = require('../controllers/feedbackController');

const router = express.Router();

// Create feedback validation
const createFeedbackValidation = [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('goalId').isMongoId().withMessage('Valid goal ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments').trim().notEmpty().withMessage('Comments are required'),
  body('type').isIn(['self', 'manager']).withMessage('Type must be self or manager')
];

// Routes
router.post('/', auth, createFeedbackValidation, createFeedback);
router.get('/user/:userId', auth, getUserFeedback);
router.get('/goal/:goalId', auth, getGoalFeedback);
router.get('/pending', auth, authorize('manager'), getPendingFeedback);

module.exports = router;
