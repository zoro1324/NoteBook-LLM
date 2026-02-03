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
    const [reprocessing, setReprocessing] = useState(null)
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
                    const doc = await documentsApi.upload(file)
                    onDocumentsChange([...documents, doc])
                }
            }
        } catch (err) {
            console.error('Upload failed:', err)
            setUploadError('Failed to upload file.')
        } finally {
            setUploading(false)
            e.target.value = ''
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

    const handleReprocess = async (e, docId) => {
        e.stopPropagation()
        setReprocessing(docId)
        try {
            await documentsApi.reprocess(docId)
            const updatedDoc = await documentsApi.get(docId)
            onDocumentsChange(documents.map(d => d.id === docId ? updatedDoc : d))
        } catch (err) {
            console.error('Reprocess failed:', err)
        } finally {
            setReprocessing(null)
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
        <div className="w-[240px] bg-[#1a1a1a] border-r border-[#2d2d2d] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#2d2d2d] flex items-center justify-between">
                <h2 className="text-sm font-normal text-[#e3e3e3]">Sources</h2>
                <button className="p-1 hover:bg-[#2d2d2d] rounded">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9aa0a6]">
                        <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Add Sources Button */}
                <div className="p-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full px-3 py-2 text-sm text-[#8ab4f8] bg-transparent border border-[#8ab4f8] rounded-full hover:bg-[#8ab4f8]/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>+</span>
                        {uploading ? 'Uploading...' : 'Add sources'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt,.md,.mp3,.wav,.mp4"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>

                {/* Search Section */}
                <div className="px-3 pb-3">
                    <p className="text-xs text-[#9aa0a6] mb-2">Search the web for new sources</p>
                    <div className="bg-[#2d2d2d] rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-2">
                            <button className="flex items-center gap-1 px-2 py-1 bg-[#3c4043] rounded-full text-xs text-[#e3e3e3] hover:bg-[#5f6368]">
                                <span>🌐</span>
                                <span>Web</span>
                                <span className="text-[10px]">▼</span>
                            </button>
                            <button className="flex items-center gap-1 px-2 py-1 bg-[#3c4043] rounded-full text-xs text-[#e3e3e3] hover:bg-[#5f6368]">
                                <span>⚡</span>
                                <span>Fast research</span>
                                <span className="text-[10px]">▼</span>
                            </button>
                        </div>
                        <button className="w-full p-2 bg-[#3c4043] rounded text-sm text-[#9aa0a6] hover:bg-[#5f6368] flex items-center justify-center">
                            <span>→</span>
                        </button>
                    </div>
                </div>

                {uploadError && (
                    <div className="mx-3 mb-2 px-2 py-1 bg-red-900/20 border border-red-700/50 rounded text-xs text-red-400">
                        {uploadError}
                    </div>
                )}

                {/* Documents List */}
                {documents.length > 0 ? (
                    <div className="px-3 space-y-1">
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => toggleDocument(doc.id)}
                                className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${selectedDocuments.includes(doc.id)
                                        ? 'bg-[#8ab4f8]/20'
                                        : 'hover:bg-[#2d2d2d]'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedDocuments.includes(doc.id)}
                                    onChange={() => { }}
                                    className="mt-0.5 accent-[#8ab4f8]"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                        <span className="text-sm text-[#e3e3e3] truncate">{doc.title}</span>
                                        {doc.word_count === 0 && doc.processed !== false ? (
                                            <button
                                                onClick={(e) => handleReprocess(e, doc.id)}
                                                className="flex-shrink-0 text-[#8ab4f8] hover:text-[#aecbfa] text-xs"
                                                disabled={reprocessing === doc.id}
                                            >
                                                {reprocessing === doc.id ? '⏳' : '🔄'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => handleRemove(e, doc.id)}
                                                className="flex-shrink-0 text-[#9aa0a6] hover:text-[#e3e3e3] text-xs"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs text-[#9aa0a6]">
                                        PDF • {doc.word_count?.toLocaleString() || 0} words
                                        {doc.processed === false && ' • Processing...'}
                                        {doc.word_count === 0 && doc.processed !== false && (
                                            <span className="text-amber-500"> • No text</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-8 text-center">
                        <div className="text-4xl mb-3 opacity-20">📁</div>
                        <p className="text-sm text-[#e3e3e3] mb-1">Saved sources will appear here</p>
                        <p className="text-xs text-[#9aa0a6]">
                            Click Add source above to add PDFs, websites, text, videos or audio files.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
