import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSummary('');
    setVideoInfo(null);
    setError('');
    setCopied(false);

    console.log('✅ Sending URL to backend:', videoUrl);

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

  const themeTooltip = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>TLDV — YouTube AI Summarizer</h1>
        <div
          className="theme-toggle"
          onClick={toggleTheme}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span className="tooltip">{themeTooltip}</span>
          <span className="icon">
            {theme === 'dark' ? (hovered ? '🌞' : '🌙') : (hovered ? '🌙' : '🌞')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Paste YouTube URL here"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
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
            <p>🕒 Duration: {videoInfo.duration.replace('PT', '')}</p>
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
