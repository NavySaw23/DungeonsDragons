// src/calendar/calendar.jsx
import { useState, useEffect } from 'react';
import './calendar.css';

export default function CalendarWidget() {
  const [currentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState(null);
  
  // Sample events data - in a real app, this would come from a database
  const events = [
    {
      id: 1,
      title: "Meeting",
      time: "9:00 AM",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      weather: "rainy",
      highlighted: true
    },
    {
      id: 2,
      title: "Project Work",
      time: "11:00 AM",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      weather: null,
      highlighted: false
    },
    {
      id: 3,
      title: "Brainstorming",
      time: "2:00 PM",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      weather: null,
      highlighted: false
    },
    {
      id: 4,
      title: "Submission",
      time: "4:00 PM",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      weather: null,
      highlighted: false
    }
  ];

  useEffect(() => {
    // Calculate more days for the calendar view
    const today = new Date(currentDate);
    
    // Start from current day minus 4 to show more days
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 4);
    
    const days = [];
    for (let i = 0; i < 9; i++) { // Show 9 days for more context
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      days.push(day);
    }
    
    setWeekDays(days);
    setSelectedDay(today); // Initialize selected day to today
  }, [currentDate]);

  const formatDateHeader = (date) => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  const getDayName = (date) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    return date.getDate() === selectedDay.getDate() &&
      date.getMonth() === selectedDay.getMonth() &&
      date.getFullYear() === selectedDay.getFullYear();
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    // In a real app, you would fetch events for the selected day here
  };

  // Weather icon component with more visual interest
  const WeatherIcon = ({ type }) => {
    if (type === "rainy") {
      return (
        <div className="weather-icons">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="rain-drop"></div>
          <div className="rain-drop" style={{ left: '10px', animationDelay: '0.3s' }}></div>
          <div className="rain-drop" style={{ left: '18px', animationDelay: '0.1s' }}></div>
        </div>
      );
    }
    return null;
  };

  // Make sure we have weekDays before rendering
  if (weekDays.length === 0) return <div className="loading-calendar">Loading calendar...</div>;

  return (
    <div className="calendar-app">
      {/* Calendar header with date selection */}
      <div className="header-container">
        <div>
          <div className="date-header">{formatDateHeader(selectedDay)}</div>
          <h1 className="today-heading">Today</h1>
        </div>
        
        {/* Calendar controls could go here */}
        <div className="calendar-controls">
          <button className="control-button">
            <span className="control-icon">◀</span>
          </button>
          <span className="current-month">{new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate)}</span>
          <button className="control-button">
            <span className="control-icon">▶</span>
          </button>
        </div>
      </div>
      
      <div className="week-container">
        {weekDays.map((day, index) => (
          <div 
            key={index}
            className={`day-item ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
            onClick={() => handleDayClick(day)}
          >
            <span className="day-number">{day.getDate()}</span>
            <span className="day-name">{getDayName(day)}</span>
            {isSelected(day) && <div className="day-indicator"></div>}
          </div>
        ))}
      </div>
      
      {/* Quick status overview */}
      <div className="status-overview">
        <div className="status-item">
          <div className="status-dot status-dot-green"></div>
          <span>Completed: 2</span>
        </div>
        <div className="status-item">
          <div className="status-dot status-dot-orange"></div>
          <span>In Progress: 1</span>
        </div>
        <div className="status-item">
          <div className="status-dot status-dot-blue"></div>
          <span>Upcoming: 1</span>
        </div>
      </div>
      
      {/* Events timeline section */}
      <div className="timeline-container">
        <div className="timeline-content">
          {/* Left timeline line with time indicators */}
          <div className="timeline-line">
            <div className="time-marker" style={{ top: '9%' }}>9AM</div>
            <div className="time-marker" style={{ top: '33%' }}>11AM</div>
            <div className="time-marker" style={{ top: '58%' }}>2PM</div>
            <div className="time-marker" style={{ top: '83%' }}>4PM</div>
          </div>
          
          {/* Events */}
          <div className="events-list">
            {events.map((event, index) => (
              <div 
                key={event.id} 
                className="event-item"
                onMouseEnter={() => setHoveredEvent(event.id)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* Timeline dot */}
                <div className="event-dot">
                  <div className={`dot ${index === 0 ? 'active' : 'inactive'} ${hoveredEvent === event.id ? 'pulse' : ''}`}></div>
                </div>
                
                {/* Event card */}
                <div className={`event-card ${event.highlighted ? 'highlighted' : ''} ${hoveredEvent === event.id ? 'hovered' : ''}`}>
                  <div className="event-content">
                    <div className="event-info">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.description}</p>
                      
                      {/* Event tags - adds more visual detail */}
                      {index === 0 && (
                        <div className="event-tags">
                          <span className="event-tag">Team</span>
                          <span className="event-tag">Priority</span>
                        </div>
                      )}
                    </div>
                    <div className="event-time">
                      <p>{event.time}</p>
                      {event.weather && (
                        <WeatherIcon type={event.weather} />
                      )}
                    </div>
                  </div>
                  
                  
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Dynamic background elements */}
      <div className="dynamic-background">
        <div className="glow-effect glow-1"></div>
        <div className="glow-effect glow-2"></div>
        
        {/* Decorative lines */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i}
            className="wave-line"
            style={{
              borderRadius: `${400 + i * 50}px`,
              transform: `translateX(${i * 15}px) rotate(${i * 0.5}deg)`,
              opacity: 0.03 + (i * 0.005)
            }}
          />
        ))}
      </div>
    </div>
  );
}