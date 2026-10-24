# Aetheris market research and $0 scenario model

**Date:** 23 October 2026  
**Status:** hypothesis, not a forecast, valuation, customer interview, or procurement signal.  
**Decision:** sell a narrow evidence-to-decision workflow to one type of multi-site operator before selling a global intelligence platform.

## What the product would sell

**Buyer hypothesis:** a director of business continuity, emergency operations, or physical security responsible for several U.S. facilities. The first likely customers are mid-sized utilities, logistics operators, industrial campuses, or regional infrastructure firms that can provide their own permitted site and asset list. This is a hypothesis; the repository has no verified buyer or paid pilot.

**Job:** after a severe-weather alert or other permitted observation, identify affected sites, inspect the source and age of each signal, record a human decision, and export a replayable brief. The product is a workflow subscription with a customer-specific setup, not a feed resale, automated threat verdict, or 3D world-model sale.

**Current deliverable:** the authenticated Aetheris pilot can import observations, display provenance, build a bounded U.S. terrain scene, and replay/export decisions. The richer Cesium viewer remains a separate prototype. Flights, CCTV, and commercial cable data remain rights-gated; the remote pilot and restore/load gates remain open. See [README](README.md), [release gates](RELEASE_GATE_CHECKLIST.md), and [startup scorecard](STARTUP_BUILDABILITY_SCORECARD.md).

**Likely economic buyer:** the manager who pays for continuity or incident-response tools; **daily user:** analyst or duty officer. The buying process and budget authority must be checked in interviews.

## Market evidence and competition

| Evidence | What it supports | What it does not prove |
| --- | --- | --- |
| [DOE reports that 14 states and one city required utility resilience plans as of June 2024](https://www.energy.gov/sites/default/files/2024-11/Reliability%2C%20Resilience%20and%20Risk.pdf). | Resilience planning is a real, recurring function for some utilities. | That any utility needs or will buy Aetheris. |
| [Esri emergency-management tools](https://www.esri.com/en-us/industries/emergency-management/solutions/situational-awareness) ingest weather and sensor information and provide dashboards, impact assessment, and field coordination. | GIS visualization and live layers are established capabilities. | That Aetheris is technically superior. |
| [Everbridge Visual Command Center](https://www.everbridge.com/products/visual-command-center/) combines risk intelligence, assets, mapping, assessment, and response. | Enterprise risk workflows already have serious incumbents. | That an incumbent's price or feature gap creates a reachable market. |
| [FEMA RAPT is a free public resilience planning GIS tool](https://preptoolkit.fema.gov/web/hazard-explorer). | A map and public hazards alone are weak paid differentiation. | That a provenance and decision workflow lacks value. |
| The [Aetheris startup scorecard](STARTUP_BUILDABILITY_SCORECARD.md) records no signed pilot, paid contract, repeatable customer study, or procurement sponsor. | Commercial traction is unverified. | That demand is zero. |

**Potential differentiation to test:** shorter time from an alert to a documented decision; clearer source/age/rights handling; easier import of a customer's permitted assets; simpler deployment and export than a broad platform. These are testable propositions, not established advantages. A globe or a larger layer catalog is not a moat.

## Segment choice

| Segment | Workflow fit | Sales friction | First move |
| --- | --- | --- | --- |
| Multi-site private operators | High if a duty team already reconciles weather, facilities, and incident notes | Medium: security review, budget owner, existing vendor | **First discovery target.** Seek one recurring event-review workflow with customer-permitted site data. |
| Electric utilities and cooperatives | High potential need for weather and resilience planning | High: OT separation, regulated procurement, integration, incumbent GIS | Interview, then pursue a narrowly scoped design partner. Do not imply operational grid readiness. |
| Counties and emergency managers | Clear public mission | High: budget cycles and free FEMA/Esri alternatives | Explore only where current reporting is painful and an authorized sponsor exists. |
| Defense bases and primes | Possible fit for unclassified base resilience | Very high: access, security, contracting, data rights | Later channel or pilot, after a commercial workflow is proven. |

The U.S. has thousands of potential facilities and agencies, but their number is **not** an addressable-market estimate. No sourced count establishes how many have this exact pain, budget, permitted data, or a buying path. Do not multiply all sites by an assumed license price and call it TAM.

## Pricing hypothesis and buyer value

Prices below are **proposed test offers**, not observed competitor prices or validated willingness to pay:

| Offer | Proposed price | Scope and commercial purpose |
| --- | ---: | --- |
| Paid discovery pilot | $5,000 one time, 4–6 weeks | One site group, one hazard workflow, one permitted asset import, baseline comparison, written outcome; capped support. |
| Small team | $12,000/year | One organization, bounded site count and public feeds, decision history and export, standard support. |
| Multi-site team | $24,000/year | Several sites, one customer adapter, role-based reviews and repeatable reports. |
| Enterprise/custom | Quote only; $48,000/year is a **scenario**, not a published price | Requires verified security, availability, data rights, support, and integration scope that the current pilot does not yet satisfy. |

**Time-savings threshold:** at a hypothetical $75/hour loaded labor cost and 30% time reduction, a $24,000 annual subscription needs to save about **20.5 team-hours per week** to break even on labor alone: `24,000 / (75 × 0.30 × 52)`. If a buyer spends only ten hours per week on the task, 30% savings are about $11,700/year; the $24,000 offer needs another demonstrated benefit or a lower price. Avoid claiming prevented disaster losses without a defensible causal study.

Interview questions should determine current hours, frequency, error/rework cost, tool spend, site count, approval path, and value of an auditable report. Ask for a recent redacted example and permission to time the existing workflow.

## Unit economics model

All figures in this section are **planning assumptions** in USD, not vendor quotes. The $0 OCI pilot is for evaluation; a paying customer needs a separately costed environment and service level. Third-party data licensing, insurance, sales travel, and procurement costs are excluded because they are unknown.

| Annual direct cost per $24k customer | Assumption |
| --- | ---: |
| Hosting, backups, monitoring | $2,400 |
| Support: 4 hours/month × $75/hour | $3,600 |
| Security/maintenance allocation | $1,200 |
| **Modeled direct cost** | **$7,200** |
| **Modeled gross profit / margin** | **$16,800 / 70%** |

A $5,000 paid pilot with 40 hours of setup at $75/hour leaves $2,000 before travel, legal, and sales. A customer-specific adapter or data license could erase that contribution. Track actual support hours and charge separately for custom integration.

At the same $7,200 direct annual cost, a $12k contract has 40% modeled gross margin; $24k has 70%; $36k has 80%. If fixed annual company costs are hypothetically $250,000, operating break-even needs roughly **53, 15, or 9** active customers at those respective prices, before tax and financing costs. These are arithmetic thresholds, not a business forecast.

| Active customers | ARR at $24k each | Gross profit at modeled 70% |
| ---: | ---: | ---: |
| 5 | $120,000 | $84,000 |
| 15 | $360,000 | $252,000 |
| 50 | $1,200,000 | $840,000 |
| 200 | $4,800,000 | $3,360,000 |

Fifteen retained customers at $24k could support a small company under this simplified model. Reaching fifty would require a repeatable sales channel and low-customization onboarding. The repository provides no evidence yet that either is attainable. Funding and acquisition value cannot be derived from these rows.

## MiroFish: what was and was not run

The local checkout at `~/Developer/MiroFish` is available. Its official run path requires both an LLM service and Zep Cloud; the local configuration has LLM settings but **no `ZEP_API_KEY`**, so an end-to-end MiroFish run was not performed. The upstream [configuration](https://github.com/666ghj/MiroFish/blob/main/.env.example) and [maintainer FAQ](https://github.com/666ghj/MiroFish/issues/726) confirm those separate dependencies. Given the project's $0 limit, this research does not start a metered simulation or provision a paid service.

The existing `scripts/aetheris_swarm_evaluator.py` is **not** an official MiroFish run: it calls an OpenAI-compatible API directly, role-plays invented personas, and prompts for high scores, purchase intent, and revenue predictions. Its `AETHERIS_SWARM_PREDICTION_REPORT_V3.md` must not be used as demand, customer, or valuation evidence.

### MiroFish-style adversarial scenarios to run once a genuinely free, configured engine is available

Seed only with the current README, release gates, this pricing model, and sourced competitor descriptions. Prohibit invented buyers, classified access, endorsements, contract amounts, and procurement probabilities. Run each scenario with a buyer, an end user, an incumbent-tool defender, an IT/security reviewer, and a skeptical finance lead:

1. **Severe-weather decision at five facilities:** Will the team adopt a $5k pilot when its alternative is email + Esri/FEMA + spreadsheet?
2. **Low-frequency events:** What happens when the task consumes only 5–10 hours/week and cannot justify $24k/year through labor savings?
3. **Data-rights failure:** Can the product still create value when flight, camera, or cable feeds are unavailable?
4. **Incumbent integration:** Would the buyer prefer an export or plugin for its existing GIS/incident system over a new dashboard?
5. **Security/procurement delay:** What proof is required before a multi-site operator imports facility locations?

**Interpretation rule:** agent arguments are a checklist of objections and interview questions. An agent consensus, score, or simulated purchase order is not a measured win rate or customer commitment. Only external interviews, timed tasks, paid pilots, and retention can update the commercial estimate.

## 30-day evidence plan and decision gates

1. Interview 15 people across one selected segment, including at least five budget or procurement participants. Record role, current task, hours, tool stack, data rights, and whether the problem recurs.
2. Ask at least five operators to complete a redacted real-world task with their current process and Aetheris. Predefine time, missed evidence, stale-signal errors, and report quality; record failures.
3. Offer a bounded $5k pilot to two qualified organizations. An offer or refusal is price evidence; a signed scope and payment are stronger evidence. Do not treat polite interest as a deal.
4. Measure integration time and support hours. Refresh pricing and gross margin with actual data.

**Continue** if at least five interviewees independently describe the same costly task, at least two offer permitted follow-up data, and one sponsor agrees to a scoped pilot or a concrete procurement path. **Reposition** if the strongest demand is for a small component inside an incumbent tool. **Stop or pivot** if users like the globe but cannot identify a recurring decision, data permission, or budget owner.

## Current verdict

Aetheris is a real software prototype with a plausible commercial wedge, but its **market size, willingness to pay, sales cycle, and retention are unmeasured**. The immediate business risk is customer demand and trust, not rendering capability. The next dollar of effort should buy evidence about one workflow and one buyer, rather than more layers or a simulated market-adoption score.
