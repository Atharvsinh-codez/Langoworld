"""
TubeInsight API Server
Flask API wrapper for transcript extraction.
Runs as a local backend that the Next.js app calls.
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from services.youtube import get_video_id, get_video_info
from services.transcript import get_youtube_transcript

# Language detection
from langdetect import detect, detect_langs
from langdetect.lang_detect_exception import LangDetectException

load_dotenv()

app = Flask(__name__)
CORS(app)

# All language codes supported by the LangoWorld project
SUPPORTED_LANG_CODES = {
    "en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru",
    "ja", "ko", "zh-cn", "zh-tw", "ar", "hi", "tr", "sv",
    "no", "da", "fi", "gu",
}

# Map langdetect codes to our project codes
LANG_CODE_MAP = {
    "zh-cn": "zh",
    "zh-tw": "zh",
}

logging.basicConfig(level=logging.INFO, format="[TubeInsight] %(message)s")


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "TubeInsight"})


@app.route("/api/detect-language", methods=["POST"])
def detect_language():
    """
    Detect the language of input text using Google's langdetect.

    Body: { "text": "some text to detect" }
    Returns: { "code": "pt", "confidence": 0.99 }
    """
    try:
        data = request.get_json()
        text = (data.get("text", "") if data else "").strip()

        if not text or len(text) < 2:
            return jsonify({"code": "en", "confidence": 0.0, "reason": "text too short"})

        # Get all possible languages with probabilities
        results = detect_langs(text)

        if not results:
            return jsonify({"code": "en", "confidence": 0.0, "reason": "no detection"})

        # Best result
        best = results[0]
        detected_code = str(best.lang)
        confidence = round(float(best.prob), 4)

        # Map to our project codes (e.g. zh-cn → zh)
        mapped_code = LANG_CODE_MAP.get(detected_code, detected_code)

        # Log for debugging
        logging.info(f"[Detect] '{text[:50]}...' → {detected_code} ({confidence}) → mapped: {mapped_code}")

        return jsonify({
            "code": mapped_code,
            "confidence": confidence,
            "raw": detected_code,
        })

    except LangDetectException as e:
        logging.warning(f"[Detect] LangDetect error: {e}")
        return jsonify({"code": "en", "confidence": 0.0, "reason": str(e)})
    except Exception as e:
        logging.error(f"[Detect] Unexpected error: {e}")
        return jsonify({"code": "en", "confidence": 0.0, "reason": "error"})


@app.route("/api/transcript", methods=["POST"])
def get_transcript():
    """
    Extract transcript from a YouTube video.

    Body: { "url": "https://youtube.com/watch?v=..." }
    Returns: { "transcript": "...", "lang": "...", "video_info": {...}, "method": "captions" }
    """
    data = request.get_json()
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "YouTube URL is required"}), 400

    video_id = get_video_id(url)
    if not video_id:
        return jsonify({"error": "Invalid YouTube URL"}), 400

    logging.info(f"Processing video: {video_id}")

    # Step 1: Get video info
    video_info = get_video_info(url)
    logging.info(f"Title: {video_info['title']}")

    # Step 2: Try fetching captions transcript
    transcript, lang = get_youtube_transcript(url)

    if transcript:
        logging.info(f"Got transcript ({lang}): {len(transcript)} chars")
        return jsonify({
            "transcript": transcript,
            "lang": lang or "auto",
            "video_info": video_info,
            "method": "captions",
        })

    return jsonify({"error": "No captions found for this video"}), 422


@app.route("/api/video-info", methods=["POST"])
def video_info():
    """Get video metadata."""
    data = request.get_json()
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "YouTube URL is required"}), 400

    info = get_video_info(url)
    return jsonify(info)


if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("TUBEINSIGHT_PORT", "5123")))
    is_production = os.getenv("RENDER") is not None
    logging.info(f"Starting TubeInsight API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=not is_production)
