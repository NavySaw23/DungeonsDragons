import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../css/Dashboard.css';
import Avatar from '../assets/character.svg';
import Waves_BG from '../assets/waves-big.svg';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth(); // Get user info
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamIDToJoin, setTeamIDToJoin] = useState('');
  const [actionError, setActionError] = useState('');
  const [showAddProjectModal, setShowAddProjectModal] = useState(false); // State for Add Project modal
  const [projectName, setProjectName] = useState(''); // State for project name input
  const [projectDescription, setProjectDescription] = useState(''); // State for project description input
  const [actionSuccess, setActionSuccess] = useState('');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false); // State for Add Role modal

  const fetchTeamData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/team/me`);
      setTeamData(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setTeamData(null);
      } else {
        const message = err.response?.data?.msg || err.message || 'Error fetching team data';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect mentors/coordinators immediately
    if (user && (user.role === 'mentor' || user.role === 'coordinator')) {
      navigate('/admin');
      return; // Stop further execution in this effect for admins
    }
    // Only fetch team data if the user is a student (or other non-admin role)
    if (user && user.role === 'student') { // Be explicit about who should see this dashboard
      fetchTeamData();
    } else if (!user) {
      // If user is not logged in, AuthContext/routing should handle this,
      // but we can add a fallback redirect.
      navigate('/login');
    }
    // setLoading(false) is handled within fetchTeamData or if user is not student
    // If user is logged in but not student/mentor/coordinator, set loading false
    else if (user) {
        setLoading(false);
        // Optionally set an error or show a message for unexpected roles
        setError("Your role does not have access to this dashboard view.");
    }

  }, [user, navigate]); // Add user and navigate as dependencies

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!teamName.trim()) {
      setActionError('Team name is required.');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/team/create`, { name: teamName });
      setActionSuccess(`Team "${response.data.name}" created successfully!`);
      setTeamData(response.data);
      setShowCreateModal(false);
      setTeamName('');
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Error creating team';
      setActionError(message);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!teamIDToJoin.trim()) {
      setActionError('Team ID is required.');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/team/join`, { teamID: teamIDToJoin });
      setActionSuccess(response.data.msg || 'Successfully joined the team!');
      setTeamData(response.data.team);
      setShowJoinModal(false);
      setTeamIDToJoin('');
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Error joining team';
      setActionError(message);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!projectName.trim()) {
      setActionError('Project name is required.');
      return;
    }
    if (!teamData || !teamData._id) {
        setActionError('Cannot add project: Team data is missing.');
        return;
    }
    try {
      const response = await axios.post(`${API_URL}/team/add-project`, {
        teamId: teamData._id, // Pass the current team's ID
        projectName: projectName,
        projectDescription: projectDescription,
      });
      setActionSuccess('Project added and assigned successfully!');
      setTeamData(response.data.team); // Update team data with the new project ID
      setShowAddProjectModal(false);
      setProjectName('');
      setProjectDescription('');
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Error adding project';
      setActionError(message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const copyToClipboard = (text) => {
    if (!navigator.clipboard) {
      // Clipboard API not available (likely due to insecure context)
      console.error('Clipboard API not available. Ensure you are on HTTPS or localhost.');
      // Optionally, display an error message to the user
      // alert('Could not copy text: Clipboard API not available in this context.');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Add a success message/toast notification here
      // console.log('Text copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Optionally, display an error message to the user
      // alert('Failed to copy text.');
    });
  };

  // Early return if user is mentor/coordinator (avoids rendering student dashboard briefly)
  if (user && (user.role === 'mentor' || user.role === 'coordinator')) {
    // Optionally return a loading indicator or null while redirecting
    return <div className="loading">Redirecting...</div>;
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      {/* Upper Half Container */}
      <div className="upper-half">
        {/* Background Elements */}
        <div className="waves-background">
          <img src={Waves_BG} alt="Waves Background" className="waves-svg" />
        </div>

        <button onClick={handleLogout} className="logout-button">Logout</button>
        
        {/* Main Content */}
        <div className="header-content">
          {/* Avatar on the Left */}
          <div className="avatar-container">
            <img src={Avatar} alt="Team Avatar" className="avatar-illustration" />
          </div>
          
          {/* Team Details in the Middle */}
          <div className="team-details-container">
            {teamData ? (
              <>
                <div className="members-section">
                  <div className="members-header">
                    <h2 className="team-name">
                      {teamData.name}
                      <button 
                        className="copy-icon" 
                        onClick={() => copyToClipboard(teamData.name)}
                        title="Copy team name"
                      >
                        ⎘
                      </button>
                    </h2>
                    {/* Project Display/Add Button */}
                    {teamData.projectId ? (
                      <p className="project-name" title={teamData.projectId.description || 'No description'}>
                        Project: {teamData.projectId.name}
                      </p>
                    ) : (
                      <button
                        className="add-role-btn" // Changed class to match Add Mentor/Coordinator
                        onClick={() => { setShowAddProjectModal(true); setActionError(''); setActionSuccess(''); }}
                      >
                        + Add Project
                      </button>
                    )}
                    {/* End Project Display/Add Button */}

                    <div className="team-roles">
                      {teamData.mentorId ? (
                        <span className="role-badge mentor">
                          Mentor: {teamData.mentorId.username || 'N/A'}
                        </span>
                      ) : (
                        <button
                          className="add-role-btn"
                          onClick={() => setShowAddRoleModal(true)}
                        >
                          + Add Mentor
                        </button>
                      )}
                      
                      {teamData.coordinatorId ? (
                        <span className="role-badge coordinator">
                          Coordinator: {teamData.coordinatorId.username || 'N/A'}
                        </span>
                      ) : (
                        <button
                          className="add-role-btn"
                          onClick={() => setShowAddRoleModal(true)}
                        >
                          + Add Coordinator
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <ul className="members-list">
                    {teamData.members && teamData.members.length > 0 ? (
                      teamData.members.map((member) => (
                        <li key={member._id} className="member-item">
                          <div className="member-info">
                            <span className="member-name">{member.username}</span>
                            {teamData.teamLeadId === member._id && (
                              <span className="team-lead">(Lead)</span>
                            )}
                          </div>
                          <div className="member-stats">
                            <span className="member-class">
                              {member.playerClass || 'No class'} {/* Changed from role to playerClass */}
                            </span>
                            <div className="health-bar-container">
                              <span className="health-text">HP: 100/100</span>
                              <div className="health-bar">
                                <div 
                                  className="health-fill" 
                                  style={{ width: '100%' }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="member-item">No members found</li>
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <div className="no-team-section">
                <h2 className="no-team-title">No Team Found</h2>
                <p className="no-team-message">You are not currently part of a team.</p>
                <div className="team-actions">
                  <button 
                    className="create-team-btn"
                    onClick={() => { setShowCreateModal(true); setActionError(''); setActionSuccess(''); }}
                  >
                    Create Team
                  </button>
                  <button 
                    className="join-team-btn"
                    onClick={() => { setShowJoinModal(true); setActionError(''); setActionSuccess(''); }}
                  >
                    Join Team
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower half */}
      <div className="feature-boxes">
        <Link to="/calendar" className="feature-card calendar-box">
          <div className="feature-icon">📅</div>
          <h2 className="feature-title">Calendar / Tasks</h2>
        </Link>

        <Link to="/story" className="feature-card story-box">
          <div className="feature-icon">📖</div>
          <h2 className="feature-title">Story Progress</h2>
        </Link>

        <Link to="/pomodoropage" className="feature-card pomodoro-box">
          <div className="feature-icon">⏱️</div>
          <h2 className="feature-title">Pomodoro Timer</h2>
        </Link>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create a New Team</h3>
            <form onSubmit={handleCreateTeam} className="modal-form">
              <input
                type="text"
                placeholder="Enter Team Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="modal-input"
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="modal-submit">Create</button>
                <button 
                  type="button" 
                  className="modal-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
            {actionError && <p className="modal-error">{actionError}</p>}
            {actionSuccess && <p className="modal-success">{actionSuccess}</p>}
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Join an Existing Team</h3>
            <form onSubmit={handleJoinTeam} className="modal-form">
              <input
                type="text"
                placeholder="Enter Team ID"
                value={teamIDToJoin}
                onChange={(e) => setTeamIDToJoin(e.target.value)}
                className="modal-input"
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="modal-submit">Join</button>
                <button 
                  type="button" 
                  className="modal-cancel"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
            {actionError && <p className="modal-error">{actionError}</p>}
            {actionSuccess && <p className="modal-success">{actionSuccess}</p>}
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Project</h3>
            <form onSubmit={handleAddProject} className="modal-form">
              <input
                type="text"
                placeholder="Enter Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="modal-input"
                required
              />
              <textarea
                placeholder="Enter Project Description (Optional)"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="modal-input modal-textarea" // Add a class for styling if needed
              />
              <div className="modal-buttons">
                <button type="submit" className="modal-submit">Add Project</button>
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => { setShowAddProjectModal(false); setActionError(''); setActionSuccess(''); }} // Close and clear errors
                >
                  Cancel
                </button>
              </div>
            </form>
            {actionError && <p className="modal-error">{actionError}</p>}
            {actionSuccess && <p className="modal-success">{actionSuccess}</p>}
          </div>
        </div>
      )}

      {/* Add Role (Mentor/Coordinator) Info Modal */}
      {showAddRoleModal && teamData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Mentor / Coordinator</h3>
            <p className="modal-instruction">
              Provide the following Team ID to your Mentor or Coordinator and ask them to add themselves to your team:
            </p>
            <div className="team-id-display">
              <span className="team-id-text">{teamData._id}</span>
              <button
                className="copy-id-btn"
                onClick={() => copyToClipboard(teamData._id)}
                title="Copy Team ID"
              >
                Copy ID 📋
              </button>
            </div>
            <div className="modal-buttons">
              <button type="button" className="modal-cancel" onClick={() => setShowAddRoleModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;