"""
===============================================================
   Gemini Service Module
   ---------------------
   Handles interaction with Google's Gemini API for:
   - Initializing the Gemini client
   - Summarizing YouTube video transcript + metadata
   - Answering user questions about the video (Q&A)
===============================================================
"""

import logging
import google.generativeai as genai
from rich.console import Console

# Rich console for pretty printing in the terminal
console = Console()


# --------------------------------------------------------------
# Function: init_gemini
# Purpose : Configure Gemini with the given API key
# --------------------------------------------------------------
def init_gemini(api_key: str):
    """
    Configure Gemini with API key.
    This must be called before using Gemini features.
    """
    genai.configure(api_key=api_key)


# --------------------------------------------------------------
# Function: summarize
# Purpose : Generate a summary of a YouTube video
#           using both transcript and video metadata.
# Notes   : Uses streaming to display text as Gemini generates it.
# --------------------------------------------------------------
def summarize(transcript: str, video_info: dict) -> str:
    """
    Summarize transcript + video metadata with Gemini (streaming).
    
    Args:
        transcript (str): The video's transcript text.
        video_info (dict): Dictionary containing title, channel,
                           views, and description.

    Returns:
        str: The final summary text.
    """
    try:
        # Create Gemini model with a system instruction
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction="You are given a YouTube video's metadata and transcript. Summarize briefly."
        )

        # Prompt includes video metadata + transcript
        prompt = (
            f"Video Info:\n"
            f"Title: {video_info['title']}\n"
            f"Channel: {video_info['channel']}\n"
            f"Views: {video_info['views']}\n"
            f"Description: {video_info['description']}\n\n"
            f"Transcript:\n{transcript}"
        )

        console.print("[bold green]Summary:[/bold green]\n")

        # Generate content as a stream (prints as it comes)
        response_stream = model.generate_content(prompt, stream=True)

        final_text = ""
        for chunk in response_stream:
            if chunk.text:
                # Print streamed text in yellow
                console.print(chunk.text, end="", style="yellow")
                final_text += chunk.text

        console.print()
        return final_text

    except Exception as e:
        logging.error(f"Gemini streaming summarization error: {e}")
        return ""


# --------------------------------------------------------------
# Function: ask_question_stream
# Purpose : Answer user questions about the video by combining
#           transcript, metadata, and chat history.
# Notes   : Keeps conversational context for up to last 10 Q&As.
# --------------------------------------------------------------
def ask_question_stream(transcript: str, video_info: dict, question: str, chat_history: list | None = None) -> str:
    """
    Ask a question about transcript + video metadata with Gemini (streaming).
    
    Args:
        transcript (str): Transcript of the video.
        video_info (dict): Video metadata like title, channel, etc.
        question (str): The current user question.
        chat_history (list, optional): Previous Q&A pairs for context.

    Returns:
        str: The final answer text.
    """
    try:
        # Initialize Gemini with context-specific instructions
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction="Answer concisely using video metadata, transcript, and chat history."
        )

        # Prompt includes video metadata, transcript, and optional history
        prompt = (
            f"Video Info:\n"
            f"Title: {video_info['title']}\n"
            f"Channel: {video_info['channel']}\n"
            f"Views: {video_info['views']}\n"
            f"Description: {video_info['description']}\n\n"
            f"Transcript:\n{transcript}\n\n"
        )

        # Add up to last 10 Q&A pairs from chat history
        if chat_history:
            for i, (q, a) in enumerate(chat_history[-10:], 1):
                prompt += f"Q{i}: {q}\nA{i}: {a}\n\n"

        # Append the current question at the end
        prompt += f"Current Question: {question}"

        console.print("[bold cyan]Answer:[/bold cyan]\n")

        # Stream the response back to console
        response_stream = model.generate_content(prompt, stream=True)
        final_text = ""

        for chunk in response_stream:
            if chunk.text:
                # Print streamed answer in yellow
                console.print(chunk.text, end="", style="yellow")
                final_text += chunk.text

        console.print()
        return final_text

    except Exception as e:
        logging.error(f"Gemini streaming Q&A error: {e}")
        return ""
