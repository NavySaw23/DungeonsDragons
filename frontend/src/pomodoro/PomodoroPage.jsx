import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Volume2, VolumeX } from 'lucide-react';
import rainSoundFile from '../assets/Rain_sound.mp3';
import nightSoundFile from '../assets/Night_sound.mp3';
import alertSoundFile from '../assets/notification.mp3';

const PomodoroTimer = () => {
  // Configurable timer settings
  const workTime = 25 * 60;
  const breakTime = 5 * 60;
  const longBreakTime = 15 * 60;

  const [timeLeft, setTimeLeft] = useState(workTime);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work', 'break', or 'longBreak'
  const [cycles, setCycles] = useState(0); // Count completed work sessions
  const [isMusicPlaying, setIsMusicPlaying] = useState({ rain: false, night: false });

  const timerRef = useRef(null);
  const rainSoundRef = useRef(new Audio(rainSoundFile));
  const nightSoundRef = useRef(new Audio(nightSoundFile));
  const alertSoundRef = useRef(new Audio(alertSoundFile));

  // Calculate progress for the circle animation
  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  const getCurrentModeTime = () => {
    if (mode === 'work') return workTime;
    if (mode === 'break') return breakTime;
    return longBreakTime;
  };

  const progress = (getCurrentModeTime() - timeLeft) / getCurrentModeTime();
  const strokeDashoffset = circumference - (progress * circumference);

  // Get the stroke color based on mode and progress
  const getStrokeColor = () => {
    if (mode === 'break') return '#4ade80'; // green-400
    if (mode === 'longBreak') return '#60a5fa'; // blue-400

    // Work mode colors based on progress
    if (progress >= 0.75) return '#ef4444'; // red-500
    if (progress >= 0.5) return '#eab308'; // yellow-500
    return '#22d3ee'; // cyan-400
  };

  // Dynamic background color
  const getBgColor = () => {
    if (mode === 'break') return '#166534'; // green-800
    if (mode === 'longBreak') return '#1e40af'; // blue-800
    return '#164e63'; // cyan-800
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playAlert();

            // Auto transition logic
            if (mode === 'work') {
              const nextCycles = cycles + 1;
              setCycles(nextCycles);

              // Every 4 work sessions, take a long break
              if (nextCycles % 4 === 0) {
                setMode('longBreak');
                setTimeLeft(longBreakTime);
              } else {
                setMode('break');
                setTimeLeft(breakTime);
              }
            } else {
              // After break, return to work
              setMode('work');
              setTimeLeft(workTime);
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, cycles]);

  const formatTime = () => {
    const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setTimeLeft(getCurrentModeTime());
  };

  const handleChangeMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);

    if (newMode === 'work') setTimeLeft(workTime);
    else if (newMode === 'break') setTimeLeft(breakTime);
    else setTimeLeft(longBreakTime);
  };

  const playAlert = () => {
    alertSoundRef.current.currentTime = 0;
    alertSoundRef.current.volume = 0.7; // Increased alert volume
    alertSoundRef.current.play();
  };

  const toggleMusic = (type) => {
    setIsMusicPlaying(prev => {
      let newRain = prev.rain;
      let newNight = prev.night;

      if (type === 'rain') {
        newRain = !prev.rain;
        newNight = false;
      } else if (type === 'night') {
        newNight = !prev.night;
        newRain = false;
      }

      if (newRain) {
        rainSoundRef.current.loop = true;
        rainSoundRef.current.volume = 0.5; // Set rain volume
        rainSoundRef.current.play();
      } else {
        rainSoundRef.current.pause();
        rainSoundRef.current.currentTime = 0;
      }

      if (newNight) {
        nightSoundRef.current.loop = true;
        nightSoundRef.current.volume = 0.5; // Set night volume
        nightSoundRef.current.play();
      } else {
        nightSoundRef.current.pause();
        nightSoundRef.current.currentTime = 0;
      }

      return { rain: newRain, night: newNight };
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#111827', // gray-900
      color: 'white',
      padding: '24px'
    }}>
      {/* Mode selection tabs */}
      <div style={{
        display: 'flex',
        marginBottom: '32px',
        backgroundColor: '#1f2937', // gray-800
        borderRadius: '9999px',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => handleChangeMode('work')}
          style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: mode === 'work' ? '#2563eb' : 'transparent', // blue-600
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <Briefcase style={{ marginRight: '8px' }} size={16} />
          <span style={{ color: 'white' }}>Focus</span>
        </button>
        <button
          onClick={() => handleChangeMode('break')}
          style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: mode === 'break' ? '#16a34a' : 'transparent', // green-600
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <Coffee style={{ marginRight: '8px' }} size={16} />
          <span style={{ color: 'white' }}>Short Break</span>
        </button>
        <button
          onClick={() => handleChangeMode('longBreak')}
          style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: mode === 'longBreak' ? '#3b82f6' : 'transparent', // blue-500
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <Coffee style={{ marginRight: '8px' }} size={16} />
          <span style={{ color: 'white' }}>Long Break</span>
        </button>
      </div>

      {/* Status indicator */}
      <div style={{
        marginBottom: '16px',
        fontSize: '1.125rem',
        fontWeight: '600'
      }}>
        {mode === 'work' ? 'Focus Time' : mode === 'break' ? 'Short Break' : 'Long Break'}
        {cycles > 0 && (
          <span style={{
            marginLeft: '8px',
            fontSize: '0.875rem',
            backgroundColor: '#374151', // gray-700
            padding: '4px 8px',
            borderRadius: '9999px'
          }}>
            Cycle {Math.ceil(cycles/4)} · Session {(cycles-1)%4+1}/4
          </span>
        )}
      </div>

      {/* Timer circle */}
      <div style={{
        position: 'relative',
        marginBottom: '32px'
      }}>
        <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            stroke="#374151" // gray-700
            strokeWidth="8"
            r={radius}
            cx="140"
            cy="140"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            stroke={getStrokeColor()}
            strokeWidth="8"
            r={radius}
            cx="140"
            cy="140"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
          />
        </svg>

        {/* Time display */}
        <div style={{
          position: 'absolute',
          inset: '0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '3rem',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}>{formatTime()}</span>
        </div>
      </div>

      {/* Control buttons */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '40px'
      }}>
        <button
          onClick={() => setIsRunning(prev => !prev)}
          style={{
            padding: '16px',
            borderRadius: '9999px',
            backgroundColor: isRunning ? '#ea580c' : '#16a34a', // orange-600 : green-600
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <button
          onClick={handleReset}
          style={{
            padding: '16px',
            borderRadius: '9999px',
            backgroundColor: '#374151', // gray-700
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Sound controls */}
      <div style={{
        display: 'flex',
        gap: '16px'
      }}>
        <button
          onClick={() => toggleMusic('rain')}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: isMusicPlaying.rain ? '#2563eb' : '#374151', // blue-600 : gray-700
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {isMusicPlaying.rain ? <Volume2 style={{ marginRight: '8px' }} size={16} /> : <VolumeX style={{ marginRight: '8px' }} size={16} />}
          Rain Sounds
        </button>

        <button
          onClick={() => toggleMusic('night')}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: isMusicPlaying.night ? '#4f46e5' : '#374151', // indigo-600 : gray-700
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {isMusicPlaying.night ? <Volume2 style={{ marginRight: '8px' }} size={16} /> : <VolumeX style={{ marginRight: '8px' }} size={16} />}
          Night Sounds
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;