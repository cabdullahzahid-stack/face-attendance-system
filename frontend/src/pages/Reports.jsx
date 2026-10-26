import React, { useState } from 'react';

const Reports = () => {

  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState(false);


  const downloadCSV = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        `http://127.0.0.1:5000/api/attendance-csv?date=${date}`
      );

      if (!response.ok) {
        throw new Error(
          'CSV download failed'
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        `attendance_${date}.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(
        'CSV Download Error:',
        error
      );

      alert(
        'Unable to download CSV report'
      );

    } finally {

      setLoading(false);

    }
  };


  return (

    <div
      style={{
        padding: '30px',
        fontFamily: 'Arial',
        maxWidth: '900px',
        margin: '0 auto'
      }}
    >

      <h2>
        Attendance Reports
      </h2>

      <p>
        Generate and download attendance reports.
      </p>


      <div
        style={{
          marginTop: '25px',
          padding: '25px',
          border: '1px solid #ddd',
          borderRadius: '10px',
          maxWidth: '500px',
          boxShadow:
            '0 4px 12px rgba(0,0,0,0.08)'
        }}
      >

        <h3>
          Daily Attendance Report
        </h3>


        <div
          style={{
            marginTop: '20px'
          }}
        >

          <label>
            <strong>
              Select Date
            </strong>
          </label>

          <br />

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
            style={{
              marginTop: '8px',
              padding: '10px',
              width: '100%',
              boxSizing: 'border-box',
              border:
                '1px solid #ccc',
              borderRadius: '5px'
            }}
          />

        </div>


        <button
          onClick={downloadCSV}
          disabled={loading}
          style={{
            marginTop: '20px',
            padding: '12px 20px',
            background: '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: 'bold'
          }}
        >

          {loading
            ? 'Preparing CSV...'
            : 'Download CSV Report'}

        </button>

      </div>

    </div>
  );
};

export default Reports;