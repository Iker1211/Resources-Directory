---
id: concept_vector_indexes
type: Instance
description: Data structures that enable efficient approximate nearest neighbor (ANN) search in high-dimensional vector spaces, critical for similarity-based retrieval in AI systems.
part_of: [[LinearAlgebra]]
---
# Vector Indexes

**Part of:** [[LinearAlgebra]]

Vector indexes are the core infrastructure for similarity search in production AI systems. HNSW (Hierarchical Navigable Small World) graphs are the most widely used algorithm, relying on graph topology and distance metrics in vector space.

## Algorithms

- **HNSW** — Hierarchical Navigable Small World graphs (multi-layer navigable graphs)
- IVF — Inverted File Index (cluster-based partitioning)
- PQ — Product Quantization (compressed vector representations)

## Applications in Agentic AI

- Retrieval-Augmented Generation (RAG) knowledge retrieval
- Semantic search and document similarity
- Agent memory and episodic recall

## Mathematical Foundations

- Distance metrics: L2 (Euclidean), cosine similarity, dot product
- Graph navigation in high-dimensional spaces
- Dimensionality reduction via SVD/PCA

## Related Concepts

- [[VectorSpaces]]
- [[SingularValueDecomposition]]
- [[GraphTopologies]]