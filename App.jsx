import { useState } from 'react';
import './App.css';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);

  const handlePreview = async () => {
    if (!videoUrl) return;
    try {
      new URL(videoUrl);
    } catch {
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setVideoInfo(data.video);
      } else {
        setVideoInfo(null);
      }
    } catch {
      // ignore connection errors for preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSummary('');
    setError('');
    setCopied(false);

    console.log("✅ Sending URL to backend:", videoUrl); // <== LOGGING HERE

    try {
      const res = await fetch('http://localhost:4000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setVideoInfo(data.video);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('❌ Could not connect to the server.');
    }

    setLoading(false);
  };

  const downloadFile = (ext) => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `summary.${ext}`;
    link.click();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="app">
      <h1>TLDV — YouTube AI Summarizer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Paste YouTube URL here"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          onBlur={handlePreview}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Summarizing...' : 'Summarize'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">⏳ Working on your summary...</p>}

      {videoInfo && (
        <div className="video-preview">
          <img src={videoInfo.thumbnail} alt="thumbnail" />
          <div className="video-details">
            <h2>{videoInfo.title}</h2>
            <p>📺 {videoInfo.author}</p>
            {videoInfo.duration && (
              <p>🕒 Duration: {videoInfo.duration.replace('PT', '')}</p>
            )}
          </div>
        </div>
      )}

      {summary && (
        <div className="summary-box">
          <h2>Summary</h2>
          <div className="summary-text">{summary}</div>
          <div className="buttons">
            <button onClick={() => downloadFile('txt')}>⬇️ Export .txt</button>
            <button onClick={() => downloadFile('md')}>⬇️ Export .md</button>
            <button onClick={copyToClipboard}>📋 Copy to Clipboard</button>
            {copied && <span className="copied-msg">✅ Copied!</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
