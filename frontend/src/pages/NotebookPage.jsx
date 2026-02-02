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

    // Load notebook data from backend
    useEffect(() => {
        loadNotebook()
    }, [id])

    const loadNotebook = async () => {
        try {
            setLoading(true)
            const data = await notebooksApi.get(id)
            setNotebook(data)
            setDocuments(data.documents || [])

            // Get first conversation if exists
            if (data.conversations && data.conversations.length > 0) {
                const conv = data.conversations[0]
                setConversationId(conv.id)
                setMessages(conv.messages || [])
            }
        } catch (err) {
            console.error('Failed to load notebook:', err)
            // Create new notebook if it doesn't exist
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
        <div className="app-container">
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <button
                        className="btn-icon back-btn"
                        onClick={() => navigate('/')}
                        title="Back to notebooks"
                    >
                        ←
                    </button>
                    <div className="logo">
                        <span style={{ fontSize: '16px' }}>📓</span>
                    </div>
                    <input
                        type="text"
                        className="notebook-title-input"
                        value={notebook.title}
                        onChange={(e) => updateTitle(e.target.value)}
                        placeholder="Untitled notebook"
                    />
                </div>

                <div className="header-right">
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        <span>+</span> Create notebook
                    </button>
                    <button className="btn btn-secondary">
                        <span>📊</span> Analytics
                    </button>
                    <button className="btn btn-secondary">
                        <span>↗</span> Share
                    </button>
                    <button className="btn btn-secondary">
                        <span>⚙</span> Settings
                    </button>
                    <div className="avatar">👤</div>
                </div>
            </header>

            {/* Main Content - Three Panels */}
            <main className="main-content">
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
