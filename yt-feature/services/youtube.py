"""
==================================================================
   YouTube Service Module
   ----------------------
   Provides utilities for:
   - Extracting video ID from different YouTube URL formats
   - Fetching video metadata (title, channel, views, description)
   - Downloading audio stream from YouTube videos
==================================================================
"""

import os
import logging
from pytubefix import YouTube as PTFixYouTube
import re


# --------------------------------------------------------------
# Function: get_video_id
# Purpose : Extract YouTube video ID from multiple URL formats.
# Notes   : Supports watch, embed, shorts, youtu.be links, 
#           including extra query params like ?si=...
# --------------------------------------------------------------
def get_video_id(url: str) -> str | None:
    """
    Extract YouTube video ID from different URL formats.

    Examples of supported formats:
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtube.com/embed/VIDEO_ID
        - https://youtube.com/shorts/VIDEO_ID
        - With extra params like ?si=...

    Args:
        url (str): YouTube video URL.

    Returns:
        str | None: Extracted video ID, or None if not found.
    """
    pattern = (
        r"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/))"
        r"([0-9A-Za-z_-]{11})"
    )
    match = re.search(pattern, url)
    return match.group(1) if match else None


# --------------------------------------------------------------
# Function: get_video_info
# Purpose : Fetch YouTube video metadata (title, channel, views, description).
# Notes   : Uses pytubefix for reliability.
# --------------------------------------------------------------
def get_video_info(url: str) -> dict:
    """
    Fetch video metadata: title, channel, views, description.

    Args:
        url (str): YouTube video URL.

    Returns:
        dict: Video metadata with keys: title, channel, views, description.
    """
    try:
        yt = PTFixYouTube(url)
        return {
            "title": yt.title,
            "channel": yt.author,
            "views": yt.views,
            "description": yt.description
        }
    except Exception as e:
        logging.error(f"Error fetching video info: {e}")
        return {
            "title": "Unknown",
            "channel": "Unknown",
            "views": "Unknown",
            "description": "Unknown"
        }


# --------------------------------------------------------------
# Function: download_audio
# Purpose : Download only the audio track of a YouTube video.
# Notes   : Default filename is "audio.mp3".
# --------------------------------------------------------------
def download_audio(url: str, filename: str = "audio.mp3") -> str:
    """
    Download the audio stream from a YouTube video.

    Args:
        url (str): YouTube video URL.
        filename (str, optional): Output filename for audio. Defaults to "audio.mp3".

    Returns:
        str: Path to the downloaded audio file, or empty string on failure.
    """
    try:
        yt = PTFixYouTube(url)
        stream = yt.streams.filter(only_audio=True).first()
        if not stream:
            raise ValueError("No audio streams available")

        # Download temp audio and rename to desired filename
        out_file = stream.download(filename="temp_audio.mp4")
        os.replace(out_file, filename)
        return filename
    except Exception as e:
        logging.error(f"Audio download error: {e}")
        return ""
