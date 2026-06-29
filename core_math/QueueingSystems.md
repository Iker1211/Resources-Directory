---
id: concept_queueing
type: Instance
description: Mathematical models for analyzing systems where customers arrive, wait in queues, and receive service, characterized by arrival processes, service distributions, and queue disciplines.
part_of: [[ProbabilisticSystems]]
---
# Queueing Systems

**Part of:** [[ProbabilisticSystems]]

Queueing theory models systems using Kendall's notation A/S/c/K/N/D where A is the arrival process, S the service distribution, c the number of servers, and optional limits on queue capacity (K), population (N), and discipline (D).

## Key Models

- **M/M/1** — Poisson arrivals, exponential service, single server
- **M/M/c** — Poisson arrivals, exponential service, multiple servers
- **M/G/1** — Poisson arrivals, general service, single server

## Applications in Multi-Cloud

- Request queueing in load balancers (ALB, NLB, HAProxy)
- Auto-scaling policies based on queue depth metrics
- Message queue performance modeling (SQS, Kafka, Pub/Sub)
- Throttling and rate limiting algorithms

## Applications in Agentic AI

- Agent request queuing and prioritization
- Token generation rate management in LLM serving

## Related Concepts

- [[MarkovDecisionProcesses]]