import paragraphs from './paragraphs.json' assert { type: "json" };


let preview = document.getElementById('preview');
let recording = document.getElementById('recording');
let recordButton = document.getElementById('recordButton');
let downloadButton = document.getElementById('downloadButton');
let paragraphElement = document.getElementById('paragraph');

let isRecording = false;
let recordingTimeMS = 10000;
let constraints = { video: true, audio: true };
let recorder;
let currentParagraphIndex = 0;

let wait = (delayInMS) => {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
};

let init = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        preview.srcObject = stream;
        downloadButton.href = stream;
        preview.captureStream = preview.captureStream || preview.mozCaptureStream;

        await new Promise((resolve) => {
            preview.onplaying = resolve;
        });
    } catch (error) {
        if (error.name === 'NotFoundError') {
            console.log(`Camera or Microphone not found. Can't Record`);
        } else {
            console.log(`init(): error: ${error}`);
        }

        throw error;
    }
};

let recordStream = async (stream, lengthInMS) => {
    recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = (event) => {
        data.push(event.data);
    };

    recorder.start();
    console.log(`recordStream(): Recording has Started`);

    let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = (event) => reject(event.name);
    });

    let recorded = wait(lengthInMS).then(() => {
        if (recorder.state === 'recording') {
            recorder.stop();
        }
    });

    return Promise.race([stopped, recorded]).then(() => data);
};

let stopRecorder = (recorderToStop) => {
    recorderToStop.stop();
};

let startRecording = async () => {
    try {
        let recordedChunks = await recordStream(preview.captureStream(), recordingTimeMS);
        console.log(`startRecording(): Recording has stopped`);

        let recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
        recording.src = URL.createObjectURL(recordedBlob);
        downloadButton.href = recording.src;
        downloadButton.download = 'RecordedVideo.webm';

        if (currentParagraphIndex < paragraphs.paragraphs.length) {
            paragraphElement.textContent = paragraphs.paragraphs[currentParagraphIndex];
        } else {
            paragraphElement.textContent = 'All paragraphs have been completed.';
        }

        currentParagraphIndex++;
    } catch (error) {
        if (error.name === 'NotFoundError') {
            console.log(`Camera or Microphone not found. Can't Record`);
        } else {
            console.log(`StartButton(): error: ${error}`);
        }
    }
};

let stopRecording = () => {
    stopRecorder(recorder);
};

window.addEventListener('load', async () => {
    try {
        await init();
        recordButton.addEventListener(
            'click',
            () => {
                if (!isRecording) {
                    recordButton.textContent = 'Stop Recording';
                    console.log('recordButton(): Going to Start recording');
                    isRecording = true;
                    startRecording();
                } else {
                    recordButton.textContent = 'Start Recording';
                    console.log('recordButton(): Going to stop recording');
                    isRecording = false;
                    stopRecording();
                }
            },
            false
        );
    } catch (error) {
        console.log(`initialization error: ${error}`);
    }
});