import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StudyTimer from "./StudyTimer";

const API = "https://exam-tracker-cloud.onrender.com";

const StudyTracker = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    subjectName: "",
    examDate: "",
    studyHoursPlanned: "",
    priority: "Normal",
    difficulty: "Medium",
  });

  const [editingRecordId, setEditingRecordId] = useState(null);
  const [activeTimerRecord, setActiveTimerRecord] = useState(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${API}/api/studyRecords/${userId}`);
      setRecords(res.data || []);
    } catch (error) {
      console.error("Error fetching records", error);
      navigate("/login");
    }
  };

  return (
    <div>
      <h2>Study Tracker</h2>

      {records.length === 0 && <p>No study records yet.</p>}

      {records.map((rec) => (
        <div key={rec._id}>
          <b>{rec.subjectName}</b> – {rec.studyHoursPlanned} hrs –{" "}
          {rec.syllabusStatus}
        </div>
      ))}
    </div>
  );
};

export default StudyTracker;
