let previewVideo = document.getElementById('preview-video')
let outputVideo = document.getElementById('output-video')

let inputCanvas = document.getElementById('input-canvas')
let outputCanvas = document.getElementById('output-canvas')

let inputHeading = document.getElementById('input-heading')
let outputHeading = document.getElementById('output-heading')

const width = 320 // We will scale the photo width to this
let height = 0 // This will be computed based on the input stream

// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.
let streaming = false

let pictureid = 0
let boundingBox = 0

let frameId = 0
let batchId = 0

// delay in MS for capturing each frame
const delay = 30

// frames captured in one batch
const framesPerBatch = 100

// an inefficient queue
// this stores the batches
let batchQueue = []

// a queue to store all the batches
// a function that captures a lot of frames and then sends them

// wait that will always resolve
let wait = (delayInMS) => {
    return new Promise((resolve) => setTimeout(resolve, delayInMS))
}

let onArrayNonEmpty = (array) => {
    let resolver
    const promise = new Promise((resolve) => {
        resolver = resolve

        if (array.length > 0) {
            resolve(array)
        }
    })

    const updateArray = (...args) => {
        const result = Array.prototype.push.apply(array, args)
        if (array.length > 0) {
            resolver(array)
        }
        return result
    }

    const proxyArray = new Proxy(array, {
        get(target, property) {
            if (property === 'push') {
                return updateArray
            }
            return target[property]
        },
    })

    return { array: proxyArray, promise }
}

// clear a canvas element and returns {id: 0, url: dataurl}
let clearCanvas = async (canvasElement) => {
    const context = canvasElement.getContext('2d')
    context.fillStyle = '#AAA'
    context.fillRect(0, 0, canvas.width, canvas.height)

    const dataurl = canvas.toDataURL('image/png')
    // photo.setAttribute('src', dataurl)
    return {
        url: dataurl,
        id: 0,
    }
}

// capture frame function that takes a single picture from the video stream
let captureFrame = async (videoElement, canvasElement) => {
    const context = canvasElement.getContext('2d')
    if (width && height) {
        context.width = width
        context.height = height

        context.drawImage(videoElement, 0, 0, width, height)
        frameId += 1
        const id = frameId

        const dataurl = canvasElement.toDataURL('image/png')
        return {
            url: dataurl,
            id: id,
        }
    }
}

// capture frames in a batch and returns {id, frames}
let captureFramesInBatch = async (videoElement, canvasElement) => {
    batchId += 1
    const id = batchId
    inputHeading.textContent = `Batch Number = ${id}`

    const frames = []
    for (let i = 0; i < framesPerBatch; i += 1) {
        // wait for delay milliseconds if this is not the first frame
        if (i) await wait(delay)
        frameData = await captureFrame(videoElement, canvasElement)
        frames.push(frameData)
    }

    // console.log(`captureFramesInBatch(): frames.length = ${frames.length}`)
    return { id, frames }
}

// displays a frame onto the canvas from the frameData = {id, url}
let displayFrame = async (canvasElement, frameData) => {
    const context = canvasElement.getContext('2d')

    const img = new Image()
    img.onload = () => {
        context.drawImage(img, 0, 0)
    }

    img.src = frameData.url
}

// displays all the frames in batch onto the canvas from batchData = {batchId, frames}
let displayFramesInBatch = async (canvasElement, batchData) => {
    const frames = batchData.frames
    const id = batchData.id
    outputHeading.textContent = `Batch Number = ${id}`
    // console.log(
    //     `displayFramesInBatch(): id = ${batchData.id}, frames.length = ${frames.length}`
    // )
    for (let i = 0; i < frames.length; i += 1) {
        if (i) await wait(delay)
        frameData = frames[i]
        if (frameData === undefined) {
            console.log(
                `displayFramesInBatch() : id = ${batchData.id}, undefined i = ${i}`
            )
            console.log(frames)
        } else {
            await displayFrame(canvasElement, frameData)
        }
    }
}

let capturingFramesFunc = async () => {
    // get the batch Data
    batchData = await captureFramesInBatch(previewVideo, inputCanvas)

    if (boundingBox) {
        sendBatchData(batchData)
    } else {
        // push the frame data on the queue
        batchQueue.push(batchData)
    }

    console.log(
        `capturingFramesFunc(): took batch: ${batchData.id}, queue = ${batchQueue.length}`
    )

    capturingFramesFunc()

    // send the frames here
    await wait(delay)
}

let displayingFramesFunc = async () => {
    console.log(
        `displayFramesFunc(): waiting for queue.length = ${batchQueue.length}`
    )

    let { array, promise } = onArrayNonEmpty(batchQueue)
    batchQueue = array

    await promise

    batchData = batchQueue[0]
    batchQueue.shift()
    console.log(
        `displayingFramesFunc(): id = ${batchData.id}, queue = ${batchQueue.length}`
    )

    // wait for the frames to be completely displayed
    await displayFramesInBatch(outputCanvas, batchData)

    displayingFramesFunc()
}

let sendBatchData = async (batchData) => {
    try {
        console.log(`sendBatchData(): id = ${batchData.id}`)
        const response = await fetch(
            'http://localhost:5000/detect_faces_batch/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(batchData),
            }
        )

        const recievedBatchData = await response.json()

        if (!recievedBatchData) {
            console.log(`Json Data is None`)
            return undefined
        } else {
            batchQueue.push(recievedBatchData)
            return recievedBatchData
        }
    } catch (error) {
        // Handle the error
        console.error('Error sending batch:', error)
    }
}

let startup = async () => {
    // get the video using navigator.mediaDevices
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        })
        previewVideo.srcObject = stream
        console.log('startup(): Got the stream out')
        previewVideo.play()
    } catch (error) {
        console.log(`An error occurred: ${error}`)
    }

    // setting the height and width when we can play the video
    previewVideo.addEventListener('canplay', setupDimensions, false)
}

// setup dimensions of the video and canvas after getting video stream
let setupDimensions = (ev) => {
    if (!streaming) {
        height = previewVideo.height / (previewVideo.width / width)

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(height)) {
            height = width * (3 / 4)
        }

        previewVideo.setAttribute('width', width)
        previewVideo.setAttribute('height', height)
        inputCanvas.setAttribute('width', width)
        inputCanvas.setAttribute('height', height)
        outputCanvas.setAttribute('width', width)
        outputCanvas.setAttribute('height', height)
        streaming = true
    }
}

let toggleBoundingBox = () => {
    const bboxButton = document.getElementById('bbox-button')
    if (boundingBox) {
        boundingBox = 0
        bboxButton.textContent = 'Show Bounding Boxes'
    } else {
        boundingBox = 1
        bboxButton.textContent = 'Stop Bounding Boxes'
    }
}

window.addEventListener('load', async () => {
    await startup()
    console.log('Things have started')
    document
        .getElementById('bbox-button')
        .addEventListener('click', toggleBoundingBox)
})
