const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  createGoal,
  assignGoal,
  getGoals,
  updateGoal,
  approveGoal,
  rejectGoal,
  deleteGoal
} = require('../controllers/goalController');

const router = express.Router();

// Create goal validation
const createGoalValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('managerId').isMongoId().withMessage('Valid manager ID is required'),
  body('deadline').isISO8601().withMessage('Valid deadline date is required')
];

const assignGoalValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('weightage').isInt({ min: 0, max: 100 }).withMessage('Weightage must be between 0 and 100'),
  body('managerId').optional().isMongoId().withMessage('Valid manager ID is required'),
  body('deadline').isISO8601().withMessage('Valid deadline date is required')
];

// Update goal validation
const updateGoalValidation = [
  body('completionPercentage').optional().isInt({ min: 0, max: 100 }).withMessage('Completion percentage must be between 0 and 100'),
  body('weightage').optional().isInt({ min: 0, max: 100 }).withMessage('Weightage must be between 0 and 100'),
  body('deadline').optional().isISO8601().withMessage('Valid deadline date is required')
];

// Approve goal validation
const approveGoalValidation = [
  body('weightage').isInt({ min: 0, max: 100 }).withMessage('Weightage must be between 0 and 100')
];

// Reject goal validation
const rejectGoalValidation = [
  body('rejectionReason').trim().notEmpty().withMessage('Rejection reason is required')
];

// Routes
router.post('/', auth, authorize('employee'), createGoalValidation, createGoal);
router.post('/assign', auth, authorize('manager', 'admin'), assignGoalValidation, assignGoal);
router.get('/', auth, getGoals);
router.put('/:id', auth, updateGoalValidation, updateGoal);
router.put('/:id/approve', auth, authorize('manager'), approveGoalValidation, approveGoal);
router.put('/:id/reject', auth, authorize('manager'), rejectGoalValidation, rejectGoal);
router.delete('/:id', auth, deleteGoal);

module.exports = router;
