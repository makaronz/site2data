"""
Sentiment and emotion analysis module combining CMPT419 and Film_Script_Analysis.
"""
from typing import Dict, List, Tuple
from collections import defaultdict
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from textblob import TextBlob

class SentimentAnalyzer:
    def __init__(self):
        # Initialize NLTK components
        try:
            nltk.data.find('vader_lexicon')
        except LookupError:
            nltk.download('vader_lexicon')
        
        self.sia = SentimentIntensityAnalyzer()
        self.emotion_cache = {}
        
    def analyze_dialogue(self, text: str) -> Dict:
        """
        Analyze sentiment and emotion of a single dialogue
        """
        # Cache check
        if text in self.emotion_cache:
            return self.emotion_cache[text]
            
        # VADER sentiment analysis
        sentiment_scores = self.sia.polarity_scores(text)
        
        # TextBlob for additional analysis
        blob = TextBlob(text)
        
        result = {
            'sentiment': sentiment_scores,
            'subjectivity': blob.sentiment.subjectivity,
            'emotion': self._classify_emotion(text, sentiment_scores)
        }
        
        # Cache result
        self.emotion_cache[text] = result
        return result
        
    def analyze_character_emotions(self, character_dialogues: Dict[str, List[str]]) -> Dict:
        """
        Analyze emotions for each character based on their dialogues
        """
        character_emotions = {}
        
        for character, dialogues in character_dialogues.items():
            emotions = []
            for dialogue in dialogues:
                analysis = self.analyze_dialogue(dialogue)
                emotions.append(analysis)
                
            # Aggregate character emotions
            character_emotions[character] = self._aggregate_emotions(emotions)
            
        return character_emotions
        
    def _classify_emotion(self, text: str, sentiment_scores: Dict) -> str:
        """
        Classify the dominant emotion in text
        """
        # Basic emotion classification based on sentiment scores
        compound = sentiment_scores['compound']
        
        if compound >= 0.5:
            return 'joy'
        elif compound >= 0.1:
            return 'trust'
        elif compound <= -0.5:
            return 'anger'
        elif compound <= -0.1:
            return 'sadness'
        else:
            return 'neutral'
            
    def _aggregate_emotions(self, emotion_list: List[Dict]) -> Dict:
        """
        Aggregate multiple emotion analyses
        """
        total = len(emotion_list)
        if not total:
            return {'dominant_emotion': 'neutral', 'average_sentiment': 0}
            
        # Calculate averages
        avg_sentiment = sum(e['sentiment']['compound'] for e in emotion_list) / total
        
        # Count emotions
        emotion_counts = defaultdict(int)
        for e in emotion_list:
            emotion_counts[e['emotion']] += 1
            
        # Find dominant emotion
        dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0]
        
        return {
            'dominant_emotion': dominant_emotion,
            'average_sentiment': avg_sentiment,
            'emotion_distribution': dict(emotion_counts)
        } 