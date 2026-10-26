import cv2
import numpy as np
import json
import os
import urllib.request


CASCADE_FILENAME = "haarcascade_frontalface_default.xml"
CASCADE_URL = (
    "https://raw.githubusercontent.com/opencv/opencv/master/"
    "data/haarcascades/haarcascade_frontalface_default.xml"
)

# Lower = stricter matching
MATCH_THRESHOLD = 120.0

# If the best and second-best matches are too close,
# don't confidently identify the face.
MIN_MATCH_GAP = 10.0


def get_face_cascade():
    if not os.path.exists(CASCADE_FILENAME):
        try:
            urllib.request.urlretrieve(
                CASCADE_URL,
                CASCADE_FILENAME
            )
        except Exception as e:
            print("Download XML failed:", e)

    cascade = cv2.CascadeClassifier(CASCADE_FILENAME)

    if cascade.empty():
        cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + CASCADE_FILENAME
        )

    return cascade


def prepare_face(face_roi):
    """
    Convert face into a normalized vector.
    """

    if face_roi is None or face_roi.size == 0:
        return None

    # Resize
    face = cv2.resize(face_roi, (100, 100))

    # Histogram equalization
    face = cv2.equalizeHist(face)

    # Normalize
    face = face.astype(np.float32) / 255.0

    # Flatten
    vector = face.flatten()

    # Normalize vector
    norm = np.linalg.norm(vector)

    if norm == 0:
        return None

    vector = vector / norm

    return vector


def detect_faces(gray):
    """
    Detect faces from image.
    """

    cascade = get_face_cascade()

    if cascade.empty():
        return []

    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(50, 50)
    )

    return faces


def extract_face_encoding(image_file):
    """
    Extract encoding from registration image.
    Exactly one face should be present.
    """

    try:
        file_bytes = np.frombuffer(
            image_file.read(),
            np.uint8
        )

        img = cv2.imdecode(
            file_bytes,
            cv2.IMREAD_COLOR
        )

        if img is None:
            return None

        gray = cv2.cvtColor(
            img,
            cv2.COLOR_BGR2GRAY
        )

        faces = detect_faces(gray)

        # No face
        if len(faces) == 0:
            print("[DEBUG] No face detected")
            return None

        # More than one face
        if len(faces) > 1:
            print("[DEBUG] Multiple faces detected")
            return None

        x, y, w, h = faces[0]

        face_roi = gray[
            y:y + h,
            x:x + w
        ]

        encoding = prepare_face(face_roi)

        if encoding is None:
            return None

        return json.dumps(
            encoding.tolist()
        )

    except Exception as e:
        print(
            "Extract Face Encoding Exception:",
            str(e)
        )

        return None


def compare_encodings(encoding1, encoding2):
    """
    Compare two stored/live encodings.
    Returns Euclidean distance.
    """

    try:
        vector1 = np.array(
            json.loads(encoding1),
            dtype=np.float32
        )

        vector2 = np.array(
            json.loads(encoding2),
            dtype=np.float32
        )

        return float(
            np.linalg.norm(vector1 - vector2)
        )

    except Exception as e:
        print(
            "Compare Encoding Error:",
            str(e)
        )

        return float("inf")
def process_live_frame(image_file, registered_students):
    try:
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return []

        if not registered_students:
            return []

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = detect_faces(gray)

        if len(faces) == 0:
            return []

        results = []
        recognized_student_ids = set()

        for (x, y, w, h) in faces:

            face_roi = gray[y:y+h, x:x+w]
            live_vector = prepare_face(face_roi)

            if live_vector is None:
                continue

            matches = []

            for student in registered_students:

                encoding = student.get("face_encoding")

                if not encoding:
                    continue

                try:
                    db_vector = np.array(
                        json.loads(encoding),
                        dtype=np.float32
                    )

                    if len(db_vector) != len(live_vector):
                        continue

                    distance = float(
                        np.linalg.norm(
                            live_vector - db_vector
                        )
                    )

                    matches.append({
                        "student": student,
                        "distance": distance
                    })

                except Exception as e:
                    print("Student encoding error:", e)

            if not matches:
                results.append({
                    "student_id": "Unknown",
                    "name": "Unknown",
                    "roll_no": "",
                    "status": "Unknown",
                    "box": {
                        "x": int(x),
                        "y": int(y),
                        "w": int(w),
                        "h": int(h)
                    }
                })
                continue

            matches.sort(
                key=lambda item: item["distance"]
            )

            best = matches[0]

            best_student = best["student"]
            best_distance = best["distance"]

            second_distance = float("inf")

            if len(matches) > 1:
                second_distance = matches[1]["distance"]

            print(
                f"[DEBUG] Best: {best_student['name']} | "
                f"Distance: {best_distance:.4f}"
            )

            # Face match threshold
            if best_distance > 0.8:

                results.append({
                    "student_id": "Unknown",
                    "name": "Unknown",
                    "roll_no": "",
                    "status": "Unknown",
                    "box": {
                        "x": int(x),
                        "y": int(y),
                        "w": int(w),
                        "h": int(h)
                    }
                })

                continue

            # Ambiguous match
            if (
                second_distance != float("inf")
                and (second_distance - best_distance) < 0.1
            ):

                results.append({
                    "student_id": "Unknown",
                    "name": "Unknown",
                    "roll_no": "",
                    "status": "Ambiguous",
                    "box": {
                        "x": int(x),
                        "y": int(y),
                        "w": int(w),
                        "h": int(h)
                    }
                })

                continue

            student_id = best_student["student_id"]

            if student_id in recognized_student_ids:
                continue

            recognized_student_ids.add(student_id)

            results.append({
                "student_id": student_id,
                "name": best_student["name"],
                "roll_no": best_student.get("roll_no", ""),
                "status": "Matched",
                "box": {
                    "x": int(x),
                    "y": int(y),
                    "w": int(w),
                    "h": int(h)
                }
            })

        return results

    except Exception as e:
        print("Live Processing Exception:", str(e))
        return []