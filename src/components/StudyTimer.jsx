import { useState, useEffect, useRef } from 'react';

const StudyTimer = ({ subjectName, initialDuration, initialCompleted, onClose, onComplete, onSaveProgress }) => {

    // Parse HH:MM:SS to total seconds
    const parseDurationToSeconds = (durationStr) => {
        if (!durationStr) return 25 * 60; // Default 25 mins
        const parts = durationStr.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 3) { // HH:MM:SS
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) { // HH:MM
            seconds = parts[0] * 3600 + parts[1] * 60;
        }
        return seconds || 25 * 60;
    };

    const totalDuration = parseDurationToSeconds(initialDuration);
    // Determine start time: Total - Completed (ensure not negative)
    const startTimeLeft = Math.max(0, totalDuration - (initialCompleted || 0));

    const [timeLeft, setTimeLeft] = useState(startTimeLeft);
    const [isActive, setIsActive] = useState(false);

    // Keep track of latest timeLeft for cleanup saving
    const timeLeftRef = useRef(timeLeft);

    useEffect(() => {
        timeLeftRef.current = timeLeft;
    }, [timeLeft]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    const newValue = prev - 1;
                    timeLeftRef.current = newValue; // Update ref immediately
                    return newValue;
                });
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Timer finished naturally
            clearInterval(interval);
            setIsActive(false);
            if (Notification.permission === "granted") {
                new Notification("Time's Up!", {
                    body: `You have completed your study session for ${subjectName}.`
                });
            }
            if (onComplete) onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, subjectName, onComplete]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
        setIsActive(true);
        // Also update status to 'In Progress' if needed? 
        // For now, tracking time only.
    };

    const handlePause = () => {
        setIsActive(false);
        saveCurrentProgress();
    };

    const handleClose = () => {
        setIsActive(false);
        saveCurrentProgress();
        onClose();
    };

    const saveCurrentProgress = () => {
        // Calculate total completed: Total Duration - Current Time Left
        const completed = totalDuration - timeLeftRef.current;
        if (onSaveProgress) {
            onSaveProgress(completed);
        }
    };

    const handleReset = () => {
        if (confirm("Reset timer? This will clear your progress for this session.")) {
            setIsActive(false);
            setTimeLeft(totalDuration); // Reset to full duration
            timeLeftRef.current = totalDuration;
            if (onSaveProgress) onSaveProgress(0); // Reset progress in backend
        }
    };

    return (
        <div className="timer-overlay">
            <div className="timer-card">
                <h3>Studying: {subjectName}</h3>

                <div className="timer-display">
                    {formatTime(timeLeft)}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#64748b' }}>
                    Progress: {Math.max(0, Math.floor(((totalDuration - timeLeft) / totalDuration) * 100))}%
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1rem' }}>
                    {!isActive ? (
                        <button onClick={handleStart} className="btn btn-primary" disabled={timeLeft === 0}>Start</button>
                    ) : (
                        <button onClick={handlePause} className="btn btn-warning">Pause</button>
                    )}
                    <button onClick={handleReset} className="btn btn-secondary">Reset</button>
                    <button onClick={handleClose} className="btn btn-danger">Close</button>
                </div>
            </div>
        </div>
    );
};

export default StudyTimer;
