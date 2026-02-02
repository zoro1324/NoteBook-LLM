import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ messages, onMessagesChange, selectedDocuments }) {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: input,
            citations: []
        }

        onMessagesChange([...messages, userMessage])
        setInput('')
        setIsLoading(true)

        // TODO: Connect to Django backend
        // const response = await fetch('http://localhost:8000/api/chat/', { ... })

        // Mock AI response
        setTimeout(() => {
            const aiMessage = {
                id: Date.now(),
                role: 'assistant',
                content: 'Based on the selected sources, I can help you understand the content. Please upload some documents first, and I\'ll analyze them to provide accurate, cited responses.',
                citations: selectedDocuments.length > 0 ? [{ index: 1, source: 'Document 1' }] : []
            }
            onMessagesChange(prev => [...prev, aiMessage])
            setIsLoading(false)
        }, 1500)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const hasMessages = messages.length > 0
    const hasSources = selectedDocuments.length > 0

    return (
        <div className="panel chat-panel">
            <div className="panel-header">
                <span className="panel-title">Chat</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon">⚙</button>
                    <button className="btn-icon">⋮</button>
                </div>
            </div>

            <div className="chat-container">
                <div className="chat-messages">
                    {!hasMessages ? (
                        <div className="upload-prompt">
                            <div className="upload-icon">
                                ⬆️
                            </div>
                            <h2 className="upload-title">Add a source to get started</h2>
                            <button
                                className="upload-btn"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Upload a source
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt,.md,.mp3,.wav,.mp4"
                                style={{ display: 'none' }}
                            />
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`message ${msg.role}`}>
                                    <div className="message-avatar">
                                        {msg.role === 'user' ? '👤' : '🤖'}
                                    </div>
                                    <div className="message-content">
                                        {msg.content}
                                        {msg.citations && msg.citations.length > 0 && (
                                            <div style={{ marginTop: '8px' }}>
                                                {msg.citations.map((citation, idx) => (
                                                    <span key={idx} className="citation-chip">
                                                        [{citation.index}]
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="message assistant">
                                    <div className="message-avatar">🤖</div>
                                    <div className="message-content">
                                        <span className="loading-spinner" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Chat Input */}
                <div className="chat-input-container">
                    <div className="chat-input-wrapper">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={hasSources ? "Ask anything about your sources..." : "Upload a source to get started"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={!hasSources && !hasMessages}
                        />
                        <span className="sources-count">{selectedDocuments.length} sources</span>
                        <button
                            className="send-btn"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            →
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="footer-text">
                    NotebookLLM can be inaccurate; please double-check its responses.
                </div>
            </div>
        </div>
    )
}
