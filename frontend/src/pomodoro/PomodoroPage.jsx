import React, { useState, useEffect, useRef } from 'react';
import wavesBg from '../assets/waves.svg';
import alertSound from '../assets/notification.mp3';
import music1 from '../assets/Rain_sound.mp3';
import music2 from '../assets/Night_sound.mp3';

const PomodoroTimer = () => {
    const workTime = 25 * 60;
    const breakTime = 5 * 60;

    const [timeLeft, setTimeLeft] = useState(workTime);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('work'); // 'work' or 'break'
    const [showSwitchButton, setShowSwitchButton] = useState(false);

    const timerRef = useRef(null);
    const alertRef = useRef(new Audio(alertSound));
    const music1Ref = useRef(new Audio(music1));
    const music2Ref = useRef(new Audio(music2));

    const radius = 230;
    const circumference = 2 * Math.PI * radius;
    const progress = ((mode === 'work' ? workTime : breakTime) - timeLeft) / (mode === 'work' ? workTime : breakTime);
    const strokeDashoffset = circumference - (progress * circumference);

    const strokeColor = mode === 'break'
        ? 'limegreen'
        : progress >= 0.75
            ? 'red'
            : 'cyan';

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setIsRunning(false);
                        if (mode === 'work') playAlertThrice();
                        setShowSwitchButton(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [isRunning]);

    const formatTime = () => {
        const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const s = String(timeLeft % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleReset = () => {
        clearInterval(timerRef.current);
        setIsRunning(false);
        setTimeLeft(mode === 'work' ? workTime : breakTime);
        setShowSwitchButton(false);
    };

    const handleSwitchMode = () => {
        const nextMode = mode === 'work' ? 'break' : 'work';
        setMode(nextMode);
        setTimeLeft(nextMode === 'work' ? workTime : breakTime);
        setShowSwitchButton(false);
    };

    const playAlertThrice = () => {
        let count = 0;
        const playAlert = () => {
            alertRef.current.currentTime = 0;
            alertRef.current.play();
            count++;
            if (count < 3) {
                setTimeout(playAlert, 1000);
            }
        };
        playAlert();
    };

    const playMusic1 = () => {
        const music = music1Ref.current;
        const other = music2Ref.current;
    
        if (!music.paused) {
            music.pause();
            music.currentTime = 0;
        } else {
            other.pause(); // stop the other one if playing
            other.currentTime = 0;
            music.currentTime = 0;
            music.play();
        }
    };
    
    const playMusic2 = () => {
        const music = music2Ref.current;
        const other = music1Ref.current;
    
        if (!music.paused) {
            music.pause();
            music.currentTime = 0;
        } else {
            other.pause(); // stop the other one if playing
            other.currentTime = 0;
            music.currentTime = 0;
            music.play();
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.rowContainer}>
                <div>
                    <svg width="500" height="500">
                        <circle stroke="#555" strokeWidth="12" r={radius} cx="250" cy="250" />
                        <circle
                            stroke={strokeColor}
                            strokeWidth="12"
                            r={radius}
                            cx="250"
                            cy="250"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{
                                transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
                                transform: 'rotate(-90deg)',
                                transformOrigin: 'center',
                            }}
                        />
                        <text
                            x="50%"
                            y="50%"
                            dominantBaseline="middle"
                            textAnchor="middle"
                            fontSize="60"
                            fill="#fff"
                            fontFamily="monospace"
                        >
                            {formatTime()}
                        </text>
                    </svg>

                    <div style={styles.buttons}>
                        <button onClick={() => setIsRunning(prev => !prev)} style={styles.button}>
                            {isRunning ? 'Pause' : 'Play'}
                        </button>
                        <button onClick={handleReset} style={styles.button}>
                            Stop
                        </button>
                        {showSwitchButton && (
                            <button onClick={handleSwitchMode} style={styles.button}>
                                {mode === 'work' ? 'Break' : 'Work'}
                            </button>
                        )}
                    </div>
                </div>

                <div style={styles.rightButtons}>
                    <button onClick={playMusic1} style={styles.button}>🎵 1</button>
                    <button onClick={playMusic2} style={styles.button}>🎵 2</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#191919',
        backgroundImage: `url(${wavesBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
    },
    rowContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
    },
    buttons: {
        marginTop: 40,
        display: 'flex',
        gap: 30,
        justifyContent: 'center',
    },
    rightButtons: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    button: {
        padding: '20px',
        fontSize: 20,
        borderRadius: '50%',
        border: 'none',
        background: '#000000',
        color: '#ccc',
        cursor: 'pointer',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 6px rgba(255, 255, 255, 0.1)',
        transition: 'background 0.3s ease',
    },
};

export default PomodoroTimer;
