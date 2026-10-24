# Aetheris startup buildability scorecard

**Assessment date:** 23 October 2026  
**Decision today:** Buildable as a focused *unclassified base resilience decision workflow*; an investable company, a Palantir competitor, and an acquisition candidate are **unproven**. This is a decision framework, not a valuation or a prediction of funding.

## The customer outcome to test

God's Eye View is already the repository's richer Cesium globe. The [Aetheris integration decision](GODS_EYE_AETHERIS_INTEGRATION.md) makes it the candidate 3D viewer for this workflow, fed by the authenticated gateway after a rights-cleared, bounded build. This lowers viewer engineering effort; it does not replace customer validation.

For one installation, test range, or critical infrastructure team, answer a recurring disruption question: **Which facilities or access routes need human review after a public event or a permitted local observation, what evidence supports that decision, and what changed since the last review?** Aetheris should ingest a rights-cleared observation, show source and age, compare it with a grounded area and an explicitly synthetic scenario, and export a decision record the team can replay.

The buyer is the person who owns this workflow and a budget, not everyone who likes a globe. First discover whether that person exists, how often the decision occurs, what they use today, what errors or delays cost them, and which data they may legally provide. Ask users to show a recent redacted decision and its current toolchain. Do not collect classified or restricted data for this discovery.

## Present evidence and gaps

| Question | Evidence today | Verdict |
| --- | --- | --- |
| Can a usable prototype be built at $0? | The gateway authenticates users, records provenance, shows public feeds, builds a bounded elevation scene, and saves/replays exports. The repository has passing automated tests. | **Yes, for local unclassified evaluation.** External providers can fail; $0 hosting has capacity and uptime limits. |
| Is there a repeatable customer pain? | No permitted interview notes, workflow baseline, or named budget owner are in the repository. | **Unknown.** This is the primary startup risk. |
| Does the product improve a decision? | No study compares Aetheris with an operator's current workflow. | **Unknown.** UI polish and feed count are not outcome evidence. |
| Can it integrate with customer data? | Public and user-declared imports work; an independent third-party adapter swap has not been demonstrated. | **Partly.** Need a permissioned source, contract, and conformance test. |
| Can it be deployed for a customer? | Local gateway and OCI pilot instructions exist. The required remote pilot, restore drill, sustained Arm test, and security review are not complete. | **Not yet proven.** See [release gates](RELEASE_GATE_CHECKLIST.md). |
| Are data and IP transferable? | Observation rights are recorded; flights, CCTV, and cables remain gated. The older console includes third-party components and noncommercial cable data. | **Unproven for diligence.** Create a component, dataset, and contributor rights inventory before any commercial license or sale. |
| Is there commercial traction? | No signed pilot, paid contract, recurring revenue, or procurement sponsor is evidenced here. | **None verified.** Do not imply traction from GitHub activity. |

## Position relative to Palantir

Palantir already markets defense data integration, AI workflows, secure deployment, and third-party application hosting through Gotham, Foundry, AIP, Maven, and Mission Manager. A [2025 Army contract announcement](https://www.defense.gov/News/Contracts/Contract/Article/4194643/) reports a $795 million modification for Maven software licenses; that establishes an entrenched supplier and demand for the category, **not** Aetheris's addressable revenue. See [Palantir's defense offering](https://www.palantir.com/offerings/defense/air-space) and [2025 Form 10-K](https://investors.palantir.com/files/2025%20FY%20PLTR%2010-K.pdf).

The practical first comparison is the customer's **actual current process**: spreadsheets, email, GIS, dashboards, or an existing Palantir workflow if they use one. Aetheris should win a bounded task on setup time, evidence quality, portability, or cost measured by that customer. A globe, more toggles, generic AI, and copied open-source feeds are easy to reproduce and are not durable differentiation.

Three viable outcomes can be tested without assuming an exit:

1. **Independent niche product:** A team repeatedly pays for a narrow resilience workflow that works with its permitted data and deployment constraints.
2. **Integrating component or partner:** Aetheris becomes a useful adapter, audit, or replay module within an incumbent or prime contractor's environment. Palantir explicitly supports third-party applications in Mission Manager, but access and a partner relationship must be established; this is an inference from its published offering, not an agreement.
3. **Acquisition candidate:** A buyer may value proven customer access, proprietary workflow know-how, trusted integration, defensible software, or contracts. An attractive demo alone does not establish a reason to acquire rather than build or partner. There is no evidence of Palantir interest.

## Ninety-day falsifiable experiment

The thresholds below are **Aetheris decision rules proposed for this project**, not industry benchmarks or promises. Record dates, anonymized notes, failures, and permission to use each artifact. Keep sensitive customer material outside the public repository.

| When | Experiment and measurement | Continue criterion | Stop or change direction if |
| --- | --- | --- | --- |
| Days 1–21 | Interview 15 authorized prospective users, including at least 5 people involved in budget or procurement. Ask for the last real decision, frequency, time spent, data source, mistakes, security requirements, and existing tools. | At least 5 independently describe the same costly recurring task; at least 2 offer a follow-up using their own permitted example; identify one credible budget owner. | Interest centers on the visual demo but no repeated task or owner emerges. |
| Days 15–45 | Freeze one workflow and a baseline. Have at least 5 representative users complete comparable redacted tasks with the current process and Aetheris. Measure elapsed time, correct evidence selection, stale/false signal handling, and export usability. | Median task time improves by at least 25%, with no increase in critical evidence omissions; participants can identify synthetic and forecast records correctly. | Time gains come from skipping verification, or users cannot trust the provenance. |
| Days 30–60 | Connect one permissioned customer or partner dataset using a documented adapter contract. Ask an external implementer to perform the swap without editing the viewer. | Adapter passes fixture/outage/rights tests; independent integration completes within one working day; customer can replay a decision. | Integration requires bespoke changes throughout the app, or rights are unclear. |
| Days 45–90 | Agree on a written pilot scope with a named sponsor and budget path. Log full costs: hosting, ingestion, mapping rights, integration time, security work, support, and procurement overhead. Run a restore and load test in the intended environment. | Sponsor confirms a real evaluation, success metrics, data rights, and a plausible purchasing route; delivered value exceeds the estimated ongoing cost. | No sponsor, no lawful data, no deployable security path, or no willingness to pay. |

At day 90, make a written **go / pivot / stop** decision. A go requires customer pain, measured task improvement, permitted integration, a sponsor, and viable unit economics together. Passing software tests alone does not satisfy it.

## Funding and acquisition evidence packet

- **Problem:** anonymized interview synthesis, current-workflow diagram, decision frequency, and named buyer role.
- **Outcome:** pre-registered task protocol, baseline and Aetheris results, errors, and participant feedback.
- **Integration:** versioned observation contract, independent adapter report, rights and attribution for each source.
- **Operations:** deployment architecture, threat model, security review, backup/restore result, availability and cost measurements.
- **Commercial:** written pilot scope, sponsor, budget/procurement route, pricing hypothesis, cost-to-serve, and permitted references.
- **Diligence:** software bill of materials, open-source licenses, dataset/model rights, contributor assignments, trademarks, and customer contract rights.

For a $0 start, use local development and remote customer discovery first. [DIU's Commercial Solutions Opening](https://www.diu.mil/work-with-us) is a possible competitive prototype route when a solicitation fits a demonstrated need; it is not automatic funding. [SBIR/STTR](https://www.sbir.gov/apply) can support eligible U.S. small businesses under its rules and application process. Do not model either award as committed revenue.

## Claims allowed now

> Aetheris is an unclassified prototype for reviewing public and operator-provided observations, grounded U.S. terrain, and replayable base resilience decisions. We are testing whether it improves a specific operator workflow and can integrate with customer-permitted data.

Do not claim Palantir parity, operational deployment, government endorsement, guaranteed funding, acquisition interest, global live coverage, or surveyed world-model accuracy without corresponding evidence.
