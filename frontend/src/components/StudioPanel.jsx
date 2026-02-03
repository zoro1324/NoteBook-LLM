import { useState } from 'react'

export default function StudioPanel({ selectedDocuments, documents }) {
    const [generating, setGenerating] = useState(null)
    const [generatedItems, setGeneratedItems] = useState([])

    const studioOptions = [
        { id: 'audio', icon: '🎧', label: 'Audio Overview', desc: 'AI-generated podcast' },
        { id: 'video', icon: '🎬', label: 'Video Overview', desc: 'Visual summary' },
        { id: 'mindmap', icon: '🔗', label: 'Mind Map', desc: 'Concept connections' },
        { id: 'reports', icon: '📄', label: 'Reports', desc: 'Detailed analysis' },
        { id: 'flashcards', icon: '📚', label: 'Flashcards', desc: 'Study cards' },
        { id: 'quiz', icon: '❓', label: 'Quiz', desc: 'Test knowledge' },
        { id: 'infographic', icon: '📊', label: 'Infographic', desc: 'Visual data' },
        { id: 'slides', icon: '📽', label: 'Slide deck', desc: 'Presentation' },
        { id: 'datatable', icon: '📋', label: 'Data table', desc: 'Structured data' },
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
                createdAt: new Date()
            }
            setGeneratedItems([item, ...generatedItems])
            setGenerating(null)
        }, 2000)
    }

    const hasSourcesSelected = selectedDocuments.length > 0

    return (
        <div className="w-[240px] bg-[#1a1a1a] flex flex-col relative">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#2d2d2d]">
                <h2 className="text-sm font-normal text-[#e3e3e3]">Studio</h2>
            </div>

            {/* Language Banner */}
            <div className="m-3 p-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg">
                <p className="text-[10px] text-white leading-tight">
                    Create an Audio Overview in: हिन्दी, বাংলা, ગુજરાતી, ಕನ್ನಡ, മലയാളം, मराठी, ਪੰਜਾਬੀ, தமிழ், తెలుగు
                </p>
            </div>

            {/* Studio Tools - Vertical List */}
            <div className="flex-1 overflow-y-auto px-3">
                <div className="space-y-1">
                    {studioOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => hasSourcesSelected && handleGenerate(option.id)}
                            disabled={!hasSourcesSelected || generating === option.id}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${hasSourcesSelected
                                    ? 'hover:bg-[#2d2d2d] cursor-pointer'
                                    : 'opacity-40 cursor-not-allowed'
                                }`}
                        >
                            <span className="text-xl flex-shrink-0">
                                {generating === option.id ? (
                                    <span className="loading-spinner inline-block" style={{ width: 20, height: 20 }}></span>
                                ) : (
                                    option.icon
                                )}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-[#e3e3e3]">{option.label}</div>
                                <div className="text-xs text-[#9aa0a6]">{option.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Generated Items or Empty State */}
                {generatedItems.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                        <div className="text-3xl mb-2 opacity-20">✨</div>
                        <p className="text-xs text-[#e3e3e3] mb-1">Studio output will be saved here.</p>
                        <p className="text-xs text-[#9aa0a6]">
                            {hasSourcesSelected
                                ? 'After adding sources, click a tool to create summaries, flashcards, and more.'
                                : 'Add and select sources first, then use Studio tools to create content.'}
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-1">
                        {generatedItems.map(item => (
                            <div
                                key={item.id}
                                className="flex items-center gap-2 p-2 rounded hover:bg-[#2d2d2d] cursor-pointer"
                            >
                                <span className="text-lg">
                                    {studioOptions.find(o => o.id === item.type)?.icon || '📄'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-[#e3e3e3] truncate">{item.title}</div>
                                    <div className="text-xs text-[#9aa0a6]">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Note Button - Fixed at bottom */}
            <div className="p-3 border-t border-[#2d2d2d]">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#2d2d2d] hover:bg-[#3c4043] rounded-full text-sm text-[#e3e3e3] transition-colors">
                    <span>📝</span>
                    <span>Add note</span>
                </button>
            </div>
        </div>
    )
}
