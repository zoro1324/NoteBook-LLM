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
        <div className="h-screen flex flex-col bg-[#0f0f0f]">
            {/* Header */}
            <header className="px-4 py-2 bg-[#1a1a1a] border-b border-[#2d2d2d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-[#2d2d2d] rounded text-[#9aa0a6] hover:text-[#e3e3e3]"
                        title="Back to notebooks"
                    >
                        ←
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-base">📓</span>
                    </div>
                    <input
                        type="text"
                        className="bg-transparent border-none outline-none text-base font-normal text-[#e3e3e3] px-2 py-1 hover:bg-[#2d2d2d] focus:bg-[#2d2d2d] rounded min-w-[200px]"
                        value={notebook.title}
                        onChange={(e) => updateTitle(e.target.value)}
                        placeholder="Untitled notebook"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-4 py-1.5 bg-[#8ab4f8] text-[#0f0f0f] text-sm font-medium rounded-full hover:bg-[#aecbfa] flex items-center gap-1.5">
                        <span>+</span>
                        <span>Create notebook</span>
                    </button>
                    <button className="px-4 py-1.5 bg-transparent text-[#e3e3e3] text-sm font-medium border border-[#5f6368] rounded-full hover:bg-[#2d2d2d] flex items-center gap-1.5">
                        <span>📊</span>
                        <span>Analytics</span>
                    </button>
                    <button className="px-4 py-1.5 bg-transparent text-[#e3e3e3] text-sm font-medium border border-[#5f6368] rounded-full hover:bg-[#2d2d2d] flex items-center gap-1.5">
                        <span>↗</span>
                        <span>Share</span>
                    </button>
                    <button className="px-4 py-1.5 bg-transparent text-[#e3e3e3] text-sm font-medium border border-[#5f6368] rounded-full hover:bg-[#2d2d2d] flex items-center gap-1.5">
                        <span>⚙</span>
                        <span>Settings</span>
                    </button>
                    <div className="w-8 h-8 rounded-full bg-[#8ab4f8] flex items-center justify-center cursor-pointer ml-2">
                        👤
                    </div>
                </div>
            </header>

            {/* Main Content */}
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
