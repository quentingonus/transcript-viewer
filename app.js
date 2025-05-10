let audio = document.getElementById("audioPlayer");
let transcriptDiv = document.getElementById("transcript");
let wordElements = [];
let lastActiveIndex = -1;
let playBtn = document.getElementById("playBtn");
let progressFill = document.getElementById("progressFill");
let currentTimeDisplay = document.getElementById("currentTime");
let durationDisplay = document.getElementById("duration");
let themeToggleBtn = document.getElementById("themeToggleBtn");
let isDarkMode = false;

// Theme toggle functionality
themeToggleBtn.addEventListener("click", function () {
    const html = document.documentElement;

    isDarkMode = !isDarkMode;

    if (isDarkMode) {
        html.classList.remove("light-mode");
        html.classList.add("dark-mode");
        themeToggleBtn.textContent = "☀️";
    } else {
        html.classList.remove("dark-mode");
        html.classList.add("light-mode");
        themeToggleBtn.textContent = "🌙";
    }

    // Save preference
    localStorage.setItem("darkMode", isDarkMode);
});

// Load saved theme preference
window.addEventListener("DOMContentLoaded", function () {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";

    if (savedDarkMode) {
        document.documentElement.classList.remove("light-mode");
        document.documentElement.classList.add("dark-mode");
        themeToggleBtn.textContent = "☀️";
        isDarkMode = true;
    }
});

// Setup file selection buttons
document.getElementById("audioSelectBtn").addEventListener("click", function () {
    document.getElementById("audioInput").click();
});

document.getElementById("jsonSelectBtn").addEventListener("click", function () {
    document.getElementById("jsonInput").click();
});

// Hide controls when mouse is inactive in fullscreen
document.addEventListener("mousemove", function () {
    if (isFullscreen) {
        showControls();

        clearTimeout(controlPanelTimeout);
        controlPanelTimeout = setTimeout(function () {
            if (isFullscreen) {
                hideControls();
            }
        }, 3000);
    }
});

document.getElementById("audioInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
        // Display the file name
        document.getElementById("audioFileName").textContent = file.name;

        audio.src = URL.createObjectURL(file);
        audio.load();
        resetPlayerState();
    }
});

document.getElementById("jsonInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
        // Display the file name
        document.getElementById("jsonFileName").textContent = file.name;

        const reader = new FileReader();
        reader.onload = function (event) {
            const json = JSON.parse(event.target.result);
            renderTranscript(json.words);
        };
        reader.readAsText(file);
    }
});

function toggleFullscreen() {
    const appContainer = document.querySelector(".app-container");
    const fullscreenIcon = document.getElementById("fullscreenIcon");

    isFullscreen = !isFullscreen;

    if (isFullscreen) {
        appContainer.classList.add("fullscreen");
        fullscreenIcon.textContent = "⮌";

        // Start the timer to hide controls
        controlPanelTimeout = setTimeout(hideControls, 3000);
    } else {
        appContainer.classList.remove("fullscreen");
        fullscreenIcon.textContent = "⛶";
        showControls();
    }
}

function hideControls() {
    if (isFullscreen) {
        controlPanel.classList.add("hidden");
        controlsVisible = false;
    }
}

function showControls() {
    controlPanel.classList.remove("hidden");
    controlsVisible = true;
}

function renderTranscript(words) {
    transcriptDiv.innerHTML = "";
    wordElements = [];
    let currentSpeaker = "";

    words.forEach((wordObj, i) => {
        const speaker = wordObj.speaker_id || "Speaker";
        const text = wordObj.text;
        const start = wordObj.start;

        if (speaker !== currentSpeaker) {
            const speakerElem = document.createElement("div");
            speakerElem.className = "speaker";
            speakerElem.textContent = speaker + ":";
            transcriptDiv.appendChild(speakerElem);
            currentSpeaker = speaker;
        }

        const span = document.createElement("span");
        span.className = "word";
        span.dataset.start = start;
        span.textContent = text + " ";

        wordElements.push(span);
        transcriptDiv.appendChild(span);
    });
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        playBtn.innerHTML = "⏸️ Pause";
    } else {
        audio.pause();
        playBtn.innerHTML = "▶️ Play";
    }
}

function stopAudio() {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = "▶️ Play";
}

function rewind() {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
}

function forward() {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
}

function resetPlayerState() {
    playBtn.innerHTML = "▶️ Play";
    updateTimeDisplay();

    // Wait for metadata to load to get duration
    audio.addEventListener('loadedmetadata', function () {
        updateTimeDisplay();
    });
}

function formatTime(seconds) {
    if (isNaN(seconds)) seconds = 0;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = remainingSeconds.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

function updateTimeDisplay() {
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
    durationDisplay.textContent = formatTime(audio.duration || 0);

    const progressPercent = (audio.currentTime / audio.duration) * 100 || 0;
    progressFill.style.width = `${progressPercent}%`;
}

// Add click interaction with progress bar
document.getElementById("progressBar").addEventListener("click", function (e) {
    const progressBar = this.getBoundingClientRect();
    const clickPosition = (e.clientX - progressBar.left) / progressBar.width;
    audio.currentTime = clickPosition * audio.duration;
});

audio.addEventListener("timeupdate", () => {
    updateTimeDisplay();

    const currentTime = audio.currentTime;
    let newActiveIndex = -1;

    wordElements.forEach((span, index) => {
        const start = parseFloat(span.dataset.start);
        if (start <= currentTime) {
            span.classList.add("active");
            newActiveIndex = index;
        } else {
            span.classList.remove("active");
        }
    });

    if (newActiveIndex !== -1 && newActiveIndex !== lastActiveIndex) {
        const container = document.getElementById("transcript");
        const wordElem = wordElements[newActiveIndex];
        const containerRect = container.getBoundingClientRect();
        const wordRect = wordElem.getBoundingClientRect();

        const containerMid = containerRect.top + containerRect.height / 2;
        const wordMid = wordRect.top + wordRect.height / 2;
        const offset = wordMid - containerMid;

        if (Math.abs(offset) > 20) {
            container.scrollTop += offset;
        }

        lastActiveIndex = newActiveIndex;
    }
});

audio.addEventListener("ended", function () {
    playBtn.innerHTML = "▶️ Play";
});
