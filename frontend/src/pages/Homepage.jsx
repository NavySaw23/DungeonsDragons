import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

import '../css/Homepage.css'
import BG_UI from '../assets/login_bg.svg'
import dnd_logo from '../assets/logo_dnd.svg'

function Homepage() {
  return (
    <div className="container">
      <div className="left-container">
        <img src={BG_UI} alt="Background Illustration" className="svg-illustration" />
      </div>

      <div className="right-container">
        <div className="black-box">
          <img src={dnd_logo} alt="DND Logo" className="logo_dnd" />
          <h1>Deadlines & Dragons</h1>
          <p>Be In Control, Start Keeping your Projects and Deadlines in Check</p>
          {/* <button><Link to="/login">Get Started</Link></button> */}
          <Link to="/login" className="homepage-button">Get Started</Link>
        </div>
      </div>
    </div>
  );
}

export default Homepage;