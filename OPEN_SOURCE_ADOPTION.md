# Open source adoption for the base resilience product

**Reviewed 11 October 2026.** The near-term product goal is a trustworthy geospatial planning workflow that can run with permitted local data. Free code does not grant free rights to commercial imagery, telemetry, maps, trademarks, or hosted services.

| Material | License / status | Product use | Decision |
| --- | --- | --- | --- |
| [GeoJSON RFC 7946](https://www.rfc-editor.org/info/rfc7946/) | Open IETF format | Exchange point observations with WGS84 longitude/latitude coordinates | Implemented a narrow local importer and coordinate validation; no third-party code copied. |
| [OGC SensorThings API](https://docs.ogc.org/is/15-078r6/15-078r6.html) | Open OGC standard | Preserve `phenomenonTime`, `resultTime`, result, unit, and feature location | Implemented a read-only import of an Observation `value` array; no conformance claim. |
| [STAC common metadata](https://github.com/radiantearth/stac-spec/blob/master/commons/common-metadata.md) | Open specification | Make provider and license visible with each dataset | Used as design guidance for the evidence panel; this is not a STAC implementation. |
| [FROST Server](https://github.com/FraunhoferIOSB/FROST-Server) | LGPL 3.0 or later | Possible self-hosted SensorThings service for a permitted pilot | Do not deploy until a real pilot needs a server and its license, hosting, and security requirements are reviewed. |
| [PMTiles](https://github.com/protomaps/PMTiles/blob/main/LICENSE) | BSD 3-Clause code; spec public domain/CC0 | Offline-friendly map package for a future disconnected pilot | Evaluate after confirming map-data rights; current Cesium stack already renders the prototype. |
| [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt) | BSD 3-Clause with bundled notices | Optional lightweight 2D operational map | Do not add beside Cesium without a measured user need. |
| [geojson/schema](https://github.com/geojson/schema) | MIT | Deeper schema validation if import scope expands | Current importer is deliberately limited to Point observations; consider this when accepting more geometry types. |

## Implemented now

The defense demo has a **Data Evidence** panel. It starts with three explicitly synthetic infrastructure observations. An operator can import a local GeoJSON FeatureCollection or a SensorThings-style Observation collection (up to 500 records and 1 MB), see recent/stale/review/synthetic counts, inspect source and license declarations, and export a JSON review. The file stays in the browser tab; the report states that metadata is user-declared and unauthenticated. No network source is treated as an Army sensor.

This is a usable proof point for the startup wedge: a source-neutral, reviewable observation workflow. The next validation step is a permitted design-partner feed with a documented schema and measured operator outcome. A third-party feed swap is the right test of modularity; listing protocol names in a catalog is not.

## Example import shape

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "power-1",
      "geometry": { "type": "Point", "coordinates": [-97.7431, 30.2672] },
      "properties": {
        "label": "Power availability",
        "observedAt": "2026-10-11T12:00:00Z",
        "source": "Authorized local source",
        "license": "Documented data-use terms",
        "dataClass": "permissioned",
        "result": "Nominal"
      }
    }
  ]
}
```

Only `public`, `permissioned`, and `synthetic` are recognized data classes. A recent timestamp is a file claim, not proof that a feed is live. Missing rights, source, or time are marked **REVIEW**. Non-Point geometries and invalid coordinates are rejected rather than silently plotted.
