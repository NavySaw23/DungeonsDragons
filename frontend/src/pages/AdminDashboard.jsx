import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import './AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AdminDashboard() {
  const [mentoredTeams, setMentoredTeams] = useState([]);
  const [coordinatedTeams, setCoordinatedTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [assigneeToAdd, setAssigneeToAdd] = useState('');
  const [mentorTeamIdInput, setMentorTeamIdInput] = useState('');
  const [coordinatorTeamIdInput, setCoordinatorTeamIdInput] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Define fetchAdminTeams using useCallback to memoize it
  const fetchAdminTeams = useCallback(async () => {
    console.log("[AdminDashboard] fetchAdminTeams called.");
    setLoading(true);
    setError('');
    setActionError('');
    setActionSuccess('');
    try {
      console.log("[AdminDashboard] Sending GET /api/admin/my-teams");
      const response = await axios.get(`${API_URL}/admin/my-teams`);
      console.log("[AdminDashboard] Received API Response:", response.data);
      setMentoredTeams(response.data.mentoredTeams || []);
      setCoordinatedTeams(response.data.coordinatedTeams || []);
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Error fetching admin team data';
      console.error("[AdminDashboard] Error fetching admin teams:", err);
      setError(message);
      if (err.response?.status === 403) {
        setError("You are not authorized to view this page.");
      }
    } finally {
      console.log("[AdminDashboard] Setting loading to false.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'mentor' || user.role === 'coordinator')) {
      console.log("[AdminDashboard useEffect] User is authorized, calling fetchAdminTeams...");
      fetchAdminTeams();
    } else if (user) {
      console.log("[AdminDashboard useEffect] User exists but has wrong role:", user.role);
      setError("Access denied. You do not have the required role.");
      setLoading(false);
    } else {
      setLoading(false);
      console.log("[AdminDashboard useEffect] User not logged in, redirecting to login.");
      navigate('/login');
    }
  }, [user, navigate, fetchAdminTeams]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Action Handlers
  const handleTeamAssignment = async (role, teamId, clearInputCallback) => {
    if (!teamId) {
      setActionError(`Please enter a Team ID to assign.`);
      return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true);

    const endpoint = role === 'mentor' ? '/team/add-mentor' : '/team/add-coordinator';
    try {
      await axios.patch(`${API_URL}${endpoint}`, { teamId });
      setActionSuccess(`Successfully assigned yourself to team ${teamId}.`);
      clearInputCallback();
      await fetchAdminTeams();
    } catch (err) {
      const message = err.response?.data?.msg || err.message || `Error assigning team`;
      setActionError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamUnassignment = async (role, teamId) => {
    if (!teamId) return;

    setActionError('');
    setActionSuccess('');
    setLoading(true);

    const endpoint = role === 'mentor' ? '/team/remove-mentor' : '/team/remove-coordinator';
    try {
      await axios.patch(`${API_URL}${endpoint}`, { teamId });
      setActionSuccess(`Successfully unassigned yourself from team ${teamId}.`);
      await fetchAdminTeams();
    } catch (err) {
      const message = err.response?.data?.msg || err.message || `Error unassigning team`;
      setActionError(message);
    } finally {
      setLoading(false);
    }
  };

  // Task Action Handlers
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
        deadline: newTaskDeadline || null,
        projectId: projectId,
      });
      setActionSuccess(`Task "${newTaskName}" added successfully to project ${projectId}.`);
      setNewTaskName('');
      setNewTaskDesc('');
      setNewTaskDifficulty('medium');
      setNewTaskDeadline('');
      await fetchAdminTeams();
    } catch (err) {
      setActionError(err.response?.data?.msg || err.message || 'Error adding task');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTask = async (taskId, taskName) => {
    console.log("[AdminDashboard] handleRemoveTask attempting with taskId:", taskId); // <-- Add log
    if (!window.confirm(`Are you sure you want to delete task "${taskName}" (ID: ${taskId})?`)) {
      return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      setActionSuccess(`Task "${taskName}" deleted successfully.`);
      await fetchAdminTeams();
    } catch (err) {
      setActionError(err.response?.data?.msg || err.message || 'Error deleting task');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaskComplete = async (taskId, taskName) => {
    console.log("[AdminDashboard] handleMarkTaskComplete attempting with taskId:", taskId); // <-- Add log
    if (!window.confirm(`Are you sure you want to mark task "${taskName}" (ID: ${taskId}) as completed?`)) {
      return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true);
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}/complete`);
      setActionSuccess(`Task "${taskName}" marked as completed.`);
      await fetchAdminTeams();
    } catch (err) {
      setActionError(err.response?.data?.msg || err.message || 'Error marking task as completed');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (taskId, userId) => {
    console.log("[AdminDashboard] handleAssignTask attempting with taskId:", taskId, "userId:", userId); // <-- Add log
    if (!userId) {
      setActionError('Please select a team member to assign.');
      return;
    }
    setActionError('');
    setActionSuccess('');
    setLoading(true);
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}/assign`, { userId });
      setActionSuccess(`User assigned successfully to task ${taskId}.`);
      setAssigneeToAdd('');
      await fetchAdminTeams();
    } catch (err) {
      setActionError(err.response?.data?.msg || err.message || 'Error assigning user to task');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error notification">
        Error: {error} 
        <button onClick={() => navigate('/login')} style={{marginLeft: '1rem'}}>Login</button>
      </div>
    );
  }

  // Helper function to render status indicator
  const renderStatusIndicator = (status) => {
    const statusClass = status ? `status-${status.toLowerCase()}` : 'status-todo';
    return <span className={`status-indicator ${statusClass}`}></span>;
  };

  // Helper function to render a list of teams
  const renderTeamList = (teams, title, role) => (
    <div className="team-list-section">
      <h2>{title}</h2>
      {teams.length > 0 ? (
        <ul className="team-list">
          {teams.map((team, index) => (
            <li 
              key={team._id} 
              className="team-item admin-team-details" 
              style={{"--animation-order": index}}
            >
              <button 
                onClick={() => handleTeamUnassignment(role, team._id)} 
                className="remove-assignment-button"
              >
                Remove Team
              </button>

              <h3>Team: {team.name}</h3>
              <p className="team-id">ID: {team._id}</p>
              
              {/* Project Details */}
              <h4>Project</h4>
              {team.projectId ? (
                <div>
                  <p>Name: {team.projectId.name || 'N/A'}</p>
                  <p>ID: {team.projectId._id}</p>
                  {/* Add Task Form (Only for Mentors and if project exists) */}
              {/* Member Details */}
              <h4>Members: ({team.members?.length || 0}/{team.maxSize})</h4>
              <ul className="member-list">
                {team.teamLeadId && (
                  <li>Lead: {team.teamLeadId.username} (ID: {team.teamLeadId._id})</li>
                )}
                {team.members
                  ?.filter(member => member._id !== team.teamLeadId?._id)
                  .map(member => (
                    <li key={member._id}>{member.username} (ID: {member._id})</li>
                  ))
                }
              </ul>
              {role === 'mentor' && team.projectId && (  
                <div className="add-task-form">
                  <h4>Add New Task</h4>
                  <input 
                    type="text" 
                    placeholder="Task Name*" 
                    value={newTaskName} 
                    onChange={(e) => setNewTaskName(e.target.value)} 
                    required 
                  />
                  <textarea 
                    placeholder="Task Description" 
                    value={newTaskDesc} 
                    onChange={(e) => setNewTaskDesc(e.target.value)} 
                  />
                  <input 
                    type="date" 
                    placeholder="Deadline" 
                    value={newTaskDeadline} 
                    onChange={(e) => setNewTaskDeadline(e.target.value)} 
                  />
                  <select 
                    value={newTaskDifficulty} 
                    onChange={(e) => setNewTaskDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button 
                    onClick={() => handleAddTask(team.projectId._id, team._id)} 
                    disabled={!newTaskName || loading}
                  >
                    {loading ? 'Adding...' : 'Add Task'}
                  </button>
                </div>
              )}
                  {/* Project Tasks */}
                  <h5>Tasks</h5>
                  {team.projectId.tasks && team.projectId.tasks.length > 0 ? (
                    // console.log(`[AdminDashboard] Rendering tasks for Project ID: ${team.projectId._id}`, team.projectId.tasks), // Optional: Log all tasks at once
                    <ul className="task-list admin-task-list">
                      {team.projectId.tasks.map(task => (
                        <li 
                          key={task._id} 
                          className="task-item admin-task-item"
                          data-difficulty={task.difficulty || 'medium'}
                        >
                          {console.log("[AdminDashboard] Rendering Task Item:", task)} {/* <-- Log each task object */}
                          <div className="task-info">
                            <p>
                              {renderStatusIndicator(task.completionStatus)}
                              <strong>{task.name}</strong>
                            </p>
                            <p>Status: {task.completionStatus || 'To Do'}</p>
                            <p>ID: {task._id}</p>
                            {task.submissionLink && (
                              <p>
                                Submission: 
                                <a 
                                  href={task.submissionLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  {task.submissionLink}
                                </a>
                              </p>
                            )}
                            <p>Assignees: {task.assignees?.map(a => a.username).join(', ') || 'None'}</p>
                          </div>
                          
                          <div className="task-actions">
                            <button
                              onClick={() => handleRemoveTask(task._id, task.name)}
                              className="remove-task-button"
                              title="Delete Task"
                            >
                              Delete
                            </button>
                            
                            {(task.completionStatus !== 'completed' && task.completionStatus !== 'cancelled') && (
                              <button 
                                onClick={() => handleMarkTaskComplete(task._id, task.name)} 
                                className="mark-complete-button" 
                                title="Mark Task as Completed" 
                                disabled={loading}
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                          
                          {/* Assignee Management for Mentors */}
                          {role === 'mentor' && (
                            <div className="assignee-management">
                              <select
                                value={assigneeToAdd}
                                onChange={(e) => setAssigneeToAdd(e.target.value)}
                                className="assignee-select"
                              >
                                <option value="">-- Select Member to Assign --</option>
                                {/* Add Team Lead */}
                                {team.teamLeadId && (
                                  <option value={team.teamLeadId._id}>
                                    {team.teamLeadId.username} (Lead)
                                  </option>
                                )}
                                {/* Add Other Members */}
                                {team.members
                                  ?.filter(member => member._id !== team.teamLeadId?._id)
                                  .map(member => (
                                    <option key={member._id} value={member._id}>
                                      {member.username}
                                    </option>
                                  ))
                                }
                              </select>
                              <button 
                                onClick={() => handleAssignTask(task._id, assigneeToAdd)} 
                                className="assign-button"
                              >
                                Assign Member
                              </button>
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

              
              
              {role === 'mentor' && !team.projectId && (
                <p className="warning">Cannot add tasks: Team is not assigned to a project.</p>
              )}

              
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
      <div className="dashboard-header">
        <div className="welcome-message">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user?.username} <span className="user-badge">{user?.role}</span></p>
        </div>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      
      {actionError && <div className="error notification">{actionError}</div>}
      {actionSuccess && <div className="success notification">{actionSuccess}</div>}

      {/* Assign Team Section */}
      <div className="assign-team-section">
        <h4>Assign Yourself to a Team</h4>
        {user?.role === 'mentor' && (
          <div className="assign-form">
            <label htmlFor="mentorTeamId">Team ID:</label>
            <input
              type="text"
              id="mentorTeamId"
              name="mentorTeamId"
              placeholder="Enter Team ID to Mentor"
              value={mentorTeamIdInput}
              onChange={(e) => setMentorTeamIdInput(e.target.value)}
            />
            <button 
              onClick={() => handleTeamAssignment('mentor', mentorTeamIdInput, () => setMentorTeamIdInput(''))}
            >
              Assign as Mentor
            </button>
          </div>
        )}
        
        {user?.role === 'coordinator' && (
          <div className="assign-form">
            <label htmlFor="coordinatorTeamId">Team ID:</label>
            <input
              type="text"
              id="coordinatorTeamId"
              name="coordinatorTeamId"
              placeholder="Enter Team ID to Coordinate"
              value={coordinatorTeamIdInput}
              onChange={(e) => setCoordinatorTeamIdInput(e.target.value)}
            />
            <button 
              onClick={() => handleTeamAssignment('coordinator', coordinatorTeamIdInput, () => setCoordinatorTeamIdInput(''))}
            >
              Assign as Coordinator
            </button>
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
