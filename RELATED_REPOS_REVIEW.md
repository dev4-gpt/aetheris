# Related GitHub repositories for Aetheris

**Reviewed 20 October 2026.** I screened the repositories accessible under `dev4-gpt` for the base resilience and synthetic world work. The connected GitHub tools listed owned repositories, but did not expose the account's starred list. This review therefore covers **created/owned repositories only**; it is not a claim that all starred projects were checked.

| Repository | Useful part | Decision and evidence gate |
| --- | --- | --- |
| [OpenArchai](https://github.com/dev4-gpt/OpenArchai/blob/main/AETHERIS_SPATIAL_INDEPENDENT_AUDIT.md) | Existing independent Aetheris audit and claim corrections | **Use as a review checklist.** Recheck each 22 September finding against current code before citing it. Do not copy stale numbers into a pitch. |
| [DispatchIQ](https://github.com/dev4-gpt/DispatchIQ) | Saved runs, held-out cases, and a deterministic rule checker for agent-proposed policies | **Adapt the evaluation pattern.** For Aetheris scenarios, freeze inputs and constraints, keep agent proposals separate from the checker, and score against an untouched held-out set. Its field-service policy and cost weights do not transfer to base planning. |
| [UCIP](https://github.com/dev4-gpt/UCIP) | Satellite/IoT/weather ingestion layout and provenance-oriented data fusion concepts | **Use as architecture inspiration only.** The inspected hotspot code uses simplified conversion factors and weights. No `LICENSE` file was present in the root listing despite the README's MIT badge. Verify rights and calibrate any feature before reuse. |
| [ResearchOS](https://github.com/dev4-gpt/ResearchOS) | Source discovery, statistics review, and evidence organization | **Use for research workflow, not product runtime.** Independently verify references and measured claims; generated manuscripts are not validation of a model. |
| [gods-eye-view](https://github.com/dev4-gpt/gods-eye-view) | Existing Cesium geospatial foundation | **Already represented in Aetheris.** Continue honoring upstream attribution and provider-specific data rights. Avoid duplicating the fork as a second engine. |
| [computer-vision](https://github.com/dev4-gpt/computer-vision), [Agentic-Systems](https://github.com/dev4-gpt/Agentic-Systems), [CAIS](https://github.com/dev4-gpt/CAIS) | Learning notebooks and research materials | **Do not import as production modules.** Their root structures do not expose a tested, licensed scene-generation or geospatial package ready to integrate. |

## Highest-value transfer

Bring **DispatchIQ's evaluation discipline** to the synthetic scenario sandbox: versioned scenario fixtures, explicit assumptions and constraints, a deterministic evaluator, a baseline, held-out cases, and saved results. The initial Aetheris evaluator should test scene-manifest validity, coordinate frame and scale, asset rights, provenance, region coverage, and whether synthetic content stays visually separate from mapped data. Visual realism needs human review or a reference dataset; a single composite score is insufficient.

Use **OpenArchai's audit** to clean the investor evidence package. The audit identified prior claims that conflated arithmetic timing with rendered frame rate, browser hashing with SHA-256, upstream tests with original work, and simulated pipeline demand with buyer evidence. Treat the audit as a dated lead and reproduce every finding before asserting a current status.

## GitHub Actions reliability

The public Aetheris Actions runs inspected on 20 October failed at **Install dependencies** before tests ran. The previous workflow used Node 22 although `gods-eye-view/package.json` requires Node 24.14+ or 26, installed the latest pnpm despite the root specifying 9.15.0, retried a non-frozen install, and marked lint/typecheck failures non-blocking. The revised workflow pins action commits, Node 24.14.0, and pnpm 9.15.0, uses the lockfile strictly, and runs lint, typecheck, tests, and build as gates. The remote CI result still needs to be observed after a push; local static checks cannot prove GitHub-hosted installation succeeds.

## Reuse rule

Repository ownership alone does not prove that every file, dataset, model weight, or image is reusable. Before copying code across repositories, inspect `LICENSE`, third-party notices, dependencies, commit provenance, data rights, and tests. Prefer a small, reviewable adaptation over combining whole repositories.
