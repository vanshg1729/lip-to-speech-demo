# lip-to-speech demo
A Lip-Reading web-application that uses deep learning based lip-to-text models to transcribe speech from silent videos. The application has 2 subparts
1. A video calling app (peer-chat) that transcribes the video call in real-time by reading the lip movements of the person, assiting the deaf to communicate with others.
2. A platform to record video data of a person speaking, with a face enrollment mechanism to ensure that the face is correctly positioned in the camera, as well as to check for appropriate lighting conditions. The recorded video data can then be used to train a personalized lip-reading model for the user.

The application is built using React for the frontend and Node.js for the backend.

## PEER CHAT
Open lobby.html on the web browser and enter the room number to join a meeting on the open-source Agora video calling service

## ENROLLMENT PAGE
Each of the folders has a seperate README to run the application