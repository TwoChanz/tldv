// File: backend/app.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { getTranscript } = require("youtube-transcript");
const { getSubtitles } = require("youtube-captions-scraper");
const { OpenAI } = require("openai");

// Node 18+ includes fetch globally

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

// Preview endpoint to return only video metadata
app.post('/preview', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing YouTube URL.' });

  let videoId;
  try {
    videoId = new URL(url).searchParams.get('v');
  } catch {
    return res.status(400).json({ error: 'Invalid YouTube URL.' });
  }
  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL.' });

  const meta = await fetchVideoMetadata(videoId);
  if (!meta) return res.status(400).json({ error: 'Unable to fetch metadata.' });

  res.json({ video: meta });
});

// Fetch basic video metadata (title, thumbnail, author and optional duration)
async function fetchVideoMetadata(videoId) {
  try {
    const oembedUrl =
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) throw new Error('oEmbed request failed');
    const data = await res.json();
    const meta = {
      title: data.title,
      thumbnail: data.thumbnail_url,
      author: data.author_name,
    };

    if (process.env.YOUTUBE_API_KEY) {
      const detailsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
      );
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        meta.duration =
          detailsData.items?.[0]?.contentDetails?.duration || undefined;
      }
    }

    return meta;
  } catch (err) {
    console.error('Metadata fetch error:', err);
    return null;
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
    return res
      .status(400)
      .json({ error: "No transcript available for this video." });
  }

  // 2) Fetch metadata to return with the summary
  const videoMeta = await fetchVideoMetadata(videoId);

  // 3) Send it to OpenAI for summarization
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You summarize YouTube transcripts into clear bullet points with timestamps and key takeaways. If timestamps are missing, skip them. Format the summary so it's easy to read, using • or - for bullet points and timestamps like [00:01:15] when present.",
        },
        {
          role: "user",
          content: `Here is the transcript:\n\n${transcriptText}`,
        },
      ],
      temperature: 0.5,
    });

    const summary = completion.choices[0].message.content;
    res.json({ summary, video: videoMeta });
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
