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

// The various HTML elements we need to configure or control. These
// will be set by the startup() function.

let video = null
let photo = null
let canvas = null
let recordbutton = null

// defining it here so it doesn't have a parent node and cannot be
// seen by user
// canvas = document.createElement('canvas')
// canvas.setAttribute('id', 'canvas')

function startup() {
    video = document.getElementById('video')
    canvas = document.getElementById('canvas')
    photo = document.getElementById('photo')
    recordbutton = document.getElementById('recordbutton')

    // next is get the video using navigator.mediaDevices
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
            // set the video element src to stream and play the video
            video.srcObject = stream
            video.play()
        })
        .catch((err) => {
            console.log(`An error occurred: ${err}`)
        })

    // setting the height and width when we can play the video
    video.addEventListener(
        'canplay',
        (ev) => {
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
                streaming = true
            }
        },
        false
    )

    let recording = 0
    let intervalId
    recordbutton.addEventListener(
        'click',
        (ev) => {
            if (recording === 0) {
                console.log('Starting recording')
                intervalId = setInterval(displayPicture, 40)
                recording = 1
                recordbutton.textContent = 'Stop Recording'
            } else if (recording === 1) {
                console.log('Stopping recording')
                clearInterval(intervalId)
                recording = 0
                recordbutton.textContent = 'Start Recording'
            }
            ev.preventDefault()
        },
        false
    )
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
    photo.setAttribute('src', dataurl)
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
    data = takepicture()
    console.log(`displayFrame: Took image id=${data.id}`)

    // displaying the picture id
    heading = document.getElementById('picture-number')
    heading.textContent = `Picture Number = ${data.id}`

    // let processed_data = undefined
    processed_data = await sendPicture(data)

    if (processed_data) {
        console.log(`displayFrame: Recieved image id=${processed_data.id}`)
        photo.setAttribute('src', processed_data.url)

        // displaying the id of the processed image
        heading2 = document.getElementById('processed-number')
        heading2.textContent = `Processed Image Number = ${processed_data.id}`
    } else {
        clearphoto()
    }
}

// Set up our event listener to run the startup process
// once loading is complete.
window.addEventListener(
    'load',
    () => {
        startup()
    },
    false
)