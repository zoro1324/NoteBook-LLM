import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SourcesPanel from '../components/SourcesPanel'
import ChatPanel from '../components/ChatPanel'
import StudioPanel from '../components/StudioPanel'

export default function NotebookPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [notebook, setNotebook] = useState({
        id: id,
        title: 'Untitled notebook',
        documents: [],
        selectedDocuments: [],
        messages: []
    })

    const [documents, setDocuments] = useState([])
    const [selectedDocuments, setSelectedDocuments] = useState([])
    const [messages, setMessages] = useState([])

    // Load notebook data from backend
    useEffect(() => {
        // TODO: Fetch notebook from backend
        // fetch(`http://localhost:8000/api/notebooks/${id}/`)
        //   .then(res => res.json())
        //   .then(data => setNotebook(data))
    }, [id])

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
                        onChange={(e) => setNotebook({ ...notebook, title: e.target.value })}
                        placeholder="Untitled notebook"
                    />
                </div>

                <div className="header-right">
                    <button className="btn btn-primary">
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
                />

                <ChatPanel
                    messages={messages}
                    onMessagesChange={setMessages}
                    selectedDocuments={selectedDocuments}
                />

                <StudioPanel
                    selectedDocuments={selectedDocuments}
                />
            </main>
        </div>
    )
}
