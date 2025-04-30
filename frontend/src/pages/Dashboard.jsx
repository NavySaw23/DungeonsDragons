// e:\Sem_6\Minor\deadlines-dragons\frontend\src\pages\Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Or your preferred HTTP client
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
// import CreateTeamModal from './CreateTeamModal'; // Optional: Separate modal component
// import JoinTeamModal from './JoinTeamModal';     // Optional: Separate modal component
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

// --- API Base URL ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'; // Adjust as needed

function Dashboard() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { logout } = useAuth(); // Get logout function from context
  const navigate = useNavigate(); // Hook for navigation

  // --- State for Modals ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamName, setTeamName] = useState(''); // For create form
  const [teamIDToJoin, setTeamIDToJoin] = useState(''); // For join form
  const [actionError, setActionError] = useState(''); // Errors during create/join
  const [actionSuccess, setActionSuccess] = useState(''); // Success messages

  // --- Fetch User's Team Data ---
  const fetchTeamData = async () => {
    setLoading(true);
    setError('');
    try {
      // Axios will use the default headers set by AuthContext
      const response = await axios.get(`${API_URL}/teams/me`); // Use /teams/
      setTeamData(response.data);
      console.log('Fetched team data:', response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // 404 means user is not in a team, which is not an error in this context
        setTeamData(null);
        console.log('User is not part of any team.');
      } else {
        const message = err.response?.data?.msg || err.message || 'Error fetching team data';
        setError(message);
        console.error('Error fetching team data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []); // Fetch data on component mount

  // --- Handle Team Creation ---
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!teamName.trim()) {
      setActionError('Team name is required.');
      return;
    }
    // --- Added Logging ---
    const targetUrl = `${API_URL}/teams/create`; // Use /teams/
    console.log('Attempting to POST to:', targetUrl); // Log the URL before sending
    // --- End Added Logging ---
    try {
      // Axios will use the default headers set by AuthContext
      const response = await axios.post(
        targetUrl, // Use the constructed URL
        { name: teamName }
       );
      setActionSuccess(`Team "${response.data.name}" created successfully!`);
      setTeamData(response.data); // Update state with the new team
      setShowCreateModal(false); // Close modal
      setTeamName(''); // Reset form
      // Optionally re-fetch all team data if needed, though the response should be sufficient
      // fetchTeamData();
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Error creating team';
      setActionError(message);
      console.error('Error creating team:', err);
    }
  };

  // --- Handle Joining Team ---
  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!teamIDToJoin.trim()) {
      setActionError('Team ID is required.');
      return;
    }
    const targetUrl = `${API_URL}/teams/join`; // Use /teams/
    console.log('Attempting to POST to:', targetUrl); // Log the URL before sending
    try {
      // Axios will use the default headers set by AuthContext
      const response = await axios.post(
        targetUrl, // Use the constructed URL
        { teamID: teamIDToJoin }
       );
      setActionSuccess(response.data.msg || 'Successfully joined the team!');
      setTeamData(response.data.team); // Update state with the joined team
      setShowJoinModal(false); // Close modal
      setTeamIDToJoin(''); // Reset form
      // Optionally re-fetch all team data
      // fetchTeamData();
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Error joining team';
      setActionError(message);
      console.error('Error joining team:', err);
    }
  };

  // --- Handle Logout ---
  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Redirect to login page after logout
  };

  // --- Render Logic ---
  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <button onClick={handleLogout} style={{ position: 'absolute', top: '10px', right: '10px' }}>Logout</button> {/* Logout Button */}

      {teamData ? (
        // --- User is in a team ---
        <div className="team-details">
          <h3>Your Team: {teamData.name}</h3>
          {teamData.mentorId && (
            <p>
              <strong>Mentor:</strong> {teamData.mentorId.username || 'N/A'}
            </p>
          )}
          <h4>Members:</h4>
          <ul>
            {teamData.members && teamData.members.length > 0 ? (
              teamData.members.map((member) => (
                <li key={member._id}>
                  <strong>Name:</strong> {member.username} |{' '}
                  <strong>Class:</strong> {member.role} |{' '}
                  {/* Add Health display logic here */}
                  <strong>Health:</strong> {'100/100'} {/* Placeholder */}
                  {teamData.teamLeadId === member._id ? ' (Lead)' : ''}
                </li>
              ))
            ) : (
              <li>No members found in the team data.</li>
            )}
          </ul>
          {/* Add other team-related actions/info here if needed */}
        </div>
      ) : (
        // --- User is not in a team ---
        <div className="no-team">
          <p>You are not currently part of a team.</p>
          <button onClick={() => { setShowCreateModal(true); setActionError(''); setActionSuccess(''); }}>Create Team</button>
          <button onClick={() => { setShowJoinModal(true); setActionError(''); setActionSuccess(''); }}>Join Team</button>

          {/* Basic Inline Create Team Modal/Form */}
          {showCreateModal && (
            <div className="modal">
              <h3>Create a New Team</h3>
              <form onSubmit={handleCreateTeam}>
                <input
                  type="text"
                  placeholder="Enter Team Name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </form>
              {actionError && <p style={{ color: 'red' }}>{actionError}</p>}
              {actionSuccess && <p style={{ color: 'green' }}>{actionSuccess}</p>}
            </div>
          )}

          {/* Basic Inline Join Team Modal/Form */}
          {showJoinModal && (
            <div className="modal">
              <h3>Join an Existing Team</h3>
              <form onSubmit={handleJoinTeam}>
                <input
                  type="text"
                  placeholder="Enter Team ID"
                  value={teamIDToJoin}
                  onChange={(e) => setTeamIDToJoin(e.target.value)}
                  required
                />
                <button type="submit">Join</button>
                <button type="button" onClick={() => setShowJoinModal(false)}>Cancel</button>
              </form>
              {actionError && <p style={{ color: 'red' }}>{actionError}</p>}
              {actionSuccess && <p style={{ color: 'green' }}>{actionSuccess}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
