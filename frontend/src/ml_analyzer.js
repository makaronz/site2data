const natural = require('natural');
const nlp = require('compromise');

// Inicjalizacja analizatora sentymentu - używamy domyślnego analizatora
// zamiast AFINN, który nie obsługuje polskiego
const tokenizer = new natural.WordTokenizer();

// Słownik sentymentalny dla języka polskiego
const polishSentimentLexicon = {
  // Pozytywne słowa
  "dobry": 2, "świetny": 3, "wspaniały": 3, "doskonały": 3, "cudowny": 3,
  "zadowolony": 2, "szczęśliwy": 3, "radosny": 2, "uśmiechnięty": 2, "wesoły": 2,
  "przyjemny": 1, "miły": 1, "sympatyczny": 1, "przyjazny": 2, "pomocny": 2,
  "udany": 1, "skuteczny": 1, "wartościowy": 1, "imponujący": 2, "zachwycający": 3,
  "idealny": 3, "perfekcyjny": 3, "fenomenalny": 3, "genialny": 3, "rewelacyjny": 3,
  "kochany": 2, "ukochany": 3, "uwielbiany": 3, "lubiany": 1, "szanowany": 2,
  "sukces": 2, "zwycięstwo": 2, "osiągnięcie": 2, "spełnienie": 2, "satysfakcja": 2,
  "nadzieja": 1, "optymizm": 2, "entuzjazm": 2, "zapał": 1, "pasja": 2,
  
  // Negatywne słowa
  "zły": -2, "okropny": -3, "straszny": -2, "fatalny": -3, "beznadziejny": -3,
  "smutny": -2, "przygnębiony": -2, "zrozpaczony": -3, "załamany": -3, "nieszczęśliwy": -2,
  "nieprzyjemny": -1, "niemiły": -1, "wrogi": -2, "agresywny": -2, "złośliwy": -2,
  "nieudany": -1, "bezużyteczny": -2, "bezwartościowy": -2, "rozczarowujący": -2, "irytujący": -2,
  "okropność": -3, "katastrofa": -3, "porażka": -2, "klęska": -2, "tragedia": -3,
  "nienawiść": -3, "wstręt": -3, "pogarda": -2, "obrzydzenie": -3, "odraza": -3,
  "wściekłość": -3, "gniew": -2, "złość": -2, "irytacja": -1, "rozdrażnienie": -1,
  "strach": -2, "lęk": -2, "przerażenie": -3, "groza": -3, "trwoga": -3,
  "smutek": -2, "żal": -2, "tęsknota": -1, "melancholia": -1, "depresja": -3,
  "cierpienie": -2, "ból": -2, "agonia": -3, "męczarnia": -3, "udręka": -2
};

class MLAnalyzer {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.relationGraph = {}; // Graf relacji między postaciami
    this.contextMemory = {}; // Pamięć kontekstowa dla scen

    // Trenowanie klasyfikatora na przykładowych danych
    this._trainClassifier();
    this._initializeEmotionLexicon();
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
  
  _initializeEmotionLexicon() {
    // Rozszerzony słownik emocji w języku polskim
    this.emotionLexicon = {
      anger: [
        'wściekły', 'zły', 'wkurzony', 'wściekłość', 'gniew', 'agresja', 'furia', 
        'złość', 'irytacja', 'wkurzenie', 'wrogość', 'oburzenie', 'rozdrażnienie',
        'frustracja', 'wściec', 'zdenerwować', 'wzburzyć', 'oburzyć'
      ],
      joy: [
        'szczęśliwy', 'radosny', 'wesoły', 'zadowolony', 'śmiech', 'uśmiech', 'radość',
        'przyjemność', 'euforia', 'entuzjazm', 'zachwyt', 'optymizm', 'rozbawienie',
        'szczęście', 'cieszyć', 'radować', 'śmiać', 'uśmiechać'
      ],
      sadness: [
        'smutny', 'przygnębiony', 'żałosny', 'płacz', 'łzy', 'rozpacz', 'melancholia',
        'smutek', 'żal', 'depresja', 'tęsknota', 'rozczarowanie', 'rezygnacja', 
        'cierpienie', 'załamanie', 'smucić', 'płakać', 'rozpaczać'
      ],
      fear: [
        'przerażony', 'przestraszony', 'strach', 'lęk', 'panika', 'groza', 'niepokój',
        'obawa', 'trwoga', 'przerażenie', 'zgroza', 'przestrach', 'zatrwożenie',
        'bojaźń', 'bać', 'przerazić', 'lękać', 'niepokoić'
      ],
      surprise: [
        'zaskoczony', 'zdumiony', 'szok', 'zdziwienie', 'niedowierzanie', 'osłupienie',
        'zaskoczenie', 'zdumienie', 'konsternacja', 'oszołomienie', 'zdumiały', 
        'zszokował', 'zadziwiać', 'zaskakiwać'
      ],
      disgust: [
        'obrzydzony', 'zniesmaczony', 'wstręt', 'odraza', 'obrzydzenie', 'niesmak',
        'obrzydliwy', 'odrzucający', 'obmierzły', 'brzydzić', 'odrzucać', 'odczuwać wstręt'
      ],
      trust: [
        'ufny', 'zaufanie', 'wiara', 'pewność', 'ufność', 'spolegliwość',
        'lojalność', 'oddanie', 'ufać', 'wierzyć', 'polegać'
      ],
      anticipation: [
        'oczekiwanie', 'nadzieja', 'przewidywanie', 'wyczekiwanie', 'pragnienie',
        'perspektywa', 'oczekiwać', 'spodziewać się', 'wyglądać'
      ]
    };
  }

  // Analiza sentymentu tekstu - własna implementacja z polskim słownikiem
  analyzeSentiment(text) {
    const tokens = tokenizer.tokenize(text.toLowerCase());
    let score = 0;
    let matchedWords = 0;
    
    tokens.forEach(token => {
      if (polishSentimentLexicon[token] !== undefined) {
        score += polishSentimentLexicon[token];
        matchedWords++;
      }
    });
    
    // Normalizacja wyniku
    const normalizedScore = matchedWords > 0 ? score / (matchedWords * 3) : 0;
    
    return {
      score: normalizedScore,
      sentiment: this._mapScoreToSentiment(normalizedScore),
      intensity: Math.abs(normalizedScore)
    };
  }

  // Analiza emocji w tekście - rozszerzona, wykorzystuje lokalne słowniki zamiast zewnętrznej biblioteki
  async analyzeEmotions(text) {
    const doc = nlp(text);
    const emotions = {
      anger: 0,
      joy: 0,
      sadness: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      trust: 0,
      anticipation: 0
    };

    // Analiza występowania słów kluczowych i ich kontekstu
    for (const [emotion, keywords] of Object.entries(this.emotionLexicon)) {
      keywords.forEach(keyword => {
        // Prosta implementacja sprawdzania występowania słowa w tekście
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        const matches = (text.match(regex) || []).length;
        const contextScore = this._analyzeEmotionContext(text, keyword);
        emotions[emotion] += matches * contextScore;
      });
    }

    // Analiza struktury składniowej dla lepszego zrozumienia emocji
    const syntaxEnhancedScore = await this._analyzeSyntaxForEmotions(text);
    for (const emotion in syntaxEnhancedScore) {
      if (emotions[emotion] !== undefined) {
        emotions[emotion] += syntaxEnhancedScore[emotion];
      }
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

  // Nowa metoda: Analizuje strukturę składniową tekstu dla lepszego zrozumienia emocji
  async _analyzeSyntaxForEmotions(text) {
    // Uproszczona implementacja, która nie korzysta z zewnętrznych bibliotek NLP
    const result = {
      anger: 0,
      joy: 0,
      sadness: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      trust: 0,
      anticipation: 0
    };
    
    // Analiza wykrzykników i pytań
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    
    result.surprise += questionCount * 0.2;
    result.anger += exclamationCount * 0.3;
    
    // Analiza wielkich liter (często oznacza krzyk/emocje)
    const words = text.split(' ');
    const uppercaseWords = words.filter(word => word.length > 2 && word === word.toUpperCase()).length;
    result.anger += uppercaseWords * 0.4;
    
    // Analiza powtórzeń (np. "nie, nie, nie!" oznacza silną emocję)
    const repetitionMatches = text.match(/(\b\w+\b)(\s+\1\b)+/g) || [];
    result.fear += repetitionMatches.length * 0.3;
    result.sadness += repetitionMatches.length * 0.2;
    
    return result;
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
  
  // Nowa metoda: Analiza kontekstu całej sceny
  async analyzeSceneContext(scene, allScenes) {
    const sceneIndex = allScenes.findIndex(s => s.sceneNumber === scene.sceneNumber);
    if (sceneIndex === -1) return {};
    
    // Analizuj sceny przed i po obecnej scenie dla kontekstu
    const previousScenes = allScenes.slice(Math.max(0, sceneIndex - 3), sceneIndex);
    const nextScenes = allScenes.slice(sceneIndex + 1, Math.min(allScenes.length, sceneIndex + 4));
    
    // Oblicz trend emocjonalny
    const emotionalTrend = this._calculateEmotionalTrend(scene, previousScenes, nextScenes);
    
    // Zidentyfikuj główne tematy i motywy
    const thematicAnalysis = await this._identifyThemes(scene, previousScenes, nextScenes);
    
    // Zachowaj kontekst sceny w pamięci
    this.contextMemory[scene.sceneNumber] = {
      emotionalTrend,
      thematicAnalysis,
      relatedScenes: previousScenes.map(s => s.sceneNumber).concat(nextScenes.map(s => s.sceneNumber))
    };
    
    return {
      emotionalTrend,
      thematicAnalysis,
      narrativeImportance: this._calculateNarrativeImportance(scene, sceneIndex, allScenes),
      sceneFlow: {
        buildsFrom: previousScenes.length > 0 ? previousScenes[previousScenes.length - 1].sceneNumber : null,
        leadsTo: nextScenes.length > 0 ? nextScenes[0].sceneNumber : null
      }
    };
  }
  
  // Nowa metoda: Oblicza trend emocjonalny
  _calculateEmotionalTrend(currentScene, previousScenes, nextScenes) {
    if (previousScenes.length === 0) return 'początek';
    
    // Analizuj sentyment bieżącej sceny i poprzednich
    const currentSentiment = this.analyzeSentiment(currentScene.description).score;
    const previousSentiments = previousScenes.map(scene => this.analyzeSentiment(scene.description).score);
    const avgPreviousSentiment = previousSentiments.reduce((a, b) => a + b, 0) / previousSentiments.length;
    
    // Określ kierunek trendu emocjonalnego
    const sentimentDifference = currentSentiment - avgPreviousSentiment;
    
    if (sentimentDifference > 0.3) {
      return 'wzrost emocjonalny';
    } else if (sentimentDifference < -0.3) {
      return 'spadek emocjonalny';
    } else {
      return 'stabilny';
    }
  }
  
  // Nowa metoda: Identyfikacja tematów
  async _identifyThemes(currentScene, previousScenes, nextScenes) {
    // Połącz tekst ze wszystkich analizowanych scen
    const allText = [currentScene, ...previousScenes, ...nextScenes]
      .map(scene => scene.description)
      .join(' ');
    
    // Znajdź najczęściej występujące słowa kluczowe
    const keywords = this._extractKeywords(allText);
    
    // Pogrupuj słowa kluczowe według tematów
    const themes = {
      conflict: keywords.filter(kw => ['konflikt', 'walka', 'spór', 'bitwa'].includes(kw.word)),
      romance: keywords.filter(kw => ['miłość', 'romans', 'uczucie', 'pocałunek'].includes(kw.word)),
      discovery: keywords.filter(kw => ['odkrycie', 'tajemnica', 'sekret', 'prawda'].includes(kw.word)),
      transformation: keywords.filter(kw => ['zmiana', 'transformacja', 'przemiana', 'ewolucja'].includes(kw.word))
    };
    
    // Znajdź dominujący temat
    const dominantTheme = Object.entries(themes)
      .map(([theme, words]) => ({ theme, score: words.reduce((sum, kw) => sum + kw.count, 0) }))
      .sort((a, b) => b.score - a.score)[0];
    
    return {
      dominantTheme: dominantTheme ? dominantTheme.theme : 'undefined',
      keywords: keywords.slice(0, 5),
      themes
    };
  }
  
  // Nowa metoda: Wyodrębnienie słów kluczowych
  _extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['i', 'w', 'na', 'z', 'do', 'się', 'jest', 'to', 'że', 'a', 'o', 'jak', 'po', 'co'];
    
    // Zlicz wystąpienia słów (bez słów stopu)
    const wordCounts = words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .reduce((counts, word) => {
        counts[word] = (counts[word] || 0) + 1;
        return counts;
      }, {});
    
    // Konwertuj do tablicy i sortuj
    return Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  // Nowa metoda: Obliczenie znaczenia narracyjnego
  _calculateNarrativeImportance(scene, sceneIndex, allScenes) {
    // Wagi dla różnych czynników
    const weights = {
      position: 0.3,  // Pozycja w narracji
      dialogue: 0.2,  // Ilość dialogów
      characters: 0.2, // Liczba postaci
      emotion: 0.3    // Intensywność emocjonalna
    };
    
    // Pozycja narracyjna (sceny na początku i końcu są zazwyczaj ważniejsze)
    const totalScenes = allScenes.length;
    const positionScore = Math.min(
      1.0,
      1.5 * Math.exp(-Math.pow((sceneIndex / totalScenes) - 0.05, 2) / 0.02) + // Początek
      1.5 * Math.exp(-Math.pow((sceneIndex / totalScenes) - 0.33, 2) / 0.02) + // Pierwszy punkt zwrotny
      1.5 * Math.exp(-Math.pow((sceneIndex / totalScenes) - 0.5, 2) / 0.02) +  // Środek
      1.5 * Math.exp(-Math.pow((sceneIndex / totalScenes) - 0.75, 2) / 0.02) + // Drugi punkt zwrotny
      1.5 * Math.exp(-Math.pow((sceneIndex / totalScenes) - 0.95, 2) / 0.02)   // Koniec
    );
    
    // Dialogi i postacie
    const dialogueScore = Math.min(1.0, scene.dialogue.length / 10); // Normalizacja do 1.0
    const charactersScore = Math.min(1.0, scene.cast.length / 5);    // Normalizacja do 1.0
    
    // Emocje
    const sentiment = this.analyzeSentiment(scene.description);
    const emotionScore = sentiment.intensity;
    
    // Wylicz ostateczny wynik
    const importance = 
      weights.position * positionScore +
      weights.dialogue * dialogueScore +
      weights.characters * charactersScore +
      weights.emotion * emotionScore;
    
    return {
      score: importance,
      level: importance > 0.7 ? 'kluczowa' : importance > 0.4 ? 'ważna' : 'standardowa',
      factors: {
        positionScore,
        dialogueScore,
        charactersScore,
        emotionScore
      }
    };
  }
  
  // Nowa metoda: Analiza relacji między postaciami
  async analyzeCharacterRelationships(scenes) {
    // Resetuj graf relacji
    this.relationGraph = {};
    
    // Przeanalizuj każdą scenę, szukając interakcji między postaciami
    scenes.forEach(scene => {
      // Inicjalizuj postacie, jeśli nie istnieją w grafie
      scene.cast.forEach(character => {
        if (!this.relationGraph[character]) {
          this.relationGraph[character] = {};
        }
      });
      
      // Analizuj dialogi, aby wykryć interakcje
      scene.dialogue.forEach(dialogue => {
        const speaker = dialogue.character;
        
        // Znajdź kto jest adresatem wypowiedzi
        const addressees = this._findAddressees(dialogue, scene.cast);
        
        // Oceń sentyment wypowiedzi
        const sentiment = this.analyzeSentiment(dialogue.text);
        
        // Aktualizuj relacje na podstawie dialogu
        addressees.forEach(addressee => {
          if (addressee !== speaker) {
            // Inicjalizuj relację, jeśli nie istnieje
            if (!this.relationGraph[speaker][addressee]) {
              this.relationGraph[speaker][addressee] = {
                interactions: 0,
                sentimentSum: 0,
                emotions: {
                  positive: 0,
                  negative: 0,
                  neutral: 0
                },
                scenes: []
              };
            }
            
            // Aktualizuj statystyki relacji
            const relation = this.relationGraph[speaker][addressee];
            relation.interactions++;
            relation.sentimentSum += sentiment.score;
            relation.scenes.push(scene.sceneNumber);
            
            // Klasyfikuj emocję
            if (sentiment.score > 0.2) {
              relation.emotions.positive++;
            } else if (sentiment.score < -0.2) {
              relation.emotions.negative++;
            } else {
              relation.emotions.neutral++;
            }
          }
        });
      });
    });
    
    // Przetwarzanie końcowe relacji
    const relationships = [];
    Object.keys(this.relationGraph).forEach(character1 => {
      Object.keys(this.relationGraph[character1]).forEach(character2 => {
        const relation = this.relationGraph[character1][character2];
        
        // Tylko relacje z wystarczającą liczbą interakcji
        if (relation.interactions >= 2) {
          const averageSentiment = relation.sentimentSum / relation.interactions;
          
          relationships.push({
            characters: [character1, character2],
            type: this._classifyRelationshipType(relation, averageSentiment),
            strength: Math.min(1.0, relation.interactions / 10), // Normalizacja
            sentiment: averageSentiment,
            scenes: [...new Set(relation.scenes)], // Unikalne sceny
            dominantEmotion: this._getDominantEmotion(relation.emotions)
          });
        }
      });
    });
    
    return relationships;
  }
  
  // Nowa metoda: Znajdowanie adresatów wypowiedzi
  _findAddressees(dialogue, castMembers) {
    const text = dialogue.text.toLowerCase();
    
    // Sprawdź czy imiona postaci występują w tekście
    const directAddressees = castMembers.filter(character => 
      text.includes(character.toLowerCase())
    );
    
    // Jeśli znaleziono bezpośrednich adresatów, użyj ich
    if (directAddressees.length > 0) {
      return directAddressees;
    }
    
    // W przeciwnym razie zakładamy, że adresatem są wszystkie postacie w scenie
    return castMembers.filter(character => character !== dialogue.character);
  }
  
  // Nowa metoda: Klasyfikacja typu relacji
  _classifyRelationshipType(relation, averageSentiment) {
    // Na podstawie sentymentu i proporcji pozytywnych/negatywnych interakcji
    const totalEmotional = relation.emotions.positive + relation.emotions.negative;
    const positiveRatio = totalEmotional > 0 ? relation.emotions.positive / totalEmotional : 0.5;
    
    if (averageSentiment > 0.5) {
      return 'przyjacielska';
    } else if (averageSentiment > 0.2) {
      return 'pozytywna';
    } else if (averageSentiment > -0.2) {
      if (positiveRatio > 0.7) {
        return 'złożona pozytywna';
      } else if (positiveRatio < 0.3) {
        return 'złożona negatywna';
      } else {
        return 'neutralna';
      }
    } else if (averageSentiment > -0.5) {
      return 'napięta';
    } else {
      return 'wroga';
    }
  }
  
  // Nowa metoda: Określenie dominującej emocji
  _getDominantEmotion(emotions) {
    if (emotions.positive > emotions.negative && emotions.positive > emotions.neutral) {
      return 'pozytywna';
    } else if (emotions.negative > emotions.positive && emotions.negative > emotions.neutral) {
      return 'negatywna';
    } else {
      return 'neutralna';
    }
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