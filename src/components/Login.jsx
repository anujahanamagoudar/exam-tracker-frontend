import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ setAuth }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Login form submitted", formData);
        try {
            const res = await axios.post('http://localhost:5001/api/login', formData);
            console.log("Login response:", res.data);
            localStorage.setItem('userId', res.data.userId);
            localStorage.setItem('username', res.data.username);
            console.log("Setting auth to true");
            setAuth(true); // Update parent state
            console.log("Navigating to dashboard");
            navigate('/dashboard');
        } catch (error) {
            console.error("Login Error:", error);
            setError(error.response?.data?.error || 'Invalid credentials');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Welcome Back</h2>
                {error && <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
                    <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                </form>
                <div className="auth-link">
                    Don't have an account? <Link to="/register">Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
