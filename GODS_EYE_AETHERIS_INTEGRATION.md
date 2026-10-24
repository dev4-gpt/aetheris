# Use God's Eye View as Aetheris's 3D viewer

**Decision (23 October 2026): Yes.** God's Eye View is the best existing 3D globe and interaction foundation in this repository. Aetheris should use its Cesium viewer for customer workflow trials while keeping the gateway's authenticated, provenance-bearing observations and decision records as the source of truth. The current lightweight gateway globe remains a working baseline for performance and task comparisons until the Cesium path is verified.

## What the repository already gives us

| Capability | Location | Aetheris use |
| --- | --- | --- |
| Cesium globe, camera, lighting, scene controls | `gods-eye-view/src/main.js`, `src/mapStackController.js`, `src/camera.js` | Main 3D map for the focused resilience review |
| Layer lifecycle and picking | `src/data/manager.js`, `src/data/pickRegistry.js`, `src/data/layerState.js` | Aetheris observation layer and selection |
| Satellite propagation and geospatial display | `src/data/satellites.js` | Reuse rendering patterns; the gateway already computes labeled predictions |
| Local observation review and export patterns | `src/agents/observationEvidence.js`, `src/data/localGeojson.js` | Interface ideas; canonical records and saved decisions remain in the gateway |
| Credits UI and render governor | `src/data/dataCredits.js`, `src/renderGovernor.js` | Visible attributions and bounded browser cost |
| Existing pilot data and decisions | `apps/gateway/src/feeds.js`, `src/observations.js`, `src/server.js` | Authenticated source, age, rights, and replay contract |

## Integration contract

1. Build a dedicated Aetheris Cesium entry in `gods-eye-view/` that initializes the viewer and only the reviewed modules needed for the first customer task. The current `src/main.js` eagerly imports many experimental feeds, voice, cartridges, and cinematic features; loading that entry as-is would inherit their behavior and dependencies.
2. Serve its built assets under the **same origin** as the authenticated gateway. The browser requests `/api/v1/layers`, `/api/v1/feeds/:id`, `/api/v1/observations/imported`, and `/api/v1/decisions` with the existing session. Do not move provider credentials or source fetches into the browser.
3. Add one adapter from the gateway's versioned observation envelope to Cesium entities. Stable IDs, WGS84 coordinates, source URL, license, observed and fetched times, and `live` / `delayed` / `forecast` / `static` / `synthetic` labels must survive selection, filtering, screenshots, and export. Satellite positions must read as **predictions**. Missing geometry stays in the evidence list rather than acquiring an invented point.
4. Attach the grounded USGS area as a distinct measured/interpolated scene layer. Keep operator markers and generated objects visibly synthetic. Use a rights-cleared base map and preserve all required credits.
5. Gate the 3D viewer with the same operator study as the simple globe: completion time, provenance recognition, stale-data handling, browser memory/frame rate, and errors on the same tasks. Ship the Cesium view as default only if it improves the measured workflow without degrading evidence comprehension.

## Rights and deployment boundary

The upstream [God's Eye View license](https://github.com/bilawalsidhu/gods-eye-view/blob/main/LICENSE) permits commercial reuse of its **code** under MIT with notice. [CesiumJS](https://cesium.com/platform/cesiumjs) is Apache 2.0 and commercially usable. Neither grant covers imagery, hosted terrain, models, or feeds. Preserve the upstream copyright and any model/asset notices actually shipped.

Before a commercial build, explicitly exclude the bundled TeleGeography submarine-cable dataset and other noncommercial event assets noted in `gods-eye-view/DATA_SOURCES.md` and `public/models/README.md`. Do not activate Google 3D/ion services under a personal trial or assume the keyless imagery endpoint grants production rights. [OpenSky's terms](https://opensky-network.org/about/terms-of-use) require a written license for commercial entities and operational REST use. Keep flights, cameras, and other unresolved layers unavailable until a permitted source and its attribution are tested. The dedicated build should include only approved modules and assets; a hidden toggle is not sufficient if restricted files still ship.

## Exit criteria

- A same-origin, authenticated Cesium screen renders the gateway's earthquakes, EONET, NWS, AIS, and predicted satellite records with identical IDs and provenance.
- Selecting a Cesium marker opens the same evidence and saves the same replayable decision record as the lightweight pilot.
- A production bundle inventory finds no noncommercial datasets or unapproved model assets; attributions remain visible.
- The app has no development Vite proxy or browser-held provider secret in the production path.
- A task study shows whether the stronger globe helps the buyer's decision. If it does not, retain it as an optional exploration view.

This reuse reduces **technical build risk**. It does not establish customer demand, procurement eligibility, Palantir parity, or acquisition interest; those still depend on the [startup scorecard](STARTUP_BUILDABILITY_SCORECARD.md).
