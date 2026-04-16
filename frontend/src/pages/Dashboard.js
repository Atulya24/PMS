import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      if (user.role === 'admin') {
        const [statsRes, goalsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/users/dashboard/stats`),
          axios.get(`${API_BASE_URL}/goals`),
        ]);
        setData({
          ...statsRes.data,
          goals: goalsRes.data,
        });
      } else {
        const response = await axios.get(`${API_BASE_URL}/goals`);
        setData(response.data);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }

  }, [user.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const getDeadlineBucket = (deadline) => {
    if (!deadline) return 'none';
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return 'none';

    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (d < now) return 'overdue';
    if (d <= endOfToday) return 'today';
    if (d <= in24h) return 'tomorrow';
    if (d <= in7d) return 'week';
    return 'later';
  };

  const getDeadlineBadge = (deadline) => {
    const bucket = getDeadlineBucket(deadline);
    switch (bucket) {
      case 'overdue':
        return 'bg-danger-100 text-danger-800';
      case 'today':
        return 'bg-warning-100 text-warning-800';
      case 'tomorrow':
        return 'bg-warning-100 text-warning-800';
      case 'week':
        return 'bg-primary-100 text-primary-800';
      case 'later':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeadlineLabel = (deadline) => {
    const bucket = getDeadlineBucket(deadline);
    switch (bucket) {
      case 'overdue':
        return 'Overdue';
      case 'today':
        return 'Due Today';
      case 'tomorrow':
        return 'Due Tomorrow';
      case 'week':
        return 'Due This Week';
      case 'later':
        return 'Upcoming';
      default:
        return 'No deadline';
    }
  };

  const getUpcomingDeadlines = (goals, limit = 5) => {
    const normalized = (goals || [])
      .filter((g) => g?.deadline)
      .map((g) => ({
        ...g,
        _deadlineTime: new Date(g.deadline).getTime(),
      }))
      .filter((g) => !Number.isNaN(g._deadlineTime));

    return normalized
      .sort((a, b) => a._deadlineTime - b._deadlineTime)
      .slice(0, limit);
  };

  const summarizeGoals = (goals) => {
    const list = goals || [];
    const total = list.length;
    const byStatus = {
      Draft: list.filter((g) => g.status === 'Draft').length,
      'Pending Approval': list.filter((g) => g.status === 'Pending Approval').length,
      Active: list.filter((g) => g.status === 'Active').length,
      Completed: list.filter((g) => g.status === 'Completed').length,
    };

    const avgProgress = total === 0
      ? 0
      : Math.round(list.reduce((sum, g) => sum + (Number(g.completionPercentage) || 0), 0) / total);

    const overdue = list.filter((g) => getDeadlineBucket(g.deadline) === 'overdue' && g.status !== 'Completed').length;
    const dueSoon = list.filter((g) => {
      const b = getDeadlineBucket(g.deadline);
      return (b === 'today' || b === 'tomorrow' || b === 'week') && g.status !== 'Completed';
    }).length;

    const weightageUsed = list
      .filter((g) => g.status === 'Active' || g.status === 'Completed')
      .reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);

    return {
      total,
      byStatus,
      avgProgress: clamp(avgProgress, 0, 100),
      overdue,
      dueSoon,
      weightageUsed: clamp(Math.round(weightageUsed), 0, 100),
    };
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

  const renderAdminDashboard = () => {
    const allGoals = data.goals || [];
    const summary = summarizeGoals(allGoals);
    const upcoming = getUpcomingDeadlines(allGoals, 6);

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="kpi-card animated-gradient text-white bg-gradient-to-r from-blue-500 via-primary-600 to-purple-600 border-white/20">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">{data.totalUsers}</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card animated-gradient text-white bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 border-white/20">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-green-100 text-sm font-medium">Total Goals</p>
                <p className="text-3xl font-bold">{data.totalGoals}</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 rounded-lg p-3">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card animated-gradient text-white bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-600 border-white/20">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-yellow-100 text-sm font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold">{data.pendingApprovals}</p>
              </div>
              <div className="bg-yellow-400 bg-opacity-30 rounded-lg p-3">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card animated-gradient text-white bg-gradient-to-r from-purple-500 via-fuchsia-600 to-pink-600 border-white/20">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-purple-100 text-sm font-medium">Active Goals</p>
                <p className="text-3xl font-bold">{data.goalsByStatus.Active || 0}</p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-lg p-3">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Deadline Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="kpi-card animated-gradient text-white bg-gradient-to-r from-danger-500 via-rose-600 to-red-600 border-white/20">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-danger-100 text-sm font-medium">Overdue Goals</p>
                <p className="text-3xl font-bold">{summary.overdue}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>

          <div className="kpi-card animated-gradient text-white bg-gradient-to-r from-warning-500 via-orange-500 to-amber-600 border-white/20">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-warning-100 text-sm font-medium">Due Soon (7 days)</p>
                <p className="text-3xl font-bold">{summary.dueSoon}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>

          <div className="kpi-card animated-gradient text-white bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 border-white/20">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-green-100 text-sm font-medium">Avg Progress</p>
                <p className="text-3xl font-bold">{summary.avgProgress}%</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-modern">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
            <div className="space-y-3">
              {Object.entries(data.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="capitalize text-gray-600">{role}s</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(count / data.totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-modern">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals by Status</h3>
            <div className="space-y-3">
              {Object.entries(data.goalsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-gray-600">{status}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(count / data.totalGoals) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card-modern">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
            <span className="text-sm text-gray-500">Next {upcoming.length} goals</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No deadlines found yet.</div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((g) => (
                <div key={g._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:border-primary-200 hover:shadow-sm transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                    <p className="text-xs text-gray-500">
                      {g.createdBy?.name ? `Employee: ${g.createdBy.name}` : ''}
                      {g.createdBy?.name && g.managerId?.name ? ' · ' : ''}
                      {g.managerId?.name ? `Manager: ${g.managerId.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeadlineBadge(g.deadline)}`}>
                      {getDeadlineLabel(g.deadline)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(g.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmployeeDashboard = () => {
    const myGoals = data || [];
    const summary = summarizeGoals(myGoals);
    const upcoming = getUpcomingDeadlines(myGoals, 5);

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="kpi-card bg-gradient-to-br from-primary-50 via-white to-primary-50 border-primary-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Goals</p>
                <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
              </div>
              <div className="bg-primary-600 rounded-xl p-3 shadow-sm">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card bg-gradient-to-br from-success-50 via-white to-success-50 border-success-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Active Goals</p>
                <p className="text-3xl font-bold text-green-600">{summary.byStatus.Active}</p>
              </div>
              <div className="bg-success-600 rounded-xl p-3 shadow-sm">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card bg-gradient-to-br from-warning-50 via-white to-warning-50 border-warning-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{summary.byStatus['Pending Approval']}</p>
              </div>
              <div className="bg-warning-600 rounded-xl p-3 shadow-sm">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card bg-gradient-to-br from-blue-50 via-white to-blue-50 border-blue-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-blue-600">{summary.byStatus.Completed}</p>
              </div>
              <div className="bg-blue-600 rounded-xl p-3 shadow-sm">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-modern">
            <h3 className="text-sm font-semibold text-gray-900">Avg Progress</h3>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900">{summary.avgProgress}%</span>
                <span className="text-sm text-gray-500">across all goals</span>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-success-600 h-2 rounded-full" style={{ width: `${summary.avgProgress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="card-modern">
            <h3 className="text-sm font-semibold text-gray-900">Weightage Used</h3>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900">{summary.weightageUsed}%</span>
                <span className="text-sm text-gray-500">active + completed</span>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${summary.weightageUsed}%` }}></div>
              </div>
            </div>
          </div>

          <div className="card-modern">
            <h3 className="text-sm font-semibold text-gray-900">Deadlines</h3>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-danger-600">{summary.overdue}</p>
                <p className="text-sm text-gray-500">overdue</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-warning-600">{summary.dueSoon}</p>
                <p className="text-sm text-gray-500">due soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card-modern">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
            <span className="text-sm text-gray-500">Next {upcoming.length} goals</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No upcoming deadlines.</div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((g) => (
                <div key={g._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:border-primary-200 hover:shadow-sm transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                    <p className="text-xs text-gray-500">{getDeadlineLabel(g.deadline)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeadlineBadge(g.deadline)}`}>
                      {new Date(g.deadline).toLocaleDateString()}
                    </span>
                    <span className={`status-badge ${getStatusColor(g.status)}`}>{g.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Goals */}
        <div className="card-modern">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Goals</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myGoals.slice(0, 5).map((goal) => (
                  <tr key={goal._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {goal.title}
                    </td>
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
                      {goal.weightage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {myGoals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No goals found. Create your first goal!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderManagerDashboard = () => {
    const teamGoals = data || [];
    const pendingGoals = teamGoals.filter(g => g.status === 'Pending Approval');
    const teamMembers = [...new Set(teamGoals.map(g => g.createdBy?._id))].length;
    const summary = summarizeGoals(teamGoals);
    const upcoming = getUpcomingDeadlines(teamGoals, 6);

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="kpi-card bg-gradient-to-br from-primary-50 via-white to-primary-50 border-primary-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Team Goals</p>
                <p className="text-3xl font-bold text-gray-900">{teamGoals.length}</p>
              </div>
              <div className="bg-primary-600 rounded-xl p-3 shadow-sm">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card bg-gradient-to-br from-warning-50 via-white to-warning-50 border-warning-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingGoals.length}</p>
              </div>
              <div className="bg-warning-600 rounded-xl p-3 shadow-sm">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card bg-gradient-to-br from-blue-50 via-white to-blue-50 border-blue-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Team Members</p>
                <p className="text-3xl font-bold text-blue-600">{teamMembers}</p>
              </div>
              <div className="bg-blue-600 rounded-xl p-3 shadow-sm">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="kpi-card bg-gradient-to-br from-success-50 via-white to-success-50 border-success-100">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Active Goals</p>
                <p className="text-3xl font-bold text-green-600">
                  {teamGoals.filter(g => g.status === 'Active').length}
                </p>
              </div>
              <div className="bg-success-600 rounded-xl p-3 shadow-sm">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-modern">
            <h3 className="text-sm font-semibold text-gray-900">Avg Progress</h3>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900">{summary.avgProgress}%</span>
                <span className="text-sm text-gray-500">team-wide</span>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-success-600 h-2 rounded-full" style={{ width: `${summary.avgProgress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="card-modern">
            <h3 className="text-sm font-semibold text-gray-900">Deadlines</h3>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-danger-600">{summary.overdue}</p>
                <p className="text-sm text-gray-500">overdue</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-warning-600">{summary.dueSoon}</p>
                <p className="text-sm text-gray-500">due soon</p>
              </div>
            </div>
          </div>

          <div className="card-modern">
            <h3 className="text-sm font-semibold text-gray-900">Status Mix</h3>
            <div className="mt-3 space-y-2">
              {Object.entries(summary.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{status}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${summary.total === 0 ? 0 : (count / summary.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card-modern">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
            <span className="text-sm text-gray-500">Next {upcoming.length} goals</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No upcoming deadlines.</div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((g) => (
                <div key={g._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:border-primary-200 hover:shadow-sm transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                    <p className="text-xs text-gray-500">Employee: {g.createdBy?.name || '-'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeadlineBadge(g.deadline)}`}>
                      {getDeadlineLabel(g.deadline)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(g.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approvals */}
        {pendingGoals.length > 0 && (
          <div className="card-modern">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
            <div className="space-y-3">
              {pendingGoals.map((goal) => (
                <div key={goal._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600">
                        by {goal.createdBy?.name} - {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <span className="status-badge status-pending">
                      Pending Approval
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Goals Overview */}
        <div className="card-modern">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Goals Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamGoals.slice(0, 10).map((goal) => (
                  <tr key={goal._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {goal.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {goal.createdBy?.name}
                    </td>
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
                      {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {teamGoals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No team goals found.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {user.role === 'admin' && renderAdminDashboard()}
      {user.role === 'employee' && renderEmployeeDashboard()}
      {user.role === 'manager' && renderManagerDashboard()}
    </Layout>
  );
};

export default Dashboard;
