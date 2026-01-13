import { useState, useEffect } from 'react';
import axios from 'axios';
import StudyTimer from './StudyTimer';

const StudyTracker = () => {
    const [records, setRecords] = useState([]);
    const [newRecord, setNewRecord] = useState({
        subjectName: '',
        examDate: '',
        studyHoursPlanned: '', // Will store "HH:MM:SS" or "HH:MM" depending on browser
        priority: 'Normal'
    });

    const [editingRecordId, setEditingRecordId] = useState(null);
    const [activeTimerRecord, setActiveTimerRecord] = useState(null);

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        // Request notification permission on mount
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, []);

    // Notifications Logic
    const checkNotifications = (records) => {
        if (Notification.permission !== "granted") return;

        records.forEach(record => {
            const examDate = new Date(record.examDate);
            const now = new Date();
            const timeDiff = examDate - now;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            // Notify conditions:
            // 1. Exam is within 3 days
            // 2. AND (Priority is Urgent/Important OR Difficulty is Hard)
            // 3. AND Not Completed
            const isHighPriority = ['Urgent', 'Important'].includes(record.priority);
            const isHard = record.difficulty === 'Hard';

            if (daysDiff >= 0 && daysDiff <= 3 && (isHighPriority || isHard) && record.syllabusStatus !== 'Completed') {
                new Notification(`⚠️ Study Reminder: ${record.subjectName}`, {
                    body: `Upcoming ${record.difficulty} subject exam in ${daysDiff === 0 ? 'today' : daysDiff + ' days'}! Priority: ${record.priority}`
                });
            }
        });
    };

    const fetchRecords = async () => {
        if (!userId) return;
        try {
            const res = await axios.get(`https://exam-tracker-cloud.onrender.com/api/studyRecords/${userId}`);
            // Ensure data is array
            if (Array.isArray(res.data)) {
                setRecords(res.data);
                checkNotifications(res.data);
            } else {
                setRecords([]);
            }
        } catch (error) {
            console.error('Error fetching records', error);
            setRecords([]);
        }
    };

    const handleChange = (e) => {
        setNewRecord({ ...newRecord, [e.target.name]: e.target.value });
    };

    const handleAddRecord = async (e) => {
        e.preventDefault();

        if (!newRecord.subjectName || !newRecord.examDate || !newRecord.studyHoursPlanned) return;

        try {
            if (editingRecordId) {
                // Update existing record
                await axios.patch(`https://exam-tracker-cloud.onrender.com/api/updateStudyRecord/${editingRecordId}`, {
                    ...newRecord
                });
                setEditingRecordId(null);
            } else {
                // Add new record
                await axios.post('https://exam-tracker-cloud.onrender.com/api/addStudyRecord', {
                    ...newRecord,
                    studentId: userId
                });
            }
            fetchRecords();
            setNewRecord({ subjectName: '', examDate: '', studyHoursPlanned: '', priority: 'Normal', difficulty: 'Medium' });
        } catch (error) {
            console.error('Error saving record', error);
            const errorMsg = error.response?.data?.error || error.message;
            alert(`Failed to save record: ${errorMsg}`);
        }
    };

    const handleEditClick = (record) => {
        setEditingRecordId(record._id);

        setNewRecord({
            subjectName: record.subjectName,
            // Format date for input type="date"
            examDate: record.examDate ? new Date(record.examDate).toISOString().split('T')[0] : '',
            // Ensure time format matches standard
            studyHoursPlanned: record.studyHoursPlanned || '',
            priority: record.priority || 'Normal',
            difficulty: record.difficulty || 'Medium'
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingRecordId(null);
        setNewRecord({ subjectName: '', examDate: '', studyHoursPlanned: '', priority: 'Normal', difficulty: 'Medium' });
    };

    const getExamStatus = (dateString) => {
        if (!dateString) return 'Upcoming';
        const examDate = new Date(dateString);
        const now = new Date();
        // Reset time for accurate date comparison
        now.setHours(0, 0, 0, 0);
        examDate.setHours(0, 0, 0, 0);

        return examDate < now ? 'Completed' : 'Upcoming';
    };

    const getStatusBadge = (status) => {
        const className = status === 'Completed' ? 'status-completed' : 'status-upcoming';
        return <span className={`status-badge ${className}`}>{status}</span>;
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return '#ef4444';
            case 'Important': return '#f97316';
            default: return '#10b981';
        }
    };

    const getPriorityBadge = (priority) => {
        const lower = (priority || 'Normal').toLowerCase();
        return <span className={`priority-badge badge-${lower}`}>{priority || 'Normal'}</span>;
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            await axios.delete(`https://exam-tracker-cloud.onrender.com/api/deleteStudyRecord/${id}`);
            fetchRecords();
        } catch (error) {
            console.error('Error deleting record', error);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`https://exam-tracker-cloud.onrender.com/api/updateStudyRecord/${id}`, {
                syllabusStatus: newStatus
            });
            fetchRecords();
        } catch (error) {
            console.error('Error updating status', error);
        }
    };

    const handleTimerComplete = async () => {
        if (activeTimerRecord) {
            // Automatically mark as Completed when timer finishes
            await handleUpdateStatus(activeTimerRecord._id, 'Completed');
            setActiveTimerRecord(null); // Close the timer modal
            alert(`Great job! ${activeTimerRecord.subjectName} marked as Completed.`);
        }
    };

    const handleSaveProgress = async (secondsCompleted) => {
        if (activeTimerRecord) {
            try {
                const updates = { studyHoursCompleted: secondsCompleted };

                // Logic:
                // If Completed > Lock (don't change status)
                // If > 0 > In Progress
                // If 0 (Reset) > Not Started
                if (activeTimerRecord.syllabusStatus !== 'Completed') {
                    if (secondsCompleted > 0) {
                        updates.syllabusStatus = 'In Progress';
                    } else {
                        updates.syllabusStatus = 'Not Started';
                    }
                }

                await axios.patch(`https://exam-tracker-cloud.onrender.com/api/updateStudyRecord/${activeTimerRecord._id}`, updates);
                fetchRecords(); // Refresh to update local state
            } catch (error) {
                console.error('Error saving progress', error);
            }
        }
    };

    return (
        <div className="container">
            {activeTimerRecord && (
                <StudyTimer
                    subjectName={activeTimerRecord.subjectName}
                    initialDuration={activeTimerRecord.studyHoursPlanned}
                    initialCompleted={activeTimerRecord.studyHoursCompleted || 0}
                    onClose={() => setActiveTimerRecord(null)}
                    onComplete={handleTimerComplete}
                    onSaveProgress={handleSaveProgress}
                />
            )}

            <div className="card">
                <h3>{editingRecordId ? 'Edit Study Record' : 'Add New Study Record'}</h3>
                <form onSubmit={handleAddRecord} className="study-form">
                    <div className="form-group">
                        <label>Subject Name</label>
                        <input name="subjectName" placeholder="e.g. Mathematics" value={newRecord.subjectName || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Exam Date</label>
                        <input name="examDate" type="date" value={newRecord.examDate || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Duration</label>
                        <input
                            name="studyHoursPlanned"
                            type="time"
                            step="1"
                            value={newRecord.studyHoursPlanned || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Priority</label>
                        <select name="priority" value={newRecord.priority || 'Normal'} onChange={handleChange} style={{ color: 'var(--text-main)' }}>
                            <option value="Normal">Normal</option>
                            <option value="Important">Important</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Difficulty</label>
                        <select name="difficulty" value={newRecord.difficulty || 'Medium'} onChange={handleChange} style={{ color: 'var(--text-main)' }}>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary" style={{ height: '48px', marginTop: 'auto' }}>
                            {editingRecordId ? 'Update Record' : 'Add Record'}
                        </button>
                        {editingRecordId && (
                            <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} style={{ height: '48px', marginTop: 'auto' }}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Exam Schedule & Progress</h3>
                    <div style={{ background: '#e0f2fe', padding: '0.5rem 1rem', borderRadius: '20px', color: '#0369a1', fontWeight: 600 }}>
                        Overall Progress: {Math.round((records.filter(r => r.syllabusStatus === 'Completed').length / (records.length || 1)) * 100)}%
                        ({records.filter(r => r.syllabusStatus === 'Completed').length}/{records.length} Completed)
                    </div>
                </div>
                <div className="records-grid">
                    {records.map((record) => (
                        <div key={record._id} className="record-card" style={{ borderLeft: `5px solid ${getPriorityColor(record.priority)}` }}>
                            <div className="record-header">
                                <div>
                                    <span className="record-subject">{record.subjectName}</span>
                                    <div className="record-meta">
                                        <span className={`difficulty-badge ${record.difficulty === 'Hard' ? 'text-red-500' : ''}`}>
                                            {record.difficulty || 'Medium'}
                                        </span>
                                        <span className="record-date">📅 {record.examDate ? new Date(record.examDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.25rem' }}>
                                    {getPriorityBadge(record.priority)}
                                    {getStatusBadge(getExamStatus(record.examDate))}
                                </div>
                            </div>

                            <div className="record-body">
                                <div className="time-stat">
                                    <span className="label">Planned Time</span>
                                    <span className="value">{record.studyHoursPlanned}</span>
                                </div>
                                <div className="status-control">
                                    <span className="label">Current Status</span>
                                    <select
                                        className="status-select"
                                        value={record.syllabusStatus || 'Not Started'}
                                        onChange={(e) => handleUpdateStatus(record._id, e.target.value)}
                                        disabled={record.syllabusStatus === 'Completed'}
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="record-actions">
                                {record.syllabusStatus !== 'Completed' && (
                                    <>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => setActiveTimerRecord(record)}
                                            style={{ flex: 1 }}
                                        >
                                            ⏱️ Timer
                                        </button>
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={() => handleEditClick(record)}
                                            style={{ flex: 1 }}
                                        >
                                            ✏️ Edit
                                        </button>
                                    </>
                                )}
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(record._id)}
                                    style={{ flex: 1 }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {records.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <h3>No study records yet 📚</h3>
                        <p>Add your first subject above to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyTracker;
