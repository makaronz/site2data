"""
Structural analysis module based on Script-Analyzer functionality.
"""
from typing import Dict, List, Tuple
import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from collections import defaultdict

class StructureAnalyzer:
    def __init__(self):
        self.interaction_graph = nx.Graph()
        self.tfidf = TfidfVectorizer(stop_words='english')
        self.scene_scores = {}
        
    def analyze_structure(self, scenes: List[Dict], character_dialogues: Dict[str, List[str]]) -> Dict:
        """
        Analyze script structure including character interactions and scene importance
        """
        self._build_interaction_graph(character_dialogues)
        self._score_scenes(scenes)
        
        return {
            'character_centrality': self._calculate_character_centrality(),
            'key_scenes': self._identify_key_scenes(),
            'character_relationships': self._analyze_relationships(),
            'structure_metrics': self._calculate_structure_metrics()
        }
        
    def _build_interaction_graph(self, character_dialogues: Dict[str, List[str]]):
        """
        Build a graph of character interactions
        """
        # Reset graph
        self.interaction_graph.clear()
        
        # Add nodes for each character
        for character in character_dialogues.keys():
            self.interaction_graph.add_node(character, dialogues=len(character_dialogues[character]))
            
        # Add edges for interactions
        for char1 in character_dialogues.keys():
            for char2 in character_dialogues.keys():
                if char1 < char2:  # Avoid duplicate edges
                    weight = self._calculate_interaction_weight(
                        character_dialogues[char1],
                        character_dialogues[char2]
                    )
                    if weight > 0:
                        self.interaction_graph.add_edge(char1, char2, weight=weight)
                        
    def _calculate_interaction_weight(self, dialogues1: List[str], dialogues2: List[str]) -> float:
        """
        Calculate interaction weight between two characters
        """
        # Simple implementation - can be enhanced
        combined_text1 = ' '.join(dialogues1).lower()
        combined_text2 = ' '.join(dialogues2).lower()
        
        # Count mentions
        mentions1 = sum(1 for d in dialogues2 if any(word in d.lower() for word in combined_text1.split()))
        mentions2 = sum(1 for d in dialogues1 if any(word in d.lower() for word in combined_text2.split()))
        
        return (mentions1 + mentions2) / 2
        
    def _score_scenes(self, scenes: List[Dict]):
        """
        Score scenes based on their content using TF-IDF
        """
        # Extract scene content
        scene_texts = [scene['content'] for scene in scenes]
        
        # Calculate TF-IDF
        if scene_texts:
            tfidf_matrix = self.tfidf.fit_transform(scene_texts)
            
            # Score based on term importance
            for i, scene in enumerate(scenes):
                score = tfidf_matrix[i].sum() / tfidf_matrix[i].shape[1]
                self.scene_scores[scene['line_number']] = float(score)
                
    def _calculate_character_centrality(self) -> Dict[str, float]:
        """
        Calculate character importance using centrality metrics
        """
        if not self.interaction_graph.nodes():
            return {}
            
        # Calculate different centrality metrics
        degree_cent = nx.degree_centrality(self.interaction_graph)
        between_cent = nx.betweenness_centrality(self.interaction_graph)
        eigen_cent = nx.eigenvector_centrality(self.interaction_graph, max_iter=1000)
        
        # Combine metrics
        centrality = {}
        for character in self.interaction_graph.nodes():
            centrality[character] = {
                'degree': degree_cent[character],
                'betweenness': between_cent[character],
                'eigenvector': eigen_cent[character],
                'average': (degree_cent[character] + between_cent[character] + eigen_cent[character]) / 3
            }
            
        return centrality
        
    def _identify_key_scenes(self) -> List[Dict]:
        """
        Identify most important scenes based on scores
        """
        if not self.scene_scores:
            return []
            
        # Sort scenes by score
        sorted_scenes = sorted(
            self.scene_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [
            {'line_number': line_num, 'importance_score': score}
            for line_num, score in sorted_scenes[:10]  # Top 10 scenes
        ]
        
    def _analyze_relationships(self) -> List[Dict]:
        """
        Analyze character relationships based on interaction graph
        """
        relationships = []
        
        for char1, char2, data in self.interaction_graph.edges(data=True):
            relationships.append({
                'characters': [char1, char2],
                'interaction_strength': data['weight'],
                'combined_centrality': (
                    self._calculate_character_centrality()[char1]['average'] +
                    self._calculate_character_centrality()[char2]['average']
                ) / 2
            })
            
        return sorted(relationships, key=lambda x: x['interaction_strength'], reverse=True)
        
    def _calculate_structure_metrics(self) -> Dict:
        """
        Calculate overall script structure metrics
        """
        return {
            'density': nx.density(self.interaction_graph),
            'avg_clustering': nx.average_clustering(self.interaction_graph),
            'number_of_components': nx.number_connected_components(self.interaction_graph),
            'avg_path_length': nx.average_shortest_path_length(self.interaction_graph)
                if nx.is_connected(self.interaction_graph) else None
        } 