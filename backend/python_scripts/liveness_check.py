import sys
import json
import cv2
import numpy as np
import base64
import mediapipe as mp

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"status": "fail", "message": "No input data received"}))
            return

        data = json.loads(input_data)
        images_b64 = data.get('images', [])

        if len(images_b64) < 4:
            print(json.dumps({"status": "fail", "message": "Insufficient frames for verification"}))
            return

        mp_face_mesh = mp.solutions.face_mesh
        face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=0.5
        )

        pitch_angles = []

        for b64 in images_b64:
            try:
                header, encoded = b64.split(",", 1) if "," in b64 else ("", b64)
                img_data = base64.b64decode(encoded)
                nparr = np.frombuffer(img_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    continue
                    
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                results = face_mesh.process(img_rgb)
                
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    
                    # 1 = Nose tip, 33 = Left eye edge, 263 = Right eye edge
                    nose_y = landmarks[1].y
                    left_eye_y = landmarks[33].y
                    right_eye_y = landmarks[263].y
                    
                    avg_eye_y = (left_eye_y + right_eye_y) / 2.0
                    
                    # Pitch: Distance between eyes and nose. 
                    # If looking UP, distance decreases. If looking DOWN, distance increases.
                    pitch = nose_y - avg_eye_y
                    pitch_angles.append(pitch)
            except Exception:
                continue

        face_mesh.close()

        if len(pitch_angles) >= 4:
            max_pitch = max(pitch_angles)  # This represents looking DOWN
            min_pitch = min(pitch_angles)  # This represents looking UP
            
            pitch_diff = max_pitch - min_pitch
            
            # 0.04 चा फरक म्हणजे चेहऱ्याने खरोखरच वर आणि खाली हालचाल केली आहे. (2D फोटोत हे शक्य नाही)
            if pitch_diff >= 0.04: 
                print(json.dumps({"status": "success", "message": "Real Person Verified"}))
            else:
                print(json.dumps({"status": "fail", "message": "Please move your head UP and DOWN"}))
        else:
            print(json.dumps({"status": "fail", "message": "Face not detected properly"}))

    except Exception:
        print(json.dumps({"status": "fail", "message": "Server error processing images"}))

if __name__ == "__main__":
    main()