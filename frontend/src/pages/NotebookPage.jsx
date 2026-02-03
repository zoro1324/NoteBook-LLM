import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { notebooksApi, documentsApi } from '../services/api'
import SourcesPanel from '../components/SourcesPanel'
import ChatPanel from '../components/ChatPanel'
import StudioPanel from '../components/StudioPanel'

export default function NotebookPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [notebook, setNotebook] = useState({
        id: id,
        title: 'Untitled notebook',
    })
    const [documents, setDocuments] = useState([])
    const [selectedDocuments, setSelectedDocuments] = useState([])
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [conversationId, setConversationId] = useState(null)

    useEffect(() => {
        loadNotebook()
    }, [id])

    const loadNotebook = async () => {
        try {
            setLoading(true)
            const data = await notebooksApi.get(id)
            setNotebook(data)
            setDocuments(data.documents || [])

            if (data.conversations && data.conversations.length > 0) {
                const conv = data.conversations[0]
                setConversationId(conv.id)
                setMessages(conv.messages || [])
            }
        } catch (err) {
            console.error('Failed to load notebook:', err)
            try {
                const newNotebook = await notebooksApi.create({
                    id: id,
                    title: 'Untitled notebook'
                })
                setNotebook(newNotebook)
            } catch (createErr) {
                console.error('Failed to create notebook:', createErr)
            }
        } finally {
            setLoading(false)
        }
    }

    const updateTitle = async (newTitle) => {
        setNotebook({ ...notebook, title: newTitle })
        try {
            await notebooksApi.update(id, { title: newTitle })
        } catch (err) {
            console.error('Failed to update title:', err)
        }
    }

    const handleDocumentUpload = async (file) => {
        try {
            const document = await documentsApi.upload(file)
            await notebooksApi.addDocument(id, document.id)
            setDocuments([...documents, document])
            return document
        } catch (err) {
            console.error('Failed to upload document:', err)
            throw err
        }
    }

    const handleDocumentRemove = async (documentId) => {
        try {
            await notebooksApi.removeDocument(id, documentId)
            setDocuments(documents.filter(d => d.id !== documentId))
            setSelectedDocuments(selectedDocuments.filter(id => id !== documentId))
        } catch (err) {
            console.error('Failed to remove document:', err)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-[#131314]">
            {/* Header */}
            <header className="px-4 py-3 bg-[#131314] border-b border-[#3c4043] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-[#3c4043] rounded-full text-[#e3e3e3] transition-colors"
                        title="Back to notebooks"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">N</span>
                    </div>

                    {/* Title Input */}
                    <div className="flex items-center gap-2 min-w-0">
                        <input
                            type="text"
                            className="bg-transparent border-none outline-none text-[18px] font-normal text-[#e3e3e3] px-2 py-1 hover:bg-[#2c3033] focus:bg-[#2c3033] rounded min-w-[100px] max-w-[300px] transition-colors truncate"
                            value={notebook.title}
                            onChange={(e) => updateTitle(e.target.value)}
                            placeholder="Untitled notebook"
                        />

                        {/* Public Badge */}
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#2c3033] rounded-full text-[11px] font-medium text-[#c4c7c5] border border-[#444746]">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                            Public
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Create notebook button - White Pill */}
                    <button className="h-9 px-4 bg-[#e3e3e3] text-black text-[13px] font-medium rounded-full hover:bg-white transition-colors flex items-center gap-2 shadow-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        <span>Create notebook</span>
                    </button>

                    {/* Analytics button - Outlined */}
                    <button className="h-9 px-4 bg-transparent text-[#e3e3e3] text-[13px] font-medium border border-[#5f6368] rounded-full hover:bg-[#3c4043] transition-colors flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 20V10M12 20V4M6 20v-6" />
                        </svg>
                        <span>Analytics</span>
                    </button>

                    {/* Share button - Outlined */}
                    <button className="h-9 px-4 bg-transparent text-[#e3e3e3] text-[13px] font-medium border border-[#5f6368] rounded-full hover:bg-[#3c4043] transition-colors flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        <span>Share</span>
                    </button>

                    {/* Settings button - Outlined */}
                    <button className="h-9 px-4 bg-transparent text-[#e3e3e3] text-[13px] font-medium border border-[#5f6368] rounded-full hover:bg-[#3c4043] transition-colors flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span>Settings</span>
                    </button>

                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full ml-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#8ab4f8] transition-all">
                        <img
                            src="https://lh3.googleusercontent.com/ogw/AF2bZyi...=s64-c-mo"
                            alt="U"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null
                                e.target.src = 'https://ui-avatars.com/api/?name=User&background=random'
                            }}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content - 3 Column Layout */}
            <main className="flex flex-1 overflow-hidden">
                <SourcesPanel
                    documents={documents}
                    selectedDocuments={selectedDocuments}
                    onDocumentsChange={setDocuments}
                    onSelectionChange={setSelectedDocuments}
                    onUpload={handleDocumentUpload}
                    onRemove={handleDocumentRemove}
                />

                <ChatPanel
                    messages={messages}
                    onMessagesChange={setMessages}
                    selectedDocuments={selectedDocuments}
                    documents={documents}
                    notebookId={id}
                    conversationId={conversationId}
                    onConversationIdChange={setConversationId}
                />

                <StudioPanel
                    selectedDocuments={selectedDocuments}
                    documents={documents}
                />
            </main>
        </div>
    )
}
