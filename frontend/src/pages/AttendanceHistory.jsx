import React, { useEffect, useState } from 'react';

const AttendanceHistory = () => {

  const [attendance, setAttendance] = useState([]);

  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        `http://127.0.0.1:5000/api/attendance-history?date=${date}&search=${encodeURIComponent(search)}`
      );

      const data = await response.json();

      if (response.ok) {

        setAttendance(
          data.attendance || []
        );

      } else {

        console.error(data.error);
        setAttendance([]);

      }

    } catch (error) {

      console.error(
        'Attendance History Error:',
        error
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    fetchAttendance();

  }, [date]);

  const handleSearch = (e) => {

    e.preventDefault();

    fetchAttendance();

  };

  return (

    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial'
      }}
    >

      <h2>
        Attendance History
      </h2>

      {/* FILTERS */}

      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >

        <div>

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
              padding: '8px'
            }}
          />

        </div>


        <div>

          <label>
            <strong>
              Search Student
            </strong>
          </label>

          <br />

          <input
            type="text"
            placeholder="Name / Roll No / Student ID"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              padding: '8px',
              width: '250px'
            }}
          />

        </div>


        <div
          style={{
            display: 'flex',
            alignItems: 'end'
          }}
        >

          <button
            type="submit"
            style={{
              padding: '9px 18px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>

        </div>

      </form>


      {/* SUMMARY */}

      <div
        style={{
          marginBottom: '15px',
          fontWeight: 'bold'
        }}
      >

        Date: {date}

        {' | '}

        Total Present:
        {' '}
        {attendance.length}

      </div>


      {/* TABLE */}

      {loading ? (

        <p>
          Loading attendance...
        </p>

      ) : attendance.length === 0 ? (

        <p>
          No attendance found for this date.
        </p>

      ) : (

        <div
          style={{
            overflowX: 'auto'
          }}
        >

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}
          >

            <thead>

              <tr
                style={{
                  background: '#1e293b',
                  color: 'white'
                }}
              >

                <th style={cellStyle}>
                  #
                </th>

                <th style={cellStyle}>
                  Student ID
                </th>

                <th style={cellStyle}>
                  Name
                </th>

                <th style={cellStyle}>
                  Roll No
                </th>

                <th style={cellStyle}>
                  Department
                </th>

                <th style={cellStyle}>
                  Semester
                </th>

                <th style={cellStyle}>
                  Date
                </th>

                <th style={cellStyle}>
                  Time
                </th>

                <th style={cellStyle}>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {attendance.map(
                (record, index) => (

                  <tr
                    key={
                      record.attendance_id
                    }
                  >

                    <td style={cellStyle}>
                      {index + 1}
                    </td>

                    <td style={cellStyle}>
                      {record.student_id}
                    </td>

                    <td style={cellStyle}>
                      {record.name || 'N/A'}
                    </td>

                    <td style={cellStyle}>
                      {record.roll_no || 'N/A'}
                    </td>

                    <td style={cellStyle}>
                      {record.department || 'N/A'}
                    </td>

                    <td style={cellStyle}>
                      {record.semester || 'N/A'}
                    </td>

                    <td style={cellStyle}>
                      {record.date}
                    </td>

                    <td style={cellStyle}>
                      {record.time}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        color: '#16a34a',
                        fontWeight: 'bold'
                      }}
                    >
                      {record.status}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
};


const cellStyle = {
  border: '1px solid #ccc',
  padding: '10px',
  textAlign: 'left'
};


export default AttendanceHistory;