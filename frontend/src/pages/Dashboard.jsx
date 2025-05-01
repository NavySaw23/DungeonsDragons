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
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamIDToJoin, setTeamIDToJoin] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

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
    fetchTeamData();
  }, []);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here if needed
  };

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
                    <div className="team-roles">
                      {teamData.mentorId ? (
                        <span className="role-badge mentor">
                          Mentor: {teamData.mentorId.username || 'N/A'}
                        </span>
                      ) : (
                        <button className="add-role-btn">
                          + Add Mentor
                        </button>
                      )}
                      
                      {teamData.coordinatorId ? (
                        <span className="role-badge coordinator">
                          Coordinator: {teamData.coordinatorId.username || 'N/A'}
                        </span>
                      ) : (
                        <button className="add-role-btn">
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
                              {member.role || 'No role'}
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
    </div>
  );
}

export default Dashboard;