import cv2
import dlib

# Load the pre-trained face detector and shape predictor with 68 points
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor('shape_predictor_68_face_landmarks.dat')  # Replace with the path to your downloaded file

# Open the video file
input_video_path = 'talk.mp4'  # Replace with the path to your input video
cap = cv2.VideoCapture(input_video_path)

# Get video properties
fps = int(cap.get(cv2.CAP_PROP_FPS))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Create VideoWriter object to save the output video
output_video_path = 'output_video.avi'  # Replace with the desired output video path
fourcc = cv2.VideoWriter_fourcc(*'XVID')  # You can change the codec based on your preference
out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Convert the frame to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces in the frame
    faces = detector(gray)

    # Process each detected face
    for face in faces:
        # Get the facial landmarks
        landmarks = predictor(gray, face)

        # Draw only lip landmarks on the frame
        for i in range(48, 68):  # Lip landmarks are from index 48 to 67 in the 68-point model
            x, y = landmarks.part(i).x, landmarks.part(i).y
            cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)  # Draw a green circle at each lip landmark

    # Write the annotated frame to the output video
    out.write(frame)

    # Display the annotated frame
    cv2.imshow('Lip Landmarks', frame)
    
    if cv2.waitKey(1) & 0xFF == 27:  # Press 'Esc' to exit
        break

# Release resources
cap.release()
out.release()
cv2.destroyAllWindows()
