import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import '../css/AdminDashboard.css'; // We'll create this CSS file next

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AdminDashboard() {
  const [mentoredTeams, setMentoredTeams] = useState([]);
  const [coordinatedTeams, setCoordinatedTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState(''); // For errors during add/remove actions
  const [actionSuccess, setActionSuccess] = useState(''); // For success messages
  // State for new task inputs (could be more sophisticated, e.g., per-team state or a modal)
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [assigneeToAdd, setAssigneeToAdd] = useState(''); // State for selected assignee ID
  const { user, logout } = useAuth(); // Get user info and logout function
  const navigate = useNavigate();

  // Define fetchAdminTeams using useCallback to memoize it
  const fetchAdminTeams = useCallback(async () => {
    console.log("[AdminDashboard] fetchAdminTeams called."); // Frontend Log
    setLoading(true);
    setError('');
    setActionError(''); // Clear action errors on refresh
    setActionSuccess(''); // Clear success messages on refresh
    try {
      console.log("[AdminDashboard] Sending GET /api/admin/my-teams"); // Frontend Log
      const response = await axios.get(`${API_URL}/admin/my-teams`);
      console.log("[AdminDashboard] Received API Response:", response.data); // Frontend Log
      setMentoredTeams(response.data.mentoredTeams || []);
      setCoordinatedTeams(response.data.coordinatedTeams || []);
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Error fetching admin team data';
      console.error("[AdminDashboard] Error fetching admin teams:", err); // Log the full error
      setError(message);
      // Handle specific errors like 401/403 if needed, though AuthContext might handle 401
      if (err.response?.status === 403) {
        setError("You are not authorized to view this page.");
      }
    } finally {
      console.log("[AdminDashboard] Setting loading to false."); // Frontend Log
      setLoading(false);
    }
  }, []); // No dependencies needed here as token is handled by Axios interceptor

  useEffect(() => {
    // Only fetch if the user is logged in and has the correct role
    if (user && (user.role === 'mentor' || user.role === 'coordinator')) {
      console.log("[AdminDashboard useEffect] User is authorized, calling fetchAdminTeams..."); // Frontend Log
      fetchAdminTeams();
    } else if (user) {
      // If user is logged in but wrong role, show error or redirect
      console.log("[AdminDashboard useEffect] User exists but has wrong role:", user.role); // Frontend Log
      setError("Access denied. You do not have the required role.");
      setLoading(false);
      // Optionally redirect back to dashboard or login
      // navigate('/dashboard');
    } else {
      // If user is not logged in (should be handled by routing/AuthContext ideally)
      setLoading(false);
      console.log("[AdminDashboard useEffect] User not logged in, redirecting to login."); // Frontend Log
      navigate('/login');
    }
  }, [user, navigate, fetchAdminTeams]); // Add fetchAdminTeams to dependency array
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- Action Handlers ---

  const handleTeamAssignment = async (role, teamId) => {
    if (!teamId) {
      setActionError(`Please enter a Team ID to assign.`);
      return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true); // Indicate activity

    const endpoint = role === 'mentor' ? '/team/add-mentor' : '/team/add-coordinator';
    try {
      await axios.patch(`${API_URL}${endpoint}`, { teamId });
      setActionSuccess(`Successfully assigned yourself to team ${teamId}. Refreshing list...`);
      // Refetch teams after successful assignment
      await fetchAdminTeams(); // Call the fetch function directly
    } catch (err) {
      const message = err.response?.data?.msg || err.message || `Error assigning team`;
      setActionError(message);
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  const handleTeamUnassignment = async (role, teamId) => {
    if (!teamId) return; // Should not happen if called from button

    setActionError('');
    setActionSuccess('');
    setLoading(true); // Indicate activity

    const endpoint = role === 'mentor' ? '/team/remove-mentor' : '/team/remove-coordinator';
    try {
      await axios.patch(`${API_URL}${endpoint}`, { teamId });
      setActionSuccess(`Successfully unassigned yourself from team ${teamId}. Refreshing list...`);
      // Refetch teams after successful removal
      await fetchAdminTeams(); // Call the fetch function directly
    } catch (err) {
      const message = err.response?.data?.msg || err.message || `Error unassigning team`;
      setActionError(message);
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  // --- Task Action Handlers ---

  const handleAddTask = async (projectId, teamId) => {
    if (!newTaskName || !projectId) {
      setActionError('Task Name and Project ID are required.');
      return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/tasks`, {
        name: newTaskName,
        description: newTaskDesc,
        difficulty: newTaskDifficulty,
        deadline: newTaskDeadline || null, // Send null if empty
        projectId: projectId,
        // Assignees could be added here or assigned separately
      });
      setActionSuccess(`Task "${newTaskName}" added successfully to project ${projectId}. Refreshing...`);
      // Clear form
      setNewTaskName('');
      setNewTaskDesc('');
      setNewTaskDifficulty('medium');
      setNewTaskDeadline('');
      await fetchAdminTeams(); // Refresh data
    } catch (err) {
      setActionError(err.response?.data?.msg || err.message || 'Error adding task');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTask = async (taskId, taskName) => {
    if (!window.confirm(`Are you sure you want to delete task "${taskName}" (ID: ${taskId})?`)) {
      return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      setActionSuccess(`Task "${taskName}" deleted successfully. Refreshing...`);
      await fetchAdminTeams(); // Refresh data
    } catch (err) {
      setActionError(err.response?.data?.msg || err.message || 'Error deleting task');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaskComplete = async (taskId, taskName) => {
    if (!window.confirm(`Are you sure you want to mark task "${taskName}" (ID: ${taskId}) as completed?`)) {
      return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true);
    try {
      // Assuming an endpoint like PATCH /api/tasks/:taskId/complete
      await axios.patch(`${API_URL}/tasks/${taskId}/complete`); // Adjust endpoint if needed
      setActionSuccess(`Task "${taskName}" marked as completed. Refreshing...`);
      await fetchAdminTeams(); // Refresh data
    } catch (err) {
      setActionError(err.response?.data?.msg || err.message || 'Error marking task as completed');
    } finally {
      setLoading(false);
    }
  };
  const handleAssignTask = async (taskId, userId) => {
    if (!userId) {
        setActionError('Please select a team member to assign.');
        return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true);
    try {
      // Assuming an endpoint like PATCH /api/tasks/:taskId/assign
      await axios.patch(`${API_URL}/tasks/${taskId}/assign`, { userId });
      setActionSuccess(`User assigned successfully to task ${taskId}. Refreshing...`);
      setAssigneeToAdd(''); // Clear selection
      await fetchAdminTeams(); // Refresh data
    } catch (err) {
      setActionError(err.response?.data?.msg || err.message || 'Error assigning user to task');
    } finally {
      setLoading(false);
    }
  };

  // Note: handleUnassignTask would be similar to handleAssignTask,
  // likely calling a different endpoint like /tasks/:taskId/unassign


  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error} <button onClick={() => navigate('/login')}>Login</button></div>;
  }

  // Helper function to render a list of teams
  const renderTeamList = (teams, title, role) => (
    <div className="team-list-section">
      <h2>{title}</h2>
      {teams.length > 0 ? (
        <ul className="team-list">
          {teams.map(team => (
            <li key={team._id} className="team-item admin-team-details">
              {/* Add Remove Button */}
              <button onClick={() => handleTeamUnassignment(role, team._id)} className="remove-assignment-button">Remove Assignment</button>

              <h3>Team: {team.name} (ID: {team._id})</h3>

              {/* Project Details */}
              <h4>Project:</h4>
              {team.projectId ? (
                <div>
                  <p>Name: {team.projectId.name || 'N/A'}</p>
                  <p>ID: {team.projectId._id}</p>
                  {/* Project Tasks */}
                  <h5>Tasks:</h5>
                  {team.projectId.tasks && team.projectId.tasks.length > 0 ? (
                    <ul className="task-list admin-task-list">
                      {team.projectId.tasks.map(task => (
                        <li key={task._id} className="task-item admin-task-item">
                          <div className="task-info">
                            <p><strong>{task.name}</strong> (ID: {task._id})</p>
                            <p>Status: {task.completionStatus || 'N/A'}</p>
                            {task.submissionLink && (
                              <p>Submission: <a href={task.submissionLink} target="_blank" rel="noopener noreferrer">{task.submissionLink}</a></p>
                            )}
                            <p>Assignees: {task.assignees?.map(a => a.username).join(', ') || 'None'}</p>
                          </div>
                          <div className="task-actions">
                            <button
                              onClick={() => handleRemoveTask(task._id, task.name)}
                              className="remove-task-button"
                              title="Delete Task"
                            >
                              🗑️ Delete
                            </button>
                            {/* Add Mark Complete Button - Conditionally show/disable */}
                            {(task.completionStatus !== 'completed' && task.completionStatus !== 'cancelled') && (
                              <button onClick={() => handleMarkTaskComplete(task._id, task.name)} className="mark-complete-button" title="Mark Task as Completed" disabled={loading}>✅ Mark Complete</button>
                            )}
                          </div>
                          {/* Assignee Management for Mentors */}
                          {role === 'mentor' && (
                            <div className="assignee-management">
                              <select
                                value={assigneeToAdd} // Consider making this state per-task or using uncontrolled with refs
                                onChange={(e) => setAssigneeToAdd(e.target.value)}
                                className="assignee-select"
                              >
                                <option value="">-- Select Member to Assign --</option>
                                {/* Add Team Lead */}
                                {team.teamLeadId && <option value={team.teamLeadId._id}>{team.teamLeadId.username} (Lead)</option>}
                                {/* Add Other Members */}
                                {team.members
                                  ?.filter(member => member._id !== team.teamLeadId?._id) // Exclude lead if already added
                                  .map(member => (
                                    <option key={member._id} value={member._id}>{member.username}</option>
                                ))}
                              </select>
                              <button onClick={() => handleAssignTask(task._id, assigneeToAdd)} className="assign-button">
                                Assign Member
                              </button>
                              {/* Add an "Unassign" button/mechanism here if needed */}
                            </div>
                          )}
                        </li>

                      ))}
                    </ul>
                  ) : (
                    <p>No tasks assigned to this project.</p>
                  )}
                </div>
              ) : (
                <p>No project assigned to this team.</p>
              )}

              {/* Add Task Form (Only for Mentors and if project exists) */}
              {role === 'mentor' && team.projectId && (
                <div className="add-task-form">
                  <h4>Add New Task to Project "{team.projectId.name}"</h4>
                  <input type="text" placeholder="Task Name*" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} required />
                  <textarea placeholder="Task Description" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} />
                  <input type="date" placeholder="Deadline" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} />
                  <select value={newTaskDifficulty} onChange={(e) => setNewTaskDifficulty(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button onClick={() => handleAddTask(team.projectId._id, team._id)} disabled={!newTaskName || loading}>
                    {loading ? 'Adding...' : 'Add Task'}
                  </button>
                </div>
              )}
               {role === 'mentor' && !team.projectId && (
                 <p className="warning">Cannot add tasks: Team is not assigned to a project.</p>
               )}




              {/* Member Details */}
              <h4>Members: ({team.members?.length || 0}/{team.maxSize})</h4>
              <ul className="member-list">
                {team.teamLeadId && ( // Display Lead separately or as part of members
                  <li>Lead: {team.teamLeadId.username} (ID: {team.teamLeadId._id}) - Health: {team.teamLeadId.health ?? 'N/A'}%</li>
                )}
                {team.members?.filter(member => member._id !== team.teamLeadId?._id) // Filter out the lead from the members list
                               .map(member => (
                  <li key={member._id}>{member.username} (ID: {member._id}) - Health: {member.health ?? 'N/A'}%</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>No teams found.</p>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.username} ({user?.role})!</p>
      {actionError && <p className="error action-error">{actionError}</p>}
      {actionSuccess && <p className="success action-success">{actionSuccess}</p>}
      <button onClick={handleLogout} className="logout-button">Logout</button>

      {/* Assign Team Section */}
      <div className="assign-team-section">
        <h4>Assign Yourself to a Team</h4>
        {user?.role === 'mentor' && (
          <div className="assign-form">
            <label htmlFor="mentorTeamId">Team ID:</label>
            <input type="text" id="mentorTeamId" name="mentorTeamId" placeholder="Enter Team ID to Mentor" />
            <button onClick={() => handleTeamAssignment('mentor', document.getElementById('mentorTeamId').value)}>Assign as Mentor</button>
          </div>
        )}
        {user?.role === 'coordinator' && (
          <div className="assign-form">
            <label htmlFor="coordinatorTeamId">Team ID:</label>
            <input type="text" id="coordinatorTeamId" name="coordinatorTeamId" placeholder="Enter Team ID to Coordinate" />
            <button onClick={() => handleTeamAssignment('coordinator', document.getElementById('coordinatorTeamId').value)}>Assign as Coordinator</button>
          </div>
        )}
      </div>

      {/* Team Lists */}
      {user?.role === 'mentor' && renderTeamList(mentoredTeams, "Teams You Mentor", 'mentor')}
      {user?.role === 'coordinator' && renderTeamList(coordinatedTeams, "Teams You Coordinate", 'coordinator')}
    </div>
  );
}


export default AdminDashboard;