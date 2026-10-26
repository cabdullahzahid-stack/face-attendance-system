from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime

from face_engine import (
    extract_face_encoding,
    process_live_frame,
    compare_encodings
)

app = Flask(__name__)
CORS(app)


# =========================
# DATABASE CONNECTION
# =========================

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="face_attendance_db"
    )


# =========================
# REGISTER STUDENT
# =========================

@app.route('/api/register-student', methods=['POST'])
def register_student():

    db = None
    cursor = None

    try:
        student_id = request.form.get('student_id')
        name = request.form.get('name')
        roll_no = request.form.get('roll_no', '')
        department = request.form.get('department', '')
        semester = request.form.get('semester', '')
        image = request.files.get('image')

        if not student_id or not name or not image:
            return jsonify({
                'error': 'Student ID, Name and Image are required'
            }), 400

        # Extract face
        encoding = extract_face_encoding(image)

        if not encoding:
            return jsonify({
                'error': 'Exactly one clear face must be visible in the image'
            }), 400

        # Database
        db = get_db()
        cursor = db.cursor(dictionary=True)

        # Check student ID
        cursor.execute(
            """
            SELECT *
            FROM students
            WHERE student_id = %s
            """,
            (student_id,)
        )

        existing_student = cursor.fetchone()

        # Check duplicate face
        cursor.execute(
            """
            SELECT student_id, name, face_encoding
            FROM students
            WHERE face_encoding IS NOT NULL
            """
        )

        existing_students = cursor.fetchall()

        for student in existing_students:

            if (
                existing_student
                and student['student_id'] == student_id
            ):
                continue

            try:
                distance = compare_encodings(
                    encoding,
                    student['face_encoding']
                )

                print(
                    f"[DEBUG] Comparing with "
                    f"{student['name']} "
                    f"({student['student_id']}) "
                    f"Distance: {distance:.4f}"
                )

                if distance < 0.25:
                    return jsonify({
                        'error':
                        f"Face already registered with "
                        f"{student['name']} "
                        f"({student['student_id']})"
                    }), 409

            except Exception as e:
                print("Face comparison error:", e)

        # Update existing student
        if existing_student:

            cursor.execute(
                """
                UPDATE students
                SET
                    name = %s,
                    roll_no = %s,
                    department = %s,
                    semester = %s,
                    face_encoding = %s
                WHERE student_id = %s
                """,
                (
                    name,
                    roll_no,
                    department,
                    semester,
                    encoding,
                    student_id
                )
            )

            message = "Student updated successfully"

        # New student
        else:

            cursor.execute(
                """
                INSERT INTO students
                (
                    student_id,
                    name,
                    roll_no,
                    department,
                    semester,
                    face_encoding
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    student_id,
                    name,
                    roll_no,
                    department,
                    semester,
                    encoding
                )
            )

            message = "Student registered successfully"

        db.commit()

        return jsonify({
            'message': message
        }), 200

    except mysql.connector.Error as e:

        if db:
            db.rollback()

        print("Database Error:", str(e))

        return jsonify({
            'error': f'Database Error: {str(e)}'
        }), 500

    except Exception as e:

        if db:
            db.rollback()

        print("Registration Error:", str(e))

        return jsonify({
            'error': str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# =========================
# RECOGNIZE LIVE FRAME
# =========================

@app.route('/api/recognize-frame', methods=['POST'])
def recognize_frame():

    db = None
    cursor = None

    try:

        if 'image' not in request.files:
            return jsonify({
                'error': 'No image uploaded'
            }), 400

        image = request.files['image']

        db = get_db()

        cursor = db.cursor(dictionary=True)

        # Get registered students
        cursor.execute("""
            SELECT
                student_id,
                name,
                roll_no,
                face_encoding
            FROM students
            WHERE face_encoding IS NOT NULL
        """)

        students = cursor.fetchall()

        # Face recognition
        results = process_live_frame(
            image,
            students
        )

        # =========================
        # MARK ATTENDANCE
        # =========================

        attendance_results = []

        current_date = datetime.now().date()
        current_time = datetime.now().time()

        for result in results:

            student_id = result.get('student_id')

            # Ignore unknown faces
            if not student_id or student_id == 'Unknown':
                attendance_results.append(result)
                continue

            # Check today's attendance
            cursor.execute(
                """
                SELECT attendance_id
                FROM attendance
                WHERE student_id = %s
                AND date = %s
                """,
                (
                    student_id,
                    current_date
                )
            )

            existing_attendance = cursor.fetchone()

            if existing_attendance:

                result['status'] = 'Already Marked Present'

                attendance_results.append(result)

                print(
                    f"[ATTENDANCE] Already marked: "
                    f"{student_id}"
                )

            else:

                try:

                    cursor.execute(
                        """
                        INSERT INTO attendance
                        (
                            student_id,
                            date,
                            time,
                            status
                        )
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            student_id,
                            current_date,
                            current_time,
                            'Present'
                        )
                    )

                    result['status'] = 'Marked Present'

                    attendance_results.append(result)

                    print(
                        f"[ATTENDANCE] Marked Present: "
                        f"{student_id}"
                    )

                except mysql.connector.IntegrityError:

                    # Database unique constraint protection
                    result['status'] = 'Already Marked Present'

                    attendance_results.append(result)

                    print(
                        f"[ATTENDANCE] Duplicate prevented: "
                        f"{student_id}"
                    )

        # Save attendance changes
        db.commit()

        return jsonify({
            'recognized': attendance_results
        }), 200

    except mysql.connector.Error as e:

        if db:
            db.rollback()

        print(
            "Database Error:",
            str(e)
        )

        return jsonify({
            'error': str(e)
        }), 500

    except Exception as e:

        if db:
            db.rollback()

        print(
            "Recognize Frame Exception:",
            str(e)
        )

        return jsonify({
            'error': str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()
# =========================
# ATTENDANCE HISTORY
# =========================

@app.route('/api/attendance-history', methods=['GET'])
def attendance_history():

    db = None
    cursor = None

    try:

        date = request.args.get('date')
        search = request.args.get('search', '').strip()

        if not date:
            date = datetime.now().date()

        db = get_db()

        cursor = db.cursor(dictionary=True)

        query = """
            SELECT
                a.attendance_id,
                a.student_id,
                s.name,
                s.roll_no,
                s.department,
                s.semester,
                a.date,
                a.time,
                a.status
            FROM attendance a
            LEFT JOIN students s
                ON a.student_id = s.student_id
            WHERE a.date = %s
        """

        params = [date]

        if search:

            query += """
                AND (
                    s.name LIKE %s
                    OR s.roll_no LIKE %s
                    OR a.student_id LIKE %s
                )
            """

            search_value = f"%{search}%"

            params.extend([
                search_value,
                search_value,
                search_value
            ])

        query += """
            ORDER BY a.time DESC
        """

        cursor.execute(query, params)

        records = cursor.fetchall()

        for record in records:

            if record['date']:
                record['date'] = str(record['date'])

            if record['time']:
                record['time'] = str(record['time'])

        return jsonify({
            'attendance': records
        }), 200

    except Exception as e:

        print(
            "Attendance History Error:",
            str(e)
        )

        return jsonify({
            'error': str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()
            # =========================
# DASHBOARD
# =========================

@app.route('/api/dashboard', methods=['GET'])
def dashboard():

    db = None
    cursor = None

    try:

        db = get_db()
        cursor = db.cursor(dictionary=True)

        today = datetime.now().date()

        # Total students
        cursor.execute("""
            SELECT COUNT(*) AS total_students
            FROM students
        """)

        total_students = cursor.fetchone()['total_students']

        # Present today
        cursor.execute("""
            SELECT COUNT(*) AS present_today
            FROM attendance
            WHERE date = %s
            AND status = 'Present'
        """, (today,))

        present_today = cursor.fetchone()['present_today']

        # Absent today
        absent_today = max(
            total_students - present_today,
            0
        )

        # Attendance percentage
        if total_students > 0:
            attendance_percentage = round(
                (present_today / total_students) * 100,
                2
            )
        else:
            attendance_percentage = 0

        return jsonify({
            'total_students': total_students,
            'present_today': present_today,
            'absent_today': absent_today,
            'attendance_percentage':
                attendance_percentage
        }), 200

    except Exception as e:

        print(
            "Dashboard Error:",
            str(e)
        )

        return jsonify({
            'error': str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()
            # =========================
# DOWNLOAD ATTENDANCE CSV
# =========================

@app.route('/api/attendance-csv', methods=['GET'])
def attendance_csv():

    import csv
    from io import StringIO
    from flask import Response

    db = None
    cursor = None

    try:

        date = request.args.get('date')

        if not date:
            date = str(datetime.now().date())

        db = get_db()

        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                a.student_id,
                s.name,
                s.roll_no,
                s.department,
                s.semester,
                a.date,
                a.time,
                a.status
            FROM attendance a
            LEFT JOIN students s
                ON a.student_id = s.student_id
            WHERE a.date = %s
            ORDER BY a.time ASC
        """, (date,))

        records = cursor.fetchall()

        output = StringIO()

        writer = csv.writer(output)

        # CSV headings
        writer.writerow([
            'Student ID',
            'Name',
            'Roll No',
            'Department',
            'Semester',
            'Date',
            'Time',
            'Status'
        ])

        # CSV data
        for record in records:

            writer.writerow([
                record['student_id'],
                record['name'],
                record['roll_no'],
                record['department'],
                record['semester'],
                str(record['date']),
                str(record['time']),
                record['status']
            ])

        csv_data = output.getvalue()

        return Response(
            csv_data,
            mimetype='text/csv',
            headers={
                'Content-Disposition':
                f'attachment; filename=attendance_{date}.csv'
            }
        )

    except Exception as e:

        print(
            "CSV Export Error:",
            str(e)
        )

        return jsonify({
            'error': str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

# =========================
# RUN FLASK SERVER
# =========================

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )