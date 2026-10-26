import React, { useState } from 'react';

import Dashboard from './pages/Dashboard';
import StudentRegister from './pages/StudentRegister';
import LiveAttendance from './pages/LiveAttendance';
import AttendanceHistory from './pages/AttendanceHistory';
import Reports from './pages/Reports';

function App() {

  const [activeTab, setActiveTab] =
    useState('dashboard');

  return (

    <div>

      {/* =========================
          NAVIGATION BAR
      ========================= */}

      <nav
        style={{
          display: 'flex',
          gap: '20px',
          padding: '15px',
          background: '#1e293b',
          color: '#fff',
          flexWrap: 'wrap'
        }}
      >

        <button
          onClick={() =>
            setActiveTab('dashboard')
          }
          style={buttonStyle}
        >
          Dashboard
        </button>


        <button
          onClick={() =>
            setActiveTab('register')
          }
          style={buttonStyle}
        >
          Register Student
        </button>


        <button
          onClick={() =>
            setActiveTab('scanner')
          }
          style={buttonStyle}
        >
          Live Attendance Scanner
        </button>


        <button
          onClick={() =>
            setActiveTab('history')
          }
          style={buttonStyle}
        >
          Attendance History
        </button>


        <button
          onClick={() =>
            setActiveTab('reports')
          }
          style={buttonStyle}
        >
          Reports
        </button>

      </nav>


      {/* =========================
          PAGES
      ========================= */}

      {activeTab === 'dashboard' && (
        <Dashboard />
      )}


      {activeTab === 'register' && (
        <StudentRegister />
      )}


      {activeTab === 'scanner' && (
        <LiveAttendance />
      )}


      {activeTab === 'history' && (
        <AttendanceHistory />
      )}


      {activeTab === 'reports' && (
        <Reports />
      )}

    </div>
  );
}


/* =========================
   BUTTON STYLE
========================= */

const buttonStyle = {
  padding: '8px 16px',
  cursor: 'pointer',
  background: '#334155',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  fontWeight: 'bold'
};


export default App;