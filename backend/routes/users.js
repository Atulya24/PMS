const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getManagers, getEmployees, getUsers, getDashboardStats } = require('../controllers/userController');

const router = express.Router();

router.get('/managers', auth, getManagers);
router.get('/employees', auth, getEmployees);

// Admin-only
router.get('/', auth, authorize('admin'), getUsers);
router.get('/dashboard/stats', auth, authorize('admin'), getDashboardStats);

module.exports = router;
