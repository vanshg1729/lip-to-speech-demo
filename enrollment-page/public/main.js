let preview = document.getElementById('preview')
let recording = document.getElementById('recording')

let recordButton = document.getElementById('recordButton')

let downloadButton = document.getElementById('downloadButton')

let isRecording = false

let recordingTimeMS = 10000

let constraints = { video: true, audio: true }

let recorder

let wait = (delayInMS) => {
    return new Promise((resolve) => setTimeout(resolve, delayInMS))
}

let init = async () => {
    try {
        // get the stream out
        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        // set the stream to the preview video element
        preview.srcObject = stream
        downloadButton.href = stream
        preview.captureStream =
            preview.captureStream || preview.mozCaptureStream

        // wait for the preview to start playing
        await new Promise((resolve) => {
            preview.onplaying = resolve
        })
    } catch (error) {
        if (error.name === 'NotFoundError') {
            console.log(`Camera or Microphone not found. Can't Record`)
        } else {
            console.log(`init(): error: ${error}`)
        }

        throw error
    }
}

let recordStream = async (stream, lengthInMS) => {
    recorder = new MediaRecorder(stream)
    let data = []

    recorder.ondataavailable = (event) => {
        data.push(event.data)
    }

    recorder.start()
    console.log(`recordStream(): Recording has Started`)

    let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve
        recorder.onerror = (event) => reject(event.name)
    })

    let recorded = wait(lengthInMS).then(() => {
        if (recorder.state === 'recording') {
            recorder.stop()
        }
    })

    // return as soon as one of the promises is resolved
    return Promise.race([stopped, recorded]).then(() => data)
}

let stopRecorder = (recorderToStop) => {
    recorderToStop.stop()
}

let startRecording = async () => {
    try {
        // start the recording
        let recordedChunks = await recordStream(
            preview.captureStream(),
            recordingTimeMS
        )
        console.log(`startRecording(): Recording has stopped`)

        let recordedBlob = new Blob(recordedChunks, { type: 'video/webm' })
        recording.src = URL.createObjectURL(recordedBlob)
        downloadButton.href = recording.src
        downloadButton.download = 'RecordedVideo.webm'
    } catch (error) {
        if (error.name === 'NotFoundError') {
            console.log(`Camera or Microphone not found. Can't Record`)
        } else {
            console.log(`StartButton(): error: ${error}`)
        }
    }
}

let stopRecording = () => {
    stopRecorder(recorder)
}

//
// (2) put everything in place on the page
// (3) look into how to send the recorded file to the server
// (4)

window.addEventListener('load', async () => {
    try {
        await init()
        recordButton.addEventListener(
            'click',
            () => {
                if (!isRecording) {
                    recordButton.textContent = 'Stop Recording'
                    console.log('recordButton(): Going to Start recording')
                    isRecording = true
                    startRecording()
                } else {
                    recordButton.textContent = 'Start Recording'
                    console.log('recordButton(): Going to stop recording')
                    isRecording = false
                    stopRecording()
                }
            },
            false
        )
    } catch (error) {
        console.log(`initialization error: ${error}`)
    }
})