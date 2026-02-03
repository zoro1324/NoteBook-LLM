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
    const [copiedId, setCopiedId] = useState(null)
    const messagesEndRef = useRef(null)

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
            citations: [],
            timestamp: new Date()
        }

        onMessagesChange([...messages, userMessage])
        const messageText = input
        setInput('')
        setIsLoading(true)
        setStreamingContent('')

        try {
            const response = await chatApi.send(
                messageText,
                selectedDocuments,
                conversationId,
                notebookId
            )

            if (response.conversation_id && !conversationId) {
                onConversationIdChange?.(response.conversation_id)
            }

            const aiMessage = {
                id: response.message?.id || Date.now(),
                role: 'assistant',
                content: response.message?.content || response.content || 'No response received',
                citations: response.citations || [],
                timestamp: new Date()
            }

            onMessagesChange(prev => [...prev, aiMessage])

        } catch (err) {
            console.error('Chat error:', err)

            const aiMessage = {
                id: Date.now(),
                role: 'assistant',
                content: `I'm unable to connect to the AI backend. Please ensure:\n\n1. Django is running: \`python manage.py runserver\`\n2. Ollama is running: \`ollama serve\`\n3. A model is pulled: \`ollama pull phi3:mini\`\n\nError: ${err.message}`,
                citations: [],
                timestamp: new Date()
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

    const handleCopy = async (content, msgId) => {
        try {
            await navigator.clipboard.writeText(content)
            setCopiedId(msgId)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const formatTimestamp = (date) => {
        if (!date) return ''
        const d = new Date(date)
        const today = new Date()
        const isToday = d.toDateString() === today.toDateString()
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        return isToday ? `Today • ${time}` : `${d.toLocaleDateString()} • ${time}`
    }

    // Parse markdown-like content for structured display
    const renderContent = (content) => {
        const lines = content.split('\n')
        const elements = []
        let currentList = []
        let listKey = 0

        const flushList = () => {
            if (currentList.length > 0) {
                elements.push(
                    <ul key={`list-${listKey++}`} className="space-y-2 my-3">
                        {currentList.map((item, idx) => (
                            <li key={idx} className="flex gap-2 text-sm text-[#e3e3e3] leading-relaxed">
                                <span className="text-[#9aa0a6] mt-1.5">•</span>
                                <span>{renderInlineContent(item)}</span>
                            </li>
                        ))}
                    </ul>
                )
                currentList = []
            }
        }

        lines.forEach((line, idx) => {
            const trimmed = line.trim()

            // Numbered heading (e.g., "4. Interleaved DMA")
            const headingMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
            if (headingMatch && !trimmed.startsWith('•') && trimmed.length < 100) {
                flushList()
                elements.push(
                    <h3 key={idx} className="text-xl font-normal text-[#e3e3e3] mt-6 mb-3">
                        {headingMatch[1]}. {headingMatch[2]}
                    </h3>
                )
                return
            }

            // Regular heading (## or ###)
            if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
                flushList()
                const text = trimmed.replace(/^#+\s+/, '')
                elements.push(
                    <h3 key={idx} className="text-lg font-medium text-[#e3e3e3] mt-5 mb-2">
                        {text}
                    </h3>
                )
                return
            }

            // Bullet point
            if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                currentList.push(trimmed.slice(2))
                return
            }

            // Empty line
            if (trimmed === '') {
                flushList()
                return
            }

            // Regular paragraph
            flushList()
            elements.push(
                <p key={idx} className="text-sm text-[#e3e3e3] leading-relaxed my-2">
                    {renderInlineContent(trimmed)}
                </p>
            )
        })

        flushList()
        return elements
    }

    // Render inline content with citations highlighted
    const renderInlineContent = (text) => {
        // Match citation patterns like [1], [2], [1, 4]
        const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g)
        return parts.map((part, idx) => {
            const citationMatch = part.match(/^\[(\d+(?:,\s*\d+)*)\]$/)
            if (citationMatch) {
                const numbers = citationMatch[1].split(',').map(n => n.trim())
                return numbers.map((num, i) => (
                    <span key={`${idx}-${i}`}>
                        <button
                            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mx-0.5 text-[10px] font-medium rounded bg-[#8ab4f8]/20 text-[#8ab4f8] hover:bg-[#8ab4f8]/30 transition-colors"
                            title={`Source ${num}`}
                        >
                            {num}
                        </button>
                        {i < numbers.length - 1 && ', '}
                    </span>
                ))
            }
            // Highlight text that looks like links or emphasized content
            return <span key={idx}>{part}</span>
        })
    }

    const hasMessages = messages.length > 0
    const hasSources = selectedDocuments.length > 0

    return (
        <div className="flex-1 bg-[#131314] flex flex-col border-x border-[#2d2d2d]">
            {/* Header */}
            <div className="px-6 py-3 border-b border-[#2d2d2d] flex items-center justify-between">
                <h2 className="text-sm font-medium text-[#e3e3e3]">Chat</h2>
                <div className="flex gap-1">
                    <button className="p-2 hover:bg-[#3c4043] rounded-lg transition-colors" title="Filter">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9aa0a6]">
                            <path d="M3 6h18M7 12h10M10 18h4" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button className="p-2 hover:bg-[#3c4043] rounded-lg transition-colors" title="More options">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9aa0a6]">
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                            <circle cx="19" cy="12" r="1" fill="currentColor" />
                            <circle cx="5" cy="12" r="1" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {!hasMessages ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-8 pb-20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        {/* Minimal Empty State */}
                        <div className="w-16 h-16 bg-gradient-to-br from-[#1e1f20] to-[#2c3033] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#3c4043]/30">
                            <span className="text-2xl">✨</span>
                        </div>
                        <h3 className="text-[22px] text-[#e3e3e3] mb-3 font-normal">Add a source to get started</h3>
                        <p className="text-[14px] text-[#9aa0a6] mb-8 max-w-sm leading-relaxed">
                            Upload documents to chat with your sources and get AI-powered insights.
                        </p>
                    </div>
                ) : (
                    <div className="px-8 py-6 max-w-4xl mx-auto w-full">
                        {messages.map((msg, msgIdx) => (
                            <div key={msg.id} className="mb-8 animate-fade-in group">
                                {/* Message content */}
                                <div className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user'
                                        ? 'bg-[#3c4043] border border-[#5f6368]'
                                        : 'bg-transparent'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <span className="text-white text-xs">U</span>
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570] p-[2px]">
                                                <div className="w-full h-full rounded-full bg-[#131314] flex items-center justify-center">
                                                    <span className="text-[10px] gradient-text">AI</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {msg.role === 'user' ? (
                                            <p className="text-[15px] text-[#e3e3e3] leading-relaxed pt-1.5">{msg.content}</p>
                                        ) : (
                                            <div className="prose-invert text-[15px] leading-relaxed">
                                                {renderContent(msg.content)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Citations */}
                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 ml-12">
                                        {msg.citations.map((citation, idx) => (
                                            <button
                                                key={idx}
                                                className="px-2.5 py-1 bg-[#2c3033] text-[#8ab4f8] rounded-lg text-xs hover:bg-[#3c4043] transition-colors flex items-center gap-1.5 border border-[#3c4043]/50"
                                                title={citation.document_title || citation.chunk_text}
                                            >
                                                <span className="font-medium">[{citation.citation_index || idx + 1}]</span>
                                                <span className="text-[#c4c7c5] max-w-[150px] truncate">{citation.document_title}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Action buttons for AI responses */}
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mt-3 ml-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2c3033] rounded-full transition-colors border border-transparent hover:border-[#3c4043]">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                            </svg>
                                            <span>Save</span>
                                        </button>
                                        <button
                                            onClick={() => handleCopy(msg.content, msg.id)}
                                            className="p-1.5 text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2c3033] rounded-full transition-colors"
                                            title="Copy"
                                        >
                                            {copiedId === msg.id ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            )}
                                        </button>
                                        <button className="p-1.5 text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2c3033] rounded-full transition-colors" title="Like">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                            </svg>
                                        </button>
                                        <button className="p-1.5 text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2c3033] rounded-full transition-colors" title="Dislike">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Timestamp */}
                                {msgIdx === messages.length - 1 && msg.timestamp && (
                                    <div className="text-center mt-6">
                                        <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wide">
                                            {formatTimestamp(msg.timestamp)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {streamingContent && (
                            <div className="flex gap-4 mb-8 ml-1">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570] p-[2px] flex-shrink-0">
                                    <div className="w-full h-full rounded-full bg-[#131314] flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex-1 text-[15px] text-[#e3e3e3] leading-relaxed animate-pulse">{streamingContent}</div>
                            </div>
                        )}

                        {isLoading && !streamingContent && (
                            <div className="flex gap-4 mb-8 ml-1">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570] p-[2px] flex-shrink-0">
                                    <div className="w-full h-full rounded-full bg-[#131314] flex items-center justify-center">
                                        <span className="text-[10px] text-white">●</span>
                                    </div>
                                </div>
                                <div className="flex-1 flex items-center gap-1.5 h-8">
                                    <div className="w-1.5 h-1.5 bg-[#e3e3e3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-[#e3e3e3] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-[#e3e3e3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area - Floating Pill */}
            <div className="px-6 pb-6 pt-2">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                    <div className="bg-[#1e1f20] rounded-[24px] flex items-center px-2 py-2 shadow-lg border border-[#3c4043]/50 focus-within:border-[#5f6368] transition-all relative z-10 min-h-[56px]">
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#e3e3e3] placeholder-[#8e918f] ml-4 font-normal"
                            placeholder={hasSources ? "Ask anything..." : "Add a source to start chatting"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={!hasSources}
                        />

                        {hasSources && (
                            <span className="px-3 py-1 text-[11px] font-medium text-[#c4c7c5] bg-[#333537] rounded-full mr-2 border border-[#3c4043]">
                                {selectedDocuments.length} source{selectedDocuments.length !== 1 ? 's' : ''}
                            </span>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading || !hasSources}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${input.trim() && hasSources
                                ? 'bg-[#e3e3e3] text-black hover:scale-105'
                                : 'bg-[#3c4043] text-[#8e918f] cursor-not-allowed'
                                }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    {/* Footer Warning */}
                    <div className="text-center mt-3 text-[11px] text-[#9aa0a6]">
                        NotebookLLM can be inaccurate; please double-check its responses.
                    </div>
                </div>
            </div>
        </div>
    )
}
