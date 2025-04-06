const natural = require('natural');
const { NLP } = require('node-nlp');
const nlp = require('compromise');

// Inicjalizacja analizatora sentymentu
const analyzer = new natural.SentimentAnalyzer('Polish', natural.PorterStemmerPl, 'afinn');
const tokenizer = new natural.WordTokenizer();

class MLAnalyzer {
  constructor() {
    this.nlpProcessor = new NLP({ language: 'pl' });
    this.classifier = new natural.BayesClassifier();

    // Trenowanie klasyfikatora na przykładowych danych
    this._trainClassifier();
  }

  _trainClassifier() {
    // Przykładowe dane treningowe dla scen
    const trainingData = [
      { text: 'biegnie ucieka strzela walczy', category: 'akcja' },
      { text: 'rozmawia dyskutuje kłóci się', category: 'dialog' },
      { text: 'opisuje przedstawia pokazuje', category: 'ekspozycja' },
      { text: 'przechodzi wchodzi wychodzi', category: 'przejściowa' }
    ];

    trainingData.forEach(item => {
      this.classifier.addDocument(item.text, item.category);
    });

    this.classifier.train();
  }

  // Analiza sentymentu tekstu
  analyzeSentiment(text) {
    const tokens = tokenizer.tokenize(text);
    const score = analyzer.getSentiment(tokens);
    
    return {
      score,
      sentiment: this._mapScoreToSentiment(score),
      intensity: Math.abs(score)
    };
  }

  // Analiza emocji w tekście
  async analyzeEmotions(text) {
    const doc = nlp(text);
    const emotions = {
      anger: 0,
      joy: 0,
      sadness: 0,
      fear: 0,
      surprise: 0
    };

    // Słowa kluczowe dla każdej emocji
    const emotionKeywords = {
      anger: ['wściekły', 'zły', 'wkurzony', 'wściekłość', 'gniew', 'agresja', 'furia'],
      joy: ['szczęśliwy', 'radosny', 'wesoły', 'zadowolony', 'śmiech', 'uśmiech', 'radość'],
      sadness: ['smutny', 'przygnębiony', 'żałosny', 'płacz', 'łzy', 'rozpacz', 'melancholia'],
      fear: ['przerażony', 'przestraszony', 'strach', 'lęk', 'panika', 'groza', 'niepokój'],
      surprise: ['zaskoczony', 'zdumiony', 'szok', 'zdziwienie', 'niedowierzanie', 'osłupienie']
    };

    // Analiza występowania słów kluczowych i ich kontekstu
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      keywords.forEach(keyword => {
        const matches = doc.match(keyword).length;
        const contextScore = this._analyzeEmotionContext(text, keyword);
        emotions[emotion] += matches * contextScore;
      });
    }

    // Normalizacja wyników
    const maxValue = Math.max(...Object.values(emotions));
    if (maxValue > 0) {
      Object.keys(emotions).forEach(key => {
        emotions[key] = emotions[key] / maxValue;
      });
    }

    return emotions;
  }

  // Analiza punktów zwrotnych
  async analyzeTurningPoints(scenes) {
    const turningPoints = [];
    let previousIntensity = 0;
    let emotionalArc = [];

    // Analiza łuku emocjonalnego całego scenariusza
    scenes.forEach((scene, index) => {
      const sentiment = this.analyzeSentiment(scene.description);
      emotionalArc.push(sentiment.intensity);
    });

    // Wykrywanie znaczących zmian w intensywności emocjonalnej
    for (let i = 1; i < scenes.length - 1; i++) {
      const previousIntensity = emotionalArc[i - 1];
      const currentIntensity = emotionalArc[i];
      const nextIntensity = emotionalArc[i + 1];

      // Wykrywanie lokalnych maksimów i minimów
      if (this._isSignificantChange(previousIntensity, currentIntensity, nextIntensity)) {
        turningPoints.push({
          sceneNumber: scenes[i].sceneNumber,
          type: currentIntensity > previousIntensity ? 'wzrost' : 'spadek',
          intensity: currentIntensity,
          description: this._describeTurningPoint(scenes[i], currentIntensity, previousIntensity)
        });
      }
    }

    return turningPoints;
  }

  // Klasyfikacja scen
  async classifyScene(scene) {
    const features = await this._extractSceneFeatures(scene);
    const sceneText = this._prepareSceneTextForClassification(scene);
    
    return {
      type: this.classifier.classify(sceneText),
      intensity: features.emotionalIntensity,
      pacing: this._determinePacing(features),
      importance: this._calculateSceneImportance(features)
    };
  }

  // Prywatne metody pomocnicze
  _mapScoreToSentiment(score) {
    if (score <= -0.6) return 'bardzo negatywny';
    if (score <= -0.2) return 'negatywny';
    if (score <= 0.2) return 'neutralny';
    if (score <= 0.6) return 'pozytywny';
    return 'bardzo pozytywny';
  }

  _analyzeEmotionContext(text, keyword) {
    // Prosta analiza kontekstu - sprawdzanie negacji
    const negationWords = ['nie', 'bez', 'nigdy', 'żaden'];
    const words = text.toLowerCase().split(' ');
    const keywordIndex = words.indexOf(keyword.toLowerCase());
    
    if (keywordIndex === -1) return 1;

    // Sprawdź słowa poprzedzające keyword
    for (let i = Math.max(0, keywordIndex - 3); i < keywordIndex; i++) {
      if (negationWords.includes(words[i])) {
        return -0.5; // Negacja osłabia emocję
      }
    }

    return 1;
  }

  _isSignificantChange(prev, current, next) {
    const threshold = 0.3;
    return Math.abs(current - prev) > threshold || Math.abs(current - next) > threshold;
  }

  _describeTurningPoint(scene, currentIntensity, previousIntensity) {
    const change = currentIntensity - previousIntensity;
    const intensity = Math.abs(change);

    let description = '';
    if (intensity > 0.7) {
      description = change > 0 ? 'Dramatyczny wzrost napięcia' : 'Gwałtowny spadek napięcia';
    } else if (intensity > 0.4) {
      description = change > 0 ? 'Znaczący wzrost napięcia' : 'Wyraźny spadek napięcia';
    } else {
      description = change > 0 ? 'Umiarkowany wzrost napięcia' : 'Łagodny spadek napięcia';
    }

    return `${description} w scenie ${scene.sceneNumber}`;
  }

  async _extractSceneFeatures(scene) {
    const sentiment = this.analyzeSentiment(scene.description);
    const emotions = await this.analyzeEmotions(scene.description);
    
    return {
      dialogueCount: scene.dialogue.length,
      descriptionLength: scene.description.length,
      emotionalIntensity: sentiment.intensity,
      emotions: emotions,
      hasAction: this._containsAction(scene.description),
      timeOfDay: scene.timeOfDay,
      castSize: scene.cast.length
    };
  }

  _prepareSceneTextForClassification(scene) {
    // Łączymy opis sceny i dialogi w jeden tekst do klasyfikacji
    const dialogueText = scene.dialogue
      .map(d => d.text)
      .join(' ');
    
    return `${scene.description} ${dialogueText}`;
  }

  _determinePacing(features) {
    const score = (
      features.dialogueCount * 0.3 +
      (features.hasAction ? 0.4 : 0) +
      features.emotionalIntensity * 0.3
    );
    
    if (score > 0.7) return 'szybkie';
    if (score > 0.4) return 'umiarkowane';
    return 'wolne';
  }

  _calculateSceneImportance(features) {
    const score = (
      features.emotionalIntensity * 0.4 +
      (features.castSize / 10) * 0.2 +
      (features.hasAction ? 0.2 : 0) +
      (features.dialogueCount / 20) * 0.2
    );
    
    return Math.min(Math.max(score, 0), 1);
  }

  _containsAction(text) {
    const actionKeywords = [
      'biegnie', 'uderza', 'skacze', 'walczy', 'strzela',
      'wybucha', 'ucieka', 'goni', 'rzuca', 'łapie',
      'atakuje', 'unika', 'przewraca', 'wpada', 'rozbija'
    ];
    
    const lowercaseText = text.toLowerCase();
    return actionKeywords.some(keyword => lowercaseText.includes(keyword));
  }
}

module.exports = new MLAnalyzer(); 