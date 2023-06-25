const domain = 'meet.jit.si'
const options = {
    roomName: 'jawahar',
    width: 400,
    height: 400,
    parentNode: document.querySelector('#meet-container'),
}
const api = new JitsiMeetExternalAPI(domain, options)

async function takeScreenshot() {
    console.log('Inside takeScreenshot function')
    let data = await api.captureLargeVideoScreenshot()
    let dataurl = data.dataURL
    // console.log(`dataUrl = ${dataurl}`)
    return dataurl
}

async function sendScreenshot(dataUrl) {
    try {
        const response = await fetch('http://localhost:5000/detect_faces/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: dataUrl }),
        })

        console.log('Image sent successfully')

        const data = await response.json()
        // console.log(response)
        // console.log('hello world')
        if (!data) {
            console.log(`Json Data is None`)
            return undefined
        } else {
            console.log(`Json data:`, data)
            return data.url
            // console.log(data)
        }
    } catch (error) {
        // Handle the error
        console.error('Error sending image:', error)
    }
}

async function displayFrame() {
    // takes a screenshot and displays it with detected faces
    console.log('Inside displayFrame button')
    const dataurl = await takeScreenshot()
    var imageElement = document.getElementById('imageElement')
    let processed_dataurl = undefined
    processed_dataurl = await sendScreenshot(dataurl)

    if (processed_dataurl) {
        imageElement.src = processed_dataurl
    } else {
        imageElement.src = dataurl
    }
    imageElement.width = 500
    imageElement.length = 500
}

let recording = 0
let intervalId
api.addEventListener('videoConferenceJoined', () => {
    const recordButton = document.getElementById('record-button')
    recordButton.addEventListener('click', async () => {
        if (recording === 0) {
            console.log('Starting recording')
            intervalId = setInterval(displayFrame, 60)
            recording = 1
            recordButton.textContent = 'Stop Recording'
        } else if (recording === 1) {
            console.log('Stopping recording')
            clearInterval(intervalId)
            recording = 0
            recordButton.textContent = 'Start Recording'
        }
    })
})

// Next steps
// display the screenshot
// save the screenshot
// send the screenshot to a fake server

// api.addEventListener('videoConferenceJoined', () => {
//     const videoElement = document.querySelector('#largeVideo')
//     let frameCount = 0
//     console.log(`frame count ${frameCount}`)

//     const canvas = document.createElement('canvas')
//     canvas.width = videoElement.videoWidth
//     canvas.height = videoElement.videoHeight

//     function captureVideoFrame() {
//         const context = canvas.getContext('2d')
//         context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

//         const frameData = canvas.toDataURL('image/png')
//         const link = document.createElement('a')
//         link.href = frameData
//         link.download = `./frame_${frameCount}.png`
//         link.click()

//         frameCount++
//         console.log(frameCount)
//         requestAnimationFrame(captureVideoFrame)
//     }

//     requestAnimationFrame(captureVideoFrame)
// })
