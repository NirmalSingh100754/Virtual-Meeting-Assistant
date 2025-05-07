var content="";
class MeetingRoom {
   
  constructor() {
    this.stream = null;
    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
    this.isScreenSharing = false;
    this.isChatOpen = false;
    this.isTranscribing = false;
    this.meetingStartTime = Date.now();
    this.transcript = "";
    this.recognition = null;
    this.ws = null;
    this.isMeetingActive = false;
    this.activeTab = "chat";
    this.timerInterval = null;
    this.connectionStatusElement =
      document.querySelector(".connection-status");

    this.initializeUI();
    this.setupEventListeners();
    this.setupLocalVideo();

    // Add a simulation of a successful WebSocket connection
    setTimeout(() => {
      this.simulateConnection();
    }, 1000);

    console.log("MeetingRoom initialized");
  }

  initializeUI() {
    this.localVideo = document.getElementById("localVideo");
    this.micButton = document.getElementById("microphone");
    this.cameraButton = document.getElementById("camera");
    this.screenButton = document.getElementById("screen");
    this.transcriptionButton = document.getElementById("transcription");
    this.chatButton = document.getElementById("chat");
    this.endCallButton = document.getElementById("end-call");
    this.sidePanel = document.querySelector(".side-panel");
    this.closeChatButton = document.getElementById("close-chat");
    this.meetingTimeDisplay = document.querySelector(".meeting-time");
    this.videoGrid = document.querySelector(".video-grid");
    this.chatMessages = document.getElementById("chatMessages");
    this.transcriptionMessages = document.getElementById(
      "transcriptionMessages"
    );
    this.aiMessages = document.getElementById("aiMessages");
    this.chatMessageInput = document.getElementById("chatMessage");
    this.sendMessageButton = document.getElementById("sendMessage");
    this.chatTabs = document.querySelectorAll(".chat-tab");
    this.tabContents = document.querySelectorAll(".tab-content");

    // Initialize Lucide icons
    lucide.createIcons();
  }

  setupEventListeners() {
    this.micButton.addEventListener("click", () => this.toggleAudio());
    this.cameraButton.addEventListener("click", () => this.toggleVideo());
    this.screenButton.addEventListener("click", () =>
      this.toggleScreenShare()
    );
    this.transcriptionButton.addEventListener("click", () =>
      this.toggleTranscription()
    );
    this.chatButton.addEventListener("click", () => this.toggleChat());
    this.closeChatButton.addEventListener("click", () =>
      this.toggleChat()
    );
    this.endCallButton.addEventListener("click", () => this.endCall());
    this.sendMessageButton.addEventListener("click", () =>
      this.sendChatMessage()
    );
    this.chatMessageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendChatMessage();
      }
    });
    this.chatMessageInput.addEventListener("input", () => {
      this.chatMessageInput.style.height = "auto";
      this.chatMessageInput.style.height = `${this.chatMessageInput.scrollHeight}px`;
    });

    this.chatTabs.forEach((tab) => {
      tab.addEventListener("click", () =>
        this.switchTab(tab.dataset.tab)
      );
    });

    window.addEventListener("beforeunload", (e) => {
      if (this.isMeetingActive && this.transcript.trim()) {
        this.saveMeetingHistory();
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  simulateConnection() {
    // Simulate a successful connection
    this.isMeetingActive = true;
    this.updateConnectionStatus("Connected", true);
    this.startMeetingTimer();
    this.updateUI("Meeting started. Connected to server.", "ai");
  }

  updateConnectionStatus(status, isConnected = false) {
    this.connectionStatusElement.textContent = status;
    this.connectionStatusElement.classList.toggle(
      "connected",
      isConnected
    );
    this.connectionStatusElement.classList.toggle(
      "disconnected",
      !isConnected
    );
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    this.chatTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });
    this.tabContents.forEach((content) => {
      if (content.dataset.tab) {
        content.classList.toggle(
          "active",
          content.dataset.tab === tabName
        );
      }
    });
  }

  sendChatMessage() {
    if (!this.isMeetingActive) return;
    const message = this.chatMessageInput.value.trim();
    if (message) {
      this.addChatMessage(message, "local");
      this.simulateSendToServer({
        type: "chat",
        text: message,
        sender: "You",
      });
      this.chatMessageInput.value = "";
      this.chatMessageInput.style.height = "auto";
      setTimeout(() => {
        this.addAIMessage(
          `I've received your message: "${message}". How can I help you with this meeting?`
        );
      }, 1000);
    }
  }

  addChatMessage(text, type) {
    const container =
      type === "transcription"
        ? this.transcriptionMessages
        : this.chatMessages;
    const messageDiv = document.createElement("div");
    messageDiv.className = "message-container";

    const header = document.createElement("div");
    header.className = "message-header";
    header.textContent =
      type === "local"
        ? "You"
        : type === "transcription"
        ? "Transcript"
        : "Participant";

    const message = document.createElement("div");
    message.className = `message ${type}`;

    // Set the message content immediately
    content+=text;
    message.textContent = content;

    
    fetch("http://localhost:5001/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(text),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Server responded with status: ${response.status}`
          );
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.summary) {
          message.textContent = data.summary;
        }
      })
      .catch((error) => {
        console.error("Error fetching summary:", error);
      });
    

    messageDiv.appendChild(header);
    messageDiv.appendChild(message);
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;

    if (type === "transcription" && this.activeTab !== "transcription") {
      // Flash the transcription tab to indicate new content
      const transcriptionTab = Array.from(this.chatTabs).find(
        (tab) => tab.dataset.tab === "transcription"
      );
      transcriptionTab.style.backgroundColor = "#e8f5e9";
      setTimeout(() => {
        transcriptionTab.style.backgroundColor = "";
      }, 1000);
    }
  }

  addAIMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message-container";

    const header = document.createElement("div");
    header.className = "message-header";
    header.textContent = "AI Assistant";

    const message = document.createElement("div");
    message.className = "message ai";
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
      this.stream
        .getAudioTracks()
        .forEach((track) => (track.enabled = this.isAudioEnabled));
      this.micButton.classList.toggle("active", this.isAudioEnabled);
      this.updateUI(
        `Microphone ${this.isAudioEnabled ? "unmuted" : "muted"}`,
        "ai"
      );
    }
  }

  toggleVideo() {
    if (!this.isMeetingActive) return;
    if (this.stream) {
      this.isVideoEnabled = !this.isVideoEnabled;
      this.stream
        .getVideoTracks()
        .forEach((track) => (track.enabled = this.isVideoEnabled));
      this.cameraButton.classList.toggle("active", this.isVideoEnabled);
      this.updateUI(
        `Camera ${this.isVideoEnabled ? "turned on" : "turned off"}`,
        "ai"
      );
    }
  }

  toggleScreenShare() {
    if (!this.isMeetingActive) return;

    if (this.isScreenSharing) {
      // Stop screen sharing
      this.isScreenSharing = false;
      this.screenButton.classList.remove("active");
      this.updateUI("Screen sharing stopped", "ai");

      // Switch back to camera
      this.setupLocalVideo();
    } else {
      // Start screen sharing
      navigator.mediaDevices
        .getDisplayMedia({ video: true })
        .then((screenStream) => {
          // Save current video stream to restore later
          if (this.stream) {
            this.stream.getVideoTracks().forEach((track) => track.stop());
          }

          this.localVideo.srcObject = screenStream;
          this.stream = screenStream;

          // Handle the case when user stops sharing via browser UI
          screenStream.getVideoTracks()[0].onended = () => {
            this.isScreenSharing = false;
            this.screenButton.classList.remove("active");
            this.updateUI("Screen sharing stopped", "ai");
            this.setupLocalVideo();
          };

          this.isScreenSharing = true;
          this.screenButton.classList.add("active");
          this.updateUI("Screen sharing started", "ai");
        })
        .catch((err) => {
          console.error("Error starting screen share:", err);
          this.updateUI("Failed to start screen sharing", "ai");
        });
    }
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
    if (!this.isMeetingActive && !this.isChatOpen) return;
    this.isChatOpen = !this.isChatOpen;
    this.sidePanel.classList.toggle("open", this.isChatOpen);
    this.videoGrid.classList.toggle("chat-open", this.isChatOpen);
    this.chatButton.classList.toggle("active", this.isChatOpen);
  }

  endCall() {
    if (!this.isMeetingActive) return;
    this.isMeetingActive = false;

    // Call backend summarize API with the global content variable
    fetch("http://localhost:5002/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Minutes of Meeting:");
        if (data.minutes_of_meeting) {
          data.minutes_of_meeting.forEach((line) => console.log(line));
        }
        console.log("Summary:");
        if (data.summary) {
          console.log(data.summary);
        }
      })
      .catch((error) => {
        console.error("Error fetching summary:", error);
      });

    this.simulateSendToServer({ type: "leave", sender: "You" });
    this.updateConnectionStatus("Disconnected");

    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.localVideo.srcObject = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.meetingTimeDisplay.textContent = "Meeting Ended";
    this.updateUI("You have left the meeting", "ai");

    [
      this.micButton,
      this.cameraButton,
      this.screenButton,
      this.transcriptionButton,
      this.chatButton,
    ].forEach((btn) => {
      btn.classList.remove("active");
      btn.classList.add("inactive");
      btn.disabled = true;
    });

    this.endCallButton.classList.add("inactive");
    this.endCallButton.disabled = true;

    this.sendMessageButton.disabled = true;
    this.chatMessageInput.disabled = true;
    this.chatMessageInput.placeholder = "Meeting has ended";
  }

  startMeetingTimer() {
    this.timerInterval = setInterval(() => {
      if (this.isMeetingActive) {
        const elapsed = Math.floor(
          (Date.now() - this.meetingStartTime) / 1000
        );
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const seconds = String(elapsed % 60).padStart(2, "0");
        this.meetingTimeDisplay.textContent = `${minutes}:${seconds}`;
      }
    }, 1000);
  }

  setupLocalVideo() {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.stream = stream;
        this.localVideo.srcObject = stream;

        // Make sure audio and video states match the buttons
        this.stream
          .getAudioTracks()
          .forEach((track) => (track.enabled = this.isAudioEnabled));
        this.stream
          .getVideoTracks()
          .forEach((track) => (track.enabled = this.isVideoEnabled));
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        this.updateUI(
          "Failed to access camera/microphone. Please check permissions.",
          "ai"
        );

        // Try fallback to audio only
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((audioStream) => {
            this.stream = audioStream;
            this.updateUI("Video unavailable. Using audio only.", "ai");
            this.cameraButton.classList.remove("active");
            this.isVideoEnabled = false;
          })
          .catch((audioErr) => {
            console.error("Error accessing audio devices:", audioErr);
            this.updateUI(
              "Failed to access microphone. Please check permissions.",
              "ai"
            );
          });
      });
  }

  simulateSendToServer(data) {
    console.log("Simulated data sent to server:", data);
    // Here we would normally send data to a WebSocket server
    // Since we don't have a real server, we'll simulate responses

    if (data.type === "leave") {
      setTimeout(() => {
        this.updateUI("Server acknowledged your departure", "ai");
      }, 500);
    }
  }

  startTranscription() {
    if (!this.isMeetingActive) return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.updateUI(
        "Speech Recognition not supported in this browser. Try Chrome, Edge, or Safari.",
        "ai"
      );
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            this.addChatMessage(transcriptSegment, "transcription");
            this.simulateSendToServer({
              type: "live",
              text: transcriptSegment,
            });
            this.transcript += transcriptSegment + " ";
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          this.updateUI(
            "Microphone access denied. Please enable permissions.",
            "ai"
          );
        } else if (event.error === "network") {
          this.updateUI(
            "Network error occurred with speech recognition.",
            "ai"
          );
        } else {
          this.updateUI(`Speech recognition error: ${event.error}`, "ai");
        }
        this.stopTranscription();
      };

      this.recognition.onend = () => {
        // Auto-restart if still in transcription mode
        if (this.isTranscribing) {
          try {
            this.recognition.start();
          } catch (err) {
            console.error("Failed to restart transcription:", err);
            this.updateUI("Transcription stopped unexpectedly.", "ai");
            this.isTranscribing = false;
            this.transcriptionButton.classList.remove("active");
          }
        }
      };

      this.recognition.start();
      this.isTranscribing = true;
      this.transcriptionButton.classList.add("active");
      this.updateUI("Transcription started...", "ai");

      // Switch to transcription tab
      this.switchTab("transcription");
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      this.updateUI(
        "Failed to start transcription. Please try again.",
        "ai"
      );
    }
  }

  stopTranscription() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
      this.recognition = null;
      this.isTranscribing = false;
      this.transcriptionButton.classList.remove("active");
      this.updateUI("Transcription stopped.", "ai");
    }
  }

  saveMeetingHistory() {
    console.log("Saving meeting history:", this.transcript);
    // In a real application, this would save to a server or local storage
    localStorage.setItem("lastMeetingTranscript", this.transcript);
    this.updateUI("Meeting transcript saved locally.", "ai");
  }

  updateUI(text, type = "ai") {
    if (type === "transcription") {
      this.addChatMessage(text, "transcription");
    } else if (type === "ai") {
      this.addAIMessage(text);
    } else {
      this.addChatMessage(text, type);
    }
  }
}

// Initialize the meeting room
document.addEventListener("DOMContentLoaded", () => {
  new MeetingRoom();
});