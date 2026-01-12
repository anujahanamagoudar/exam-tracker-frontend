import { useState, useEffect } from 'react';
import axios from 'axios';
import StudyTimer from './StudyTimer';

const API = "https://exam-tracker-cloud.onrender.com";

const StudyTracker = () => {
    const [records, setRecords] = useState([]);
    const [newRecord, setNewRecord] = useState({
        subjectName: '',
        examDate: '',
        studyHoursPlanned: '',
        priority: 'Normal'
    });

    const [editingRecordId, setEditingRecordId] = useState(null);
    const [activeTimerRecord, setActiveTimerRecord] = useState(null);

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, []);

    const checkNotifications = (records) => {
        if (Notification.permission !== "granted") return;

        records.forEach(record => {
            const examDate = new Date(record.examDate);
            const now = new Date();
            const timeDiff = examDate - now;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

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
            const res = await axios.get(`${API}/api/studyRecords/${userId}`);
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
                await axios.patch(`${API}/api/updateStudyRecord/${editingRecordId}`, { ...newRecord });
                setEditingRecordId(null);
            } else {
                await axios.post(`${API}/api/addStudyRecord`, {
                    ...newRecord,
                    studentId: userId
                });
            }
            fetchRecords();
            setNewRecord({ subjectName: '', examDate: '', studyHoursPlanned: '', priority: 'Normal', difficulty: 'Medium' });
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            alert(`Failed to save record: ${errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            await axios.delete(`${API}/api/deleteStudyRecord/${id}`);
            fetchRecords();
        } catch (error) {
            console.error('Error deleting record', error);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`${API}/api/updateStudyRecord/${id}`, {
                syllabusStatus: newStatus
            });
            fetchRecords();
        } catch (error) {
            console.error('Error updating status', error);
        }
    };

    const handleTimerComplete = async () => {
        if (activeTimerRecord) {
            await handleUpdateStatus(activeTimerRecord._id, 'Completed');
            setActiveTimerRecord(null);
            alert(`Great job! ${activeTimerRecord.subjectName} marked as Completed.`);
        }
    };

    const handleSaveProgress = async (secondsCompleted) => {
        if (activeTimerRecord) {
            try {
                const updates = { studyHoursCompleted: secondsCompleted };

                if (activeTimerRecord.syllabusStatus !== 'Completed') {
                    if (secondsCompleted > 0) updates.syllabusStatus = 'In Progress';
                    else updates.syllabusStatus = 'Not Started';
                }

                await axios.patch(`${API}/api/updateStudyRecord/${activeTimerRecord._id}`, updates);
                fetchRecords();
            } catch (error) {
                console.error('Error saving progress', error);
            }
        }
    };

    // UI remains unchanged
    return <>{/* keep rest of your JSX as is */}</>;
};

export default StudyTracker;
