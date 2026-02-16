"""
Transcript Service Module
- Fetches YouTube captions via Maestra.ai API
"""

import logging
import requests
import json


MAESTRA_URL = "https://website-tools-dot-maestro-218920.uk.r.appspot.com/getYoutubeCaptions"


def get_youtube_transcript(url: str) -> tuple[str, str | None]:
    """
    Fetch transcript via Maestra.ai caption API.
    Returns: (transcript_text, language_code)
    """
    headers = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "origin": "https://maestra.ai",
        "referer": "https://maestra.ai/",
        "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"iOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
    }

    payload = json.dumps({"videoUrl": url})

    try:
        logging.info(f"Fetching captions via Maestra.ai...")
        response = requests.post(MAESTRA_URL, headers=headers, data=payload, timeout=60)
        logging.info(f"Maestra response: status={response.status_code}, length={len(response.text)}")
        response.raise_for_status()
    except requests.RequestException as e:
        logging.error(f"Maestra API failed: {e}")
        return "", None

    # Debug: log first 300 chars
    logging.info(f"Response preview: {response.text[:300]}")

    try:
        data = response.json()
    except json.JSONDecodeError:
        # Maybe it's plain text transcript
        if len(response.text) > 50:
            logging.info(f"Using plain text response: {len(response.text)} chars")
            return response.text, "auto"
        logging.error("Non-JSON and too short")
        return "", None

    # Handle different response formats
    if isinstance(data, list):
        segments = []
        for entry in data:
            if isinstance(entry, dict):
                text = entry.get("text", "") or entry.get("content", "") or ""
            elif isinstance(entry, str):
                text = entry
            else:
                continue
            text = text.strip()
            if text:
                segments.append(text)

        transcript = " ".join(segments)
        if transcript and len(transcript) > 20:
            logging.info(f"Got transcript: {len(segments)} segments, {len(transcript)} chars")
            return transcript, "auto"

    elif isinstance(data, dict):
        # Try known keys
        for key in ["captions", "transcript", "text", "subtitles", "result"]:
            val = data.get(key)
            if isinstance(val, str) and len(val) > 20:
                logging.info(f"Got transcript from key '{key}': {len(val)} chars")
                return val, data.get("language", "auto")
            if isinstance(val, list):
                segments = []
                for entry in val:
                    text = entry.get("text", "") if isinstance(entry, dict) else str(entry)
                    text = text.strip()
                    if text:
                        segments.append(text)
                transcript = " ".join(segments)
                if transcript and len(transcript) > 20:
                    logging.info(f"Got transcript from key '{key}': {len(segments)} segments")
                    return transcript, data.get("language", "auto")

    logging.warning(f"Could not extract transcript (type: {type(data).__name__}, keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'})")
    return "", None
