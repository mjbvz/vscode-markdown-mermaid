```mermaid
flowchart-elk RL
  %% this doted arrow is not crossing
  FirestoreRepository -.-> Repository
  subgraph domain
    Repository
  end
  subgraph architecture
    documentSchema --> DocumentDTO
    FirestoreRepository
  end
```