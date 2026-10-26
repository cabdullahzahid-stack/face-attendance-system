import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { registerStudent } from '../services/api';

const StudentRegister = () => {
  const webcamRef = useRef(null);
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    roll_no: '',
    department: '',
    semester: ''
  });
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const capturePhoto = () => {
    const image = webcamRef.current.getScreenshot();
    setImageSrc(image);
  };

  const dataURLtoBlob = (dataurl) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], {type:mime});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageSrc) {
      alert("Pehle photo capture karein!");
      return;
    }

    setLoading(true);
    setMessage('');

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    const blob = dataURLtoBlob(imageSrc);
    data.append('image', blob, 'student.jpg');

    try {
      const res = await registerStudent(data);
      setMessage(res.data.message);
      setFormData({ student_id: '', name: '', roll_no: '', department: '', semester: '' });
      setImageSrc(null);
    } catch (err) {
      setMessage(err.response?.data?.error || "Registration error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h2>Student Face Registration</h2>
      {message && <p style={{ padding: '10px', background: '#e2e8f0' }}>{message}</p>}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input name="student_id" placeholder="Student ID (e.g. STU01)" value={formData.student_id} onChange={handleChange} required />
          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          <input name="roll_no" placeholder="Roll No" value={formData.roll_no} onChange={handleChange} required />
          <input name="department" placeholder="Department" value={formData.department} onChange={handleChange} required />
          <input name="semester" placeholder="Semester" value={formData.semester} onChange={handleChange} required />
          <button type="submit" disabled={loading} style={{ padding: '10px', background: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {loading ? "Saving..." : "Register Student"}
          </button>
        </form>

        <div style={{ flex: 1, textAlign: 'center' }}>
          {!imageSrc ? (
            <>
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" />
              <button onClick={capturePhoto} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>Capture Photo</button>
            </>
          ) : (
            <>
              <img src={imageSrc} alt="Captured" style={{ width: '100%' }} />
              <button onClick={() => setImageSrc(null)} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>Retake Photo</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;