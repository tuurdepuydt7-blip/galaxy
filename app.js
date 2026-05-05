const socket = io();

const splash = document.getElementById('splash');
const app = document.getElementById('app');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const photoButton = document.getElementById('photoButton');
const photoInput = document.getElementById('photoInput');
const voiceButton = document.getElementById('voiceButton');

let mediaRecorder;
let audioChunks = [];

// Hide splash after 1 second or on skip click
const hideSplash = () => {
  splash.classList.add('hidden');
  app.classList.remove('hidden');
};

setTimeout(hideSplash, 1000);

document.getElementById('skipButton').addEventListener('click', hideSplash);

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

photoButton.addEventListener('click', () => {
  photoInput.click();
});

photoInput.addEventListener('change', sendPhoto);

voiceButton.addEventListener('mousedown', startRecording);
voiceButton.addEventListener('mouseup', stopRecording);

socket.on('chat message', (msg) => {
  displayMessage(msg, 'other');
});

socket.on('photo', (data) => {
  displayPhoto(data, 'other');
});

socket.on('voice', (data) => {
  displayVoice(data, 'other');
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chat message', message);
    displayMessage(message, 'own');
    messageInput.value = '';
  }
}

function sendPhoto() {
  const file = photoInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      socket.emit('photo', data);
      displayPhoto(data, 'own');
    };
    reader.readAsDataURL(file);
  }
}

function displayMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', type);
  messageDiv.textContent = message;
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
}

function displayPhoto(data, type) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', type);
  const img = document.createElement('img');
  img.src = data;
  img.classList.add('photo');
  messageDiv.appendChild(img);
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
}

function displayVoice(data, type) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', type);
  const audio = document.createElement('audio');
  audio.src = data;
  audio.controls = true;
  audio.classList.add('audio');
  messageDiv.appendChild(audio);
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      socket.emit('voice', audioUrl);
      displayVoice(audioUrl, 'own');
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}
