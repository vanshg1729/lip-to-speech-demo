import paragraphs from './paragraphs.json' assert { type: "json" };

let preview = document.getElementById('preview');
let recording = document.getElementById('recording');
let recordButton = document.getElementById('recordButton');
let discardButton = document.getElementById('discardButton');
let saveButton = document.getElementById('saveButton');
// let downloadButton = document.getElementById('downloadButton');
let paragraphElement = document.getElementById('paragraph');
let recordingSymbol = document.getElementById('recordingSymbol');
const outputDiv = document.getElementById('output');

let isRecording = false;
let recordingTimeMS = 300000; // 5 minutes auto stop, need to fix stop recording button at the end of this timer
let constraints = { video: true, audio: true };
let recorder;
let currentParagraphIndex = 0;

// asr stuff
// Create a SpeechRecognition object
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Set properties for the SpeechRecognition object
recognition.lang = 'en-US'; // Set the language
recognition.continuous = true; // Enable continuous speech recognition
recognition.interimResults = true; // Enable interim results for live updates

// Start/stop the recognition
let readWords = [];
let globTime = new Date().getTime();
for (let i = 0; i < 1000; i++) {
    readWords.push(globTime + 100000000); // + 100000000 just a nice big number
}
let highlightParagraph = (paragraph, currentWord, nonLowerCase) => {
    let nonCase = nonLowerCase.split(' ');
    let words = paragraph.split(' ');
    let highlightedParagraph = '';
    let count = 0;
    let check = false;
    let currTime = new Date().getTime();
    for (let word of words) {
        if ((word === currentWord || word === currentWord + '.' || word === currentWord + ',' || word === currentWord + '?') && readWords[count] + 2000 > currTime && check === false) {
            highlightedParagraph += `<span class="highlighted-word">${nonCase[count]}</span> `;
            readWords[count] = new Date().getTime(); // time when word was read
            check = true;
        } else {
            highlightedParagraph += nonCase[count] + ' ';
        }
        count++;
    }

    return highlightedParagraph.trim();
};

let wait = (delayInMS) => {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
};

let init = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        preview.srcObject = stream;
        // downloadButton.href = stream;
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
    recordingSymbol.classList.remove('hidden');

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
    recordingSymbol.classList.add('hidden');
};

let startRecording = async () => { // this has the wrong naming
    try {
        let recordedChunks = await recordStream(preview.captureStream(), recordingTimeMS);
        console.log(`startRecording(): Recording has stopped`);

        let recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
        recording.src = URL.createObjectURL(recordedBlob);
        // downloadButton.href = recording.src;
        // downloadButton.download = 'RecordedVideo.webm';
        // if (currentParagraphIndex < paragraphs.paragraphs.length) {
        //     paragraphElement.textContent = paragraphs.paragraphs[currentParagraphIndex];
        //     currentParagraphIndex++;
        // } else {
        //     paragraphElement.textContent = 'All paragraphs have been completed.';
        // }
    } catch (error) {
        if (error.name === 'NotFoundError') {
            console.log(`Camera or Microphone not found. Can't Record`);
        } else {
            console.log(`StartButton(): error: ${error}`);
        }
    }
};

let stopRecording = () => {
    globTime = new Date().getTime();
    for (let i = 0; i < 1000; i++) {
        readWords[i] = globTime + 100000000;
    }
    document.getElementsByClassName('hidden-buttons1')[0].style.display = 'none';
    document.getElementsByClassName('hidden-buttons2')[0].style.display = 'block';
    stopRecorder(recorder);
};

// Handle the recognition result
recognition.onresult = function (event) {
    let interimTranscript = '';
    let finalTranscript = '';

    // Combine interim and final transcripts
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }

    // Display live text
    outputDiv.innerHTML = finalTranscript;
    outputDiv.innerHTML += '<span style="color: gray;">' + interimTranscript + '</span>';
    let spokenWord = interimTranscript.split(' ').pop().toLowerCase();
    let paragraph = paragraphElement.textContent.toLowerCase();
    paragraphElement.innerHTML = highlightParagraph(paragraph, spokenWord, paragraphElement.textContent);
}

// Handle errors
recognition.onerror = function (event) {
    console.error('ASR error:', event.error);
}

window.addEventListener('load', async () => {
    try {
        await init();
        paragraphElement.textContent = paragraphs.paragraphs[currentParagraphIndex];
        currentParagraphIndex++;

        recordButton.addEventListener(
            'click',
            () => {
                if (!isRecording) {
                    recordButton.textContent = 'Stop Recording';
                    console.log('recordButton(): Going to Start recording');
                    isRecording = true;
                    startRecording();
                    // asr stuff
                    recognition.start();

                } else {
                    recordButton.textContent = 'Start Recording';
                    console.log('recordButton(): Going to stop recording');
                    isRecording = false;
                    stopRecording();
                    // asr stuff
                    recognition.stop();
                }
            },
            false
        );


        discardButton.addEventListener(
            'click',
            () => {
                document.getElementsByClassName('hidden-buttons1')[0].style.display = 'block';
                document.getElementsByClassName('hidden-buttons2')[0].style.display = 'none';
            },
            false
        );

        saveButton.addEventListener(
            'click',
            () => {
                document.getElementsByClassName('hidden-buttons1')[0].style.display = 'block';
                document.getElementsByClassName('hidden-buttons2')[0].style.display = 'none';
                if (currentParagraphIndex < paragraphs.paragraphs.length) {
                    paragraphElement.textContent = paragraphs.paragraphs[currentParagraphIndex];
                    currentParagraphIndex++;
                } else {
                    paragraphElement.textContent = 'All paragraphs have been completed.';
                }
            },
            false
        );

    } catch (error) {
        console.log(`initialization error: ${error}`);
    }
});