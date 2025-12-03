// ---------------- METRONOME STATE VARIABLES -----------------
let isRunning = false;             // Tracks whether metronome is currently running
let bpm = 100;                     // Beats per minute
let beatsPerMeasure = 4;           // Time signature beats per measure
let nextNoteTime = 0.0;            // Audio context time for scheduling next beat
let currentBeat = 0;               // Tracks current beat number
let audioCtx;                      // Web Audio API context
let schedulerId;                   // requestAnimationFrame ID
let swingLeft = true;              // Pendulum or ball swing direction
let animationMode = "pendulum";    // Current animation mode ("pendulum", "ball", "none")

// -------------------- DOM ELEMENTS --------------------------
const bpmInput = document.getElementById("bpm");
const startStopBtn = document.getElementById("startStop");
const indicator = document.getElementById("indicator");
const pendulum = document.getElementById("pendulum");
const pendulumContainer = document.getElementById("pendulumContainer");
const ballContainer = document.getElementById("ballContainer");
const ball = document.getElementById("ball");
const signatureInput = document.getElementById("signature");
const toggleAnimBtn = document.getElementById("toggleAnim");

// -------------------- EVENT LISTENERS -------------------------
// Update BPM when input changes
bpmInput.addEventListener("change", () => bpm = parseInt(bpmInput.value));

// Update beats per measure when time signature changes
signatureInput.addEventListener("change", () => beatsPerMeasure = parseInt(signatureInput.value));

// Toggle animation mode between pendulum, ball, and none
toggleAnimBtn.addEventListener("click", () => {
    if(animationMode === "pendulum") {
        animationMode = "ball";
        pendulumContainer.style.display = "none";
        ballContainer.style.display = "flex";
    } else if(animationMode === "ball") {
        animationMode = "none";
        pendulumContainer.style.display = "none";
        ballContainer.style.display = "none";
    } else {
        animationMode = "pendulum";
        pendulumContainer.style.display = "flex";
        ballContainer.style.display = "none";
    }
});

// Start & Stop Button Handler
startStopBtn.addEventListener("click", () => {
    if (isRunning) {
        stopMetronome();
        startStopBtn.textContent = "Start";
    } else {
        startMetronome();
        startStopBtn.textContent = "Stop";
    }
    isRunning = !isRunning;
});

// ------------------------  PLAY CLICK ----------------------------------------
// Purpose: Plays a click sound at the scheduled time and triggers animation.
// Parameters:
//   - time (number): AudioContext time when the click should occur.
//   - isAccent (boolean): If true, play accent tone.
// ------------------------------------------------------------------------------
function playClick(time, isAccent) {
    const osc = audioCtx.createOscillator(); // Create oscillator for click sound
    const envelope = audioCtx.createGain();  // Gain node for controlling volume

    // Set oscillator frequency: higher pitch for accented beats
    osc.frequency.value = isAccent ? 880 : 660;

    // Envelope settings: volume ramp for click decay
    envelope.gain.setValueAtTime(0.3, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(envelope).connect(audioCtx.destination); // Connect to speakers
    osc.start(time); // Start at scheduled time
    osc.stop(time + 0.05); // Stop shortly after

    // Visual beat indicator
    setTimeout(() => {
        indicator.classList.add("active");
        if (isAccent) indicator.classList.add("accent");
        setTimeout(() => indicator.classList.remove("active", "accent"), 100);
    }, (time - audioCtx.currentTime) * 1000);

    // Pendulum animation
    if (animationMode === "pendulum") {
        setTimeout(() => {
            pendulum.style.transition = `transform ${60/bpm}s ease-in-out`;
            pendulum.style.transform = swingLeft ? "rotate(-30deg)" : "rotate(30deg)";
            swingLeft = !swingLeft;
        }, (time - audioCtx.currentTime) * 1000);
    }

    // Ball animation
    if (animationMode === "ball") {
        setTimeout(() => {
            let containerWidth = ballContainer.offsetWidth;
            let amplitude = containerWidth * 0.4;
            let pos = swingLeft ? -amplitude : amplitude;
            ball.style.transition = `transform ${60/bpm}s ease-in-out`;
            ball.style.transform = `translateX(${pos}px)`;
            swingLeft = !swingLeft;
        }, (time - audioCtx.currentTime) * 1000);
    }
}

// ------------------------  SCHEDULER ----------------------------------------
// Purpose: Schedule clicks ahead of time to maintain consistent timing.
// ----------------------------------------------------------------------------
function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        let isAccent = (currentBeat % beatsPerMeasure === 0);
        playClick(nextNoteTime, isAccent);
        nextNoteTime += 60.0 / bpm;
        currentBeat++;
    }
    schedulerId = requestAnimationFrame(scheduler);
}

// -----------------------  START METRONOME -------------------------------------
// Purpose: Initialize audio context and start scheduling beats.
// ------------------------------------------------------------------------------
function startMetronome() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    nextNoteTime = audioCtx.currentTime;
    currentBeat = 0;
    scheduler();
}

// -----------------------  STOP METRONOME -------------------------------------
// Purpose: Stops the metronome and resets animations.
//------------------------------------------------------------------------------
function stopMetronome() {
    cancelAnimationFrame(schedulerId);
    pendulum.style.transition = "transform 0.3s ease-out";
    pendulum.style.transform = "rotate(0deg)";
    ball.style.transition = "transform 0.3s ease-out";
    ball.style.transform = "translateX(0)";
}
