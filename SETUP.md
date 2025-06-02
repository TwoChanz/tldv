# 🛠️ TLDV Project Setup Guide

## 📌 Overview
**TLDV (Too Long; Didn't View)** is a full-stack AI-powered summarization tool. Paste a YouTube URL and receive a structured summary using OpenAI GPT and YouTube transcripts.

---

## 📁 Project Structure

```
tldv/
├── backend/
│   ├── app.js
│   ├── .env
│   ├── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── main.jsx
│   ├── index.html
│   ├── package.json
```

---

## ✅ Backend Setup

### Required Packages:
- express
- cors
- dotenv
- axios
- openai
- youtube-transcript

### Commands:
```bash
cd backend
npm install
node app.js
```

---

## ✅ Frontend Setup

### Required Tools:
- Vite
- React

### Commands:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables (.env)
```env
OPENAI_API_KEY=your_openai_key
YOUTUBE_API_KEY=your_youtube_api_key
```

---

## 🧪 Local URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:4000/summarize

Submit a POST request to `/summarize` with JSON:
```json
{ "url": "https://www.youtube.com/watch?v=VIDEO_ID" }
```
