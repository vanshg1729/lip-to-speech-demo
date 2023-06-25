// Initialize the Jitsi Meet API
const domain = 'meet.jit.si'
const options = {
    roomName: 'jawahar',
    width: 400,
    height: 400,
    parentNode: document.querySelector('#meet-container'),
    configOverwrite: {},
    interfaceConfigOverwrite: {},
}
const api = new JitsiMeetExternalAPI(domain, options)

// Get the canvas element and context
const canvasElement = document.getElementById('canvas-element')
const context = canvasElement.getContext('2d')

// Create a video element to hold the video stream from Jitsi Meet
const videoElement = document.createElement('video')
videoElement.autoplay = true

// Get the user's media stream and assign it to the video element
// try {
//     let stream = await navigator.mediaDevices.getUserMedia({ video: true })
//     videoElement.srcObject = stream
// } catch (error) {
//     console.error('Error accessing the webcam:', error)
// }

// // Add a click event listener to the Capture Frame button
// const captureFrameBtn = document.getElementById('capture-frame-button')
// captureFrameBtn.addEventListener('click', () => {
//     // Draw the current frame of the video onto the canvas
//     context.drawImage(
//         videoElement,
//         0,
//         0,
//         canvasElement.width,
//         canvasElement.height
//     )

//     // Retrieve the image data from the canvas as a data URL
//     const imageDataURL = canvasElement.toDataURL('image/png')

//     // Do something with the captured frame (e.g., send it to a server, save it locally, etc.)
//     console.log('Captured frame:', imageDataURL)
// })

// setInterval(function () {
//     captureFrameBtn.click()
// }, 1000)
