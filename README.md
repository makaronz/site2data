# Film Production Assistant

A comprehensive mobile and web application designed to streamline film production workflows and enhance collaboration among film crews.

## Project Overview

Film Production Assistant is a full-stack solution that addresses the challenges faced by film production teams. It provides tools for schedule management, document handling, continuity tracking, and equipment management, all integrated into a seamless experience available on both web and mobile platforms.

### Key Features

#### Mobile Production Assistant
- Real-time access to shooting schedules and production calendars
- Quick information exchange between crew members
- Automated notifications for schedule changes
- Equipment and materials request system with status tracking
- Cross-platform support (iOS and Android)

#### Production Schedule Assistant
- Automatic analysis of call sheets and production calendars
- Identification of potential scheduling conflicts
- Shot sequence optimization based on locations, actor availability, and camera setups
- Weather change alerts affecting outdoor shooting schedules
- Crew working time tracking to prevent overtime issues

#### Production Document Management System
- Automatic categorization of production documents (schedules, contracts, crew lists, shot plans)
- AI-powered quick search within documents
- Document version control with notifications for key crew members
- Daily status reports generation

#### Continuity and Script Supervision Assistant
- Automatic detection of continuity errors between shots
- Tracking of camera setups, props, and costumes for each scene
- Automated continuity notes with frame marking
- Comparison of shots with the script to ensure all key elements are captured

## Technical Architecture

### Backend
- **Framework**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT-based authentication
- **Real-time Communication**: Socket.io
- **File Storage**: AWS S3
- **AI Integration**: OpenAI for document analysis and continuity tracking

### Web Frontend
- **Framework**: React with Redux
- **UI Library**: Material-UI
- **Forms**: Formik with Yup validation
- **API Communication**: Axios
- **Real-time Updates**: Socket.io client

### Mobile Applications
- **Framework**: React Native (Expo)
- **UI Library**: React Native Paper
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit
- **Offline Support**: AsyncStorage with data syncing
- **Notifications**: Expo Notifications

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- React Native development environment (for mobile app)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/film-production-assistant.git
   cd film-production-assistant
   ```

2. Install dependencies for all packages
   ```bash
   npm run install:all
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env` in the backend directory
   - Copy `.env.example` to `.env` in the frontend directory
   - Configure the environment variables with your specific settings

4. Start the development servers
   ```bash
   # Start backend server
   npm run start:backend
   
   # Start frontend web app
   npm run start:frontend
   
   # Start mobile app
   npm run start:mobile
   ```

### Running on Mobile Devices

1. Install the Expo Go app on your mobile device
2. Scan the QR code displayed in the terminal after running `npm run start:mobile`
3. The app will load on your device

## Development Workflow

### Backend Development
- API routes are defined in the `backend/src/routes` directory
- Controllers are in `backend/src/controllers`
- MongoDB models are in `backend/src/models`
- Middleware for authentication, error handling, etc. is in `backend/src/middleware`

### Frontend Development
- Pages/screens are in `frontend/src/pages`
- Components are in `frontend/src/components`
- Redux state management is in `frontend/src/store`
- API service calls are in `frontend/src/services`

### Mobile Development
- Screens are in `mobile/src/screens`
- Components are in `mobile/src/components`
- Navigation configuration is in `mobile/src/navigation`
- Redux state management is in `mobile/src/redux`

## Deployment

### Backend Deployment
- The backend can be deployed to any Node.js hosting service (AWS, Heroku, DigitalOcean, etc.)
- MongoDB can be hosted on MongoDB Atlas or any other MongoDB hosting service

### Web Frontend Deployment
- The React app can be built with `npm run build:frontend` and deployed to services like Netlify, Vercel, or AWS S3

### Mobile App Deployment
- iOS: Build with Expo and publish to the App Store
- Android: Build with Expo and publish to the Google Play Store

## Project Roadmap

### Phase 1: Core Functionality (Current)
- User authentication and authorization
- Basic production schedule management
- Document upload and categorization
- Simple notification system

### Phase 2: Advanced Features
- AI-powered document analysis
- Continuity tracking tools
- Weather integration for outdoor shooting
- Equipment request and tracking system

### Phase 3: Integration and Expansion
- Integration with common film production software
- Advanced analytics and reporting
- Expanded mobile features with offline support
- API for third-party integrations

## Podsumowanie Ulepszenia Analizy Emocjonalnej

### Zaimplementowane Funkcjonalności

1. **Rozszerzony Analizator Emocji**
   - Implementacja rozpoznawania 8 podstawowych emocji (złość, radość, smutek, strach, zaskoczenie, obrzydzenie, zaufanie, oczekiwanie)
   - Własny słownik sentymentalny dla języka polskiego
   - Zaawansowana analiza składniowa tekstu dla lepszego zrozumienia emocji

2. **Analiza Kontekstu Scen**
   - Śledzenie trendów emocjonalnych między scenami
   - Identyfikacja głównych tematów i motywów
   - Ocena znaczenia narracyjnego scen w kontekście całego scenariusza

3. **Analiza Relacji Między Postaciami**
   - Identyfikacja interakcji między postaciami na podstawie dialogów
   - Klasyfikacja typów relacji (przyjacielska, napięta, wroga, neutralna)
   - Analiza siły i dominującej emocji w relacjach
   - Mapowanie wspólnych scen dla par postaci

4. **REST API dla Zaawansowanej Analizy**
   - Endpointy do analizy emocji scen: `/api/analysis/emotions/:scriptId/:sceneId`
   - Endpointy do analizy relacji: `/api/analysis/relationships/:scriptId`
   - Endpointy do analizy punktów zwrotnych: `/api/analysis/turningpoints/:scriptId`
   - Endpointy do analizy postaci: `/api/analysis/character/:scriptId/:characterName`
   - Pełna dokumentacja dostępna pod: `/api/docs`

### Przykłady Użycia

**Analiza Emocji w Scenie**
```json
{
  "sceneNumber": "15",
  "location": {
    "type": "NIEOKREŚLONY",
    "name": "PL. PARKING W OKOLICY STACJI BENZYNOWEJ"
  },
  "timeOfDay": "DZIEŃ",
  "analysis": {
    "emotions": {
      "anger": 1.0,
      "joy": 0.0,
      "sadness": 0.0,
      "fear": 0.0,
      "surprise": 0.19,
      "disgust": 0.0,
      "trust": 0.0,
      "anticipation": 0.0
    },
    "sentiment": {
      "score": 0.0,
      "sentiment": "neutralny",
      "intensity": 0.0
    },
    "context": {
      "emotionalTrend": "stabilny",
      "thematicAnalysis": {
        "dominantTheme": "conflict",
        "keywords": [
          { "word": "parking", "count": 3 },
          { "word": "autobusowego", "count": 2 },
          { "word": "samochody", "count": 2 }
        ]
      }
    }
  }
}
```

**Analiza Relacji Między Postaciami**
```json
{
  "scriptId": "DRUGA-FURIOZA",
  "relationships": [
    {
      "characters": ["GOLDEN", "MRÓWKA"],
      "type": "neutralna",
      "strength": 1.0,
      "sentiment": 0.0,
      "scenes": ["12", "15", "55", "89", "97", "118", "134", "164"],
      "dominantEmotion": "neutralna"
    },
    {
      "characters": ["MRÓWKA", "BAUER"],
      "type": "neutralna",
      "strength": 1.0,
      "sentiment": 0.0,
      "scenes": ["12", "16", "52", "54", "164"],
      "dominantEmotion": "neutralna"
    }
  ]
}
```

### Dalszy Rozwój

Planowane są następujące ulepszenia:

1. Integracja modeli uczenia głębokiego dla jeszcze dokładniejszej analizy emocjonalnej
2. Wizualizacja analizy emocjonalnej na wykresach i diagramach
3. Analizator fabuły i łuku dramatycznego scenariusza
4. Wykrywanie archetypów postaci na podstawie analizy dialogów i interakcji
5. Integracja z narzędziami preprodukcyjnymi (np. automatyczne generowanie dokumentów produkcyjnych)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - [your.email@example.com](mailto:your.email@example.com)

Project Link: [https://github.com/yourusername/film-production-assistant](https://github.com/yourusername/film-production-assistant)
