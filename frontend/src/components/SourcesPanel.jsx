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

    const toggleSelectAll = () => {
        if (selectedDocuments.length === documents.length) {
            onSelectionChange([])
        } else {
            onSelectionChange(documents.map(d => d.id))
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

    const getFileIcon = (doc) => {
        const type = doc.file_type?.toLowerCase() || doc.title?.split('.').pop()?.toLowerCase()
        if (doc.source_url?.includes('youtube') || doc.source_url?.includes('youtu.be')) {
            return (
                <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            )
        }
        const icons = {
            'pdf': (
                <div className="w-5 h-5 bg-red-500/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                </div>
            ),
            'docx': (
                <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                </div>
            ),
            'txt': (
                <div className="w-5 h-5 bg-gray-500/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                </div>
            ),
        }
        return icons[type] || icons['pdf']
    }

    const allSelected = documents.length > 0 && selectedDocuments.length === documents.length

    return (
        <div className="w-[260px] bg-[#1c1c1c] border-r border-[#2d2d2d] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
                <h2 className="text-sm font-medium text-[#e3e3e3]">Sources</h2>
                <button className="p-1.5 hover:bg-[#3c4043] rounded-md transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9aa0a6]">
                        <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                        <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                        <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                        <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Add Sources Button - Big Pill */}
                <div className="p-5">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full h-12 flex items-center justify-center gap-3 px-4 bg-[#2c3033] hover:bg-[#353a3d] text-[#e3e3e3] rounded-[16px] transition-all shadow-sm group border border-transparent hover:border-[#3c4043]"
                    >
                        <div className="w-6 h-6 rounded-full border border-[#e3e3e3] flex items-center justify-center group-hover:bg-[#e3e3e3] group-hover:text-[#1c1c1c] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </div>
                        <span className="font-medium text-[15px]">Add sources</span>
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
                <div className="px-5 pb-4">
                    <div className="bg-[#1e1f20] rounded-[16px] p-1 border border-[#3c4043]">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full bg-transparent text-[#e3e3e3] text-sm px-4 py-2.5 outline-none placeholder-[#8e918f]"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button className="p-1.5 hover:bg-[#3c4043] rounded-full text-[#c4c7c5]">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="M21 21l-4.35-4.35" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-2 pb-2 mt-1">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#333537] rounded-full text-[11px] text-[#e3e3e3] border border-[#3c4043] cursor-pointer hover:bg-[#3c4043]">
                                <span>🌐</span>
                                <span>Web</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#333537] rounded-full text-[11px] text-[#e3e3e3] border border-[#3c4043] cursor-pointer hover:bg-[#3c4043]">
                                <span>⚡</span>
                                <span>Fast research</span>
                            </div>
                        </div>
                    </div>
                </div>

                {uploadError && (
                    <div className="mx-3 mb-2 px-3 py-2 bg-red-900/20 border border-red-700/30 rounded-lg text-xs text-red-400">
                        {uploadError}
                    </div>
                )}

                {/* Select All Sources */}
                {documents.length > 0 && (
                    <div
                        onClick={toggleSelectAll}
                        className="mx-3 mb-2 flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-[#292929] transition-colors"
                    >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allSelected
                            ? 'bg-[#8ab4f8] border-[#8ab4f8]'
                            : 'border-[#5f6368] hover:border-[#8ab4f8]'
                            }`}>
                            {allSelected && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm text-[#e3e3e3]">Select all sources</span>
                        {allSelected && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8ab4f8" strokeWidth="2" className="ml-auto">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                    </div>
                )}

                {/* Documents List */}
                {documents.length > 0 ? (
                    <div className="px-3 space-y-1">
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => toggleDocument(doc.id)}
                                className={`group flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${selectedDocuments.includes(doc.id)
                                    ? 'bg-[#8ab4f8]/15'
                                    : 'hover:bg-[#292929]'
                                    }`}
                            >
                                {/* Checkbox */}
                                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${selectedDocuments.includes(doc.id)
                                    ? 'bg-[#8ab4f8] border-[#8ab4f8]'
                                    : 'border-[#5f6368] group-hover:border-[#8ab4f8]'
                                    }`}>
                                    {selectedDocuments.includes(doc.id) && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>

                                {/* File Icon */}
                                {getFileIcon(doc)}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-sm text-[#e3e3e3] line-clamp-2 leading-tight">{doc.title}</span>
                                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {doc.word_count === 0 && doc.processed !== false ? (
                                                <button
                                                    onClick={(e) => handleReprocess(e, doc.id)}
                                                    className="p-1 text-[#8ab4f8] hover:bg-[#3c4043] rounded transition-colors"
                                                    disabled={reprocessing === doc.id}
                                                    title="Reprocess document"
                                                >
                                                    {reprocessing === doc.id ? (
                                                        <span className="loading-spinner inline-block" style={{ width: 12, height: 12 }}></span>
                                                    ) : (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M23 4v6h-6M1 20v-6h6" />
                                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleRemove(e, doc.id)}
                                                    className="p-1 text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#3c4043] rounded transition-colors"
                                                    title="Remove document"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {selectedDocuments.includes(doc.id) && (
                                        <div className="mt-0.5 flex items-center gap-1.5 text-[#8ab4f8]">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-10 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 bg-[#292929] rounded-full flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm text-[#e3e3e3] mb-1.5">Saved sources will appear here</p>
                        <p className="text-xs text-[#9aa0a6] leading-relaxed">
                            Click Add source above to add PDFs, websites, text, videos or audio files.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
