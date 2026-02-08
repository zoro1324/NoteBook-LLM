import ollama
import json
import edge_tts
import nest_asyncio
import asyncio
import os
import uuid
from django.conf import settings

# Apply nest_asyncio to allow async execution
nest_asyncio.apply()

class PodcastService:
    def __init__(self):
        self.model = "phi3:mini"
        self.voice_map = {
            "host": "en-US-GuyNeural",   # Male voice
            "guest": "en-US-JennyNeural" # Female voice
        }
        
    def generate_podcast(self, text, output_dir="media/podcasts"):
        """
        Main method to generate a podcast from text.
        Returns the path to the generated audio file.
        """
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. Determine Roles
        roles = self._determine_roles(text)
        print(f"[PodcastService] Selected Roles: {roles}")
        
        # 2. Generate Script
        script = self._generate_script(text, roles)
        print(f"[PodcastService] Generated Script with {len(script)} turns")
        
        # 3. Generate Audio
        audio_file = self._generate_audio(script, roles, output_dir)
        
        return audio_file

    def _determine_roles(self, text):
        """Determine suitable roles for the conversation"""
        role_prompt = f"""
        Analyze the following content and determine the two most suitable roles for a conversation about it.
        For example: 
        - If the content is about study, roles could be 'Teacher' and 'Student'.
        - If the content is about a job, roles could be 'HR' and 'Candidate'.
        - If the content is technical, roles could be 'Expert' and 'Novice'.

        Content:
        {text[:10000]}... (truncated)

        Return ONLY a JSON object with keys 'host' and 'guest'. Do not add any other text.
        Example format: {{"host": "...", "guest": "..."}}
        """
        
        try:
            response = ollama.chat(model=self.model, messages=[{'role': 'user', 'content': role_prompt}], format='json')
            roles = json.loads(response['message']['content'])
            return roles
        except Exception as e:
            print(f"[PodcastService] Error selecting roles: {e}")
            return {"host": "Host", "guest": "Guest"}

    def _generate_script(self, text, roles):
        """Generate the podcast script"""
        podcast_prompt = f"""
        Generate a podcast conversation between a {roles.get('host', 'Host')} and a {roles.get('guest', 'Guest')} based on the following content.
        Make it engaging and easy to understand.
        Make it a comprehensive deep dive. Do not limit the conversation length. Cover the key points in detail.

        Content:
        {text[:30000]}... (truncated if too long)

        Return the output as a JSON object with a key 'conversation' which is a list of objects.
        Each object in the list should have 'speaker' and 'text' keys.
        Ensure the 'speaker' field matches exactly one of the roles: {roles.get('host', 'Host')} or {roles.get('guest', 'Guest')}.
        Example format:
        {{
          "conversation": [
            {{"speaker": "{roles.get('host', 'Host')}", "text": "Hello everyone..."}},
            {{"speaker": "{roles.get('guest', 'Guest')}", "text": "Hi! Today we are discussing..."}}
          ]
        }}
        """
        
        try:
            response = ollama.chat(model=self.model, messages=[{'role': 'user', 'content': podcast_prompt}], format='json')
            data = json.loads(response['message']['content'])
            
            # Extract conversation list safely
            if 'conversation' in data:
                return data['conversation']
            elif isinstance(data, list):
                return data
            else:
                # Try to find a list in values
                for v in data.values():
                    if isinstance(v, list):
                        return v
            return []
            
        except Exception as e:
            print(f"[PodcastService] Error generating script: {e}")
            return []

    def _generate_audio(self, script, roles, output_dir):
        """Convert script to audio"""
        
        async def _generate_segment(text, voice, filename):
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(filename)

        async def _process_script():
            segments = []
            host_role = roles.get('host', 'Host')
            
            for i, turn in enumerate(script):
                speaker = turn.get('speaker', '')
                text = turn.get('text', '')
                
                if not text:
                    continue
                
                # Determine voice
                # Simple heuristic: if speaker string contains the host role name, use host voice
                # Otherwise use guest voice. 
                # Ideally, we should map exact role strings, but LLM might vary them slightly.
                if host_role in speaker or speaker in host_role:
                    voice = self.voice_map['host']
                else:
                    voice = self.voice_map['guest']
                
                filename = os.path.join(output_dir, f"segment_{i}_{uuid.uuid4().hex[:8]}.mp3")
                await _generate_segment(text, voice, filename)
                segments.append(filename)
            
            return segments

        try:
            # Generate all segments
            segment_files = asyncio.run(_process_script())
            
            # Combine segments
            # Since we don't want to rely on ffmpeg if possible (complex install), 
            # we can use a simple file concatenation for mp3s (often works) 
            # or try to use pydub if installed. 
            # The notebook used moviepy, but let's try simple concatenation first for speed/dependency minification
            # if edge-tts produces standard mp3s.
            
            final_filename = f"podcast_{uuid.uuid4().hex[:8]}.mp3"
            final_path = os.path.join(output_dir, final_filename)
            
            with open(final_path, 'wb') as outfile:
                for segment_file in segment_files:
                    with open(segment_file, 'rb') as infile:
                        outfile.write(infile.read())
                    # Clean up segment
                    try:
                        os.remove(segment_file)
                    except:
                        pass
            
            return final_filename
            
        except Exception as e:
            print(f"[PodcastService] Error generating audio: {e}")
            return None

# Singleton instance
podcast_service = PodcastService()
