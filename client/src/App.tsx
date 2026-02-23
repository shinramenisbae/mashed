import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="app">
      <h1>Mashed</h1>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      
      <div className="messages">
        <h2>Messages</h2>
        {messages.length === 0 ? (
          <p>No messages yet...</p>
        ) : (
          <ul>
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
