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
            "person1": "en-US-GuyNeural",   # Male voice
            "person2": "en-US-JennyNeural" # Female voice
        }
        
    def generate_persona_options(self, text):
        """
        Analyze content and propose 3 distinct persona pairs.
        """
        prompt = f"""
        Analyze the following content and propose 3 distinct pairs of personas (Host 1 and Host 2) for an audio conversation about it.
        Each pair should represent a different dynamic or angle (e.g., Skeptic vs Believer, Expert vs Novice, Enthusiast vs Realist).
        
        Content Summary:
        {text[:10000]}... (truncated)

        Return ONLY a JSON object with a key 'options' which is a list of objects.
        Each object must have 'person1' (name/role) and 'person2' (name/role).
        Example: 
        {{
            "options": [
                {{"person1": "Professor X (Expert)", "person2": "Student Y (Curious)"}},
                {{"person1": "Tech Optimist", "person2": "Tech Skeptic"}},
                {{"person1": "Historian", "person2": "Futurist"}}
            ]
        }}
        """
        try:
            response = ollama.chat(model=self.model, messages=[{'role': 'user', 'content': prompt}], format='json')
            data = json.loads(response['message']['content'])
            return data.get('options', [])
        except Exception as e:
            print(f"[PodcastService] Error generating persona options: {e}")
            return [
                {"person1": "Expert", "person2": "Novice"},
                {"person1": "Skeptic", "person2": "Enthusiast"},
                {"person1": "Host 1", "person2": "Host 2"}
            ]

    def generate_scenario_options(self, text, personas=None):
        """
        Generate 3 distinct conversational scenarios based on content and selected personas.
        """
        persona_context = ""
        if personas:
            persona_context = f"The conversation will be between {personas.get('person1')} and {personas.get('person2')}."

        prompt = f"""
        Analyze the following content and propose 3 distinct, creative conversational scenarios for an audio overview.
        {persona_context}
        Consider the perspectives of the specific personas defined above.
        
        Content Summary:
        {text[:10000]}... (truncated)

        Return ONLY a JSON object with a key 'options' which is a list of strings.
        Example: {{"options": ["Debate on ethics", "Deep dive into history", "Practical application discussion"]}}
        """
        try:
            response = ollama.chat(model=self.model, messages=[{'role': 'user', 'content': prompt}], format='json')
            data = json.loads(response['message']['content'])
            return data.get('options', [])
        except Exception as e:
            print(f"[PodcastService] Error generating scenario options: {e}")
            return ["Deep Dive", "Critical Analysis", "Casual Overview"]

    def generate_podcast(self, text, instruction=None, person1=None, person2=None, output_dir="media/podcasts"):
        """
        Main method to generate an audio overview from text.
        Returns the path to the generated audio file.
        """
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. Determine Roles
        roles = self._determine_roles(text, instruction, person1, person2)
        print(f"[PodcastService] Selected Roles: {roles}")
        
        # 2. Generate Script
        script = self._generate_script(text, roles, instruction)
        print(f"[PodcastService] Generated Script with {len(script)} turns")
        
        # 3. Generate Audio
        audio_file = self._generate_audio(script, roles, output_dir)
        
        return audio_file

    def _determine_roles(self, text, instruction=None, person1=None, person2=None):
        """Determine suitable roles for the conversation"""
        
        # If roles are explicitly provided, use them
        if person1 and person2:
            return {"person1": person1, "person2": person2}

        instruction_context = f"User Instruction/Theme: {instruction}" if instruction else ""
        
        role_prompt = f"""
        Analyze the following content and determine the two most suitable roles for a conversation about it.
        {instruction_context}
        
        If the instruction suggests specific personas (e.g. "Student and Teacher"), USE THEM.
        Otherwise, infer the best roles from the content.
        
        Examples:
        - Instruction: "Casual chat" -> Person 1: "Sarah", Person 2: "Naveen"
        - Instruction: "Academic explanation" -> Person 1: "Professor", Person 2: "Student"
        - Content is Technical -> Person 1: "Expert", Person 2: "Novice"

        Content:
        {text[:10000]}... (truncated)

        Return ONLY a JSON object with keys 'person1' (the lead speaker) and 'person2' (the second speaker). 
        Do not add any other text.
        Example format: {{"person1": "...", "person2": "..."}}
        """
        
        try:
            response = ollama.chat(model=self.model, messages=[{'role': 'user', 'content': role_prompt}], format='json')
            roles = json.loads(response['message']['content'])
            # Ensure keys exist
            if 'person1' not in roles: roles['person1'] = roles.get('host', 'Speaker 1')
            if 'person2' not in roles: roles['person2'] = roles.get('guest', 'Speaker 2')
            return roles
        except Exception as e:
            print(f"[PodcastService] Error selecting roles: {e}")
            return {"person1": "Speaker 1", "person2": "Speaker 2"}

    def _generate_script(self, text, roles, instruction=None):
        """Generate the podcast script"""
        
        instruction_text = f"Focus on this specific theme/format: {instruction}" if instruction else "Cover the key points naturally."
        
        podcast_prompt = f"""
        Generate a natural conversation between {roles.get('person1', 'Speaker 1')} and {roles.get('person2', 'Speaker 2')} based on the following content.
        Make it engaging, authentic, and easy to follow.
        Make it a comprehensive deep dive. Do not limit the conversation length. 
        {instruction_text}

        Content:
        {text[:12000]}... (truncated if too long)

        Return the output as a JSON object with a key 'conversation' which is a list of objects.
        Each object in the list should have 'speaker' and 'text' keys.
        Ensure the 'speaker' field matches exactly one of the roles: "{roles.get('person1', 'Speaker 1')}" or "{roles.get('person2', 'Speaker 2')}".
        Example format:
        {{
          "conversation": [
            {{"speaker": "{roles.get('person1', 'Speaker 1')}", "text": "Hello..."}},
            {{"speaker": "{roles.get('person2', 'Speaker 2')}", "text": "Hi there..."}}
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
        if not script:
             print("[PodcastService] Warning: Script is empty.")
             return None
             
        async def _generate_segment(text, voice, filename):
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(filename)

        async def _process_script():
            segments = []
            person1_role = roles.get('person1', 'Speaker 1')
            
            for i, turn in enumerate(script):
                speaker = turn.get('speaker', '')
                text = turn.get('text', '')
                
                if not text:
                    continue
                
                # Determine voice
                # Use simple heuristics to match speaker name to role
                if speaker == person1_role or person1_role in speaker:
                    voice = self.voice_map['person1']
                else:
                    voice = self.voice_map['person2']
                
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
