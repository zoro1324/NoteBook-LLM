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
        <div className="min-h-screen bg-zinc-950 text-gray-100">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 via-teal-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xl">📓</span>
                    </div>
                    <span className="text-xl font-medium">NotebookLLM</span>
                </div>

                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-gray-200 text-sm font-medium border border-zinc-700 rounded-full hover:bg-zinc-800 transition-all duration-200">
                        <span>⚙</span> Settings
                    </button>
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full">PR O</span>
                    <button className="p-2 text-gray-400 hover:bg-zinc-800 hover:text-gray-200 rounded-lg transition-all duration-200">⋮⋮</button>
                    <div className="w-9 h-9 rounded-full bg-teal-400 flex items-center justify-center cursor-pointer">👤</div>
                </div>
            </header>

            {/* Tabs and Controls */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-800">
                <div className="flex gap-1">
                    <button
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === 'all'
                                ? 'bg-zinc-800 text-white'
                                : 'text-gray-400 hover:bg-zinc-800/50 hover:text-gray-200'
                            }`}
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === 'my'
                                ? 'bg-zinc-800 text-white'
                                : 'text-gray-400 hover:bg-zinc-800/50 hover:text-gray-200'
                            }`}
                        onClick={() => setActiveTab('my')}
                    >
                        My notebooks
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === 'featured'
                                ? 'bg-zinc-800 text-white'
                                : 'text-gray-400 hover:bg-zinc-800/50 hover:text-gray-200'
                            }`}
                        onClick={() => setActiveTab('featured')}
                    >
                        Featured notebooks
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg">
                        <button
                            className={`p-2 rounded text-sm transition-all duration-200 ${viewMode === 'grid'
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                            onClick={() => setViewMode('grid')}
                        >
                            ⊞
                        </button>
                        <button
                            className={`p-2 rounded text-sm transition-all duration-200 ${viewMode === 'list'
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                            onClick={() => setViewMode('list')}
                        >
                            ☰
                        </button>
                    </div>

                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 rounded-lg transition-all duration-200">
                        Most recent ▾
                    </button>

                    <button
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-all duration-200 shadow-sm"
                        onClick={createNewNotebook}
                    >
                        <span>+</span> Create new
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-8 py-4 bg-red-500/10 border-b border-red-500/30 text-red-400 text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* Section Title */}
            <div className="px-8 py-6">
                <h2 className="text-2xl font-medium text-gray-100">My notebooks</h2>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="loading-spinner" style={{ width: 32, height: 32 }}></span>
                </div>
            ) : (
                /* Notebooks Grid */
                <div className={`px-8 pb-8 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-2'}`}>
                    {/* Create New Card */}
                    <div
                        className="flex flex-col items-center justify-center gap-3 p-8 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-600 hover:bg-zinc-850 transition-all duration-200 min-h-[200px]"
                        onClick={createNewNotebook}
                    >
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-2xl text-gray-400">
                            +
                        </div>
                        <span className="text-sm font-medium text-gray-300">Create new notebook</span>
                    </div>

                    {/* Notebook Cards */}
                    {notebooks.map(notebook => (
                        <div
                            key={notebook.id}
                            className="flex flex-col p-5 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-850 hover:border-zinc-700 hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md min-h-[200px]"
                            onClick={() => openNotebook(notebook.id)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: notebook.color || '#4285f4' }}
                                >
                                    <span className="text-lg">{notebook.icon || '📓'}</span>
                                </div>
                                <button
                                    className="p-2 text-gray-500 hover:bg-zinc-800 hover:text-gray-300 rounded-lg transition-all duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    ⋮
                                </button>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-medium text-gray-100 mb-2 line-clamp-2">
                                    {notebook.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>
                                        {notebook.date || new Date(notebook.updated_at).toLocaleDateString()}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {notebook.source_count || 0} source{notebook.source_count !== 1 ? 's' : ''}
                                    </span>
                                    {notebook.source_count > 0 && (
                                        <span className="ml-auto">🔊</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
