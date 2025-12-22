import sys
import os
import json
import re

try:
    from faster_whisper import WhisperModel
    import torch
except ImportError as e:
    print(json.dumps({"error": f"Missing dependency: {str(e)}"}), file=sys.stderr)
    sys.exit(1)

# Optional grammar tool
try:
    import language_tool_python
    tool = language_tool_python.LanguageTool('en-US')
except:
    tool = None

def init_whisper():
    """Initialize whisper model once."""
    device = "cpu"
    compute_type = "int8" if device == "cpu" else "float16"

    model_path = os.environ.get("WHISPER_LOCAL_PATH")

    return WhisperModel(
        model_path if model_path and os.path.exists(model_path) else "small",
        device=device,
        compute_type=compute_type
    )

def clean_text(text: str):
    """Basic cleanup (remove weird characters)."""
    return re.sub(r"[^a-zA-Z0-9.,?!'\s]", "", text).strip()

def grammar_fix(text: str):
    if not tool:
        return text
    try:
        return tool.correct(text)
    except:
        return text

def transcribe_audio(model, input_file):
    """Main transcription logic."""
    segments, _ = model.transcribe(
        input_file,
        language="en",
        vad_filter=True
    )

    final_text = ""

    for segment in segments:
        text = segment.text.strip()
        if not text:
            continue
        
        text = clean_text(text)
        text = grammar_fix(text)
        final_text += text + " "

    return final_text.strip() if final_text.strip() else "No speech detected."

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input file path provided"}), file=sys.stderr)
        return 1

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(json.dumps({"error": f"File not found: {input_file}"}), file=sys.stderr)
        return 1

    try:
        print("Loading model...", file=sys.stderr)
        model = init_whisper()
        print("Transcribing...", file=sys.stderr)

        result = transcribe_audio(model, input_file)
        print(result)
        return 0

    except Exception as e:
        print(json.dumps({"error": f"Transcription error: {str(e)}"}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
