let audio = document.getElementById("audioPlayer");
let transcriptDiv = document.getElementById("transcript");
let wordElements = [];
let lastActiveIndex = -1;

document.getElementById("audioInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
        audio.src = URL.createObjectURL(file);
    }
});

document.getElementById("jsonInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const json = JSON.parse(event.target.result);
            renderTranscript(json.words);
        };
        reader.readAsText(file);
    }
});

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

function rewind() {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
}

function forward() {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
}

audio.addEventListener("timeupdate", () => {
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
