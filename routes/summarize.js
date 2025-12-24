const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

router.post("/", (req, res) => {
    const text = req.body?.text?.trim();

    if (!text) return res.status(400).json({ error: "Text is required" });

    const pythonScript = path.join(__dirname, "../python/summarize.py");
    // Prefer project's virtualenv python if present
    const venvPython = path.join(__dirname, "..", "env", "Scripts", "python.exe");
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : (process.platform === "win32" ? "python" : "python3");

    console.error("Using python executable:", pythonCmd);
    console.error("Summarizing text (length:", text.length, "chars)");
    
    const python = spawn(pythonCmd, ["-u", pythonScript], {
        env: process.env,
        shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";
    let responseSent = false;

    // Send input to python
    python.stdin.write(JSON.stringify({ text }));
    python.stdin.end();

    python.stdout.on("data", (data) => {
        stdout += data.toString();
        console.error("Python stdout:", data.toString().substring(0, 100));
    });
    
    python.stderr.on("data", (data) => {
        stderr += data.toString();
        // Log stderr but don't treat as error (it's just logging)
        console.error("Python stderr:", data.toString().substring(0, 200));
    });
    
    // Add timeout (5 minutes for model loading)
    const timeout = setTimeout(() => {
        if (!responseSent) {
            responseSent = true;
            python.kill();
            return res.status(500).json({ error: "Summarization timeout (exceeded 5 minutes)" });
        }
    }, 300000);

    python.on("close", (code) => {
        if (responseSent) return;
        clearTimeout(timeout);
        const cleanOut = stdout.trim();
        const cleanErr = stderr.trim();
        
        console.error("Python process exited with code:", code);
        console.error("Python stdout length:", cleanOut.length);
        console.error("Python stderr length:", cleanErr.length);

        // Check if stdout contains valid JSON response
        let jsonResponse = null;
        try {
            jsonResponse = JSON.parse(cleanOut);
        } catch (e) {
            // stdout doesn't contain valid JSON, check for errors
        }

        // If we got a valid JSON response, use it (even if code !== 0)
        if (jsonResponse && jsonResponse.bullets) {
            responseSent = true;
            return res.json(jsonResponse);
        }

        // If exit code is non-zero, there was an error
        if (code !== 0) {
            // Try to parse error from stderr or stdout
            try {
                const errorJson = JSON.parse(cleanErr || cleanOut);
                if (errorJson.error) {
                    responseSent = true;
                    return res.status(500).json(errorJson);
                }
            } catch {}

            // Check for specific error patterns
            if (cleanErr.includes("ModuleNotFoundError") || cleanErr.includes("ImportError")) {
                responseSent = true;
                return res.status(500).json({
                    error: "Missing Python dependencies. Install requirements.txt.",
                });
            }

            // Return the error message
            responseSent = true;
            return res.status(500).json({
                error: cleanErr || cleanOut || "Summarizer crashed unexpectedly",
            });
        }

        // If we reach here, no valid response was found
        responseSent = true;
        return res.status(500).json({
            error: "Invalid summarizer response format",
            raw: cleanOut,
            stderr: cleanErr
        });
    });
});

module.exports = router;
