import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("v") || 
           urlObj.pathname.split('/').pop(); // Handle youtu.be links
  } catch {
    return null;
  }
}

/**
 * Fetch transcript using youtube-transcript
 */
async function fetchTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(chunk => chunk.text).join(" ");
  } catch (error) {
    throw new Error(`No transcript available: ${error.message}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'TLDV backend is running' });
});

// Main summarize endpoint
app.post("/summarize", async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: "Missing YouTube URL." });
  }

  // Extract video ID
  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    // 1) Fetch transcript
    console.log(`Fetching transcript for video: ${videoId}`);
    const transcriptText = await fetchTranscript(videoId);
    
    if (!transcriptText || transcriptText.trim().length === 0) {
      return res.status(400).json({ error: "No transcript content found." });
    }

    // 2) Send to OpenAI for summarization
    console.log('Sending to OpenAI for summarization...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using more cost-effective model
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that creates concise, well-structured summaries of YouTube video transcripts. 

Format your response as:
## Summary
[2-3 sentence overview]

## Key Points
• [Main point 1]
• [Main point 2] 
• [Main point 3]

## Takeaways
• [Actionable insight 1]
• [Actionable insight 2]`
        },
        {
          role: "user",
          content: `Please summarize this YouTube video transcript:\n\n${transcriptText.slice(0, 8000)}` // Limit length
        },
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const summary = completion.choices[0].message.content;
    
    res.json({ 
      summary,
      videoId,
      transcriptLength: transcriptText.length 
    });

  } catch (error) {
    console.error("Error processing request:", error);
    
    if (error.message.includes('transcript')) {
      return res.status(400).json({
        error: "No transcript available for this video. The video may not have captions enabled."
      });
    }
    
    if (error.code === "context_length_exceeded") {
      return res.status(400).json({
        error: "Video transcript is too long. Try a shorter video."
      });
    }
    
    res.status(500).json({ 
      error: "Failed to process video. Please try again." 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ TLDV backend running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});
