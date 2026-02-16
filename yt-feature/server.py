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

load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO, format="[TubeInsight] %(message)s")


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "TubeInsight"})


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
