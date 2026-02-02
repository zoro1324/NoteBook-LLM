import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../services/api'

export default function ChatPanel({
    messages,
    onMessagesChange,
    selectedDocuments,
    documents,
    notebookId,
    conversationId,
    onConversationIdChange
}) {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [streamingContent, setStreamingContent] = useState('')
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, streamingContent])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: input,
            citations: []
        }

        onMessagesChange([...messages, userMessage])
        const messageText = input
        setInput('')
        setIsLoading(true)
        setStreamingContent('')

        try {
            // Try to use the API
            const response = await chatApi.send(
                messageText,
                selectedDocuments,
                conversationId,
                notebookId
            )

            // Update conversation ID if new
            if (response.conversation_id && !conversationId) {
                onConversationIdChange?.(response.conversation_id)
            }

            // Add AI response
            const aiMessage = {
                id: response.message?.id || Date.now(),
                role: 'assistant',
                content: response.message?.content || response.content || 'No response received',
                citations: response.citations || []
            }

            onMessagesChange(prev => [...prev, aiMessage])

        } catch (err) {
            console.error('Chat error:', err)

            // Fallback response when backend is not available
            const aiMessage = {
                id: Date.now(),
                role: 'assistant',
                content: `I'm unable to connect to the AI backend. Please ensure:\n\n1. Django is running: \`python manage.py runserver\`\n2. Ollama is running: \`ollama serve\`\n3. A model is pulled: \`ollama pull phi3:mini\`\n\nError: ${err.message}`,
                citations: []
            }
            onMessagesChange(prev => [...prev, aiMessage])
        } finally {
            setIsLoading(false)
            setStreamingContent('')
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const hasMessages = messages.length > 0
    const hasSources = selectedDocuments.length > 0

    // Get selected document names for display
    const selectedDocNames = documents
        ?.filter(d => selectedDocuments.includes(d.id))
        .map(d => d.title)
        .join(', ')

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
                            <div className="upload-icon">⬆️</div>
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
                        <div style={{ width: '100%', padding: '0 16px' }}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`message ${msg.role}`}>
                                    <div className="message-avatar">
                                        {msg.role === 'user' ? '👤' : '🤖'}
                                    </div>
                                    <div className="message-content">
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                        {msg.citations && msg.citations.length > 0 && (
                                            <div style={{ marginTop: '12px' }}>
                                                {msg.citations.map((citation, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="citation-chip"
                                                        title={citation.document_title || citation.chunk_text}
                                                    >
                                                        [{citation.citation_index || idx + 1}]
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Streaming content */}
                            {streamingContent && (
                                <div className="message assistant">
                                    <div className="message-avatar">🤖</div>
                                    <div className="message-content">
                                        {streamingContent}
                                    </div>
                                </div>
                            )}

                            {isLoading && !streamingContent && (
                                <div className="message assistant">
                                    <div className="message-avatar">🤖</div>
                                    <div className="message-content">
                                        <span className="loading-spinner" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Selected Sources Indicator */}
                {hasSources && (
                    <div style={{
                        padding: '8px 24px',
                        background: 'rgba(0, 191, 165, 0.1)',
                        borderTop: '1px solid var(--border-color)',
                        fontSize: '12px',
                        color: 'var(--accent-teal)'
                    }}>
                        📎 Using: {selectedDocNames}
                    </div>
                )}

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
