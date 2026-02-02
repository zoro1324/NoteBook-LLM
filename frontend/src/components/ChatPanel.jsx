import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ conversation, selectedDocuments }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = {
            role: 'user',
            content: input,
            citations: []
        }

        setMessages([...messages, userMessage])
        setInput('')
        setIsLoading(true)

        // TODO: Send to backend and get AI response
        // const response = await fetch('/api/chat', { ... })

        // Mock response
        setTimeout(() => {
            const aiMessage = {
                role: 'assistant',
                content: 'This is a placeholder response. Connect to the Django backend to get real AI responses from Ollama.',
                citations: []
            }
            setMessages(prev => [...prev, aiMessage])
            setIsLoading(false)
        }, 1000)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="panel chat-panel">
            <div className="panel-header">
                <span className="panel-title">Chat</span>
            </div>

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">💬</div>
                            <div className="empty-state-text">
                                {selectedDocuments.length === 0
                                    ? 'Select some sources to start chatting'
                                    : 'Ask questions about your sources'}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                <div className="message-avatar">
                                    {msg.role === 'user' ? 'U' : 'AI'}
                                </div>
                                <div className="message-content">
                                    {msg.content}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div style={{ marginTop: '8px' }}>
                                            {msg.citations.map((citation, cidx) => (
                                                <span key={cidx} className="citation-chip">
                                                    [{cidx + 1}]
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="message assistant">
                            <div className="message-avatar">AI</div>
                            <div className="message-content">
                                <span className="loading-spinner"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    <div className="chat-input-wrapper">
                        <textarea
                            className="chat-input"
                            placeholder="Ask anything about your sources..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            rows={1}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
