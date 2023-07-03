let APP_ID = 'ebf263c085e64d2fa7069b8ecdc785f1'

let token = null
let uid = String(Math.floor(Math.random() * 10000))

let client
let channel

let queryString = window.location.search
console.log('queryString: ', queryString)
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if (!roomId) {
    window.location = 'lobby.html'
}

let localStream
let remoteStream
let peerConnection

const servers = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
}

let constraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio: true,
}

let init = async () => {
    console.log('Hello from init(): ', uid)

    try {
        client = await AgoraRTM.createInstance(APP_ID)
        console.log('init(): created the RTC client')
        await client.login({ uid, token })
        console.log('AgoraRTM client login success')
    } catch (error) {
        console.log('AgoraRTM client login failure: ', error)
    }

    console.log('init(): hello there')

    // index.html?room=233249
    channel = client.createChannel(roomId)
    await channel.join()

    channel.on('MemberJoined', handleUserJoined)
    channel.on('MemberLeft', handleUserLeft)

    client.on('MessageFromPeer', handleMessageFromPeer)

    localStream = await getVideoStream()
    // localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user-1').srcObject = localStream
}

let handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text)
    if (message.type !== 'candidate') {
        console.log('handleMessageFromPeer(): message: ', message)
    }

    if (message.type === 'offer') {
        createAnswer(MemberId, message.offer)
    }

    if (message.type === 'answer') {
        addAnswer(message.answer)
    }

    if (message.type === 'candidate') {
        if (peerConnection) {
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let handleUserJoined = async (MemberId) => {
    console.log('A new user joined the channel: ', MemberId)
    createOffer(MemberId)
}

let handleUserLeft = async (MemberId) => {
    // agora doesn't immediately call this function
    // it wait for 20-30 secs after user left the channel to call this
    document.getElementById('user-2').style.display = 'none'
    document.getElementById('user-1').classList.remove('smallFrame')
}

let createPeerConnection = async (MemberId) => {
    // MemberId is of the other peer
    // create a web RTC peer connection
    peerConnection = new RTCPeerConnection(servers)

    // get the remote stream
    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'

    document.getElementById('user-1').classList.add('smallFrame')

    if (!localStream) {
        localStream = await getVideoStream()
        // localStream = await navigator.mediaDevices.getUserMedia(constraints)
    }

    if (localStream) {
        // add all the tracks from localStream to the peerConnection
        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream)
        })
    }

    // event triggered when a new track is added to the connection
    // the track here are added by the remote peer
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    // event that is triggered on getting a new ICE candidate
    peerConnection.onicecandidate = async (event) => {
        if (event.candidate !== null) {
            // console.log('Recieved New Ice Candidate: ', event.candidate)
            client.sendMessageToPeer(
                {
                    text: JSON.stringify({
                        type: 'candidate',
                        candidate: event.candidate,
                    }),
                },
                MemberId
            )
        }
    }
}

let createOffer = async (MemberId) => {
    // MemberId is of the other peer
    await createPeerConnection(MemberId)

    // sdp offer
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    console.log('createOffer(): offer: ', offer)
    client.sendMessageToPeer(
        { text: JSON.stringify({ type: 'offer', offer: offer }) },
        MemberId
    )
}

let createAnswer = async (MemberId, offer) => {
    // MemberId is of the other peer
    console.log('Inside createAnswer(): MemberId: ', MemberId)
    await createPeerConnection(MemberId)

    // set the remote description of user-2 to offer sent from user-1
    await peerConnection.setRemoteDescription(offer)

    // sdp answer
    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    // console.log('createAnswer(): Answer: ', answer)
    client.sendMessageToPeer(
        { text: JSON.stringify({ type: 'answer', answer: answer }) },
        MemberId
    )
}

let addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer)
    }
}

let leaveChannel = async () => {
    await channel.leave()
    await client.logout()
}

let toggleCamera = async () => {
    let videoTrack = localStream
        .getTracks()
        .find((track) => track.kind === 'video')

    if (videoTrack.enabled) {
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor =
            'rgb(255, 80, 80)'
    } else {
        videoTrack.enabled = true
        document.getElementById('camera-btn').style.backgroundColor =
            'rgb(179, 102, 249, .9)'
    }
}

let toggleMic = async () => {
    let audioTrack = localStream
        .getTracks()
        .find((track) => track.kind === 'audio')

    if (audioTrack.enabled) {
        audioTrack.enabled = false
        document.getElementById('mic-btn').style.backgroundColor =
            'rgb(255, 80, 80)'
    } else {
        audioTrack.enabled = true
        document.getElementById('mic-btn').style.backgroundColor =
            'rgb(179, 102, 249, .9)'
    }
}

window.addEventListener('beforeunload', leaveChannel)

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
// document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('bbox-btn').addEventListener('click', toggleBoundingBox)

init()
