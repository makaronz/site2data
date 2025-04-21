document.addEventListener('DOMContentLoaded', function() {
    // Elementy DOM
    const uploadButton = document.getElementById('uploadButton');
    const scriptFileInput = document.getElementById('scriptFile');
    const scriptsList = document.getElementById('scriptsList');
    const scriptsSection = document.getElementById('scriptsSection');
    const analysisSection = document.getElementById('analysisSection');
    const scriptTitle = document.getElementById('scriptTitle');
    
    // Zmienne stanu
    let currentScriptId = null;
    let currentScript = null;
    let scripts = [];
    
    // Obsługa przesyłania pliku
    uploadButton.addEventListener('click', function() {
        scriptFileInput.click();
    });
    
    scriptFileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('script', file);
            
            // Pokaż indykator ładowania
            uploadButton.textContent = 'Analizowanie...';
            uploadButton.disabled = true;
            
            // Wyślij plik do serwera
            fetch('/api/parse-script', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas przesyłania pliku.');
                }
                return response.json();
            })
            .then(data => {
                uploadButton.textContent = 'Wgraj Scenariusz';
                uploadButton.disabled = false;
                
                // Zaaktualizuj listę scenariuszy
                fetchScripts();
                
                // Wyświetl analizę
                showAnalysis(data);
            })
            .catch(error => {
                console.error('Błąd:', error);
                uploadButton.textContent = 'Wgraj Scenariusz';
                uploadButton.disabled = false;
                alert('Wystąpił błąd podczas analizowania scenariusza: ' + error.message);
            });
        }
    });
    
    // Pobierz listę scenariuszy
    function fetchScripts() {
        fetch('/api/scripts')
            .then(response => response.json())
            .then(data => {
                scripts = data;
                renderScriptsList();
            })
            .catch(error => {
                console.error('Błąd podczas pobierania scenariuszy:', error);
            });
    }
    
    // Renderuj listę scenariuszy
    function renderScriptsList() {
        if (scripts.length === 0) {
            scriptsList.innerHTML = '<div class="no-scripts">Nie masz jeszcze żadnych scenariuszy. Wgraj swój pierwszy scenariusz, aby rozpocząć.</div>';
            return;
        }
        
        scriptsList.innerHTML = '';
        
        scripts.forEach(script => {
            const scriptCard = document.createElement('div');
            scriptCard.classList.add('script-card');
            scriptCard.dataset.id = script.path;
            
            const date = new Date(script.date);
            const formattedDate = date.toLocaleString('pl-PL');
            
            scriptCard.innerHTML = `
                <h3 class="script-title">${script.name}</h3>
                <div class="script-date">${formattedDate}</div>
                <div class="script-stats">
                    <div class="script-stat">Sceny: ...</div>
                    <div class="script-stat">Postacie: ...</div>
                </div>
            `;
            
            scriptCard.addEventListener('click', function() {
                fetchScriptAnalysis(script.path);
            });
            
            scriptsList.appendChild(scriptCard);
        });
    }
    
    // Pobierz analizę dla scenariusza
    function fetchScriptAnalysis(scriptPath) {
        fetch(`/api/analysis/full`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scriptPath })
        })
        .then(response => response.json())
        .then(data => {
            showAnalysis(data);
        })
        .catch(error => {
            console.error('Błąd podczas pobierania analizy:', error);
            alert('Wystąpił błąd podczas pobierania analizy scenariusza.');
        });
    }
    
    // Pokaż analizę scenariusza
    function showAnalysis(scriptData) {
        currentScript = scriptData;
        
        // Ukryj sekcję z listą scenariuszy
        scriptsSection.style.display = 'none';
        
        // Pokaż sekcję analizy
        analysisSection.style.display = 'block';
        
        // Ustaw tytuł
        scriptTitle.textContent = scriptData.title || 'Bez tytułu';
        
        // Wypełnij dane statystyczne
        document.getElementById('scenesCount').textContent = scriptData.metadata?.totalScenes || 0;
        document.getElementById('charactersCount').textContent = scriptData.metadata?.uniqueCharacters?.length || 0;
        document.getElementById('dialoguesCount').textContent = scriptData.metadata?.totalDialogues || 0;
        document.getElementById('pagesCount').textContent = Math.ceil(scriptData.metadata?.estimatedPages || 0);
        
        // Renderuj kartę przeglądu
        renderOverviewTab(scriptData);
        
        // Renderuj kartę scen
        renderScenesTab(scriptData);
        
        // Renderuj kartę postaci
        renderCharactersTab(scriptData);
        
        // Renderuj kartę emocji, jeśli dostępne
        if (scriptData.emotions) {
            renderEmotionsTab(scriptData);
        }
        
        // Renderuj kartę relacji, jeśli dostępne
        if (scriptData.relationships) {
            renderRelationshipsTab(scriptData);
        }
    }
    
    // Renderuj kartę przeglądu
    function renderOverviewTab(scriptData) {
        // Tworzenie wykresu emocji
        const emotionChartCanvas = document.getElementById('emotionChart');
        const emotionData = [];
        
        if (scriptData.scenes && scriptData.scenes.length > 0) {
            // Jeśli mamy dane o emocjach w scenach
            if (scriptData.emotions && scriptData.emotions.scenesEmotions) {
                const scenesEmotions = scriptData.emotions.scenesEmotions;
                
                // Przygotuj dane do wykresu
                const labels = [];
                const intensity = [];
                const sentiment = [];
                
                for (let i = 0; i < scenesEmotions.length; i++) {
                    labels.push('Scena ' + (i + 1));
                    intensity.push(scenesEmotions[i].intensity * 100);
                    sentiment.push((scenesEmotions[i].sentiment + 1) * 50); // Konwersja z zakresu -1 do 1 na 0 do 100
                }
                
                // Utwórz wykres
                if (window.emotionChart) {
                    window.emotionChart.destroy();
                }
                
                window.emotionChart = new Chart(emotionChartCanvas, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Intensywność',
                                data: intensity,
                                borderColor: 'rgba(46, 196, 182, 1)',
                                backgroundColor: 'rgba(46, 196, 182, 0.1)',
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Sentyment',
                                data: sentiment,
                                borderColor: 'rgba(231, 29, 54, 1)',
                                backgroundColor: 'rgba(231, 29, 54, 0.1)',
                                tension: 0.4,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                labels: {
                                    color: '#e0e0e0'
                                }
                            }
                        }
                    }
                });
            }
        }
    }
    
    // Renderuj kartę scen
    function renderScenesTab(scriptData) {
        const scenesDetailsList = document.getElementById('scenesDetailsList');
        scenesDetailsList.innerHTML = '';
        
        if (scriptData.scenes && scriptData.scenes.length > 0) {
            scriptData.scenes.forEach((scene, index) => {
                const sceneElement = document.createElement('div');
                sceneElement.classList.add('scene-item');
                
                const castList = scene.cast && scene.cast.length > 0 
                    ? scene.cast.map(character => `<span class="character-tag">${character}</span>`).join('')
                    : '<span class="character-tag">Brak postaci</span>';
                
                sceneElement.innerHTML = `
                    <div class="scene-header">
                        <div class="scene-title">${scene.location?.name || 'Nieznana lokacja'}</div>
                        <div class="scene-number">${scene.sceneNumber || index + 1}</div>
                    </div>
                    <div class="scene-details">
                        <div><strong>Pora dnia:</strong> ${scene.timeOfDay || 'Nie określono'}</div>
                        <div><strong>Wnętrze/Plener:</strong> ${scene.location?.interior ? 'Wnętrze' : 'Plener'}</div>
                    </div>
                    <div class="scene-synopsis">${scene.synopsis || 'Brak opisu'}</div>
                    <div class="scene-cast">
                        <strong>Obsada:</strong> ${castList}
                    </div>
                `;
                
                scenesDetailsList.appendChild(sceneElement);
            });
        } else {
            scenesDetailsList.innerHTML = '<div class="no-data">Brak danych o scenach.</div>';
        }
    }
    
    // Renderuj kartę postaci
    function renderCharactersTab(scriptData) {
        const charactersGrid = document.getElementById('charactersGrid');
        charactersGrid.innerHTML = '';
        
        if (scriptData.metadata && scriptData.metadata.uniqueCharacters && scriptData.metadata.uniqueCharacters.length > 0) {
            const characters = scriptData.metadata.uniqueCharacters;
            
            characters.forEach(character => {
                const characterElement = document.createElement('div');
                characterElement.classList.add('character-card');
                
                // Znajdź liczbę dialogów postaci
                let dialogCount = 0;
                if (scriptData.scenes) {
                    scriptData.scenes.forEach(scene => {
                        if (scene.dialogue) {
                            dialogCount += scene.dialogue.filter(d => d.character === character).length;
                        }
                    });
                }
                
                // Znajdź sceny, w których występuje postać
                let scenesWithCharacter = 0;
                if (scriptData.scenes) {
                    scenesWithCharacter = scriptData.scenes.filter(scene => 
                        scene.cast && scene.cast.includes(character)
                    ).length;
                }
                
                characterElement.innerHTML = `
                    <h3>${character}</h3>
                    <div class="character-stats">
                        <div class="character-stat">
                            <div class="stat-label">Dialogi</div>
                            <div class="stat-value-small">${dialogCount}</div>
                        </div>
                        <div class="character-stat">
                            <div class="stat-label">Sceny</div>
                            <div class="stat-value-small">${scenesWithCharacter}</div>
                        </div>
                    </div>
                `;
                
                charactersGrid.appendChild(characterElement);
            });
        } else {
            charactersGrid.innerHTML = '<div class="no-data">Brak danych o postaciach.</div>';
        }
    }
    
    // Renderuj kartę emocji
    function renderEmotionsTab(scriptData) {
        const emotionsAnalysis = document.getElementById('emotionsAnalysis');
        emotionsAnalysis.innerHTML = '';
        
        if (scriptData.emotions) {
            const emotions = scriptData.emotions;
            
            // Informacje o ogólnym nastroju
            const moodElement = document.createElement('div');
            moodElement.classList.add('emotions-card');
            moodElement.innerHTML = `
                <h3>Ogólny nastrój scenariusza</h3>
                <div class="mood-meter">
                    <div class="mood-bar" style="width: ${(emotions.overallSentiment + 1) * 50}%"></div>
                </div>
                <div class="mood-labels">
                    <span>Negatywny</span>
                    <span>Neutralny</span>
                    <span>Pozytywny</span>
                </div>
                <div class="emotions-details">
                    <p>Dominujące emocje: ${emotions.dominantEmotions?.join(', ') || 'Brak danych'}</p>
                    <p>Intensywność emocjonalna: ${Math.round(emotions.overallIntensity * 100)}%</p>
                </div>
            `;
            
            emotionsAnalysis.appendChild(moodElement);
            
            // Emocje w poszczególnych scenach, jeśli są dostępne
            if (emotions.scenesEmotions && emotions.scenesEmotions.length > 0) {
                const scenesEmotionsElement = document.createElement('div');
                scenesEmotionsElement.classList.add('scenes-emotions');
                
                scenesEmotionsElement.innerHTML = `
                    <h3>Emocje w scenach</h3>
                    <div class="scenes-emotions-list" id="scenesEmotionsList"></div>
                `;
                
                emotionsAnalysis.appendChild(scenesEmotionsElement);
                
                const scenesEmotionsList = document.getElementById('scenesEmotionsList');
                
                emotions.scenesEmotions.forEach((sceneEmotion, index) => {
                    const sceneNumber = index + 1;
                    const scene = scriptData.scenes && scriptData.scenes[index];
                    const sceneTitle = scene ? `${scene.location?.name || 'Scena'} ${scene.sceneNumber || sceneNumber}` : `Scena ${sceneNumber}`;
                    
                    const sceneEmotionElement = document.createElement('div');
                    sceneEmotionElement.classList.add('scene-emotion-item');
                    
                    sceneEmotionElement.innerHTML = `
                        <div class="scene-emotion-header">
                            <div class="scene-emotion-title">${sceneTitle}</div>
                            <div class="scene-emotion-intensity" style="background: linear-gradient(90deg, var(--gradient-start) ${sceneEmotion.sentiment * 100}%, var(--gradient-end) ${(1 - sceneEmotion.sentiment) * 100}%);">
                                ${Math.round(sceneEmotion.intensity * 100)}%
                            </div>
                        </div>
                        <div class="scene-emotion-tags">
                            ${sceneEmotion.emotions?.map(emotion => `<span class="emotion-tag">${emotion}</span>`).join('') || 'Brak danych o emocjach'}
                        </div>
                    `;
                    
                    scenesEmotionsList.appendChild(sceneEmotionElement);
                });
            }
        } else {
            emotionsAnalysis.innerHTML = '<div class="no-data">Brak danych o emocjach. Uruchom zaawansowaną analizę, aby zobaczyć emocje.</div>';
        }
    }
    
    // Renderuj kartę relacji
    function renderRelationshipsTab(scriptData) {
        const relationshipsNetwork = document.getElementById('relationshipsNetwork');
        relationshipsNetwork.innerHTML = '';
        
        if (scriptData.relationships) {
            const relationships = scriptData.relationships;
            
            relationshipsNetwork.innerHTML = `
                <div class="relationships-info">
                    <h3>Relacje między postaciami</h3>
                    <p>Liczba zidentyfikowanych relacji: ${relationships.connections?.length || 0}</p>
                </div>
                <div class="relationships-list" id="relationshipsList"></div>
            `;
            
            const relationshipsList = document.getElementById('relationshipsList');
            
            if (relationships.connections && relationships.connections.length > 0) {
                relationships.connections.forEach(connection => {
                    const relationshipElement = document.createElement('div');
                    relationshipElement.classList.add('relationship-item');
                    
                    relationshipElement.innerHTML = `
                        <div class="relationship-characters">
                            <span class="relationship-character">${connection.character1}</span>
                            <span class="relationship-arrow">→</span>
                            <span class="relationship-character">${connection.character2}</span>
                        </div>
                        <div class="relationship-strength" style="width: ${connection.strength * 100}%"></div>
                        <div class="relationship-type">${connection.type || 'Niezidentyfikowana relacja'}</div>
                        <div class="relationship-description">${connection.description || 'Brak opisu relacji'}</div>
                    `;
                    
                    relationshipsList.appendChild(relationshipElement);
                });
            } else {
                relationshipsList.innerHTML = '<div class="no-data">Brak zidentyfikowanych relacji.</div>';
            }
        } else {
            relationshipsNetwork.innerHTML = '<div class="no-data">Brak danych o relacjach. Uruchom zaawansowaną analizę, aby zobaczyć relacje.</div>';
        }
    }
    
    // Obsługa zakładek
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Ukryj wszystkie zakładki
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Usuń aktywną klasę ze wszystkich przycisków
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Aktywuj wybraną zakładkę
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Dodaj aktywną klasę do przycisku
            this.classList.add('active');
        });
    });
    
    // Pobierz listę scenariuszy podczas ładowania strony
    fetchScripts();
}); 