import { useState } from 'react'

export default function StudioPanel({ selectedDocuments }) {
    const [activeTab, setActiveTab] = useState('image')
    const [prompt, setPrompt] = useState('')
    const [generating, setGenerating] = useState(false)
    const [generatedItems, setGeneratedItems] = useState([])

    const handleGenerate = async () => {
        if (!prompt.trim() || generating) return

        setGenerating(true)

        // TODO: Call backend API for generation
        // const response = await fetch(`/api/generate/${activeTab}`, { ... })

        // Mock generation
        setTimeout(() => {
            const item = {
                id: Date.now(),
                type: activeTab,
                prompt: prompt,
                url: `https://via.placeholder.com/400?text=${activeTab}`,
                createdAt: new Date()
            }
            setGeneratedItems([item, ...generatedItems])
            setPrompt('')
            setGenerating(false)
        }, 2000)
    }

    return (
        <div className="panel studio-panel">
            <div className="panel-header">
                <span className="panel-title">Studio</span>
            </div>

            <div className="generation-tabs">
                <button
                    className={`tab ${activeTab === 'image' ? 'active' : ''}`}
                    onClick={() => setActiveTab('image')}
                >
                    🎨 Image
                </button>
                <button
                    className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audio')}
                >
                    🎵 Audio
                </button>
                <button
                    className={`tab ${activeTab === 'video' ? 'active' : ''}`}
                    onClick={() => setActiveTab('video')}
                >
                    🎬 Video
                </button>
                <button
                    className={`tab ${activeTab === 'guide' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guide')}
                >
                    📚 Guide
                </button>
            </div>

            <div className="panel-content">
                <div style={{ marginBottom: '16px' }}>
                    <textarea
                        className="chat-input"
                        placeholder={`Describe the ${activeTab} you want to generate...`}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontFamily: 'var(--font-family)',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || generating}
                        style={{ marginTop: '8px', width: '100%' }}
                    >
                        {generating ? (
                            <>
                                <span className="loading-spinner"></span>
                                Generating...
                            </>
                        ) : (
                            `Generate ${activeTab}`
                        )}
                    </button>
                </div>

                {generatedItems.filter(item => item.type === activeTab).length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">✨</div>
                        <div className="empty-state-text">
                            No {activeTab}s generated yet
                        </div>
                    </div>
                ) : (
                    generatedItems
                        .filter(item => item.type === activeTab)
                        .map(item => (
                            <div key={item.id} className="generated-item">
                                {item.type === 'image' && (
                                    <img src={item.url} alt={item.prompt} className="generated-preview" />
                                )}
                                {item.type === 'audio' && (
                                    <div className="generated-preview" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '48px'
                                    }}>
                                        🎵
                                    </div>
                                )}
                                {item.type === 'video' && (
                                    <div className="generated-preview" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '48px'
                                    }}>
                                        🎬
                                    </div>
                                )}
                                <div className="generated-info">
                                    <div className="generated-prompt">{item.prompt}</div>
                                    <div className="generated-meta">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                )}
            </div>
        </div>
    )
}
