import { useState } from 'react'
import './App.css'
import SourcesPanel from './components/SourcesPanel'
import ChatPanel from './components/ChatPanel'
import StudioPanel from './components/StudioPanel'

function App() {
  const [documents, setDocuments] = useState([])
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [messages, setMessages] = useState([])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span style={{ fontSize: '16px' }}>📓</span>
          </div>
          <span className="notebook-title">Untitled notebook</span>
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
          <div className="logo" style={{ width: 32, height: 32 }}>
            <span style={{ fontSize: 14 }}>👤</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
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

export default App
