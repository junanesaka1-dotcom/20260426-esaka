import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import './App.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [isStreaming, setIsStreaming] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setStatus('connecting')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen = () => setStatus('connected')

    ws.onclose = () => {
      setStatus('disconnected')
      setIsStreaming(false)
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'delta':
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last?.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: last.content + data.content }
            } else {
              updated.push({ role: 'assistant', content: data.content })
            }
            return updated
          })
          break

        case 'message':
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last?.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: data.content }
            } else {
              updated.push({ role: 'assistant', content: data.content })
            }
            return updated
          })
          setIsStreaming(false)
          break

        case 'done':
          setIsStreaming(false)
          break

        case 'error':
          setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.content}` }])
          setIsStreaming(false)
          break
      }
    }
  }, [])

  useEffect(() => {
    connectWebSocket()
    return () => {
      wsRef.current?.close()
    }
  }, [connectWebSocket])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    wsRef.current.send(JSON.stringify({ type: 'chat', content: trimmed }))
    setInput('')
    setIsStreaming(true)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Copilot Chat</h1>
        <div className="status">
          <span className={`status-dot ${status}`} />
          {status}
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">Send a message to start chatting</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-bubble">
              {msg.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="message assistant">
            <div className="message-bubble">
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={status !== 'connected'}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || status !== 'connected' || isStreaming}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
