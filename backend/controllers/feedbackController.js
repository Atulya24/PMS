const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Goal = require('../models/Goal');
const User = require('../models/User');

// Create feedback
const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, goalId, rating, comments, type } = req.body;

    // Verify goal exists
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'employee') {
      // Employees can only give self-feedback
      if (type !== 'self' || userId !== req.user.id) {
        return res.status(403).json({ message: 'Employees can only submit self-feedback' });
      }
    } else if (req.user.role === 'manager') {
      // Managers can give feedback to their team members
      if (type !== 'manager') {
        return res.status(403).json({ message: 'Managers can only submit manager feedback' });
      }
      
      // Check if the user is under this manager
      const userGoal = await Goal.findOne({ 
        _id: goalId, 
        createdBy: userId, 
        managerId: req.user.id 
      });
      
      if (!userGoal) {
        return res.status(403).json({ message: 'You can only give feedback to your team members' });
      }
    }

    // Check if feedback already exists for this combination
    const existingFeedback = await Feedback.findOne({
      userId,
      goalId,
      givenBy: req.user.id,
      type
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already exists for this goal' });
    }

    const feedback = await Feedback.create({
      userId,
      goalId,
      givenBy: req.user.id,
      rating,
      comments,
      type
    });

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('userId', 'name email')
      .populate('goalId', 'title')
      .populate('givenBy', 'name email');

    res.status(201).json(populatedFeedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get feedback for a user
const getUserFeedback = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permissions
    if (req.user.role === 'employee' && userId !== req.user.id) {
      return res.status(403).json({ message: 'Employees can only view their own feedback' });
    }

    if (req.user.role === 'manager') {
      // Managers can only view feedback for their team members
      const teamGoal = await Goal.findOne({
        createdBy: userId,
        managerId: req.user.id
      });
      
      if (!teamGoal) {
        return res.status(403).json({ message: 'You can only view feedback for your team members' });
      }
    }

    const feedback = await Feedback.find({ userId })
      .populate('userId', 'name email')
      .populate('goalId', 'title status')
      .populate('givenBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get feedback for a goal
const getGoalFeedback = async (req, res) => {
  try {
    const { goalId } = req.params;

    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && goal.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only view feedback for your own goals' });
    }

    if (req.user.role === 'manager' && goal.managerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only view feedback for goals assigned to you' });
    }

    const feedback = await Feedback.find({ goalId })
      .populate('userId', 'name email')
      .populate('givenBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending feedback for manager
const getPendingFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can view pending feedback' });
    }

    // Get active goals for this manager's team
    const activeGoals = await Goal.find({
      managerId: req.user.id,
      status: 'Active'
    }).populate('createdBy', 'name email');

    // Get feedback already given by this manager
    const givenFeedback = await Feedback.find({
      givenBy: req.user.id,
      type: 'manager'
    }).select('goalId');

    const givenGoalIds = givenFeedback.map(f => f.goalId);

    // Filter goals that don't have manager feedback yet
    const pendingGoals = activeGoals.filter(goal => 
      !givenGoalIds.includes(goal._id.toString())
    );

    res.json(pendingGoals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createFeedback,
  getUserFeedback,
  getGoalFeedback,
  getPendingFeedback
};
