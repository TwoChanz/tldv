# 📘 TLDV - Too Long; Didn't View

**TLDV** is a web-based tool that allows users to paste any YouTube video URL and instantly receive a structured summary, key insights, and timestamped notes using AI.

---

## 🚀 Project Overview

### 🔍 Purpose
TLDV helps users digest long-form video content quickly by generating:
- 🧠 Summaries (paragraph and bullet form)
- 📌 Timestamped insights
- 📝 Key takeaways & action items

---

## 💡 Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **APIs**: OpenAI, youtube-transcript (unofficial)
- **Optional**: YouTube Data API for video metadata

---

## 🧩 How It Works
1. User pastes a YouTube URL
2. App extracts the transcript
3. Transcript is sent to OpenAI
4. Summary is returned and displayed in the UI

---

## 📄 MVP Features
- Paste YouTube URL
- AI transcript summarization
- Key takeaways with timestamp support
- Error handling and loading state
