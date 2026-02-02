import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
    const navigate = useNavigate()
    const [viewMode, setViewMode] = useState('grid') // grid or list
    const [activeTab, setActiveTab] = useState('my') // all, my, featured
    const [sortBy, setSortBy] = useState('recent')

    // Mock notebooks - will come from backend
    const [notebooks, setNotebooks] = useState([
        {
            id: '2873ee77-e042-4497-8f67-133dccb81e9d',
            title: 'Untitled notebook',
            date: '2 Feb 2026',
            sources: 0,
            icon: '📊',
            color: '#4285f4'
        },
        {
            id: 'abc123-def456',
            title: 'Direct Memory Access (DMA) in Tamil',
            date: '13 Nov 2025',
            sources: 1,
            icon: '💻',
            color: '#00bcd4'
        },
        {
            id: 'def456-ghi789',
            title: 'Von Neumann Architecture in Tamil',
            date: '13 Nov 2025',
            sources: 1,
            icon: '🖥️',
            color: '#ff9800'
        },
        {
            id: 'ghi789-jkl012',
            title: 'Algebra and Combinatorics...',
            date: '16 Nov 2025',
            sources: 1,
            icon: '📐',
            color: '#00bcd4'
        },
        {
            id: 'jkl012-mno345',
            title: 'Computer Addressing Modes in Tamil',
            date: '14 Nov 2025',
            sources: 1,
            icon: '📚',
            color: '#e91e63'
        },
        {
            id: 'mno345-pqr678',
            title: 'MIPS Processor Addressing Modes...',
            date: '13 Nov 2025',
            sources: 1,
            icon: '⚙️',
            color: '#00bcd4'
        },
        {
            id: 'pqr678-stu901',
            title: 'Data and Control Hazards in Tamil',
            date: '13 Nov 2025',
            sources: 1,
            icon: '⚠️',
            color: '#ff9800'
        }
    ])

    const createNewNotebook = () => {
        const newId = crypto.randomUUID()
        navigate(`/notebook/${newId}`)
    }

    const openNotebook = (id) => {
        navigate(`/notebook/${id}`)
    }

    return (
        <div className="home-container">
            {/* Header */}
            <header className="home-header">
                <div className="home-header-left">
                    <div className="home-logo">
                        <span>📓</span>
                    </div>
                    <span className="home-brand">NotebookLLM</span>
                </div>

                <div className="home-header-right">
                    <button className="btn btn-secondary">
                        <span>⚙</span> Settings
                    </button>
                    <span className="pro-badge">PRO</span>
                    <button className="btn-icon">⋮⋮</button>
                    <div className="avatar">👤</div>
                </div>
            </header>

            {/* Tabs and Controls */}
            <div className="home-controls">
                <div className="home-tabs">
                    <button
                        className={`home-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>
                    <button
                        className={`home-tab ${activeTab === 'my' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my')}
                    >
                        My notebooks
                    </button>
                    <button
                        className={`home-tab ${activeTab === 'featured' ? 'active' : ''}`}
                        onClick={() => setActiveTab('featured')}
                    >
                        Featured notebooks
                    </button>
                </div>

                <div className="home-actions">
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            ⊞
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            ☰
                        </button>
                    </div>

                    <button className="sort-btn">
                        Most recent ▾
                    </button>

                    <button className="btn btn-primary" onClick={createNewNotebook}>
                        <span>+</span> Create new
                    </button>
                </div>
            </div>

            {/* Section Title */}
            <div className="home-section-title">
                <h2>My notebooks</h2>
            </div>

            {/* Notebooks Grid */}
            <div className={`notebooks-${viewMode}`}>
                {/* Create New Card */}
                <div className="notebook-card create-card" onClick={createNewNotebook}>
                    <div className="create-icon">
                        <span>+</span>
                    </div>
                    <span className="create-text">Create new notebook</span>
                </div>

                {/* Notebook Cards */}
                {notebooks.map(notebook => (
                    <div
                        key={notebook.id}
                        className="notebook-card"
                        onClick={() => openNotebook(notebook.id)}
                    >
                        <div className="notebook-card-header">
                            <div
                                className="notebook-icon"
                                style={{ backgroundColor: notebook.color }}
                            >
                                <span>{notebook.icon}</span>
                            </div>
                            <button className="notebook-menu" onClick={(e) => e.stopPropagation()}>
                                ⋮
                            </button>
                        </div>
                        <div className="notebook-card-content">
                            <h3 className="notebook-title">{notebook.title}</h3>
                            <div className="notebook-meta">
                                <span>{notebook.date}</span>
                                <span>•</span>
                                <span>{notebook.sources} source{notebook.sources !== 1 ? 's' : ''}</span>
                                {notebook.sources > 0 && <span className="audio-icon">🔊</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
