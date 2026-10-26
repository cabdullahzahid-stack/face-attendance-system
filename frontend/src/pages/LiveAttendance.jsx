import React, {
  useRef,
  useState,
  useEffect
} from 'react';

import Webcam from 'react-webcam';

import { recognizeFrame } from '../services/api';

const LiveAttendance = () => {

  const webcamRef = useRef(null);
  const processingRef = useRef(false);

  const [logs, setLogs] = useState([]);
  const [statusText, setStatusText] =
    useState('Scanning...');

  const [faces, setFaces] = useState([]);

  const dataURLtoBlob = (dataurl) => {

    const arr = dataurl.split(',');

    const mime =
      arr[0].match(/:(.*?);/)[1];

    const bstr = atob(arr[1]);

    let n = bstr.length;

    const u8arr =
      new Uint8Array(n);

    while (n--) {
      u8arr[n] =
        bstr.charCodeAt(n);
    }

    return new Blob(
      [u8arr],
      { type: mime }
    );
  };

  const processFrame = async () => {

    if (processingRef.current)
      return;

    if (!webcamRef.current)
      return;

    const imageSrc =
      webcamRef.current.getScreenshot();

    if (!imageSrc)
      return;

    processingRef.current = true;

    try {

      const blob =
        dataURLtoBlob(imageSrc);

      const res =
        await recognizeFrame(blob);

      const recognizedList =
        res.data.recognized ||
        res.data.results ||
        [];

      setFaces(recognizedList);

      if (recognizedList.length > 0) {

        recognizedList.forEach((item) => {

          const studentName =
            item.name ||
            item.student_name ||
            'Unknown';

          const studentId =
            item.id ||
            item.student_id ||
            'Unknown';

          const rollNo =
            item.roll_no ||
            '';

          if (studentId !== 'Unknown') {

            setLogs((prev) => {

              const alreadyExists =
                prev.some(
                  (log) =>
                    log.id === studentId
                );

              if (alreadyExists) {

                setStatusText(
                  `${studentName} - This student is already marked present`
                );

                return prev;
              }

              setStatusText(
                `Match Found: ${studentName}`
              );

              const newLog = {

                id: studentId,

                name: studentName,

                rollNo: rollNo,

                status:
                  'Marked Present',

                time:
                  new Date()
                    .toLocaleTimeString(),

                timestamp:
                  new Date()
              };

              return [
                newLog,
                ...prev
              ].slice(0, 10);
            });

          } else {

            setStatusText(
              'Face detected - Not Registered'
            );
          }

        });

      } else {

        setStatusText(
          'Scanning for face...'
        );
      }

    } catch (err) {

      console.error(
        'Scanning Error:',
        err
      );

      setStatusText(
        'API Scanning Error'
      );

    } finally {

      processingRef.current = false;
    }
  };

  useEffect(() => {

    const interval =
      setInterval(() => {

        processFrame();

      }, 2000);

    return () => {
      clearInterval(interval);
    };

  }, []);

  return (

    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial'
      }}
    >

      <h2>
        Real-Time Face Recognition Attendance Scanner
      </h2>

      <p
        style={{
          fontWeight: 'bold',
          color: '#0284c7'
        }}
      >
        Status: {statusText}
      </p>

      <div
        style={{
          display: 'flex',
          gap: '20px'
        }}
      >

        {/* CAMERA */}

        <div
          style={{
            flex: 1,
            position: 'relative'
          }}
        >

          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{
              facingMode: 'user'
            }}
          />

          {/* FACE BOXES */}

          {faces.map((face, index) => {

            if (!face.box)
              return null;

            const box = face.box;

            /*
              Backend image is usually 640x480.
              Camera display uses percentage.
            */

            const left =
              (box.x / 640) * 100;

            const top =
              (box.y / 480) * 100;

            const width =
              (box.w / 640) * 100;

            const height =
              (box.h / 480) * 100;

            const isMatched =
              face.student_id !==
              'Unknown';

            return (

              <div
                key={index}
                style={{
                  position: 'absolute',

                  left: `${left}%`,

                  top: `${top}%`,

                  width: `${width}%`,

                  height: `${height}%`,

                  border:
                    isMatched
                      ? '3px solid #22c55e'
                      : '3px solid #ef4444',

                  boxSizing:
                    'border-box',

                  pointerEvents:
                    'none'
                }}
              >

                {/* NAME LABEL */}

                <div
                  style={{
                    position: 'absolute',

                    top: '-55px',

                    left: '0',

                    background:
                      isMatched
                        ? '#16a34a'
                        : '#dc2626',

                    color: 'white',

                    padding:
                      '6px 10px',

                    borderRadius:
                      '5px',

                    fontSize:
                      '14px',

                    fontWeight:
                      'bold',

                    whiteSpace:
                      'nowrap'
                  }}
                >

                  {isMatched
                    ? face.name
                    : 'Unknown Face'}

                  {isMatched &&
                    face.roll_no && (
                      <div
                        style={{
                          fontSize:
                            '12px',
                          fontWeight:
                            'normal',
                          marginTop:
                            '2px'
                        }}
                      >
                        Roll No:
                        {' '}
                        {face.roll_no}
                      </div>
                    )}

                </div>

              </div>
            );
          })}

        </div>


        {/* ATTENDANCE LOGS */}

        <div
          style={{
            flex: 1
          }}
        >

          <h3>
            Live Attendance Logs
          </h3>

          <ul
            style={{
              listStyleType:
                'none',

              padding: 0
            }}
          >

            {logs.length === 0 ? (

              <li
                style={{
                  color: '#aaa'
                }}
              >
                No attendance marked yet.
                Look into the camera.
              </li>

            ) : (

              logs.map((log) => (

                <li
                  key={log.id}

                  style={{
                    padding: '10px',

                    borderBottom:
                      '1px solid #ccc',

                    background:
                      '#1e293b',

                    color: '#fff',

                    marginBottom:
                      '5px',

                    borderRadius:
                      '4px'
                  }}
                >

                  <strong>
                    {log.name}
                  </strong>

                  {' '}

                  ({log.id})

                  {log.rollNo && (
                    <>
                      {' - '}
                      Roll No:
                      {' '}
                      {log.rollNo}
                    </>
                  )}

                  {' — '}

                  <span
                    style={{
                      color:
                        '#4ade80'
                    }}
                  >
                    {log.status}
                  </span>

                  {' '}
                  at {log.time}

                </li>

              ))

            )}

          </ul>

        </div>

      </div>

    </div>
  );
};

export default LiveAttendance;