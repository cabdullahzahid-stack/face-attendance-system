import React, { useEffect, useState } from 'react';

const Dashboard = () => {

  const [data, setData] = useState({
    total_students: 0,
    present_today: 0,
    absent_today: 0,
    attendance_percentage: 0
  });

  const [loading, setLoading] =
    useState(true);

  const fetchDashboard = async () => {

    try {

      const response = await fetch(
        'http://127.0.0.1:5000/api/dashboard'
      );

      const result =
        await response.json();

      if (response.ok) {
        setData(result);
      }

    } catch (error) {

      console.error(
        'Dashboard Error:',
        error
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    fetchDashboard();

  }, []);

  if (loading) {

    return (
      <div style={{ padding: '20px' }}>
        Loading Dashboard...
      </div>
    );

  }

  return (

    <div
      style={{
        padding: '25px',
        fontFamily: 'Arial'
      }}
    >

      <h2>
        Attendance Dashboard
      </h2>

      <p>
        Today's Attendance Summary
      </p>


      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: '20px',
          marginTop: '25px'
        }}
      >

        {/* TOTAL STUDENTS */}

        <div style={cardStyle}>

          <h3>
            Total Students
          </h3>

          <p style={numberStyle}>
            {data.total_students}
          </p>

        </div>


        {/* PRESENT */}

        <div style={cardStyle}>

          <h3>
            Present Today
          </h3>

          <p style={numberStyle}>
            {data.present_today}
          </p>

        </div>


        {/* ABSENT */}

        <div style={cardStyle}>

          <h3>
            Absent Today
          </h3>

          <p style={numberStyle}>
            {data.absent_today}
          </p>

        </div>


        {/* PERCENTAGE */}

        <div style={cardStyle}>

          <h3>
            Attendance %
          </h3>

          <p style={numberStyle}>
            {data.attendance_percentage}%
          </p>

        </div>

      </div>

    </div>
  );
};


const cardStyle = {

  padding: '20px',

  background: '#1e293b',

  color: '#fff',

  borderRadius: '10px',

  textAlign: 'center',

  boxShadow:
    '0 2px 8px rgba(0,0,0,0.15)'

};


const numberStyle = {

  fontSize: '32px',

  fontWeight: 'bold',

  margin: '10px 0'

};


export default Dashboard;