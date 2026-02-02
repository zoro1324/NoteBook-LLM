import { useState } from 'react'

export default function StudioPanel({ selectedDocuments }) {
    const [generating, setGenerating] = useState(null)
    const [generatedItems, setGeneratedItems] = useState([])

    const studioOptions = [
        { id: 'audio', icon: '🎧', label: 'Audio Overview' },
        { id: 'video', icon: '🎬', label: 'Video Overview' },
        { id: 'mindmap', icon: '🔗', label: 'Mind Map' },
        { id: 'reports', icon: '📄', label: 'Reports' },
        { id: 'flashcards', icon: '📚', label: 'Flashcards' },
        { id: 'quiz', icon: '❓', label: 'Quiz' },
        { id: 'infographic', icon: '📊', label: 'Infographic' },
        { id: 'slides', icon: '📽', label: 'Slide deck' },
        { id: 'datatable', icon: '📋', label: 'Data table' },
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

    return (
        <div className="panel studio-panel relative">
            <div className="panel-header">
                <span className="panel-title">Studio</span>
                <button className="btn-icon">📋</button>
            </div>

            <div className="panel-content">
                {/* Rainbow Banner */}
                <div className="studio-banner">
                    <span className="studio-banner-text">
                        Create an Audio Overview in: हिन्दी , বাংলা , ગુજરાતી , ಕನ್ನಡ , മലയാളം , मराठी , ਪੰਜਾਬੀ , தமிழ் , తెలుగు
                    </span>
                </div>

                {/* Studio Options Grid */}
                <div className="studio-grid">
                    {studioOptions.map(option => (
                        <div
                            key={option.id}
                            className="studio-option"
                            onClick={() => handleGenerate(option.id)}
                            style={{
                                opacity: generating === option.id ? 0.7 : 1,
                                pointerEvents: generating ? 'none' : 'auto'
                            }}
                        >
                            <span className="studio-option-icon">
                                {generating === option.id ? (
                                    <span className="loading-spinner" />
                                ) : (
                                    option.icon
                                )}
                            </span>
                            <span className="studio-option-label">{option.label}</span>
                        </div>
                    ))}
                </div>

                {/* Generated Items or Empty State */}
                {generatedItems.length === 0 ? (
                    <div className="studio-empty">
                        <div className="studio-empty-icon">✨</div>
                        <div className="studio-empty-title">Studio output will be saved here.</div>
                        <div className="studio-empty-text">
                            After adding sources, click to add Audio Overview, study guide, mind map and more!
                        </div>
                    </div>
                ) : (
                    <div style={{ marginTop: '16px' }}>
                        {generatedItems.map(item => (
                            <div key={item.id} className="document-card">
                                <span className="document-icon">
                                    {studioOptions.find(o => o.id === item.type)?.icon || '📄'}
                                </span>
                                <div className="document-info">
                                    <div className="document-title">{item.title}</div>
                                    <div className="document-meta">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Note Button */}
            <button className="add-note-btn">
                <span>📝</span>
                Add note
            </button>
        </div>
    )
}
