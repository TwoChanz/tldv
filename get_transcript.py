# get_transcript.py

import sys
from youtube_transcript_api import YouTubeTranscriptApi

if len(sys.argv) < 2:
    print("Missing video ID")
    sys.exit(1)

video_id = sys.argv[1]

try:
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    text_output = " ".join([entry['text'] for entry in transcript])
    print(text_output)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
