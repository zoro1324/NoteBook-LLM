import { useState, useRef } from 'react'
import { documentsApi } from '../services/api'

export default function SourcesPanel({
    documents,
    selectedDocuments,
    onDocumentsChange,
    onSelectionChange,
    onUpload,
    onRemove
}) {
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setUploading(true)
        setUploadError(null)

        try {
            for (const file of files) {
                if (onUpload) {
                    await onUpload(file)
                } else {
                    // Direct upload if no handler provided
                    const doc = await documentsApi.upload(file)
                    onDocumentsChange([...documents, doc])
                }
            }
        } catch (err) {
            console.error('Upload failed:', err)
            setUploadError('Failed to upload file. Make sure the backend is running.')
        } finally {
            setUploading(false)
            e.target.value = '' // Reset input
        }
    }

    const toggleDocument = (docId) => {
        if (selectedDocuments.includes(docId)) {
            onSelectionChange(selectedDocuments.filter(id => id !== docId))
        } else {
            onSelectionChange([...selectedDocuments, docId])
        }
    }

    const handleRemove = async (e, docId) => {
        e.stopPropagation()
        if (onRemove) {
            await onRemove(docId)
        }
    }

    const getFileIcon = (type) => {
        const icons = {
            'pdf': '📄',
            'docx': '📝',
            'txt': '📃',
            'md': '📋',
            'audio': '🎵',
            'video': '🎬',
            'url': '🌐'
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

                {/* Upload Error */}
                {uploadError && (
                    <div style={{
                        padding: '8px 12px',
                        marginBottom: '12px',
                        background: 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid rgba(244, 67, 54, 0.3)',
                        borderRadius: '8px',
                        color: '#f44336',
                        fontSize: '12px'
                    }}>
                        {uploadError}
                    </div>
                )}

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
                                    {selectedDocuments.includes(doc.id) && (
                                        <span style={{ color: '#000', fontSize: 12 }}>✓</span>
                                    )}
                                </div>
                                <span className="document-icon">{getFileIcon(doc.file_type)}</span>
                                <div className="document-info">
                                    <div className="document-title">{doc.title}</div>
                                    <div className="document-meta">
                                        {doc.file_type?.toUpperCase()} • {doc.word_count?.toLocaleString() || 0} words
                                        {doc.processed === false && ' • Processing...'}
                                    </div>
                                </div>
                                <button
                                    className="btn-icon"
                                    onClick={(e) => handleRemove(e, doc.id)}
                                    title="Remove"
                                    style={{ opacity: 0.5 }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" style={{ marginTop: '60px' }}>
                        <div className="empty-state-icon">📁</div>
                        <div className="empty-state-title">Saved sources will appear here</div>
                        <div className="empty-state-text">
                            Click Add source above to add PDFs, websites, text, videos or audio files.
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
