import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    employeeId: '',
    managerId: '',
    deadline: '',
    completionPercentage: 0,
    weightage: 0,
  });

  useEffect(() => {
    fetchGoals();
    if (user.role === 'employee') {
      fetchManagers();
    }
    if (user.role === 'manager' || user.role === 'admin') {
      fetchEmployees();
    }
    if (user.role === 'admin') {
      fetchManagers();
    }
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/goals');
      setGoals(response.data);
    } catch (err) {
      setError('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/users/managers');
      setManagers(response.data);
    } catch (err) {
      console.error('Failed to fetch managers:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/users/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return 'status-draft';
      case 'Pending Approval':
        return 'status-pending';
      case 'Active':
        return 'status-active';
      case 'Completed':
        return 'status-completed';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingGoal) {
        await axios.put(`http://localhost:5001/api/goals/${editingGoal._id}`, formData);
      } else {
        if (user.role === 'employee') {
          await axios.post('http://localhost:5001/api/goals', {
            title: formData.title,
            description: formData.description,
            managerId: formData.managerId,
            deadline: formData.deadline,
          });
        } else {
          await axios.post('http://localhost:5001/api/goals/assign', {
            title: formData.title,
            description: formData.description,
            employeeId: formData.employeeId,
            weightage: Number(formData.weightage),
            managerId: user.role === 'admin' ? formData.managerId : undefined,
            deadline: formData.deadline,
          });
        }
      }

      fetchGoals();
      setShowCreateForm(false);
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        employeeId: '',
        managerId: '',
        deadline: '',
        completionPercentage: 0,
        weightage: 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      employeeId: goal.createdBy?._id || goal.createdBy,
      managerId: goal.managerId?._id || goal.managerId,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : '',
      completionPercentage: goal.completionPercentage,
      weightage: goal.weightage,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (goalId) => {
    if (!window['confirm']('Are you sure you want to delete this goal?')) return;

    try {
      await axios.delete(`http://localhost:5001/api/goals/${goalId}`);
      fetchGoals();
    } catch (err) {
      setError('Failed to delete goal');
    }
  };

  const handleApprove = async (goalId) => {
    const weightage = window['prompt']('Enter weightage (0-100):');
    if (!weightage || isNaN(weightage)) return;

    try {
      await axios.put(`http://localhost:5001/api/goals/${goalId}/approve`, {
        weightage: parseInt(weightage),
      });
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve goal');
    }
  };

  const handleReject = async (goalId) => {
    const reason = window['prompt']('Enter rejection reason:');
    if (!reason) return;

    try {
      await axios.put(`http://localhost:5001/api/goals/${goalId}/reject`, {
        rejectionReason: reason,
      });
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject goal');
    }
  };

  const handleSubmitForApproval = async (goalId) => {
    try {
      await axios.put(`http://localhost:5001/api/goals/${goalId}`, {
        status: 'Pending Approval',
      });
      fetchGoals();
    } catch (err) {
      setError('Failed to submit goal for approval');
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingGoal(null);
    setFormData({
      title: '',
      description: '',
      employeeId: '',
      managerId: '',
      deadline: '',
      completionPercentage: 0,
      weightage: 0,
    });
  };

  if (loading) {
    return (
      <Layout title="Goals">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Goals">
      <div className="space-y-6">
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter by status:</span>
              <select className="form-input text-sm">
                <option value="">All</option>
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          
          {(user.role === 'employee' || user.role === 'manager' || user.role === 'admin') && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              {user.role === 'employee' ? 'Create New Goal' : 'Assign Goal'}
            </button>
          )}
        </div>

        {/* Create/Edit Goal Form */}
        {showCreateForm && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingGoal
                ? 'Edit Goal'
                : user.role === 'employee'
                  ? 'Create New Goal'
                  : 'Assign Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="form-label">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="form-input"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
                
                {user.role === 'employee' && !editingGoal && (
                  <div>
                    <label htmlFor="managerId" className="form-label">
                      Assign Manager *
                    </label>
                    <select
                      id="managerId"
                      name="managerId"
                      required
                      className="form-input"
                      value={formData.managerId}
                      onChange={handleChange}
                    >
                      <option value="">Select a manager</option>
                      {managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(user.role === 'manager' || user.role === 'admin') && !editingGoal && (
                  <div>
                    <label htmlFor="employeeId" className="form-label">
                      Assign Employee *
                    </label>
                    <select
                      id="employeeId"
                      name="employeeId"
                      required
                      className="form-input"
                      value={formData.employeeId}
                      onChange={handleChange}
                    >
                      <option value="">Select an employee</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {user.role === 'admin' && !editingGoal && (
                  <div>
                    <label htmlFor="managerId" className="form-label">
                      Assign Manager *
                    </label>
                    <select
                      id="managerId"
                      name="managerId"
                      required
                      className="form-input"
                      value={formData.managerId}
                      onChange={handleChange}
                    >
                      <option value="">Select a manager</option>
                      {managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deadline" className="form-label">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    required
                    className="form-input"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="form-label">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  className="form-input"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.role === 'manager' || user.role === 'admin') && !editingGoal && (
                  <div>
                    <label htmlFor="weightage" className="form-label">
                      Weightage (%) *
                    </label>
                    <input
                      type="number"
                      id="weightage"
                      name="weightage"
                      min="0"
                      max="100"
                      required
                      className="form-input"
                      value={formData.weightage}
                      onChange={handleChange}
                    />
                  </div>
                )}

                {(user.role === 'manager' || user.role === 'admin') && editingGoal && (
                  <div>
                    <label htmlFor="weightage" className="form-label">
                      Weightage (%)
                    </label>
                    <input
                      type="number"
                      id="weightage"
                      name="weightage"
                      min="0"
                      max="100"
                      className="form-input"
                      value={formData.weightage}
                      onChange={handleChange}
                    />
                  </div>
                )}
                
                {editingGoal && (
                  <div>
                    <label htmlFor="completionPercentage" className="form-label">
                      Completion Percentage (%)
                    </label>
                    <input
                      type="number"
                      id="completionPercentage"
                      name="completionPercentage"
                      min="0"
                      max="100"
                      className="form-input"
                      value={formData.completionPercentage}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGoal
                    ? 'Update Goal'
                    : user.role === 'employee'
                      ? 'Create Goal'
                      : 'Assign Goal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {user.role === 'admin' ? 'All Goals' : 
             user.role === 'manager' ? 'Team Goals' : 'My Goals'}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goal
                  </th>
                  {user.role !== 'employee' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                  )}
                  {user.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weightage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {goals.map((goal) => (
                  <tr key={goal._id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {goal.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {goal.description}
                        </div>
                        {goal.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1">
                            Rejected: {goal.rejectionReason}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {user.role !== 'employee' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {goal.createdBy?.name}
                      </td>
                    )}
                    
                    {user.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {goal.managerId?.name}
                      </td>
                    )}
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${getStatusColor(goal.status)}`}>
                        {goal.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${goal.completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{goal.completionPercentage}%</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {goal.weightage > 0 ? `${goal.weightage}%` : '-'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.role === 'employee' && goal.status === 'Draft' && (
                          <button
                            onClick={() => handleEdit(goal)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </button>
                        )}

                        {(user.role === 'employee' && goal.status === 'Draft') && (
                          <button
                            onClick={() => handleDelete(goal._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}

                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(goal._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                        
                        {user.role === 'employee' && goal.status === 'Draft' && (
                          <button
                            onClick={() => handleSubmitForApproval(goal._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Submit
                          </button>
                        )}
                        
                        {user.role === 'manager' && goal.status === 'Pending Approval' && (
                          <>
                            <button
                              onClick={() => handleApprove(goal._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(goal._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {(user.role === 'manager' || user.role === 'admin') && goal.status === 'Active' && (
                          <button
                            onClick={() => handleEdit(goal)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {goals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No goals found. {user.role === 'employee' && 'Create your first goal!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Goals;
