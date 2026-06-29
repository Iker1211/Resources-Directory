---
id: concept_consensus
type: Instance
description: Algorithms that enable multiple distributed nodes to agree on a single data value or system state despite failures and network partitions, critical for fault-tolerant distributed systems.
part_of: [[DiscreteMathematics]]
---
# Distributed Consensus Algorithms

**Part of:** [[DiscreteMathematics]]

Consensus algorithms solve the problem of agreement in distributed systems, drawing on graph theory, fault tolerance models, and discrete mathematics for proof of correctness.

## Key Algorithms

- **Paxos** — Classic consensus protocol (Leslie Lamport)
- **Raft** — Understandable consensus protocol (log replication)
- **PBFT** — Practical Byzantine Fault Tolerance
- **Zab** — Zookeeper Atomic Broadcast

## Applications in Multi-Cloud

- Distributed database replication (etcd, Consul, ZooKeeper)
- Leader election in high-availability clusters
- Configuration management and service discovery

## Mathematical Foundations

- Graph connectivity and quorum theory
- Formal verification of safety and liveness properties
- Byzantine fault models and threshold cryptography

## Related Concepts

- [[GraphTopologies]]
- [[DirectedAcyclicGraphs]]