import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notebooksApi } from '../services/api'

export default function HomePage() {
    const navigate = useNavigate()
    const [viewMode, setViewMode] = useState('grid')
    const [activeTab, setActiveTab] = useState('my')
    const [notebooks, setNotebooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch notebooks from backend
    useEffect(() => {
        loadNotebooks()
    }, [])

    const loadNotebooks = async () => {
        try {
            setLoading(true)
            const data = await notebooksApi.list()
            setNotebooks(data.results || data)
            setError(null)
        } catch (err) {
            console.error('Failed to load notebooks:', err)
            setError('Failed to load notebooks. Make sure the backend is running.')
            // Use mock data as fallback
            setNotebooks([])
        } finally {
            setLoading(false)
        }
    }

    const createNewNotebook = async () => {
        try {
            const newNotebook = await notebooksApi.create({
                title: 'Untitled notebook',
                icon: '📓',
                color: '#4285f4'
            })
            navigate(`/notebook/${newNotebook.id}`)
        } catch (err) {
            // Fallback to client-side UUID if backend fails
            const newId = crypto.randomUUID()
            navigate(`/notebook/${newId}`)
        }
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

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: '16px 32px',
                    background: 'rgba(244, 67, 54, 0.1)',
                    color: '#f44336',
                    borderBottom: '1px solid rgba(244, 67, 54, 0.3)'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Section Title */}
            <div className="home-section-title">
                <h2>My notebooks</h2>
            </div>

            {/* Loading State */}
            {loading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '48px'
                }}>
                    <span className="loading-spinner" style={{ width: 32, height: 32 }}></span>
                </div>
            ) : (
                /* Notebooks Grid */
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
                                    <span>{notebook.date || new Date(notebook.updated_at).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{notebook.source_count || 0} source{notebook.source_count !== 1 ? 's' : ''}</span>
                                    {notebook.source_count > 0 && <span className="audio-icon">🔊</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
