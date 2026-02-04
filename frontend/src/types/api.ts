// API Types
export interface Notebook {
  id: string; // UUID
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  documents?: Document[];
}

export interface Document {
  id: number;
  title: string;
  file_type: string;
  file_size: number;
  file?: string;
  url?: string;
  word_count: number;
  extracted_text: string;
  processed: boolean;
  embedded: boolean;
  processing_error?: string;
  uploaded_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  citations?: Citation[];
}

export interface Citation {
  document_id: number;
  document_title?: string;
  chunk_text: string;
  page_number?: number;
  section_title?: string;
  score?: number;
  citation_index: number;
}

export interface Conversation {
  id: number;
  notebook: string; // UUID reference to notebook
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface ChatSendRequest {
  conversation_id?: number;
  notebook_id?: string; // UUID
  message: string;
  document_ids?: number[];
}

export interface ChatSendResponse {
  conversation_id: number;
  message: Message;
  citations: Citation[];
  is_follow_up: boolean;
}
