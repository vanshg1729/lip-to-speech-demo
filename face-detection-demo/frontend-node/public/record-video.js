const domain = 'meet.jit.si'
const options = {
    roomName: 'jawahar',
    width: 400,
    height: 400,
    parentNode: document.querySelector('#meet-container'),
}
const api = new JitsiMeetExternalAPI(domain, options)

let screenshotNum = 0
async function takeScreenshot() {
    // console.log('Inside takeScreenshot function')
    screenshotNum += 1
    const localScreenshotNum = screenshotNum

    const heading = document.getElementById('screenshot-call')
    heading.textContent = `Screenshot Call = ${localScreenshotNum}`

    console.log(`takeScreenshot: taking image ${screenshotNum}`)
    let data = await api.captureLargeVideoScreenshot()
    console.log(`takeScreenshot: took image id = ${localScreenshotNum}`)

    let dataurl = data.dataURL
    // console.log(`dataUrl = ${dataurl}`)

    dataToSend = {
        url: dataurl,
        id: localScreenshotNum,
    }

    return dataToSend
}

async function sendScreenshot(dataToSend) {
    try {
        console.log(`sendScreenshot: sending image ${dataToSend.id}`)
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

async function displayFrame() {
    // takes a screenshot and displays it with detected faces
    // console.log('Inside displayFrame button')

    // take a screenshot
    const data = await takeScreenshot()

    // update the screenshot number
    const heading = document.getElementById('screenshot-num')
    heading.textContent = `Screenshot Number = ${data.id}`

    var imageElement = document.getElementById('imageElement')

    // let processed_data = undefined
    processed_data = await sendScreenshot(data)

    if (processed_data) {
        console.log(
            `displayFrame: Recieved the processed_data with id=${processed_data.id}`
        )
        imageElement.src = processed_data.url
        // update the recieved screenshot number
        const heading2 = document.getElementById('recieved-num')
        heading2.textContent = `Recieved Screenshot Number = ${processed_data.id}`
    } else {
        imageElement.src = data.url
    }
    imageElement.width = 500
    imageElement.length = 500
}

let toggleRecording = async () => {
    if (recording === 0) {
        console.log('Starting recording')
        intervalId = setInterval(displayFrame, 30)
        recording = 1
        recordButton.textContent = 'Stop Recording'
    } else if (recording === 1) {
        console.log('Stopping recording')
        clearInterval(intervalId)
        recording = 0
        recordButton.textContent = 'Start Recording'
    }
}

let recording = 0
let intervalId
api.addEventListener('videoConferenceJoined', () => {
    const recordButton = document.getElementById('record-button')
    recordButton.addEventListener('click', toggleRecording)
})