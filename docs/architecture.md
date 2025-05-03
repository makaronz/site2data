# Site2Data Architecture Documentation

This document provides a detailed overview of the Site2Data system architecture, including component diagrams, data flow diagrams, and sequence diagrams for key workflows.

## Architecture Diagram (Detailed)

The following diagram illustrates the detailed architecture of the Site2Data system, showing all components and their interactions:

```mermaid
graph TD
    subgraph "Frontend Layer"
        UI[SvelteKit UI]
        ReactUI[React UI]
        D3[D3.js Visualizations]
        ThreeJS[Three.js Visualizations]
    end

    subgraph "API Layer"
        API[Node.js/Express API]
        PythonAPI[Python/FastAPI]
        Auth[Authentication Service]
        Upload[File Upload Service]
        JobManager[Job Management Service]
    end

    subgraph "Worker Layer"
        JSWorker[JS Worker]
        PythonWorker[Python Worker]
        PDFExtractor[PDF Text Extractor]
        ScriptParser[Script Parser]
        EntityRecognizer[Entity Recognition]
        RelationExtractor[Relationship Extractor]
        EmbeddingGenerator[Embedding Generator]
    end

    subgraph "Infrastructure Layer"
        Redis[(Redis)]
        MongoDB[(MongoDB)]
        Weaviate[(Weaviate)]
        MinIO[(MinIO)]
        JobQueue[Job Queue]
        PubSub[Pub/Sub Messaging]
        Cache[Cache]
    end

    %% Frontend connections
    UI --> API
    UI --> D3
    UI --> ThreeJS
    ReactUI --> API
    ReactUI --> D3
    ReactUI --> ThreeJS

    %% API Layer internal connections
    API --> Auth
    API --> Upload
    API --> JobManager
    API --> PythonAPI

    %% API to Worker connections
    API --> JSWorker
    PythonAPI --> PythonWorker

    %% Worker internal connections
    JSWorker --> PDFExtractor
    JSWorker --> ScriptParser
    PythonWorker --> EntityRecognizer
    PythonWorker --> RelationExtractor
    PythonWorker --> EmbeddingGenerator

    %% Infrastructure connections
    Redis --> JobQueue
    Redis --> PubSub
    Redis --> Cache
    
    %% API to Infrastructure connections
    API --> Redis
    API --> MongoDB
    API --> MinIO
    PythonAPI --> Redis
    PythonAPI --> MongoDB
    PythonAPI --> Weaviate
    
    %% Worker to Infrastructure connections
    JSWorker --> Redis
    JSWorker --> MongoDB
    JSWorker --> MinIO
    PythonWorker --> Redis
    PythonWorker --> MongoDB
    PythonWorker --> Weaviate
    PythonWorker --> MinIO
    
    %% Component descriptions
    classDef frontend fill:#f9f,stroke:#333,stroke-width:1px
    classDef api fill:#bbf,stroke:#333,stroke-width:1px
    classDef worker fill:#bfb,stroke:#333,stroke-width:1px
    classDef infrastructure fill:#fbb,stroke:#333,stroke-width:1px
    
    class UI,ReactUI,D3,ThreeJS frontend
    class API,PythonAPI,Auth,Upload,JobManager api
    class JSWorker,PythonWorker,PDFExtractor,ScriptParser,EntityRecognizer,RelationExtractor,EmbeddingGenerator worker
    class Redis,MongoDB,Weaviate,MinIO,JobQueue,PubSub,Cache infrastructure
```

## Data Flow Diagram (Processing Pipeline)

The following diagram illustrates the data flow through the Site2Data processing pipeline, from script upload to visualization:

```mermaid
flowchart TD
    %% Input stage
    Upload[Script Upload] --> RawStorage[Raw File Storage]
    RawStorage --> TextExtraction[Text Extraction]
    
    %% Processing stage
    TextExtraction --> StructureParsing[Structure Parsing]
    StructureParsing --> SceneIdentification[Scene Identification]
    StructureParsing --> CharacterIdentification[Character Identification]
    StructureParsing --> DialogueExtraction[Dialogue Extraction]
    
    %% Analysis stage
    SceneIdentification --> SceneAnalysis[Scene Analysis]
    CharacterIdentification --> CharacterAnalysis[Character Analysis]
    DialogueExtraction --> DialogueAnalysis[Dialogue Analysis]
    
    SceneAnalysis --> RelationshipMapping[Relationship Mapping]
    CharacterAnalysis --> RelationshipMapping
    DialogueAnalysis --> RelationshipMapping
    
    %% Embedding stage
    SceneAnalysis --> EmbeddingGeneration[Embedding Generation]
    CharacterAnalysis --> EmbeddingGeneration
    DialogueAnalysis --> EmbeddingGeneration
    
    %% Storage stage
    RelationshipMapping --> StructuredStorage[Structured Data Storage]
    EmbeddingGeneration --> VectorStorage[Vector Database Storage]
    
    %% Retrieval stage
    StructuredStorage --> DataRetrieval[Data Retrieval API]
    VectorStorage --> SemanticSearch[Semantic Search API]
    
    %% Visualization stage
    DataRetrieval --> RelationshipVisualization[Relationship Visualization]
    DataRetrieval --> SceneVisualization[Scene Visualization]
    DataRetrieval --> CharacterVisualization[Character Visualization]
    SemanticSearch --> SemanticVisualization[Semantic Visualization]
    
    %% Output stage
    RelationshipVisualization --> UserInterface[User Interface]
    SceneVisualization --> UserInterface
    CharacterVisualization --> UserInterface
    SemanticVisualization --> UserInterface
    
    %% Styling
    classDef input fill:#f9f,stroke:#333,stroke-width:1px
    classDef processing fill:#bbf,stroke:#333,stroke-width:1px
    classDef analysis fill:#bfb,stroke:#333,stroke-width:1px
    classDef storage fill:#fbb,stroke:#333,stroke-width:1px
    classDef retrieval fill:#fbf,stroke:#333,stroke-width:1px
    classDef visualization fill:#bff,stroke:#333,stroke-width:1px
    
    class Upload,RawStorage input
    class TextExtraction,StructureParsing,SceneIdentification,CharacterIdentification,DialogueExtraction processing
    class SceneAnalysis,CharacterAnalysis,DialogueAnalysis,RelationshipMapping,EmbeddingGeneration analysis
    class StructuredStorage,VectorStorage storage
    class DataRetrieval,SemanticSearch retrieval
    class RelationshipVisualization,SceneVisualization,CharacterVisualization,SemanticVisualization,UserInterface visualization
```

## Sequence Diagrams for Key Workflows

### 1. Script Upload and Processing Workflow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Service
    participant Upload as Upload Service
    participant Storage as MinIO Storage
    participant Queue as Job Queue
    participant JSWorker as JS Worker
    participant PythonWorker as Python Worker
    participant DB as MongoDB
    participant VectorDB as Weaviate
    
    User->>UI: Upload Script File
    UI->>API: POST /api/scripts/upload
    API->>Upload: Process Upload
    Upload->>Storage: Store Raw File
    Upload->>Queue: Create Processing Job
    Upload->>API: Return Job ID
    API->>UI: Return Job ID
    
    Queue->>JSWorker: Assign Text Extraction Job
    JSWorker->>Storage: Retrieve Raw File
    JSWorker->>JSWorker: Extract Text
    JSWorker->>JSWorker: Parse Structure
    JSWorker->>DB: Store Extracted Structure
    JSWorker->>Queue: Update Job Status
    JSWorker->>Queue: Create Analysis Job
    
    Queue->>PythonWorker: Assign Analysis Job
    PythonWorker->>DB: Retrieve Extracted Structure
    PythonWorker->>PythonWorker: Identify Entities
    PythonWorker->>PythonWorker: Extract Relationships
    PythonWorker->>PythonWorker: Generate Embeddings
    PythonWorker->>DB: Store Analysis Results
    PythonWorker->>VectorDB: Store Embeddings
    PythonWorker->>Queue: Update Job Status
    
    UI->>API: Poll /api/jobs/{jobId}
    API->>Queue: Check Job Status
    Queue->>API: Return Job Status
    API->>UI: Return Job Status
    
    Note over User,UI: When job is complete
    
    UI->>API: GET /api/scripts/{scriptId}
    API->>DB: Retrieve Script Data
    DB->>API: Return Script Data
    API->>UI: Return Script Data
    UI->>User: Display Script Analysis
```

### 2. Search and Visualization Workflow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Service
    participant DB as MongoDB
    participant VectorDB as Weaviate
    
    User->>UI: Enter Search Query
    UI->>API: GET /api/search?q={query}
    
    alt Semantic Search
        API->>VectorDB: Perform Vector Search
        VectorDB->>API: Return Semantic Results
    else Structured Search
        API->>DB: Perform Structured Query
        DB->>API: Return Structured Results
    end
    
    API->>UI: Return Search Results
    UI->>User: Display Search Results
    
    User->>UI: Select Result for Visualization
    UI->>API: GET /api/scripts/{scriptId}/visualization
    API->>DB: Retrieve Visualization Data
    DB->>API: Return Visualization Data
    API->>UI: Return Visualization Data
    
    alt Relationship Visualization
        UI->>UI: Render Relationship Graph
    else Scene Visualization
        UI->>UI: Render Scene Timeline
    else Character Visualization
        UI->>UI: Render Character Network
    end
    
    UI->>User: Display Visualization
```

### 3. User Authentication and Script Management Workflow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Service
    participant Auth as Auth Service
    participant DB as MongoDB
    
    User->>UI: Enter Credentials
    UI->>API: POST /api/auth/login
    API->>Auth: Validate Credentials
    Auth->>API: Return JWT Token
    API->>UI: Return JWT Token
    UI->>UI: Store Token
    
    User->>UI: Request My Scripts
    UI->>API: GET /api/scripts (with Auth)
    API->>Auth: Validate Token
    Auth->>API: Return User ID
    API->>DB: Query User's Scripts
    DB->>API: Return Script List
    API->>UI: Return Script List
    UI->>User: Display Script List
    
    User->>UI: Select Script to Edit
    UI->>API: GET /api/scripts/{scriptId} (with Auth)
    API->>Auth: Validate Token
    Auth->>API: Return User ID
    API->>DB: Check Script Ownership
    API->>DB: Retrieve Script Data
    DB->>API: Return Script Data
    API->>UI: Return Script Data
    UI->>User: Display Script Editor
    
    User->>UI: Make Script Changes
    UI->>API: PUT /api/scripts/{scriptId} (with Auth)
    API->>Auth: Validate Token
    Auth->>API: Return User ID
    API->>DB: Check Script Ownership
    API->>DB: Update Script Data
    DB->>API: Confirm Update
    API->>UI: Return Success
    UI->>User: Display Success Message
```

## Component Responsibilities

### Frontend Layer

| Component | Responsibility |
|-----------|----------------|
| SvelteKit UI | Primary user interface for script upload, management, and visualization |
| React UI | Secondary interface for specialized visualization features |
| D3.js Visualizations | Data-driven visualizations for relationships and structures |
| Three.js Visualizations | 3D visualizations for complex script elements |

### API Layer

| Component | Responsibility |
|-----------|----------------|
| Node.js/Express API | Main API service handling client requests |
| Python/FastAPI | Specialized API for ML-specific operations |
| Authentication Service | User authentication and authorization |
| File Upload Service | Handling file uploads and validation |
| Job Management Service | Managing and tracking processing jobs |

### Worker Layer

| Component | Responsibility |
|-----------|----------------|
| JS Worker | Processing jobs for text extraction and basic analysis |
| Python Worker | Advanced ML processing and analysis |
| PDF Text Extractor | Extracting text from PDF files |
| Script Parser | Parsing script structure and elements |
| Entity Recognition | Identifying entities in script text |
| Relationship Extractor | Determining relationships between entities |
| Embedding Generator | Creating vector embeddings for semantic analysis |

### Infrastructure Layer

| Component | Responsibility |
|-----------|----------------|
| Redis | Caching, pub/sub messaging, and job queues |
| MongoDB | Primary document storage |
| Weaviate | Vector database for semantic search |
| MinIO | Object storage for raw files |
| Job Queue | Managing processing jobs |
| Pub/Sub Messaging | Communication between components |
| Cache | Caching frequently accessed data |

## Technology Stack Details

| Layer | Technologies | Description |
|-------|--------------|-------------|
| Frontend | SvelteKit, React, D3.js, Three.js | Modern web frameworks for responsive UI and data visualization |
| API | Node.js, Express, FastAPI, JWT | REST APIs for client communication with authentication |
| Workers | Node.js, Python, spaCy, Hugging Face Transformers | Processing engines for text analysis and ML tasks |
| Infrastructure | Redis, MongoDB, Weaviate, MinIO | Data storage and messaging services |

## Communication Protocols

| Protocol | Usage | Components |
|----------|-------|------------|
| REST API | Client-server communication | Frontend ↔ API |
| WebSockets | Real-time updates | Frontend ↔ API |
| Redis Pub/Sub | Inter-service messaging | API ↔ Workers |
| MongoDB Queries | Data retrieval and storage | API ↔ MongoDB, Workers ↔ MongoDB |
| Vector Queries | Semantic search | API ↔ Weaviate, Workers ↔ Weaviate |
| S3 Protocol | File storage and retrieval | API ↔ MinIO, Workers ↔ MinIO |

## Deployment Architecture

The system is designed for containerized deployment using Docker and Docker Compose:

```mermaid
graph TD
    subgraph "Docker Compose Environment"
        subgraph "Frontend Containers"
            SvelteContainer[SvelteKit Container]
            ReactContainer[React Container]
            NginxContainer[Nginx Container]
        end
        
        subgraph "API Containers"
            NodeAPIContainer[Node.js API Container]
            PythonAPIContainer[Python API Container]
        end
        
        subgraph "Worker Containers"
            JSWorkerContainer[JS Worker Container]
            PythonWorkerContainer[Python Worker Container]
        end
        
        subgraph "Infrastructure Containers"
            RedisContainer[Redis Container]
            MongoContainer[MongoDB Container]
            WeaviateContainer[Weaviate Container]
            MinIOContainer[MinIO Container]
        end
    end
    
    NginxContainer --> SvelteContainer
    NginxContainer --> ReactContainer
    NginxContainer --> NodeAPIContainer
    NginxContainer --> PythonAPIContainer
    
    SvelteContainer --> NodeAPIContainer
    ReactContainer --> NodeAPIContainer
    NodeAPIContainer --> JSWorkerContainer
    NodeAPIContainer --> PythonAPIContainer
    PythonAPIContainer --> PythonWorkerContainer
    
    JSWorkerContainer --> RedisContainer
    PythonWorkerContainer --> RedisContainer
    NodeAPIContainer --> RedisContainer
    PythonAPIContainer --> RedisContainer
    
    JSWorkerContainer --> MongoContainer
    PythonWorkerContainer --> MongoContainer
    NodeAPIContainer --> MongoContainer
    PythonAPIContainer --> MongoContainer
    
    JSWorkerContainer --> WeaviateContainer
    PythonWorkerContainer --> WeaviateContainer
    NodeAPIContainer --> WeaviateContainer
    PythonAPIContainer --> WeaviateContainer
    
    JSWorkerContainer --> MinIOContainer
    PythonWorkerContainer --> MinIOContainer
    NodeAPIContainer --> MinIOContainer
    PythonAPIContainer --> MinIOContainer
```

## Security Architecture

```mermaid
graph TD
    subgraph "Security Components"
        Auth[Authentication Service]
        JWT[JWT Token Service]
        RBAC[Role-Based Access Control]
        APIGateway[API Gateway]
        Encryption[Data Encryption]
        Firewall[Network Firewall]
    end
    
    User((User)) --> APIGateway
    APIGateway --> Auth
    Auth --> JWT
    JWT --> RBAC
    
    APIGateway --> API[API Services]
    RBAC --> API
    
    API --> Encryption
    Encryption --> Storage[(Data Storage)]
    
    Firewall --> APIGateway
    Firewall --> API
    Firewall --> Storage
    
    classDef security fill:#f96,stroke:#333,stroke-width:1px
    classDef external fill:#69f,stroke:#333,stroke-width:1px
    
    class Auth,JWT,RBAC,APIGateway,Encryption,Firewall security
    class User external
```

## Scalability Considerations

- **Horizontal Scaling**: Worker components can be scaled horizontally to handle increased processing load
- **Load Balancing**: API services are designed to work behind load balancers
- **Database Sharding**: MongoDB can be sharded for improved performance with large datasets
- **Caching Strategy**: Redis caching is used for frequently accessed data
- **Stateless Design**: API services are stateless to facilitate scaling
- **Resource Isolation**: Each component runs in its own container with dedicated resources

## Monitoring and Logging

- **Centralized Logging**: All components send logs to a centralized logging service
- **Performance Metrics**: Key performance indicators are tracked for each component
- **Health Checks**: Regular health checks ensure system stability
- **Alerting**: Automated alerts for system issues
- **Tracing**: Distributed tracing for request flows across components

## Disaster Recovery

- **Data Backups**: Regular backups of all databases
- **Redundancy**: Critical components have redundant instances
- **Failover**: Automatic failover for infrastructure components
- **Recovery Procedures**: Documented procedures for system recovery
- **Data Integrity**: Checksums and validation to ensure data integrity
