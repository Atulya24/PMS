const User = require('../models/User');
const Goal = require('../models/Goal');

// Get all managers (auth required)
const getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager' })
      .select('_id name email')
      .sort({ name: 1 });

    res.json(managers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all employees (auth required)
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('_id name email')
      .sort({ name: 1 });

    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard stats (admin only)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGoals = await Goal.countDocuments();
    
    const goalsByStatus = await Goal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const pendingApprovals = await Goal.countDocuments({ 
      status: 'Pending Approval' 
    });

    res.json({
      totalUsers,
      totalGoals,
      pendingApprovals,
      goalsByStatus: goalsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getManagers,
  getEmployees,
  getUsers,
  getDashboardStats
};
