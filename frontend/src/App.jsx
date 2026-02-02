import { useState, useEffect } from 'react'
import './App.css'
import SourcesPanel from './components/SourcesPanel'
import ChatPanel from './components/ChatPanel'
import StudioPanel from './components/StudioPanel'

function App() {
  const [documents, setDocuments] = useState([])
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)

  return (
    <div className="app-container">
      <SourcesPanel
        documents={documents}
        selectedDocuments={selectedDocuments}
        onDocumentsChange={setDocuments}
        onSelectionChange={setSelectedDocuments}
      />

      <ChatPanel
        conversation={activeConversation}
        selectedDocuments={selectedDocuments}
      />

      <StudioPanel
        selectedDocuments={selectedDocuments}
      />
    </div>
  )
}

export default App
