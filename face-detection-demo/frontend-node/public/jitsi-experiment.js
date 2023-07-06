const domain = 'meet.jit.si'
const options = {
    roomName: 'jawahar',
    width: 400,
    height: 400,
    parentNode: document.querySelector('#meet-container'),
}
const api = new JitsiMeetExternalAPI(domain, options)

const width = 320 // We will scale the photo width to this
let height = 0 // This will be computed based on the input stream

let video = null
let streaming = false

async function startup() {
    video = document.getElementById('video')
    // canvas = document.getElementById('canvas')
    // photo = document.getElementById('photo')
    // recordbutton = document.getElementById('recordbutton')

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
                video.setAttribute('autoplay', true)
                streaming = true
            }
        },
        false
    )
}

// Set up our event listener to run the startup process
// once loading is complete.
window.addEventListener(
    'load',
    async () => {
        // await startup()
        // try {
        //     videoElement = document.getElementById('video')
        //     // const stream = videoElement.captureStream()
        //     const streamurl = URL.createObjectURL(videoElement.srcObject)
        //     console.log(`window event listener: ${streamurl}`)
        // } catch (error) {
        //     console.log(`Window event error: ${error}`)
        // }

        api.addEventListener('videoConferenceJoined', async () => {
            // video = document.getElementById('video')
            // const stream = video.captureStream()
            // const streamurl = URL.createObjectURL(stream)
            streamurl =
                'blob:https://webrtc.github.io/9baf15bb-526c-40c1-ad4c-d70909bad01e'
            // api.executeCommand('startShareVideo', streamurl)
        })
    },
    false
)
