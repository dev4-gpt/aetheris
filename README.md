# Aetheris

Repository: [dev4-gpt/aetheris](https://github.com/dev4-gpt/aetheris).

Aetheris is an unclassified base resilience planning prototype. The new pilot workspace reviews public or operator-imported observations on a rotatable globe or flat map, shows source and freshness, builds a bounded U.S. terrain scene from USGS elevation samples, and saves replayable decision records. Both world views and the light/dark theme can be switched in the workspace. It is designed for human review; it does not authenticate user-imported claims, provide a surveyed terrain model, or make operational decisions.

## Pilot workspace

Requires Node.js 24.14 or newer. The gateway dependencies are locked in `apps/gateway/package-lock.json`.

```bash
cd apps/gateway
npm ci
AETHERIS_ADMIN_PASSWORD='choose-a-unique-password-at-least-14-characters' \
  AETHERIS_DB_PATH="$PWD/pilot-data/aetheris.db" npm start
```

Open `http://localhost:3001`. The bootstrap username is `admin`. Use HTTPS for any remote deployment; secure session cookies are enabled when `NODE_ENV=production`. The pilot uses no paid model API. It needs internet access to the named public sources and USGS elevation service.

The workspace has feed adapters for USGS earthquakes, NASA EONET events, NWS alerts and point forecasts, CelesTrak orbital elements, Fintraffic AIS for Finnish waters, and GDELT article metadata. Satellite markers are SGP4 predictions from orbital elements, and wind/rain markers are NWS forecasts for the selected U.S. point. Operators can add synthetic sea, air, and naval planning markers. Providers can be down, rate limited, sparse, or delayed. Flight, CCTV, and cable layers stay permission-gated without invented records. The full live-platform release remains blocked until every required source has verified rights and a tested working adapter.

The elevation scene requests 25 interpolated USGS 3DEP samples in a contiguous-U.S. area up to 5 km radius. The perspective mesh is a planning visualization, not surveyed geometry. WorldClaw informs the structured scene and review process; its repository does not publish an implementation or weights for this product. AlphaEarth embeddings are not integrated as an imagery layer.

## Deployment and verification

[OCI Always Free pilot deployment](deploy/oci/README.md) explains the Arm image, HTTPS setup, source allowlist, backups, quotas, and release blockers. The [release gate checklist](RELEASE_GATE_CHECKLIST.md) tracks what is verified, what needs source permission, and what could require money. The `docker-compose.yml` file is the pilot deployment. OCI Always Free has no uptime SLA. Google Cloud trial credits are not used.

```bash
node --test apps/gateway/test/gateway.test.js
```

The richer Cesium console in `gods-eye-view/` is the intended 3D viewer foundation. Its current entry point remains a research prototype with a development proxy and provider setup; see the [God's Eye View integration decision](GODS_EYE_AETHERIS_INTEGRATION.md) for the bounded, same-origin product path and source-rights checks. The creative `apps/studio/` is synthetic. Their screenshots, simulations, model lists, and historical marketing material are not evidence of a live defense deployment.

## Data and license notes

The pilot serves a [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) public-domain outline and [USGS 3DEP](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map) elevation samples. Attribution and source links travel with observations and exports. [Fintraffic](https://www.digitraffic.fi/en/terms-of-service/) is CC BY 4.0; [GDELT](https://gdeltproject.org/about.html) permits commercial dataset use with citation. News links lead to publishers; Aetheris does not rebroadcast their content. The bundled TeleGeography cable data in the older console is noncommercial and is not used by this pilot. Source code licenses do not grant rights to third-party feeds. Review each new source before enabling it in a commercial or operational setting.

See the [startup buildability scorecard](STARTUP_BUILDABILITY_SCORECARD.md), [readiness review](DEFENSE_STARTUP_READINESS.md), [source feasibility review](ALPHAEARTH_OSIRIS_WORLDCLAW_REVIEW.md), and [master product plan](AETHERIS_MASTER_PLAN.md) for known gaps and research paths.
