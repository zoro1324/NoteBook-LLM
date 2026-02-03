import { useState } from 'react'

export default function StudioPanel({ selectedDocuments, documents }) {
    const [generating, setGenerating] = useState(null)
    const [generatedItems, setGeneratedItems] = useState([])

    const studioTools = [
        { id: 'audio', icon: '🎧', label: 'Audio Overview', desc: 'AI-generated podcast', color: 'text-[#c4c7c5]' },
        { id: 'video', icon: '🎬', label: 'Video Overview', desc: 'Visual summary', color: 'text-[#c4c7c5]' },
        { id: 'mindmap', icon: '🔗', label: 'Mind Map', desc: 'Concept connections', color: 'text-[#c4c7c5]' },
        { id: 'reports', icon: '📄', label: 'Reports', desc: 'Detailed analysis', color: 'text-[#c4c7c5]' },
        { id: 'flashcards', icon: '📚', label: 'Flashcards', desc: 'Study cards', color: 'text-[#c4c7c5]' },
        { id: 'quiz', icon: '❓', label: 'Quiz', desc: 'Test knowledge', color: 'text-[#c4c7c5]' },
        { id: 'infographic', icon: '📊', label: 'Infographic', desc: 'Visual data', color: 'text-[#c4c7c5]' },
        { id: 'slides', icon: '📽', label: 'Slide deck', desc: 'Presentation', color: 'text-[#c4c7c5]' },
    ]

    const handleGenerate = async (optionId) => {
        if (selectedDocuments.length === 0) {
            alert('Please select some sources first!')
            return
        }

        setGenerating(optionId)
        // TODO: Connect to backend
        setTimeout(() => {
            const item = {
                id: Date.now(),
                type: optionId,
                title: `Generated ${optionId}`,
                sources: selectedDocuments.length,
                time: 'Just now',
                createdAt: new Date()
            }
            setGeneratedItems([item, ...generatedItems])
            setGenerating(null)
        }, 2000)
    }

    const hasSourcesSelected = selectedDocuments.length > 0

    const getItemIcon = (type, status) => {
        if (status === 'generating') {
            return (
                <div className="w-8 h-8 rounded-lg bg-[#2c3033] flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
                </div>
            )
        }
        const icons = {
            'audio': '🎧',
            'video': '🎬',
            'mindmap': '🔗',
            'reports': '📄',
            'report': '📄',
            'flashcards': '📚',
            'quiz': '❓',
            'infographic': '📊',
            'slides': '📽',
        }
        return (
            <div className="w-8 h-8 rounded-lg bg-[#2c3033] flex items-center justify-center text-lg">
                {icons[type] || '📄'}
            </div>
        )
    }

    return (
        <div className="w-[300px] bg-[#1e1f20] flex flex-col relative border-l border-[#3c4043] h-full">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between">
                <h2 className="text-[15px] font-medium text-[#e3e3e3]">Studio</h2>
                <button className="p-1.5 hover:bg-[#3c4043] rounded-md transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#e3e3e3]">
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                </button>
            </div>

            {/* Language Banner - Subtle Design */}
            <div className="mx-5 mb-4 p-3 bg-[#2c3033] rounded-xl border border-[#3c4043]/50">
                <p className="text-[11px] text-[#e3e3e3] leading-relaxed font-medium">
                    Create an Audio Overview in: <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">हिन्दी, বাংলা, ગુજરાતી, ಕನ್ನಡ, മലയാളം, मराठी, ਪੰਜਾਬੀ, தமிழ், తెలుగు</span>
                </p>
            </div>

            {/* Studio Tools Grid */}
            <div className="px-5 pb-4 space-y-2">
                {/* Audio & Video */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => hasSourcesSelected && handleGenerate('audio')}
                        disabled={!hasSourcesSelected || generating === 'audio'}
                        title={!hasSourcesSelected ? "Add a source to use this tool" : ""}
                        className={`group relative flex flex-col p-3 rounded-2xl text-left transition-all duration-200 border ${hasSourcesSelected
                            ? 'bg-[#2c3033] border-transparent hover:bg-[#353a3d]'
                            : 'bg-[#2c3033]/50 border-transparent opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xl text-[#c4c7c5]">
                                {generating === 'audio' ? <div className="w-5 h-5 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div> : '🎧'}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-white transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-[#e3e3e3]">Audio Overview</span>
                    </button>
                    <button
                        onClick={() => hasSourcesSelected && handleGenerate('video')}
                        disabled={!hasSourcesSelected || generating === 'video'}
                        title={!hasSourcesSelected ? "Add a source to use this tool" : ""}
                        className={`group relative flex flex-col p-3 rounded-2xl text-left transition-all duration-200 border ${hasSourcesSelected
                            ? 'bg-[#2c3033] border-transparent hover:bg-[#353a3d]'
                            : 'bg-[#2c3033]/50 border-transparent opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xl text-[#c4c7c5]">
                                {generating === 'video' ? <div className="w-5 h-5 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div> : '🎬'}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-white transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-[#e3e3e3]">Video Overview</span>
                    </button>
                </div>

                {/* Mind Map & Reports */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => hasSourcesSelected && handleGenerate('mindmap')}
                        disabled={!hasSourcesSelected || generating === 'mindmap'}
                        title={!hasSourcesSelected ? "Add a source to use this tool" : ""}
                        className={`group relative flex flex-col p-3 rounded-2xl text-left transition-all duration-200 border ${hasSourcesSelected
                            ? 'bg-[#1e1f20] border-[#3c4043] hover:bg-[#2c3033]'
                            : 'bg-[#1e1f20]/50 border-[#3c4043]/50 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xl text-[#c4c7c5]">
                                {generating === 'mindmap' ? <div className="w-5 h-5 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div> : '🔗'}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-white transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-[#e3e3e3]">Mind Map</span>
                    </button>
                    <button
                        onClick={() => hasSourcesSelected && handleGenerate('reports')}
                        disabled={!hasSourcesSelected || generating === 'reports'}
                        title={!hasSourcesSelected ? "Add a source to use this tool" : ""}
                        className={`group relative flex flex-col p-3 rounded-2xl text-left transition-all duration-200 border ${hasSourcesSelected
                            ? 'bg-[#1e1f20] border-[#3c4043] hover:bg-[#2c3033]'
                            : 'bg-[#1e1f20]/50 border-[#3c4043]/50 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xl text-[#c4c7c5]">
                                {generating === 'reports' ? <div className="w-5 h-5 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div> : '📄'}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-white transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-[#e3e3e3]">Reports</span>
                    </button>
                </div>

                {/* Flashcards & Quiz */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => hasSourcesSelected && handleGenerate('flashcards')}
                        disabled={!hasSourcesSelected || generating === 'flashcards'}
                        title={!hasSourcesSelected ? "Add a source to use this tool" : ""}
                        className={`group relative flex flex-col p-3 rounded-2xl text-left transition-all duration-200 border ${hasSourcesSelected
                            ? 'bg-[#1e1f20] border-[#3c4043] hover:bg-[#2c3033]'
                            : 'bg-[#1e1f20]/50 border-[#3c4043]/50 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xl text-[#c4c7c5]">
                                {generating === 'flashcards' ? <div className="w-5 h-5 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div> : '📚'}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-white transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-[#e3e3e3]">Flashcards</span>
                    </button>
                    <button
                        onClick={() => hasSourcesSelected && handleGenerate('quiz')}
                        disabled={!hasSourcesSelected || generating === 'quiz'}
                        title={!hasSourcesSelected ? "Add a source to use this tool" : ""}
                        className={`group relative flex flex-col p-3 rounded-2xl text-left transition-all duration-200 border ${hasSourcesSelected
                            ? 'bg-[#1e1f20] border-[#3c4043] hover:bg-[#2c3033]'
                            : 'bg-[#1e1f20]/50 border-[#3c4043]/50 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xl text-[#c4c7c5]">
                                {generating === 'quiz' ? <div className="w-5 h-5 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div> : '❓'}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-white transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-[#e3e3e3]">Quiz</span>
                    </button>
                </div>

                {/* Infographic & Slides */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => hasSourcesSelected && handleGenerate('infographic')}
                        disabled={!hasSourcesSelected || generating === 'infographic'}
                        title={!hasSourcesSelected ? "Add a source to use this tool" : ""}
                        className={`group relative flex flex-col p-3 rounded-2xl text-left transition-all duration-200 border ${hasSourcesSelected
                            ? 'bg-[#1e1f20] border-[#3c4043] hover:bg-[#2c3033]'
                            : 'bg-[#1e1f20]/50 border-[#3c4043]/50 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xl text-[#c4c7c5]">
                                {generating === 'infographic' ? <div className="w-5 h-5 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div> : '📊'}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-white transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-[#e3e3e3]">Infographic</span>
                    </button>
                    <button
                        onClick={() => hasSourcesSelected && handleGenerate('slides')}
                        disabled={!hasSourcesSelected || generating === 'slides'}
                        title={!hasSourcesSelected ? "Add a source to use this tool" : ""}
                        className={`group relative flex flex-col p-3 rounded-2xl text-left transition-all duration-200 border ${hasSourcesSelected
                            ? 'bg-[#1e1f20] border-[#3c4043] hover:bg-[#2c3033]'
                            : 'bg-[#1e1f20]/50 border-[#3c4043]/50 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xl text-[#c4c7c5]">
                                {generating === 'slides' ? <div className="w-5 h-5 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div> : '📽'}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-white transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-[#e3e3e3]">Slide deck</span>
                    </button>
                </div>
            </div>

            {/* Data Table - Full Width */}
            <div className="px-5 pb-3">
                <button
                    onClick={() => hasSourcesSelected && handleGenerate('datatable')}
                    disabled={!hasSourcesSelected}
                    className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all border ${hasSourcesSelected
                        ? 'bg-[#1e1f20] border-[#3c4043] hover:bg-[#2c3033]'
                        : 'bg-[#1e1f20]/50 border-[#3c4043]/50 opacity-50 cursor-not-allowed'
                        }`}
                >
                    <span className="text-xl text-[#c4c7c5]">📋</span>
                    <span className="text-[13px] font-medium text-[#e3e3e3]">Data table</span>
                    <button
                        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#3c4043] rounded transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                </button>
            </div>

            {/* Divider */}
            <div className="border-t border-[#3c4043] mx-3"></div>

            {/* Generated Items List */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-1">
                    {generatedItems.map(item => (
                        <div
                            key={item.id}
                            className="group flex items-start gap-3 p-2 rounded-lg hover:bg-[#292929] cursor-pointer transition-colors"
                        >
                            {getItemIcon(item.type, item.status)}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-[#e3e3e3] truncate leading-tight">
                                    {item.title}
                                </div>
                                {item.status === 'generating' ? (
                                    <div className="text-xs text-[#9aa0a6] mt-0.5">
                                        Come back in a few minutes
                                    </div>
                                ) : (
                                    <div className="text-xs text-[#9aa0a6] mt-0.5">
                                        {item.sources} source{item.sources !== 1 ? 's' : ''} · {item.time}
                                    </div>
                                )}
                            </div>
                            <button className="p-1 opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-[#e3e3e3] transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                                    <circle cx="12" cy="5" r="1" fill="currentColor" />
                                    <circle cx="12" cy="19" r="1" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Note Button - Floating at bottom right */}
            <div className="absolute bottom-4 right-4">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#292929] hover:bg-[#3c4043] border border-[#3c4043] rounded-full text-sm text-[#e3e3e3] transition-all shadow-lg hover:shadow-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>Add note</span>
                </button>
            </div>

            {/* Bottom padding for floating button */}
            <div className="h-16"></div>
        </div>
    )
}
