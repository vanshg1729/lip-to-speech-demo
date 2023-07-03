// ref : https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos

// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.

const width = 320 // We will scale the photo width to this
let height = 0 // This will be computed based on the input stream

// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.

let streaming = false

let pictureid = 0
let boundingBox = 0

// The various HTML elements we need to configure or control. These
// will be set by the startup() function.

let videoElement = null

// hidden background elements
let video = document.createElement('video')
let canvas = document.createElement('canvas')
let outputCanvas = document.createElement('canvas')
video.style.display = 'none'
canvas.style.display = 'none'
outputCanvas.style.display = 'none'

let startVideoDisplay = async () => {
    const videoStream = await getVideoStream()
    let videoElement = document.getElementById('video')
    videoElement.srcObject = videoStream
    videoElement.play()
}

let getVideoStream = async () => {
    await startup()
    let intervalId = setInterval(displayPicture, 100)

    // Context is required before capturing stream (firefox bug)
    outputCanvas.getContext('2d')
    const videoStream = outputCanvas.captureStream()

    return videoStream
}

let startup = async () => {
    // get the video using navigator.mediaDevices
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        })
        video.srcObject = stream
        console.log('startup(): Got the stream out')
        video.play()
    } catch (error) {
        console.log(`An error occurred: ${error}`)
    }

    // setting the height and width when we can play the video
    video.addEventListener('canplay', setupDimensions, false)
}

// setup dimensions of the video and canvas after getting video stream
let setupDimensions = (ev) => {
    if (!streaming) {
        height = video.height / (video.width / width)

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(height)) {
            height = width * (3 / 4)
        }

        video.setAttribute('width', width)
        video.setAttribute('height', height)
        canvas.setAttribute('width', width)
        canvas.setAttribute('height', height)
        outputCanvas.setAttribute('width', width)
        outputCanvas.setAttribute('height', height)
        streaming = true
    }
}

// Capture a photo by fetching the current contents of the video
// and drawing it into a canvas, then converting that to a PNG
// format data URL. By drawing it on an offscreen canvas and then
// drawing that to the screen, we can change its size and/or apply
// other changes before drawing it.
function clearphoto() {
    const context = canvas.getContext('2d')
    context.fillStyle = '#AAA'
    context.fillRect(0, 0, canvas.width, canvas.height)

    const dataurl = canvas.toDataURL('image/png')
    // photo.setAttribute('src', dataurl)
    return {
        url: dataurl,
        id: 0,
    }
}

function takepicture() {
    const context = canvas.getContext('2d')
    if (width && height) {
        context.width = width
        context.height = height

        context.drawImage(video, 0, 0, width, height)
        pictureid += 1

        const dataurl = canvas.toDataURL('image/png')
        return {
            url: dataurl,
            id: pictureid,
        }
    } else {
        clearphoto()
    }
}

async function sendPicture(dataToSend) {
    try {
        // console.log(`sendPicture: sending image ${dataToSend.id}`)
        const response = await fetch('http://localhost:5000/detect_faces/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })

        const data = await response.json()
        // console.log(response)
        // console.log('hello world')
        if (!data) {
            console.log(`Json Data is None`)
            return undefined
        } else {
            // console.log(`Json data:`, data)
            return data
            // console.log(data)
        }
    } catch (error) {
        // Handle the error
        console.error('Error sending image:', error)
    }
}

async function displayPicture() {
    let data = takepicture()
    // console.log(`displayFrame: Took image id=${data.id}`)

    let context = outputCanvas.getContext('2d')
    let img = new Image()
    img.onload = () => {
        context.drawImage(img, 0, 0)
    }

    if (!boundingBox) {
        img.src = data.url
    } else {
        // let processed_data = undefined
        processed_data = await sendPicture(data)

        if (processed_data) {
            // console.log(`displayFrame: Recieved image id=${processed_data.id}`)
            img.src = processed_data.url
        } else {
            img.src = data.url
        }
    }
}

let toggleBoundingBox = () => {
    let bboxButton = document.getElementById('bbox-btn')
    if (boundingBox) {
        boundingBox = 0
        bboxButton.style.backgroundColor = 'rgb(255, 80, 80)'
    } else {
        boundingBox = 1
        bboxButton.style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}
