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
    console.log('Inside takeScreenshot function')
    let data = await api.captureLargeVideoScreenshot()
    let dataurl = data.dataURL
    screenshotNum += 1
    // console.log(`dataUrl = ${dataurl}`)

    dataToSend = {
        url: dataurl,
        id: screenshotNum,
    }

    return dataToSend
}

async function sendScreenshot(dataToSend) {
    try {
        const response = await fetch('http://localhost:5000/detect_faces/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })

        console.log('Image sent successfully')

        const data = await response.json()
        // console.log(response)
        // console.log('hello world')
        if (!data) {
            console.log(`Json Data is None`)
            return undefined
        } else {
            console.log(`Recieved Json data:`, data)
            return data
            // console.log(data)
        }
    } catch (error) {
        // Handle the error
        console.error('Error sending image:', error)
    }
}

api.addEventListener('videoConferenceJoined', () => {
    const screenshotButton = document.getElementById('screenshot-button')
    screenshotButton.addEventListener('click', async () => {
        console.log('You clicked the button')

        // take a screenshot
        const data = await takeScreenshot()

        // updating screenshot number
        const heading = document.getElementById('screenshot-num')
        heading.textContent = `Screenshot Number = ${data.id}`

        var imageElement = document.getElementById('imageElement')

        // let processed_dataurl = undefined
        // send the screenshot
        processed_data = await sendScreenshot(data)

        if (processed_data) {
            imageElement.src = processed_data.url
            // updating recieved screenshot number
            const heading2 = document.getElementById('recieved-num')
            heading2.textContent = `Recieved Screenshot Number = ${processed_data.id}`
        } else {
            imageElement.src = data.url
        }
        imageElement.width = 500
        imageElement.length = 500
    })
})

// api.addEventListener('videoConferenceJoined', () => {
//     setInterval(function () {
//         screenshotButton.click()
//     }, 30)
// })

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
