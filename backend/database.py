import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # XAMPP default password empty hota hai
        database="face_attendance_db"
    )