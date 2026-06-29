---
id: concept_mdp
type: Instance
description: A mathematical framework for modeling decision-making where outcomes are partly random and partly under the control of a decision maker, defined by states, actions, transition probabilities, and rewards.
part_of: [[ProbabilisticSystems]]
---
# Markov Decision Processes (MDPs)

**Part of:** [[ProbabilisticSystems]]

An MDP is defined by the tuple (S, A, P, R, γ) where S is the set of states, A the set of actions, P the transition probability function, R the reward function, and γ the discount factor. MDPs are solved via dynamic programming (value iteration, policy iteration) or reinforcement learning.

## Applications in Agentic AI

- Agent planning and decision-making under uncertainty
- Reinforcement learning for tool-use optimization
- Dialogue management and task completion strategies

## Applications in Multi-Cloud

- Autoscaling decisions as a stochastic control problem
- Cost optimization under uncertain demand
- Resource scheduling and allocation policies

## Related Concepts

- [[BayesTheorem]]
- [[QueueingSystems]]