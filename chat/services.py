"""
Ollama Service - LLM Integration Handler
Manages communication with Ollama for text generation with document context.
"""
import requests
import json
from typing import List, Dict, Generator
from django.conf import settings


class OllamaService:
    """Service for interacting with Ollama API"""
    
    def __init__(self):
        config = settings.APP_CONFIG.get('llm', {})
        self.base_url = config.get('base_url', 'http://localhost:11434')
        self.model = config.get('model', 'phi3:mini')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 2048)
    
    def is_available(self) -> bool:
        """Check if Ollama service is running"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def list_models(self) -> List[str]:
        """List available Ollama models"""
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except:
            return []
    
    def generate(self, prompt: str, system_prompt: str = None, stream: bool = False) -> Generator[str, None, None] | str:
        """
        Generate text from prompt using Ollama.
        
        Args:
            prompt: User's input prompt
            system_prompt: Optional system instructions
            stream: Whether to stream the response
        
        Returns:
            Generator yielding chunks if stream=True, otherwise full response
        """
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens,
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        try:
            response =requests.post(url, json=payload, stream=stream, timeout=60)
            
            if stream:
                return self._stream_response(response)
            else:
                if response.status_code == 200:
                    return response.json().get('response', '')
                else:
                    raise Exception(f"Ollama API error: {response.text}")
        except Exception as e:
            raise Exception(f"Failed to generate: {str(e)}")
    
    def _stream_response(self, response) -> Generator[str, None, None]:
        """Stream response chunks from Ollama"""
        for line in response.iter_lines():
            if line:
                try:
                    data = json.loads(line)
                    if 'response' in data:
                        yield data['response']
                    if data.get('done', False):
                        break
                except json.JSONDecodeError:
                    continue
    
    def chat(self, messages: List[Dict[str, str]], stream: bool = False) -> Generator[str, None, None] | str:
        """
        Chat interface with conversation history.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            stream: Whether to stream the response
        
        Example:
            messages = [
                {"role": "user", "content": "Hello!"},
                {"role": "assistant", "content": "Hi there!"},
                {"role": "user", "content": "What is AI?"}
            ]
        """
        url = f"{self.base_url}/api/chat"
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens,
            }
        }
        
        try:
            response = requests.post(url, json=payload, stream=stream, timeout=120)
            
            if stream:
                return self._stream_chat_response(response)
            else:
                if response.status_code == 200:
                    return response.json()['message']['content']
                else:
                    raise Exception(f"Ollama API error: {response.text}")
        except Exception as e:
            raise Exception(f"Failed to chat: {str(e)}")
    
    def _stream_chat_response(self, response) -> Generator[str, None, None]:
        """Stream chat response chunks from Ollama"""
        for line in response.iter_lines():
            if line:
                try:
                    data = json.loads(line)
                    if 'message' in data and 'content' in data['message']:
                        yield data['message']['content']
                    if data.get('done', False):
                        break
                except json.JSONDecodeError:
                    continue
    
    def generate_with_context(self, question: str, context_chunks: List[str], stream: bool = False):
        """
        Generate response with document context for RAG.
        
        Args:
            question: User's question
            context_chunks: List of relevant text chunks from documents
            stream: Whether to stream response
        """
        # Build context from chunks
        context = "\n\n".join([f"[Source {i+1}]:\n{chunk}" for i, chunk in enumerate(context_chunks)])
        
        system_prompt = """You are a helpful AI assistant. Answer the user's question based ONLY on the provided source documents. 
If the answer cannot be found in the sources, say "I cannot find this information in the provided documents."
Always cite which source number you're using when answering."""
        
        user_prompt = f"""Context from documents:
{context}

Question: {question}

Answer based on the sources above:"""
        
        return self.generate(user_prompt, system_prompt=system_prompt, stream=stream)


# Global instance
ollama_service = OllamaService()
