// src/calendar/calendar.jsx
import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext'; // Import default export
import './calendar.css';

export default function CalendarWidget() {
  const { user, token } = useContext(AuthContext); // Get user and token
  const [currentDate, setCurrentDate] = useState(new Date()); // Allow updating currentDate
  const [weekDays, setWeekDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Access API_URL from environment variables
  const API_URL = process.env.REACT_APP_API_URL;

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

  // Fetch team data (including tasks)
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!API_URL) {
        setError('API URL is not configured. Please set REACT_APP_API_URL in your .env file.');
        setLoading(false);
        return;
      }
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await axios.get(`${API_URL}/team/me`, config);
        setTeamData(response.data);
        console.log("Fetched team data for calendar:", response.data);
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError(err.response?.data?.msg || 'Failed to fetch team data');
        setTeamData(null); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [token]); // Re-fetch if token changes

  useEffect(() => {
    const referenceDate = new Date(currentDate); // Use currentDate as the reference
    // Start from current day minus 4 to show more days
    const startDay = new Date(referenceDate);
    startDay.setDate(referenceDate.getDate() - 4); // Calculate start based on reference

    const days = [];
    for (let i = 0; i < 9; i++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      days.push(day);
    }
    
    setWeekDays(days);
    setSelectedDay(referenceDate); // Initialize selected day to the reference date
  }, [currentDate]); // Re-run when currentDate changes

  // Transform fetched tasks into the event format
  const tasksAsEvents = useMemo(() => {
    if (!teamData?.projectId?.tasks) {
      return [];
    }
    return teamData.projectId.tasks.map((task, index) => ({
      id: task._id,
      title: task.name,
      // Format deadline - adjust formatting as needed
      time: task.deadline ? new Date(task.deadline).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'No Deadline',
      date: task.deadline ? new Date(task.deadline) : null, // Store the date object
      description: task.description || 'No description provided.',
      status: task.completionStatus, // Keep status for potential filtering/styling
      weather: null, // Placeholder, can be adapted if needed
      highlighted: index === 0, // Example highlighting logic
      difficulty: task.difficulty, // Add difficulty field
      assignees: task.assignees?.map(a => a.username).join(', ') || 'Unassigned', // Display assignees
    }));
  }, [teamData]);

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

  // --- Calendar Navigation ---
  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7); // Move back 7 days
    setCurrentDate(newDate);
    setSelectedDay(newDate); // Optionally move selected day too
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7); // Move forward 7 days
    setCurrentDate(newDate);
    setSelectedDay(newDate); // Optionally move selected day too
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1); // Move back 1 month
    setCurrentDate(newDate);
    setSelectedDay(newDate); // Move selected day to the new month
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1); // Move forward 1 month
    setCurrentDate(newDate);
    setSelectedDay(newDate); // Move selected day to the new month
  };
  // Filter events to show only those for the selected day
  const eventsForSelectedDay = useMemo(() => {
    return tasksAsEvents.filter(event => {
      if (!event.date) return false; // Don't show tasks without deadlines on specific days
      return event.date.getDate() === selectedDay.getDate() &&
             event.date.getMonth() === selectedDay.getMonth() &&
             event.date.getFullYear() === selectedDay.getFullYear();
    });
  }, [tasksAsEvents, selectedDay]);

  // Filter tasks to show upcoming ones (after selected day)
  const upcomingTasks = useMemo(() => {
    // Normalize selectedDay to the start of the day for comparison
    const startOfSelectedDay = new Date(selectedDay);
    startOfSelectedDay.setHours(0, 0, 0, 0);

    return tasksAsEvents
      .filter(event => {
        if (!event.date) return false; // Only include tasks with deadlines
        return event.date > startOfSelectedDay; // Check if task date is after selected day
      })
      .sort((a, b) => a.date - b.date); // Sort upcoming tasks by date
  }, [tasksAsEvents, selectedDay]);

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

   // Helper function for relative date names
   const getRelativeDayName = (selectedDate) => {
    const today = new Date();
    // Normalize dates to the start of the day for accurate comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    const diffTime = selectedStart.getTime() - todayStart.getTime();
    // Calculate difference in days
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays === 2) return "Day After Tomorrow";
    if (diffDays === -2) return "Day Before Yesterday";

    // Calculate start and end of the current week (assuming Sunday start)
    const currentWeekStart = new Date(todayStart);
    currentWeekStart.setDate(todayStart.getDate() - today.getDay()); // Go back to Sunday
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Go forward to Saturday

    const selectedDayOfWeek = selectedDate.getDay(); // 0=Sun, 6=Sat

    // Check if selected date is within the current week AND is a Saturday or Sunday
    if (selectedStart >= currentWeekStart && selectedStart <= currentWeekEnd && (selectedDayOfWeek === 0 || selectedDayOfWeek === 6)) {
        // Avoid overriding more specific labels if they fall on the weekend
        if (diffDays !== 0 && diffDays !== 1 && diffDays !== -1) {
            return "This Weekend";
        }
    }

    // Fallback to short day name (e.g., "Mon")
    return getDayName(selectedDate);
  };

  // Loading and error states
  if (loading) return <div className="loading-calendar">Loading calendar data...</div>;
  if (error) return <div className="error-calendar">Error: {error}</div>;
  if (!teamData && !loading) return <div className="info-calendar">You are not currently part of a team or no data available.</div>

  return (
    <div className="calendar-app">
      {/* Calendar header with date selection */}
      <div className="header-container">
        <div>
          <div className="date-header">{formatDateHeader(selectedDay)}</div>
          <h1 className="today-heading">{getRelativeDayName(selectedDay)}</h1> {/* Use new relative name function */}
          {/* <h1 className="today-heading">{isToday(selectedDay) ? 'Today' : getDayName(selectedDay)}</h1> Make heading dynamic */}
        </div>

        {/* Calendar controls could go here */}
        <div className="calendar-controls">
          {/* Month Navigation Buttons */}
          <button className="control-button month-nav-button" onClick={handlePreviousMonth}>
            <span className="control-icon">«</span> {/* Using double arrows for month */}
          </button>
          {/* Month/Year display remains */}
          <span className="current-month">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDay)}</span> {/* Display month of selectedDay */}
          <button className="control-button month-nav-button" onClick={handleNextMonth}>
            <span className="control-icon">»</span> {/* Using double arrows for month */}
          </button>
        </div>
      </div>

      {/* Week Container now includes navigation */}
      <div className="week-container">
        {/* Previous Week Button */}
        <button className="control-button week-nav-button week-nav-embedded" onClick={handlePreviousWeek}>
          <span className="control-icon">◀</span>
        </button>

        {/* Day Items */}
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`day-item ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
            onClick={() => handleDayClick(day)}
          >
            <span className="day-number">{day.getDate()}</span>
            <span className="day-name">{getDayName(day)}</span>
            {/* Indicator dot removed */}
          </div>
        ))}
        {/* Next Week Button */}
        <button className="control-button week-nav-button week-nav-embedded" onClick={handleNextWeek}>
          <span className="control-icon">▶</span>
        </button>
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
          {/* Show timeline if there are events today OR upcoming events */}
          {eventsForSelectedDay.length > 0 && (
             <div className="timeline-line">
               {/* Example static markers - needs refinement */}
               <div className="time-marker" style={{ top: '9%' }}>9AM</div>
               <div className="time-marker" style={{ top: '33%' }}>11AM</div>
               <div className="time-marker" style={{ top: '58%' }}>2PM</div>
               <div className="time-marker" style={{ top: '83%' }}>4PM</div>
             </div>
          )}

          {/* Events */}
          <div className="events-list">
            {eventsForSelectedDay.length === 0 ? (
              <>
                <p className="no-events-message">No tasks scheduled for {formatDateHeader(selectedDay)}.</p>
                {upcomingTasks.length > 0 && (
                  <div className="upcoming-tasks-section">
                    <h4 className="upcoming-tasks-header">Upcoming Tasks</h4>
                    {/* Use the same event card structure for upcoming tasks */}
                    {upcomingTasks.slice(0, 5).map(task => ( // Show first 5 upcoming tasks
                      <div
                        key={task.id}
                        className="event-item" // Use the same base class
                        // Omitting hover effects for simplicity on upcoming list
                      >
                        {/* Timeline dot */}
                        <div className="event-dot">
                           {/* Style dot based on task status */}
                          <div className={`dot ${task.status === 'Completed' ? 'completed' : task.status === 'InProgress' ? 'in-progress' : 'upcoming'}`}></div>
                        </div>

                        {/* Event card */}
                        {/* Omitting highlighted and hover classes for upcoming list */}
                        <div className={`event-card`}>
                          <div className="event-content">
                            <div className="event-info">
                              <h3 className="event-title">{task.title}</h3>
                              <p className="event-description">{task.description}</p>
                              <p className="event-assignees">Assignees: {task.assignees}</p>
                              <p className="event-date-upcoming">Due: {formatDateHeader(task.date)}</p> {/* Show full date */}
                            </div>
                            <div className="event-time">
                              {/* Time removed */}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              eventsForSelectedDay.map((event, index) => (
              <div
                key={event.id} 
                className="event-item"
                onMouseEnter={() => setHoveredEvent(event.id)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* Timeline dot */}
                <div className="event-dot">
                  {/* TODO: Style dot based on task status (event.status) */}
                  <div className={`dot ${event.status === 'Completed' ? 'completed' : event.status === 'InProgress' ? 'in-progress' : 'upcoming'} ${hoveredEvent === event.id ? 'pulse' : ''}`}></div>
                </div>

                {/* Event card */}
                <div className={`event-card ${event.highlighted ? 'highlighted' : ''} ${hoveredEvent === event.id ? 'hovered' : ''}`}>
                  <div className="event-content">
                    <div className="event-info">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.description}</p>
                      <p className="event-assignees">Assignees: {event.assignees}</p>
                      {/* Display priority tag based on difficulty */}
                      {event.difficulty && ( // Only show if difficulty exists
                        <div className="event-tags">
                          <span className={`event-tag ${event.difficulty === 'Hard' ? 'priority-high' : 'priority-low'}`}>
                            {event.difficulty} {/* Display the actual difficulty value */}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="event-time">
                      {/* Time removed */}
                      {event.weather && (
                        <WeatherIcon type={event.weather} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
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