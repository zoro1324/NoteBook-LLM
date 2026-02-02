/**
 * API Service for connecting React frontend to Django backend
 */

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Accept': 'application/json',
    };

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        // Handle empty responses
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// ==================== NOTEBOOKS ====================

export const notebooksApi = {
    /**
     * Get all notebooks for homepage
     */
    list: () => fetchApi('/notebooks/'),

    /**
     * Get single notebook details
     */
    get: (id) => fetchApi(`/notebooks/${id}/`),

    /**
     * Create new notebook
     */
    create: (data = {}) => fetchApi('/notebooks/', {
        method: 'POST',
        body: JSON.stringify({
            title: data.title || 'Untitled notebook',
            icon: data.icon || '📓',
            color: data.color || '#4285f4',
        }),
    }),

    /**
     * Update notebook
     */
    update: (id, data) => fetchApi(`/notebooks/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    /**
     * Delete notebook
     */
    delete: (id) => fetchApi(`/notebooks/${id}/`, {
        method: 'DELETE',
    }),

    /**
     * Add document to notebook
     */
    addDocument: (notebookId, documentId) => fetchApi(`/notebooks/${notebookId}/add_document/`, {
        method: 'POST',
        body: JSON.stringify({ document_id: documentId }),
    }),

    /**
     * Remove document from notebook
     */
    removeDocument: (notebookId, documentId) => fetchApi(`/notebooks/${notebookId}/remove_document/`, {
        method: 'POST',
        body: JSON.stringify({ document_id: documentId }),
    }),
};

// ==================== DOCUMENTS ====================

export const documentsApi = {
    /**
     * Get all documents
     */
    list: () => fetchApi('/documents/'),

    /**
     * Get single document
     */
    get: (id) => fetchApi(`/documents/${id}/`),

    /**
     * Upload new document
     */
    upload: async (file, title = null) => {
        const formData = new FormData();
        formData.append('file', file);
        if (title) {
            formData.append('title', title);
        }

        return fetchApi('/documents/', {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Delete document
     */
    delete: (id) => fetchApi(`/documents/${id}/`, {
        method: 'DELETE',
    }),

    /**
     * Get document chunks (for debugging/viewing)
     */
    getChunks: (id) => fetchApi(`/documents/${id}/chunks/`),

    /**
     * Reprocess document
     */
    reprocess: (id) => fetchApi(`/documents/${id}/reprocess/`, {
        method: 'POST',
    }),
};

// ==================== CHAT ====================

export const chatApi = {
    /**
     * Send message and get response
     */
    send: (message, documentIds = [], conversationId = null, notebookId = null) =>
        fetchApi('/chat/send/', {
            method: 'POST',
            body: JSON.stringify({
                message,
                document_ids: documentIds,
                conversation_id: conversationId,
                notebook_id: notebookId,
            }),
        }),

    /**
     * Stream message response using Server-Sent Events
     */
    stream: async function* (message, documentIds = []) {
        const response = await fetch(`${API_BASE_URL}/chat/stream/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                document_ids: documentIds,
            }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        yield data;
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }
    },
};

// ==================== CONVERSATIONS ====================

export const conversationsApi = {
    /**
     * Get conversations for a notebook
     */
    list: (notebookId = null) => {
        const params = notebookId ? `?notebook=${notebookId}` : '';
        return fetchApi(`/conversations/${params}`);
    },

    /**
     * Get single conversation with messages
     */
    get: (id) => fetchApi(`/conversations/${id}/`),

    /**
     * Delete conversation
     */
    delete: (id) => fetchApi(`/conversations/${id}/`, {
        method: 'DELETE',
    }),
};

export default {
    notebooks: notebooksApi,
    documents: documentsApi,
    chat: chatApi,
    conversations: conversationsApi,
};
