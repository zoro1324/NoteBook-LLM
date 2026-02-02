"""
Document Processing Service
Handles extraction and processing of various document types.
"""
import os
import re
from pathlib import Path
from typing import List, Tuple
from django.core.files.uploadedfile import UploadedFile


class DocumentProcessor:
    """Base class for document processing"""
    
    @staticmethod
    def detect_file_type(filename: str) -> str:
        """Detect file type from extension"""
        ext = Path(filename).suffix.lower()
        
        mapping = {
            '.pdf': 'pdf',
            '.docx': 'docx',
            '.doc': 'docx',
            '.txt': 'txt',
            '.md': 'md',
            '.mp3': 'audio',
            '.wav': 'audio',
            '.m4a': 'audio',
            '.mp4': 'video',
            '.avi': 'video',
            '.mov': 'video',
        }
        
        return mapping.get(ext, 'txt')
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50) -> List[Tuple[str, int, int]]:
        """
        Split text into overlapping chunks for embeddings.
        
        Returns:
            List of (chunk_text, start_char, end_char) tuples
        """
        chunks = []
        words = text.split()
        
        if not words:
            return chunks
        
        current_chunk = []
        current_size = 0
        char_position = 0
        
        for word in words:
            word_size = len(word) + 1  # +1 for space
            
            if current_size + word_size > chunk_size and current_chunk:
                # Save current chunk
                chunk_text = ' '.join(current_chunk)
                start_pos = char_position - len(chunk_text)
                chunks.append((chunk_text, start_pos, char_position))
                
                # Start new chunk with overlap
                overlap_words = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_words + [word]
                current_size = sum(len(w) + 1 for w in current_chunk)
                char_position += word_size
            else:
                current_chunk.append(word)
                current_size += word_size
                char_position += word_size
        
        # Add final chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            start_pos = char_position - len(chunk_text)
            chunks.append((chunk_text, start_pos, char_position))
        
        return chunks


class PDFProcessor(DocumentProcessor):
    """Process PDF documents"""
    
    @staticmethod
    def extract_text(file_path: str) -> Tuple[str, dict]:
        """
        Extract text from PDF.
        
        Returns:
            (extracted_text, metadata)
        """
        try:
            import PyPDF2
            
            text_pages = []
            metadata = {'pages': 0}
            
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                metadata['pages'] = len(reader.pages)
                
                for page in reader.pages:
                    text_pages.append(page.extract_text())
            
            full_text = '\n\n'.join(text_pages)
            return full_text, metadata
        except Exception as e:
            raise Exception(f"PDF extraction failed: {str(e)}")


class TextProcessor(DocumentProcessor):
    """Process plain text and markdown files"""
    
    @staticmethod
    def extract_text(file_path: str) -> Tuple[str, dict]:
        """Extract text from text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            metadata = {
                'lines': len(text.split('\n')),
                'chars': len(text),
            }
            
            return text, metadata
        except Exception as e:
            raise Exception(f"Text extraction failed: {str(e)}")


class DocxProcessor(DocumentProcessor):
    """Process Word documents"""
    
    @staticmethod
    def extract_text(file_path: str) -> Tuple[str, dict]:
        """Extract text from DOCX"""
        try:
            import docx
            
            doc = docx.Document(file_path)
            paragraphs = [para.text for para in doc.paragraphs]
            full_text = '\n\n'.join(paragraphs)
            
            metadata = {
                'paragraphs': len(paragraphs),
                'chars': len(full_text),
            }
            
            return full_text, metadata
        except Exception as e:
            raise Exception(f"DOCX extraction failed: {str(e)}")


class AudioProcessor(DocumentProcessor):
    """Process audio files with transcription"""
    
    @staticmethod
    def transcribe(file_path: str) -> Tuple[str, dict]:
        """Transcribe audio file using Faster Whisper"""
        try:
            from faster_whisper import WhisperModel
            from django.conf import settings
            
            config = settings.APP_CONFIG.get('transcription', {})
            model_size = config.get('model', 'tiny')
            device = config.get('device', 'cuda')
            
            model = WhisperModel(model_size, device=device)
            segments, info = model.transcribe(file_path)
            
            text_segments = []
            for segment in segments:
                text_segments.append(segment.text)
            
            full_text = ' '.join(text_segments)
            
            metadata = {
                'language': info.language,
                'duration': info.duration,
            }
            
            return full_text, metadata
        except Exception as e:
            raise Exception(f"Audio transcription failed: {str(e)}")


# Factory function to get appropriate processor
def get_processor(file_type: str):
    """Get processor instance for file type"""
    processors = {
        'pdf': PDFProcessor,
        'txt': TextProcessor,
        'md': TextProcessor,
        'docx': DocxProcessor,
        'audio': AudioProcessor,
    }
    
    return processors.get(file_type, TextProcessor)()
