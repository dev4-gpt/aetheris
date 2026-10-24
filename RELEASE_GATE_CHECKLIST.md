# Aetheris release gates — $0 pilot

Checked items are verified in the repository as of 2026-10-23. An unchecked item is a release gate, not a claim that a provider is unusable. Keep the product described as an **unclassified public-data pilot** until the relevant gates are checked.

## Working foundation

- [x] Versioned observation records include source, rights, timestamps, location when available, and status.
- [x] Authenticated roles, CSRF protection, input limits, persistent records, audit trail, and backup code are present.
- [x] Bounded USGS elevation scene separates measured samples from optional synthetic markers.
- [x] Human reviewer can import a Point observation, save a decision, replay it, and export JSON.
- [x] Local tests, lint, typecheck, build, Arm64 image build, and a local SQLite backup/restore test pass.
- [x] Gateway production dependencies pass `npm audit` at moderate severity or above.

## External pilot gate — mainly deployment and validation, not a license fee

- [ ] Obtain an **Always Free** OCI Ampere A1 instance with enough regional capacity. **Money:** $0 if available within free quotas; free capacity can be unavailable, and Always Free has no uptime SLA. Do not enable paid resources. [OCI FAQ](https://www.oracle.com/cloud/free/faq/)
- [ ] Deploy the committed image behind HTTPS, verify login, roles, health checks, data persistence, and fixed outbound source access from that VM. **Money:** $0 within free limits; DNS may need an existing or free hostname.
- [ ] Copy a backup off the VM, restore it on the VM, and verify a saved decision. **Money:** $0 if using storage already within free quotas; an off-VM destination still needs to be chosen.
- [ ] Run a sustained Arm workload and verify compute, storage, and transfer remain within free quotas. **Money:** $0 only while limits hold. [OCI Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [ ] Exercise each enabled adapter against the provider from the deployed VM; record malformed responses, stale data, outages, and rate limits. **Money:** no known mandatory fee for the current public-data adapters; provider availability and terms still apply.
- [ ] Review attribution in the deployed UI and exported records with the exact datasets used. **Money:** generally $0; this is a rights and documentation check.

## Full live-platform claim — blocked today

- [ ] **Flights:** secure a written license or another provider that explicitly permits a commercial or operational live product, then implement and test its adapter. **Blocker:** permission; a usable license may cost money. OpenSky expressly requires a written license for commercial entities and for operational REST API use. [OpenSky terms](https://opensky-network.org/about/terms-of-use)
- [ ] **CCTV:** identify operators that permit public camera metadata and outbound links for this use, then implement and test the metadata adapter. **Blocker:** source permission and engineering; licensing terms or fees depend on each operator. Do not rebroadcast video.
- [ ] **Cables:** obtain commercial-use rights for a static dataset and connect it to the viewer. The bundled TeleGeography data is CC BY-NC-SA 3.0 and cannot be used in this commercial product without separate permission. **Blocker:** rights and engineering; a different openly licensed dataset might avoid a fee.
- [x] **Wind and rain software:** NWS hourly point forecasts now display issue and valid times for the selected U.S. area. Forecasts are not labeled as observations. **Remaining gate:** test live provider behavior from the deployed VM. [NWS API](https://www.weather.gov/documentation/services-web-api)
- [x] **Sea, air, and naval planning markers:** operators can save and replay synthetic points. They are user-authored scenarios, not automated simulations or real positions.
- [x] **Satellite position software:** CelesTrak OMM elements are propagated with SGP4 into timestamped predicted positions, refreshed locally without exceeding the two-hour source cadence. **Remaining gate:** live provider and accuracy validation. [CelesTrak usage policy](https://celestrak.org/usage-policy.php)
- [ ] **Coverage:** publish tested geographic limits for every layer. Fintraffic AIS covers Finnish waters; it does not support a global maritime claim. **Blocker:** data availability and product wording, not automatically money. [Fintraffic marine traffic](https://www.digitraffic.fi/en/marine-traffic/)
- [ ] **Rights and provenance:** retain Fintraffic CC BY 4.0 attribution and GDELT citation/link in every relevant display and export; do not treat linked news articles as licensed content. **Blocker:** review and implementation. [Fintraffic terms](https://www.digitraffic.fi/en/terms-of-service/), [GDELT terms](https://gdeltproject.org/about.html)
- [ ] Verify all required live categories have working, rights-cleared sources and pass source-specific fixture, malformed-response, stale, outage, and rate-limit tests before using the phrase **full live platform**.

## Deliberate $0 exclusions

- [x] Google Cloud deployment is excluded because the trial ended.
- [x] Paid model inference and Argon API use are excluded from the operating model.
- [x] WorldClaw code and weights are not imported; the published method only informs Aetheris's independent scene pipeline.
- [x] AlphaEarth embeddings are not presented as imagery or ground truth.
- [x] No funding, continuous availability, or defense operational-readiness guarantee is claimed.
