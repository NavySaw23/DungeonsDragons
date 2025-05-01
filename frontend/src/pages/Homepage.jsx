import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../css/Homepage.css';
import BG_UI from '../assets/login_bg.svg';
import dnd_logo from '../assets/logo_dnd.svg';

function Homepage() {
  return (
    <div className="homepage-container">
      <div className="homepage-left-container">
        <img src={BG_UI} alt="Background Illustration" className="homepage-svg-illustration" />
      </div>

      <div className="homepage-right-container">
        <div className="homepage-black-box">
          <img src={dnd_logo} alt="DND Logo" className="homepage-logo-dnd" />
          <h1 className="homepage-title">Deadlines & Dragons</h1>
          <p className="homepage-description">Be In Control, Start Keeping your Projects and Deadlines in Check</p>
          <Link to="/login" className="homepage-button">Get Started</Link>
        </div>
      </div>
    </div>
  );
}

export default Homepage;