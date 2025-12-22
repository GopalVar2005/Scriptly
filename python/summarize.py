import sys
import json
import os

try:
    from transformers import pipeline
except ImportError:
    print(json.dumps({"error": "transformers package missing"}), file=sys.stderr)
    sys.exit(1)


def load_summarizer():
    """Load model (local path if provided, otherwise default)."""
    import torch
    model_path = os.environ.get("SUMMARIZER_LOCAL_PATH")
    
    # Use CPU (device=-1) for compatibility
    device = -1 if not torch.cuda.is_available() else 0
    
    try:
        return pipeline(
            "summarization",
            model=model_path if model_path and os.path.exists(model_path) else "facebook/bart-large-cnn",
            device=device
        )
    except Exception as e:
        print(f"Error loading summarizer: {str(e)}", file=sys.stderr)
        # Fallback to CPU
        return pipeline(
            "summarization",
            model="facebook/bart-large-cnn",
            device=-1
        )


def chunk_text(text, max_tokens=512):
    """Split long input into smaller blocks for summarizer."""
    words = text.split()
    chunks, current = [], []

    for word in words:
        if len(" ".join(current + [word])) > max_tokens:
            chunks.append(" ".join(current))
            current = [word]
        else:
            current.append(word)

    if current:
        chunks.append(" ".join(current))

    return chunks


def summarize(summarizer, text):
    """Summarize text into bullet points."""
    if len(text) < 20:
        return ["- Text too short to summarize."]

    bullets = []

    chunks = chunk_text(text) if len(text) > 1000 else [text]

    for chunk in chunks:
        try:
            # Adjust min_length based on text length
            text_length = len(chunk.split())
            # Ensure min_length is less than max_length and reasonable
            min_len = max(10, min(20, text_length // 3))
            max_len = max(min_len + 10, min(150, text_length // 2))
            
            # Ensure max_length is at least 30 for the model to work properly
            if max_len < 30:
                max_len = min(50, text_length)
            
            summary = summarizer(chunk, max_length=max_len, min_length=min_len, truncation=True)[0]["summary_text"]
            
            if not summary or not summary.strip():
                print(f"Warning: Empty summary for chunk", file=sys.stderr)
                continue
                
        except Exception as e:
            print(f"Error summarizing chunk: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            # Try to use a fallback: just return first few sentences
            sentences = chunk.split('.')
            if len(sentences) > 1:
                fallback = '. '.join(sentences[:2]).strip()
                if fallback:
                    bullets.append(f"- {fallback}.")
            continue

        for sentence in summary.replace(". ", ".").split("."):
            sentence = sentence.strip()
            if len(sentence) > 5:
                bullets.append(f"- {sentence if sentence.endswith('.') else sentence + '.'}")

    return bullets[:10] if bullets else ["- Unable to generate summary. Please try with longer text."]


def main():
    data = sys.stdin.read()

    if not data:
        print(json.dumps({"error": "No input received"}), file=sys.stderr)
        return 1

    try:
        payload = json.loads(data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON"}), file=sys.stderr)
        return 1

    text = payload.get("text", "").strip()

    if not text:
        print(json.dumps({"error": "No text provided"}), file=sys.stderr)
        return 1

    try:
        print("Loading summarizer model...", file=sys.stderr)
        summarizer = load_summarizer()
        print("Summarizer loaded successfully", file=sys.stderr)
        
        print(f"Summarizing text (length: {len(text)} chars)...", file=sys.stderr)
        result = summarize(summarizer, text)
        print(f"Generated {len(result)} bullet points", file=sys.stderr)
        
        print(json.dumps({"bullets": result}))
        return 0
    except Exception as e:
        print(json.dumps({"error": f"Summarization failed: {str(e)}"}), file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
