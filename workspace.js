// ---- BACKEND ENDPOINTS ----
const BASE_URL = "http://localhost:5000/api";

// ---- DOM ELEMENTS ----
const textArea = document.getElementById("voiceText");
const summaryBox = document.getElementById("summaryText");
const keywordBox = document.getElementById("keywordsText");

// ---- RECORDING STATE ----
let recording = false;
let mediaRecorder;
let audioChunks = [];

// ----------------------- START RECORDING -----------------------
async function startRecording() {
    if (recording) return;
    recording = true;

    textArea.value = "";
    textArea.placeholder = "🎙 Listening...";

    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        textArea.placeholder = "❌ Microphone not supported in this browser.";
        recording = false;
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });

        let mimeType = 'audio/webm';
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                break;
            }
        }

        mediaRecorder = new MediaRecorder(stream, { mimeType });

        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            recording = false;
            textArea.placeholder = "❌ Recording error occurred.";
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start(100);
        textArea.placeholder = "🎙 Recording...";
        console.log("Recording started with:", mimeType);

    } catch (error) {
        console.warn("Microphone access error:", error);
        textArea.placeholder = "❌ Microphone access denied.";
        recording = false;
    }
}

// ----------------------- STOP RECORDING -----------------------
async function stopRecording() {
    if (!recording) return;

    recording = false;
    textArea.placeholder = "⏳ Processing audio...";
    mediaRecorder.stop();

    mediaRecorder.onstop = async () => {
        console.log("Recording stopped.");

        let blobType = audioChunks[0]?.type || "audio/webm";
        const audioBlob = new Blob(audioChunks, { type: blobType });

        if (audioBlob.size < 1000) {
            textArea.placeholder = "⚠ Recording too short. Try again.";
            return;
        }

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        try {
            const response = await fetch(`${BASE_URL}/transcribe/transcribe`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errRes = await response.json().catch(() => null);
                textArea.placeholder = errRes?.error || "❌ Server transcription failed.";
                return;
            }

            const data = await response.json();
            const transcription = data.transcription || "";

            if (!transcription.trim()) {
                textArea.value = "⚠ No speech detected.";
                return;
            }

            textArea.value = transcription;
            textArea.placeholder = "Your transcribed text will appear here...";

            // Auto summary trigger
            if (transcription.trim().length > 10 && typeof generateSummary === "function") {
                setTimeout(generateSummary, 500);
            }

        } catch (error) {
            textArea.placeholder = `❌ Network error: ${error.message}`;
        } finally {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    };
}

// ----------------------- GENERATE SUMMARY -----------------------
async function generateSummary() {
    const text = textArea.value.trim();
    if (!text) {
        summaryBox.innerText = "⚠ Please enter or record text first!";
        return;
    }

    summaryBox.innerText = "⏳ Generating summary...";

    try {
        const response = await fetch(`${BASE_URL}/summarize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }));
            summaryBox.innerText = `❌ Error: ${errorData.error || "Failed to generate summary"}`;
            console.error("Summary error:", errorData);
            return;
        }

        const data = await response.json();
        console.log("Summary response:", data);
        
        const bullets = data.bullets || data.summary || [];
        
        if (!bullets || (Array.isArray(bullets) && bullets.length === 0)) {
            summaryBox.innerText = "⚠ No summary generated. Please try with longer text.";
            return;
        }

        const summaryText = Array.isArray(bullets) ? bullets.join("\n") : bullets;
        summaryBox.innerText = summaryText || "⚠ Summary is empty.";

    } catch (error) {
        console.error("Summary fetch error:", error);
        summaryBox.innerText = `❌ Error: ${error.message || "Network error occurred"}`;
    }
}

// ----------------------- EXTRACT KEYWORDS -----------------------
function extractKeywords() {
    const text = textArea.value.trim();
    if (!text) return alert("Enter or record text first!");

    keywordBox.innerText = "⏳ Extracting keywords...";

    const stopwords = new Set([
        'the','and','a','to','of','in','is','it','that','for','on','with','as','are','was','were','be','by','this','an','or','from','at','which','i','you','he','she','we','they',
        'me','him','her','will','us','them','than','just','more','my','like','used','your','his','our','their','what','when','where','why','how','who'
    ]);

    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w && !stopwords.has(w) && w.length > 2);

    if (!words.length) return keywordBox.innerText = "⚠ No keywords found.";

    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);

    const top = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 10);

    keywordBox.innerText = top.join(', ');
}