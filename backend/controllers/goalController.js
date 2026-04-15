const { body, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { sendGoalCreatedEmail } = require('../services/emailService');

// Create goal
const createGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, managerId, deadline } = req.body;

    // Verify manager exists and is a manager
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(400).json({ message: 'Invalid manager assigned' });
    }

    const goal = await Goal.create({
      title,
      description,
      deadline: new Date(deadline),
      createdBy: req.user.id,
      managerId
    });

    // Email on creation (best-effort)
    try {
      const employee = await User.findById(req.user.id).select('name email');
      await sendGoalCreatedEmail({
        to: [employee?.email, manager?.email].filter(Boolean),
        goalTitle: title,
        goalDescription: description,
        deadline: new Date(deadline),
        createdByName: employee?.name,
        managerName: manager?.name,
      });
      goal.createdEmailSent = true;
      await goal.save();
    } catch (e) {
      console.error('Goal created email failed:', e?.message || e);
    }

    const populatedGoal = await Goal.findById(goal._id)
      .populate('createdBy', 'name email')
      .populate('managerId', 'name email');

    res.status(201).json(populatedGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Manager/Admin assigns a goal to an employee
const assignGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, employeeId, weightage, managerId, deadline } = req.body;

    // Resolve manager
    let resolvedManagerId = req.user.id;
    if (req.user.role === 'admin' && managerId) {
      resolvedManagerId = managerId;
    }

    const manager = await User.findById(resolvedManagerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(400).json({ message: 'Invalid manager assigned' });
    }

    // Resolve employee
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(400).json({ message: 'Invalid employee assigned' });
    }

    // Validate weightage
    if (weightage === undefined || weightage === null || weightage < 0 || weightage > 100) {
      return res.status(400).json({ message: 'Weightage must be between 0 and 100' });
    }

    // Check total weightage for this employee's active goals
    const existingGoals = await Goal.find({
      createdBy: employeeId,
      status: 'Active'
    });

    const totalWeightage = existingGoals.reduce((sum, g) => sum + g.weightage, 0) + Number(weightage);
    if (totalWeightage > 100) {
      return res.status(400).json({ message: 'Total weightage cannot exceed 100%' });
    }

    const goal = await Goal.create({
      title,
      description,
      status: 'Active',
      weightage: Number(weightage),
      deadline: new Date(deadline),
      createdBy: employeeId,
      managerId: resolvedManagerId
    });

    // Email on creation (best-effort)
    try {
      await sendGoalCreatedEmail({
        to: [employee?.email, manager?.email].filter(Boolean),
        goalTitle: title,
        goalDescription: description,
        deadline: new Date(deadline),
        createdByName: employee?.name,
        managerName: manager?.name,
      });
      goal.createdEmailSent = true;
      await goal.save();
    } catch (e) {
      console.error('Assigned goal email failed:', e?.message || e);
    }

    const populatedGoal = await Goal.findById(goal._id)
      .populate('createdBy', 'name email')
      .populate('managerId', 'name email');

    res.status(201).json(populatedGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete goal
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findById(id);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (req.user.role === 'admin') {
      await Goal.findByIdAndDelete(id);
      return res.json({ message: 'Goal deleted successfully' });
    }

    if (req.user.role === 'employee') {
      if (goal.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this goal' });
      }
      if (goal.status !== 'Draft') {
        return res.status(400).json({ message: 'Only Draft goals can be deleted' });
      }

      await Goal.findByIdAndDelete(id);
      return res.json({ message: 'Goal deleted successfully' });
    }

    return res.status(403).json({ message: 'Not authorized to delete goals' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get goals based on user role
const getGoals = async (req, res) => {
  try {
    let goals;

    if (req.user.role === 'admin') {
      // Admin can see all goals
      goals = await Goal.find()
        .populate('createdBy', 'name email')
        .populate('managerId', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'manager') {
      // Manager can see goals assigned to them
      goals = await Goal.find({ managerId: req.user.id })
        .populate('createdBy', 'name email')
        .populate('managerId', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Employee can see their own goals
      goals = await Goal.find({ createdBy: req.user.id })
        .populate('createdBy', 'name email')
        .populate('managerId', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json(goals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update goal
const updateGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    const goal = await Goal.findById(id);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && goal.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this goal' });
    }

    if (req.user.role === 'manager' && goal.managerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this goal' });
    }

    // Employees can:
    // - edit Draft goal details (title/description/deadline)
    // - update completionPercentage
    // - submit Draft -> Pending Approval
    if (req.user.role === 'employee') {
      const updateKeys = Object.keys(updates);

      // Check if trying to submit for approval
      if (updates.status === 'Pending Approval' && goal.status === 'Draft') {
        goal.status = 'Pending Approval';
      }

      const allowedDraftEdits = ['title', 'description', 'deadline'];
      const allowedAlways = ['completionPercentage'];

      const isDraft = goal.status === 'Draft';
      const allowedUpdates = isDraft ? [...allowedAlways, ...allowedDraftEdits] : allowedAlways;
      const isAllowed = updateKeys.every((key) => {
        if (key === 'status') return true;
        return allowedUpdates.includes(key);
      });

      if (!isAllowed) {
        return res.status(403).json({ message: 'Not authorized to update these goal fields' });
      }

      if (updates.title !== undefined && isDraft) goal.title = updates.title;
      if (updates.description !== undefined && isDraft) goal.description = updates.description;
      if (updates.deadline !== undefined && isDraft) goal.deadline = new Date(updates.deadline);
      if (updates.completionPercentage !== undefined) {
        goal.completionPercentage = updates.completionPercentage;
      }
    } else {
      // Managers/Admin can update weightage, completionPercentage and deadline (and other fields)
      if (updates.deadline !== undefined) {
        updates.deadline = new Date(updates.deadline);
      }
      Object.assign(goal, updates);
    }

    const updatedGoal = await goal.save();
    const populatedGoal = await Goal.findById(updatedGoal._id)
      .populate('createdBy', 'name email')
      .populate('managerId', 'name email');

    res.json(populatedGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve goal
const approveGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { weightage } = req.body;

    const goal = await Goal.findById(id);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check if user is the assigned manager
    if (goal.managerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only assigned manager can approve goals' });
    }

    if (goal.status !== 'Pending Approval') {
      return res.status(400).json({ message: 'Goal is not pending approval' });
    }

    // Validate weightage
    if (!weightage || weightage < 0 || weightage > 100) {
      return res.status(400).json({ message: 'Weightage must be between 0 and 100' });
    }

    // Check total weightage for this employee's active goals
    const existingGoals = await Goal.find({
      createdBy: goal.createdBy,
      status: 'Active',
      _id: { $ne: goal._id }
    });

    const totalWeightage = existingGoals.reduce((sum, g) => sum + g.weightage, 0) + weightage;
    if (totalWeightage > 100) {
      return res.status(400).json({ message: 'Total weightage cannot exceed 100%' });
    }

    goal.status = 'Active';
    goal.weightage = weightage;
    goal.rejectionReason = '';

    const updatedGoal = await goal.save();
    const populatedGoal = await Goal.findById(updatedGoal._id)
      .populate('createdBy', 'name email')
      .populate('managerId', 'name email');

    res.json(populatedGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject goal
const rejectGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const goal = await Goal.findById(id);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check if user is the assigned manager
    if (goal.managerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only assigned manager can reject goals' });
    }

    if (goal.status !== 'Pending Approval') {
      return res.status(400).json({ message: 'Goal is not pending approval' });
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    goal.status = 'Draft';
    goal.rejectionReason = rejectionReason;

    const updatedGoal = await goal.save();
    const populatedGoal = await Goal.findById(updatedGoal._id)
      .populate('createdBy', 'name email')
      .populate('managerId', 'name email');

    res.json(populatedGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createGoal,
  assignGoal,
  getGoals,
  updateGoal,
  approveGoal,
  rejectGoal,
  deleteGoal
};
