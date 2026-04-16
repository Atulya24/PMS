import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Feedback = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [goals, setGoals] = useState([]);
  const [pendingGoals, setPendingGoals] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    goalId: '',
    rating: 5,
    comments: '',
    type: 'self',
  });

  const fetchFeedback = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feedback/user/${user.id}`);
      setFeedback(response.data);
    } catch (err) {
      setError('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchPendingGoals = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feedback/pending`);
      setPendingGoals(response.data);
    } catch (err) {
      console.error('Failed to fetch pending goals:', err);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
    if (user.role === 'manager') {
      fetchPendingGoals();
    }
  }, [fetchFeedback, fetchPendingGoals, user.role]);

  const fetchGoals = async (userId) => {
    try {
      // For demo purposes, we'll fetch all goals and filter
      const response = await axios.get(`${API_BASE_URL}/goals`);
      const userGoals = response.data.filter(goal => 
        goal.createdBy?._id === userId && goal.status === 'Active'
      );
      setGoals(userGoals);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        &#9733;
      </span>
    ));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'userId' && value) {
      fetchGoals(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/feedback`, formData);
      fetchFeedback();
      setShowCreateForm(false);
      setFormData({
        userId: '',
        goalId: '',
        rating: 5,
        comments: '',
        type: 'self',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setFormData({
      userId: '',
      goalId: '',
      rating: 5,
      comments: '',
      type: 'self',
    });
  };

  if (loading) {
    return (
      <Layout title="Feedback">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Feedback">
      <div className="space-y-6">
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {user.role === 'employee' ? 'My Feedback' : 
               user.role === 'manager' ? 'Team Feedback' : 'All Feedback'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {user.role === 'employee' ? 'View your feedback history and submit self-feedback' :
               user.role === 'manager' ? 'Give feedback to your team members and view feedback history' :
               'View all feedback in the system'}
            </p>
          </div>
          
          {(user.role === 'employee' || user.role === 'manager') && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              {user.role === 'employee' ? 'Submit Self-Feedback' : 'Give Feedback'}
            </button>
          )}
        </div>

        {/* Manager: Pending Feedback */}
        {user.role === 'manager' && pendingGoals.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Feedback</h3>
            <div className="space-y-3">
              {pendingGoals.map((goal) => (
                <div key={goal._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600">
                        Employee: {goal.createdBy?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({
                          userId: goal.createdBy._id,
                          goalId: goal._id,
                          rating: 5,
                          comments: '',
                          type: 'manager',
                        });
                        fetchGoals(goal.createdBy._id);
                        setShowCreateForm(true);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Give Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Feedback Form */}
        {showCreateForm && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {user.role === 'employee' ? 'Submit Self-Feedback' : 'Give Feedback'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user.role === 'manager' && (
                <div>
                  <label htmlFor="userId" className="form-label">
                    Team Member *
                  </label>
                  <select
                    id="userId"
                    name="userId"
                    required
                    className="form-input"
                    value={formData.userId}
                    onChange={handleChange}
                  >
                    <option value="">Select a team member</option>
                    {pendingGoals.map((goal) => (
                      <option key={goal.createdBy._id} value={goal.createdBy._id}>
                        {goal.createdBy.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="goalId" className="form-label">
                  Goal *
                </label>
                <select
                  id="goalId"
                  name="goalId"
                  required
                  className="form-input"
                  value={formData.goalId}
                  onChange={handleChange}
                  disabled={!formData.userId && user.role === 'manager'}
                >
                  <option value="">Select a goal</option>
                  {goals.map((goal) => (
                    <option key={goal._id} value={goal._id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rating" className="form-label">
                  Rating *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    id="rating"
                    name="rating"
                    min="1"
                    max="5"
                    className="flex-1"
                    value={formData.rating}
                    onChange={handleChange}
                  />
                  <div className="flex items-center space-x-1">
                    {getRatingStars(formData.rating)}
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      ({formData.rating}/5)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="comments" className="form-label">
                  Comments *
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  required
                  rows={4}
                  className="form-input"
                  value={formData.comments}
                  onChange={handleChange}
                  placeholder={
                    user.role === 'employee' 
                      ? 'Describe your progress and achievements...'
                      : 'Provide constructive feedback on performance...'
                  }
                />
              </div>

              <input
                type="hidden"
                name="type"
                value={formData.type}
              />

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feedback History */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback History</h3>
          
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No feedback found. {user.role === 'employee' && 'Submit your first self-feedback!'}
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {item.goalId?.title || 'Goal'}
                        </h4>
                        <span className={`status-badge ${
                          item.type === 'self' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type === 'self' ? 'Self Feedback' : 'Manager Feedback'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-1">
                          {getRatingStars(item.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          by {item.givenBy?.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {item.comments}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Feedback;
