---
id: mathematical_module
type: Class
superclass: [[ComputationalMathematics]]
description: Abstract class representing a core mathematical subject area with structured curriculum, typically associated with MIT Course 18 or Course 6 nomenclature.
---
# MathematicalModule

**Superclass:** [[ComputationalMathematics]]

An abstract class representing a formal mathematical discipline. Each module has an associated MIT course code and may serve as a prerequisite for other modules.

## Subclasses

- [[DiscreteMathematics]]
- [[LinearAlgebra]]
- [[ProbabilisticSystems]]

## Properties

| Property | Type | Cardinality |
|----------|------|-------------|
| mit_course_code | String | Single |
| has_prerequisite | Instance (MathematicalModule) | Multiple |
| underpins_market_skill | Instance (MarketCompetency) | Multiple |