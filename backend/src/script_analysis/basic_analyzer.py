"""
Basic script analyzer module combining MovieScript Parser and R² functionality.
"""
import re
from typing import Dict, List, Tuple
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class ScriptElement:
    type: str  # 'scene', 'dialogue', 'action', 'character'
    content: str
    line_number: int
    metadata: Dict = None

class BasicAnalyzer:
    def __init__(self):
        self.elements: List[ScriptElement] = []
        self.characters = set()
        self.scenes = []
        self.dialogues = defaultdict(list)
        
    def parse_script(self, script_text: str) -> Dict:
        """
        Parse script text into structured elements
        """
        lines = script_text.split('\n')
        current_element = None
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue
                
            # Scene heading detection (basic)
            if re.match(r'^(INT\.|EXT\.)', line):
                self.scenes.append(ScriptElement('scene', line, i))
                continue
                
            # Character name detection (basic)
            if line.isupper() and not line.startswith(('INT.', 'EXT.')):
                self.characters.add(line)
                current_element = ScriptElement('character', line, i)
                continue
                
            # Dialogue detection
            if current_element and current_element.type == 'character':
                self.dialogues[current_element.content].append(line)
                self.elements.append(ScriptElement('dialogue', line, i, 
                                                {'character': current_element.content}))
                continue
                
            # Action/description
            self.elements.append(ScriptElement('action', line, i))
            current_element = None
            
        return self._generate_analysis()
    
    def _generate_analysis(self) -> Dict:
        """
        Generate basic analysis of the script
        """
        return {
            'total_scenes': len(self.scenes),
            'total_characters': len(self.characters),
            'characters': list(self.characters),
            'dialogue_count': sum(len(d) for d in self.dialogues.values()),
            'dialogue_per_character': {char: len(dialogues) 
                                    for char, dialogues in self.dialogues.items()},
            'scene_breakdown': [{'content': scene.content, 
                               'line_number': scene.line_number} 
                              for scene in self.scenes]
        } 