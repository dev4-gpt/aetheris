# Aetheris defense startup readiness review

**Reviewed:** 11 October 2026
**Decision:** promising visualization and scenario prototyping; not yet a validated defense product or funding-ready proof of Army integration.

## The focused thesis

Start with **base resilience planning and interoperable sensor visualization**: give installation and test-range teams a browser-based way to combine permitted sensor feeds, map blind spots, compare assumptions, rehearse logistics disruptions, and export reviewable observations. Keep any counter-UAS engagement sequence as a clearly labeled simulation. This is a narrower, testable entry point than claiming a complete sensor-to-shooter system, interceptor hardware, factory, or operational Army connection.

The [YC request for startups](https://www.ycombinator.com/rfs) asks for low-cost interceptors or components that lower cost per kill, next-generation sensors and software, modular interfaces, resilient logistics, and performance in extreme environments. It is an invitation to build in those areas, not an acceptance criterion or funding commitment. Aetheris can plausibly address the **sensor/software and planning** portion if customer discovery and integration tests support it.

## What the repository currently proves

| Area | Evidence in this repository | Present conclusion | Evidence needed before an external claim |
| --- | --- | --- | --- |
| 3D geospatial UI | Running browser application and static defense demo | Demonstrable UI prototype | Operator study and measured task results against a baseline |
| Scenario modules | Deterministic JavaScript agents and a passing focused test suite | Logic behaves as coded for synthetic inputs | Real data provenance, calibration, uncertainty bounds, and independent scenario review |
| Observation evidence panel | Local GeoJSON and SensorThings-style import, source/rights/age review, JSON report | Working prototype with user-declared metadata | Permissioned feed, source authentication, data rights review, and operator study |
| Modular registry | `mosaAdapterAgent.js` checks metadata strings and exports JSON | Demo catalog, not interface integration | Published interface contracts, working adapters, conformance tests, and a third-party module swap |
| Environment model | Hard-coded theater profiles in `extremeClimateAgent.js` | Illustrative assumptions | Relevant measured data and test reports for a defined system and environment |
| Costs | Constants in `fireControlAgent.js` and UI | Scenario inputs, not unit economics or cost per kill | Quotes/BOM, all-in lifecycle costs, effectiveness measurements, and comparable mission conditions |
| Logistics | In-memory state transitions in `contestedLogisticsAgent.js` | Browser simulation | Hardware/partner evidence, production yield, flight/test data, and supply-chain validation |
| Readiness | Test suite and build support software prototype | No TRL 7 evidence found in repo | Prototype demonstration in an operational environment and test report |
| Buyer traction | No signed pilot, budget owner, or contract artifact found in repo | Unknown outside this repository | Interview notes, partner permission, pilot agreement, and budget path |

**Assessment:** RFS topic relevance is **moderate**; evidence for deployment, interoperability, economics, and buyer demand is **low**. The earlier “80% covered / 100% alignment” assessment is not supportable from code coverage. Passing unit tests show that coded assumptions produce expected outputs; they do not establish Army compliance, field readiness, performance, or customer demand.

## Claims to retire until demonstrated

- **“TRL 7.”** DoD describes TRL 7 as a system prototype demonstrated in an operational environment. A browser demo and unit tests do not meet that bar. [DoD technology readiness descriptions](https://www.acq.osd.mil/eie/eer/ecc/pfas/docs/reports/Nonincineration-RTC.pdf).
- **“MOSA / SOSA / IBCS / FAAD C2 compliant” or “plug-and-play.”** The current registry verifies strings and a `vendorLockIn` flag. The Army explains that MOSA claims are program-specific and require defined interfaces and verification; an Army conformance example included independent hardware/software replacement. [Army MOSA guidance](https://www.army.mil/article/268818), [Army evaluation example](https://www.army.mil/article-amp/279556/the_armys_future_tactical_uncrewed_aircraft_system_program_achieves_two_major_milestones).
- **“MIL-STD-810H rated,” exact environmental survival, or operational PNT fallback.** A standard named in code is a reference, not a qualification report. Keep profile values marked as uncalibrated assumptions.
- **“$0.05 / $1.50 / $4,800 per kill” and “99.85% savings.”** These are hard-coded per-event prices compared with a different weapon class. A cost-per-kill comparison needs observed probability of success and full system costs under the same mission conditions.
- **Named vendor integration and manufacturing claims.** Example module IDs and the simulated factory/drone are not evidence of commercial agreements, delivered devices, or tested production capability.
- **“DoD,” “US Army,” and “YC” badges implying endorsement.** Refer to the public RFS as inspiration only, unless the organization gives explicit permission for a stronger claim.

## Investor-ready wedge: proof gates

1. **Customer problem (weeks 1–3):** Interview at least 15 authorized installation, range, infrastructure, or integrator users. Record the current workflow, decision frequency, existing tools, data restrictions, and budget owner. Seek a repeated, costly pain that the globe actually reduces.
2. **Single workflow (weeks 2–6):** Build one permitted sensor-to-map pipeline with a documented interface, replayable test fixture, stale-data handling, provenance, and clear separation of live, delayed, and synthetic layers. Measure ingest latency, availability, and operator task time. Avoid expanding the engagement simulator as the initial sellable product.
3. **Open interface evidence (weeks 4–8):** Publish a versioned schema and adapter contract; have an independent partner replace one mock feed without modifying the UI. Store test logs and interface limitations. Describe this as a modular prototype until a program-specific review is complete.
4. **Operational validation (weeks 6–12):** Run a permissioned tabletop or range observation with a prospective user. Pre-register success criteria: task completion, false/missing signal handling, alert usefulness, and setup time. Record failures and repeatability. Do not assign a TRL from unit tests.
5. **Commercial proof (parallel):** Obtain a written pilot scope, data rights, security requirements, procurement route, and named sponsor. Estimate customer value from measured time saved or errors prevented. Track actual hosting, integration, support, and licensing costs.

## Immediate pitch language

> **Aetheris is an early browser-based geospatial planning prototype for base resilience teams.** It combines public or permissioned feeds in a 3D view and tests modular workflows with explicit data provenance. Our current defense scenarios are simulations. We are seeking design partners to validate a specific sensor-visualization workflow, measure operator value, and prove an open interface with third-party data.

Use the public demo to show interaction design and systems thinking. Show a separate evidence appendix with dated tests, source licenses, customer findings, and clearly marked assumptions. Do not present simulated engagements as field outcomes.

## Repository and business diligence

- The geospatial base is derived from the upstream God's Eye View project; keep its license and attribution, identify original Aetheris work precisely, and review commercial rights for each data source, model, imagery provider, and brand. See `gods-eye-view/LICENSE`, `gods-eye-view/DATA_SOURCES.md`, and `gods-eye-view/docs/media/README.md`.
- The main README currently mixes the upstream product story with Aetheris claims, which obscures ownership and the sellable wedge. A future pitch site should separate upstream capability, original code, and validated product results.
- Collect source-of-truth evidence outside this public repository for customer conversations and any restricted information. Publish only artifacts the parties permit.

## Release rule for external claims

For every numerical, standards, partner, or operational statement, keep a claim ledger with: exact wording, owner, evidence URL or file, date, test environment, assumptions, limitations, and approval for public use. If a field is missing, label the statement **hypothesis**, **simulation**, or **target**. Update the demo and pitch together when evidence changes.
