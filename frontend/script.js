class MeetingRoom {
    constructor() {
      this.stream = null;
      this.isAudioEnabled = true;
      this.isVideoEnabled = true;
      this.isScreenSharing = false;
      this.isChatOpen = false;
      this.isTranscribing = false;
      this.meetingStartTime = Date.now();
      this=    this.transcript = "";
      this.recognition = null;
      this.ws = null;
      this.isMeetingActive = true;
      this.activeTab = 'chat';
      this.timerInterval = null;
  
      this.initializeUI();
      this.setupEventListeners();
      this.startMeetingTimer();
      this.setupLocalVideo();
      this.connectWebSocket();
    }
  
    initializeUI() {
      this.localVideo = document.getElementById('localVideo');
      this.micButton = document.getElementById('microphone');
      this.cameraButton = document.getElementById('camera');
      this.screenButton = document.getElementById('screen');
      this.transcriptionButton = document.getElementById('transcription');
      this.chatButton = document.getElementById('chat');
      this.endCallButton = document.getElementById('end-call');
      this.sidePanel = document.querySelector('.side-panel');
      this.closeChatButton = document.getElementById('close-chat');
      this.meetingTimeDisplay = document.querySelector('.meeting-time');
      this.videoGrid = document.querySelector('.video-grid');
      this.chatMessages = document.getElementById('chatMessages');
      this.transcriptionMessages = document.getElementById('transcriptionMessages');
      this.aiMessages = document.getElementById('aiMessages');
      this.chatMessageInput = document.getElementById('chatMessage');
      this.sendMessageButton = document.getElementById('sendMessage');
      this.chatTabs = document.querySelectorAll('.chat-tab');
      this.tabContents = document.querySelectorAll('.tab-content');
    }
  
    setupEventListeners() {
      this.micButton.addEventListener('click', () => this.toggleAudio());
      this.cameraButton.addEventListener('click', () => this.toggleVideo());
      this.screenButton.addEventListener('click', () => this.toggleScreenShare());
      this.transcriptionButton.addEventListener('click', () => this.toggleTranscription());
      this.chatButton.addEventListener('click', () => this.toggleChat());
      this.closeChatButton.addEventListener('click', () => this.toggleChat());
      this.endCallButton.addEventListener('click', () => this.endCall());
      this.sendMessageButton.addEventListener('click', () => this.sendChatMessage());
      this.chatMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendChatMessage();
        }
      });
      this.chatMessageInput.addEventListener('input', () => {
        this.chatMessageInput.style.height = 'auto';
        this.chatMessageInput.style.height = `${this.chatMessageInput.scrollHeight}px`;
      });
  
      this.chatTabs.forEach(tab => {
        tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
      });
  
      window.addEventListener('beforeunload', (e) => {
        if (this.isMeetingActive && this.transcript.trim()) {
          this.saveMeetingHistory();
          e.preventDefault();
          e.returnValue = '';
        }
      });
    }
  
    switchTab(tabName) {
      this.activeTab = tabName;
      this.chatTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });
      this.tabContents.forEach(content => {
        content.classList.toggle('active', content.dataset.tab === tabName);
      });
    }
  
    sendChatMessage() {
      if (!this.isMeetingActive) return;
      const message = this.chatMessageInput.value.trim();
      if (message) {
        this.addChatMessage(message, 'local');
        this.sendToServer({ type: "chat", text: message, sender: "You" });
        this.chatMessageInput.value = '';
        this.chatMessageInput.style.height = 'auto';
        // Simulate AI response
        setTimeout(() => {
          this.addAIMessage(`AI: Responding to "${message}"`);
        }, 1000);
      }
    }
  
    addChatMessage(text, type) {
      const container = type === 'transcription' ? this.transcriptionMessages : this.chatMessages;
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message-container';
      
      const header = document.createElement('div');
      header.className = 'message-header';
      header.textContent = type === 'local' ? 'You' : 
                         type === 'transcription' ? 'Transcript' : 'Participant';
      
      const message = document.createElement('div');
      message.className = `message ${type}`;
      message.textContent = text;
      
      messageDiv.appendChild(header);
      messageDiv.appendChild(message);
      container.appendChild(messageDiv);
      container.scrollTop = container.scrollHeight;
      
      if (type === 'transcription' && this.activeTab !== 'transcription') {
        this.switchTab('transcription');
      } else if (type !== 'transcription' && this.activeTab !== 'chat') {
        this.switchTab('chat');
      }
    }
  
    addAIMessage(text) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message-container';
      
      const header = document.createElement('div');
      header.className = 'message-header';
      header.textContent = 'AI Assistant';
      
      const message = document.createElement('div');
      message.className = 'message ai';
      message.textContent = text;
      
      messageDiv.appendChild(header);
      messageDiv.appendChild(message);
      this.aiMessages.appendChild(messageDiv);
      this.aiMessages.scrollTop = this.aiMessages.scrollHeight;
    }
  
    toggleAudio() {
      if (!this.isMeetingActive) return;
      if (this.stream) {
        this.isAudioEnabled = !this.isAudioEnabled;
        this.stream.getAudioEabled = this.isAudioEnabled;
        this.micButton.classList.toggle('active', this.isAudioEnabled);
      }
    }
  
    toggleVideo() {
      if (!this.isMeetingActive) return;
      if (this.stream) {
        this.isVideoEnabled = !this.isVideoEnabled;
        this.stream.getVideoTracks().forEach(track => track.enabled = this.isVideoEnabled);
        this.cameraButton.classList.toggle('active', this.isVideoEnabled);
      }
    }
  
    toggleScreenShare() {
      if (!this.isMeetingActive) return;
      this.isScreenSharing = !this.isScreenSharing;
      this.screenButton.classList.toggle('active', this.isScreenSharing);
      this.updateUI(`Screen sharing ${this.isScreenSharing ? 'started' : 'stopped'}`, 'ai');
    }
  
    toggleTranscription() {
      if (!this.isMeetingActive) return;
      if (this.isTranscribing) {
        this.stopTranscription();
      } else {
        this.startTranscription();
      }
    }
  
    toggleChat() {
      if (!this.isMeetingActive) return;
      this.isChatOpen = !this.isChatOpen;
      this.sidePanel.classList.toggle('open', this.isChatOpen);
      this.videoGrid.classList.toggle('chat-open', this.isChatOpen);
      this.chatButton.classList.toggle('active', this.isChatOpen);
    }
  
    endCall() {
      if (!this.isMeetingActive) return;
      this.isMeetingActive = false;
  
      // Notify server of leaving
      this.sendToServer({ type: "leave", sender: "You" });
  
      // Clean up resources
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      if (this.recognition) {
        this.recognition.stop();
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.localVideo.srcObject = null;
      }
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
  
      // Update UI
      this.meetingTimeDisplay.textContent = 'Meeting Ended';
      this.updateUI('You have left the meeting', 'ai');
  
      // Disable all controls
      [this.micButton, this.cameraButton, this.screenButton, this.transcriptionButton, this.chatButton, this.endCallButton].forEach(btn => {
        btn.classList.remove('active', 'disabled');
        btn.classList.add('inactive');
        btn.disabled = true;
      });
      this.sendMessageButton.disabled = true;
      this.chatMessageInput.disabled = true;
      this.closeChatButton.disabled = true;
    }
  
    startMeetingTimer() {
      this.timerInterval = setInterval(() => {
        if (this.isMeetingActive) {
          const elapsed = Math.floor((Date.now() - this.meetingStartTime) / 1000);
          const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
          const seconds = String(elapsed % 60).padStart(2, '0');
          this.meetingTimeDisplay.textContent = `${minutes}:${seconds}`;
        }
      }, 1000);
    }
  
    setupLocalVideo() {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          this.stream = stream;
          this.localVideo.srcObject = stream;
        })
        .catch(err => {
          console.error('Error accessing media devices:', err);
          this.updateUI('Failed to access camera/microphone', 'ai');
        });
    }
  
    connectWebSocket() {
      try {
        this.ws = new WebSocket('ws://localhost:8080');
        this.ws.onopen = () => {
          this.updateUI('Connected to server', 'ai');
        };
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'chat') {
            this.addChatMessage(data.text, 'ai');
          } else if (data.type === 'ai') {
            this.addAIMessage(data.text);
          } else if (data.type === 'meeting_ended') {
            this.handleMeetingEnded();
          }
        };
        this.ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          this.updateUI('Server connection error', 'ai');
        };
        this.ws.onclose = () => {
          this.updateUI('Disconnected from server', 'ai');
        };
      } catch (err) {
        console.error('WebSocket initialization failed:', err);
        this.updateUI('Unable to connect to server', 'ai');
      }
    }
  
    sendToServer(data) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(data));
        } catch (err) {
          console.error('Error sending to server:', err);
        }
      }
    }
  
    handleMeetingEnded() {
      if (!this.isMeetingActive) return;
      this.isMeetingActive = false;
  
      // Clean up resources
      if (this.recognition) {
        this.recognition.stop();
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.localVideo.srcObject = null;
      }
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
  
      // Update UI
      this.meetingTimeDisplay.textContent = 'Meeting Ended';
      this.updateUI('The meeting has been ended by the host', 'ai');
  
      // Disable all controls
      [this.micButton, this.cameraButton, this.screenButton, this.transcriptionButton, this.chatButton, this.endCallButton].forEach(btn => {
        btn.classList.remove('active', 'disabled');
        btn.classList.add('inactive');
        btn.disabled = true;
      });
      this.sendMessageButton.disabled = true;
      this.chatMessageInput.disabled = true;
      this.closeChatButton.disabled = true;
    }
  
    saveMeetingHistory() {
      console.log('Saving meeting history:', this.transcript);
    }
  
    startTranscription() {
      if (!this.isMeetingActive) return;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.updateUI("Speech Recognition not supported in this browser.", 'ai');
        return;
      }
  
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
  
      this.recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            this.updateUI(transcriptSegment, 'transcription');
            this.sendToServer({ type: "live", text: transcriptSegment });
          }
        }
      };
  
      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          this.updateUI('Microphone access denied. Please enable permissions.', 'ai');
        }
        this.stopTranscription();
      };
  
      this.recognition.start();
      this.isTranscribing = true;
      this.transcriptionButton.classList.add('active');
      this.updateUI("Transcription started...", 'ai');
    }
  
    stopTranscription() {
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
        this.isTranscribing = false;
        this.transcriptionButton.classList.remove('active');
        this.updateUI("Transcription stopped.", 'ai');
      }
    }
  
    updateUI(text, type = 'ai') {
      if (type === 'transcription') {
        this.addChatMessage(text, 'transcription');
        this.transcript += text + " ";
      } else if (type === 'ai') {
        this.addAIMessage(text);
      } else {
        this.addChatMessage(text, type);
      }
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    new MeetingRoom();
  });