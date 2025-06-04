// File: backend/app.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { getTranscript } = require("youtube-transcript");
const { getSubtitles } = require("youtube-captions-scraper");
const { OpenAI } = require("openai");

dotenv.config();

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Try owner-uploaded captions first (youtube-transcript), 
 * then fall back to auto-generated English captions (youtube-captions-scraper).
 * Throws if neither exists.
 */
async function fetchAnyTranscript(videoId) {
  // 1) Try owner‐uploaded captions
  try {
    const ownerTranscript = await getTranscript(videoId);
    return ownerTranscript.map((chunk) => chunk.text).join(" ");
  } catch (ownerErr) {
    console.log(
      `Owner captions not found for ${videoId}. Falling back to auto-generated.`
    );
    // 2) Fallback to auto-generated English
    const autoCaps = await getSubtitles({ videoID: videoId, lang: "en" });
    if (!autoCaps || autoCaps.length === 0) {
      throw new Error("No transcript available");
    }
    return autoCaps.map((chunk) => chunk.text).join(" ");
  }
}

app.post("/summarize", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing YouTube URL." });

  let videoId;
  try {
    videoId = new URL(url).searchParams.get("v");
  } catch {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL." });

  // 1) Fetch transcript (owner OR auto-generated)
  let transcriptText;
  try {
    transcriptText = await fetchAnyTranscript(videoId);
  } catch (err) {
    console.error("Transcript fetch error:", err);
    return res.status(400).json({
      error: "\u26A0\uFE0F Transcript not found or video is private.",
    });
  }

  // 2) Send it to OpenAI for summarization
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You summarize YouTube transcripts into concise summaries with bullet points and timestamps when available.",
        },
        {
          role: "user",
          content: `Here is the transcript:\n\n${transcriptText}`,
        },
      ],
      temperature: 0.5,
    });

    const summary = completion.choices[0].message.content;
    res.json({ summary });
  } catch (openAiErr) {
    console.error("OpenAI error:", openAiErr);
    if (openAiErr.code === "context_length_exceeded") {
      return res.status(400).json({
        error:
          "Transcript too long for this model’s context window. Try a shorter video or trim the transcript.",
      });
    }
    res.status(500).json({ error: "OpenAI request failed." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ TLDV backend running at http://localhost:${PORT}`);
});
