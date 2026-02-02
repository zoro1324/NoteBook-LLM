import { useState, useRef } from 'react'

export default function SourcesPanel({ documents, selectedDocuments, onDocumentsChange, onSelectionChange }) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setUploading(true)

        // Simulate upload - connect to backend later
        const newDocs = files.map((file, index) => ({
            id: Date.now() + index,
            title: file.name,
            file_type: file.name.split('.').pop().toUpperCase(),
            word_count: Math.floor(Math.random() * 5000) + 500,
            processed: true
        }))

        onDocumentsChange([...documents, ...newDocs])
        setUploading(false)
    }

    const toggleDocument = (docId) => {
        if (selectedDocuments.includes(docId)) {
            onSelectionChange(selectedDocuments.filter(id => id !== docId))
        } else {
            onSelectionChange([...selectedDocuments, docId])
        }
    }

    const getFileIcon = (type) => {
        const icons = {
            'PDF': '📄',
            'DOCX': '📝',
            'TXT': '📃',
            'MD': '📋',
            'MP3': '🎵',
            'WAV': '🎵',
            'MP4': '🎬'
        }
        return icons[type] || '📄'
    }

    return (
        <div className="panel sources-panel">
            <div className="panel-header">
                <span className="panel-title">Sources</span>
                <button className="btn-icon">📋</button>
            </div>

            <div className="panel-content">
                {/* Add Sources Button */}
                <button
                    className="add-sources-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <span className="loading-spinner" />
                    ) : (
                        <>
                            <span>+</span>
                            <span>Add sources</span>
                        </>
                    )}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.md,.mp3,.wav,.mp4"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />

                {/* Deep Research Card */}
                <div className="deep-research-card">
                    <span className="deep-research-icon">✨</span>
                    <span className="deep-research-text">
                        <a href="#">Try Deep Research</a> for an in-depth report and new sources!
                    </span>
                </div>

                {/* Search Section */}
                <div className="search-container">
                    <span className="search-label">Search the web for new sources</span>
                    <div className="search-bar">
                        <div className="search-options">
                            <span className="search-option">
                                🌐 Web ▾
                            </span>
                            <span className="search-option">
                                ⚡ Fast research ▾
                            </span>
                        </div>
                        <span className="search-arrow">→</span>
                    </div>
                </div>

                {/* Document List */}
                {documents.length > 0 ? (
                    <div style={{ marginTop: '16px' }}>
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                className={`document-card ${selectedDocuments.includes(doc.id) ? 'selected' : ''}`}
                                onClick={() => toggleDocument(doc.id)}
                            >
                                <div className="document-checkbox">
                                    {selectedDocuments.includes(doc.id) && <span style={{ color: '#000', fontSize: 12 }}>✓</span>}
                                </div>
                                <span className="document-icon">{getFileIcon(doc.file_type)}</span>
                                <div className="document-info">
                                    <div className="document-title">{doc.title}</div>
                                    <div className="document-meta">{doc.file_type} • {doc.word_count.toLocaleString()} words</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" style={{ marginTop: '60px' }}>
                        <div className="empty-state-icon">📁</div>
                        <div className="empty-state-title">Saved sources will appear here</div>
                        <div className="empty-state-text">
                            Click Add source above to add PDFs, websites, text, videos or audio files. Or import a file directly from Google Drive.
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
