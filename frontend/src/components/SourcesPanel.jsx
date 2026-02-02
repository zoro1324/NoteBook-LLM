import { useState } from 'react'

export default function SourcesPanel({ documents, selectedDocuments, onDocumentsChange, onSelectionChange }) {
    const [uploading, setUploading] = useState(false)

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        setUploading(true)

        // TODO: Upload to backend
        // const formData = new FormData()
        // files.forEach(file => formData.append('files', file))

        setUploading(false)
    }

    const toggleDocumentSelection = (docId) => {
        if (selectedDocuments.includes(docId)) {
            onSelectionChange(selectedDocuments.filter(id => id !== docId))
        } else {
            onSelectionChange([...selectedDocuments, docId])
        }
    }

    return (
        <div className="panel sources-panel">
            <div className="panel-header">
                <span className="panel-title">Sources</span>
                <label className="btn btn-icon" title="Add sources">
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt,.md,.mp3,.wav,.mp4"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <span>+</span>
                </label>
            </div>

            <div className="panel-content">
                {documents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📄</div>
                        <div className="empty-state-text">
                            No sources yet. Click + to upload documents.
                        </div>
                    </div>
                ) : (
                    documents.map(doc => (
                        <div
                            key={doc.id}
                            className={`document-card ${selectedDocuments.includes(doc.id) ? 'selected' : ''}`}
                            onClick={() => toggleDocumentSelection(doc.id)}
                        >
                            <div className="document-title">{doc.title}</div>
                            <div className="document-meta">
                                {doc.file_type.toUpperCase()} • {doc.word_count} words
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
