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
                citations: response.citations || []
            }

            onMessagesChange(prev => [...prev, aiMessage])

        } catch (err) {
            console.error('Chat error:', err)

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

    const selectedDocNames = documents
        ?.filter(d => selectedDocuments.includes(d.id))
        .map(d => d.title)
        .join(', ')

    return (
        <div className="flex-1 bg-[#0f0f0f] flex flex-col">
            {/* Header */}
            <div className="px-6 py-3 border-b border-[#2d2d2d] flex items-center justify-between">
                <h2 className="text-sm font-normal text-[#e3e3e3]">Chat</h2>
                <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-[#2d2d2d] rounded">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9aa0a6]">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6m0 6v6m10-11h-6m-6 0H4" strokeWidth="2" />
                        </svg>
                    </button>
                    <button className="p-1.5 hover:bg-[#2d2d2d] rounded">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9aa0a6]">
                            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                {!hasMessages ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-8 pb-20">
                        <div className="w-16 h-16 bg-[#8ab4f8] rounded-full flex items-center justify-center mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </div>
                        <h3 className="text-xl text-[#e3e3e3] mb-2">Add a source to get started</h3>
                        <p className="text-sm text-[#9aa0a6] mb-6 max-w-md">
                            Upload PDFs, documents, or other files to chat with your sources and get AI-powered insights.
                        </p>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${msg.role === 'user' ? 'bg-[#8ab4f8]' : 'bg-[#ea8600]'
                                    }`}>
                                    {msg.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-[#e3e3e3] leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.citations.map((citation, idx) => (
                                                <button
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-[#8ab4f8]/20 text-[#8ab4f8] rounded text-xs hover:bg-[#8ab4f8]/30"
                                                    title={citation.document_title || citation.chunk_text}
                                                >
                                                    [{citation.citation_index || idx + 1}]
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {streamingContent && (
                            <div className="flex gap-3">
                                <div className="w-7 h-7 rounded-full bg-[#ea8600] flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                                <div className="flex-1 text-sm text-[#e3e3e3]">{streamingContent}</div>
                            </div>
                        )}

                        {isLoading && !streamingContent && (
                            <div className="flex gap-3">
                                <div className="w-7 h-7 rounded-full bg-[#ea8600] flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                                <div className="flex-1">
                                    <span className="loading-spinner inline-block" style={{ width: 16, height: 16 }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Selected Sources Indicator */}
            {hasSources && (
                <div className="px-6 py-2 bg-[#8ab4f8]/10 border-t border-[#8ab4f8]/20 text-xs text-[#8ab4f8]">
                    Using: {selectedDocNames}
                </div>
            )}

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-[#2d2d2d]">
                <div className="bg-[#2d2d2d] rounded-full flex items-center px-4 py-2 focus-within:ring-1 focus-within:ring-[#8ab4f8]">
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-sm text-[#e3e3e3] placeholder-[#9aa0a6]"
                        placeholder={hasSources ? "Ask anything..." : "Upload a source to get started"}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!hasSources}
                    />
                    <span className="px-2 py-1 text-xs text-[#9aa0a6]">{selectedDocuments.length} sources</span>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading || !hasSources}
                        className="ml-2 w-7 h-7 bg-[#8ab4f8] rounded-full flex items-center justify-center hover:bg-[#aecbfa] disabled:bg-[#5f6368] disabled:cursor-not-allowed transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-2 text-[10px] text-[#9aa0a6]">
                NotebookLLM can be inaccurate; please double-check its responses.
            </div>
        </div>
    )
}
