/**
 * Synthetic land-scenario cartridge. This does not load or run Google's
 * AlphaEarth Foundations model or Satellite Embedding dataset. All vectors,
 * scores, events, and advisories below are deterministic fixtures.
 * 
 * @module alphaEarthCartridge
 */

import { CARTRIDGE_IDS } from './cartridgeRegistry.js';

/**
 * Approximate nominal 10m cell delta in degrees, not the alignment of
 * Google's UTM-projected embedding rasters.
 * 1 degree latitude ~ 111,320m -> 10m ~ 0.00008983 deg
 */
export function get10mBoundingBox(lat, lon) {
  const latDelta = 10.0 / 111320.0; // ~0.00008983
  const lonDelta = 10.0 / (111320.0 * Math.max(0.1, Math.cos((lat * Math.PI) / 180.0)));

  // Snap to 10m grid cell boundaries
  const south = Math.floor(lat / latDelta) * latDelta;
  const north = south + latDelta;
  const west = Math.floor(lon / lonDelta) * lonDelta;
  const east = west + lonDelta;

  return {
    south,
    north,
    west,
    east,
    centerLat: (south + north) / 2.0,
    centerLon: (west + east) / 2.0,
    gridId: `AE-10M-${south.toFixed(5)}_${west.toFixed(5)}`
  };
}

/**
 * Deterministic pseudo-random generator seeded by coordinates
 * Generates a reproducible synthetic 64-value vector. It is not an embedding.
 */
export function generate64DEmbedding(lat, lon) {
  const seed = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453;
  const embedding = new Float32Array(64);
  let s = Math.abs(seed);
  for (let i = 0; i < 64; i++) {
    s = (s * 16807) % 2147483647;
    embedding[i] = (s / 2147483647) * 2.0 - 1.0; // [-1.0, 1.0]
  }
  return embedding;
}

/**
 * Illustrative land scores for UI testing. Values are not measured risks.
 */
export function scoreLandParcel(lat, lon, label = 'Target Land Parcel') {
  const bbox = get10mBoundingBox(lat, lon);
  const embedding = generate64DEmbedding(lat, lon);

  // Compute arbitrary example inputs from the synthetic vector.
  const absLat = Math.abs(lat);
  const elevationFactor = Math.abs(embedding[0]);
  const slopeHydrology = Math.abs(embedding[1]);
  const vegetationBiomass = (embedding[2] + 1.0) / 2.0; // [0, 1]
  const sarBackscatter = embedding[3]; // arbitrary fixture component, not SAR

  // Illustrative index; these components are not measured physical variables.
  let floodRisk = Math.min(99, Math.max(1, Math.round((1.0 - elevationFactor * 0.6 + slopeHydrology * 0.4) * 55 + (sarBackscatter > 0.4 ? 25 : 0))));
  if (absLat < 10) floodRisk = Math.min(99, floodRisk + 12); // Tropical convergence

  // Illustrative wildfire index, not a probability or susceptibility model.
  let wildfireRisk = Math.min(99, Math.max(1, Math.round((vegetationBiomass * 0.6 + Math.abs(embedding[4]) * 0.4) * 65)));
  if (absLat > 60) wildfireRisk = Math.max(2, Math.round(wildfireRisk * 0.3)); // Arctic suppression

  // Illustrative soil index, not a measured health proxy.
  const soilHealth = Math.min(100, Math.max(5, Math.round((Math.abs(embedding[5]) * 0.5 + Math.abs(embedding[6]) * 0.5) * 85 + 15)));

  // Synthetic grade for UI layout; no investment recommendation.
  const compositeScore = 100 - (floodRisk * 0.45 + wildfireRisk * 0.35 - (soilHealth - 50) * 0.2);
  let grade = 'B';
  let valuationAdvisory = 'Synthetic example only; obtain measured hazard data before any decision.';
  if (compositeScore >= 85) {
    grade = 'AAA';
    valuationAdvisory = 'Synthetic grade only; no parcel suitability conclusion.';
  } else if (compositeScore >= 75) {
    grade = 'AA';
    valuationAdvisory = 'Synthetic grade only; no parcel suitability conclusion.';
  } else if (compositeScore >= 65) {
    grade = 'A';
    valuationAdvisory = 'Synthetic grade only; no parcel suitability conclusion.';
  } else if (compositeScore >= 50) {
    grade = 'BBB';
    valuationAdvisory = 'Synthetic grade only; verify hazards with authoritative sources.';
  } else if (compositeScore >= 35) {
    grade = 'BB';
    valuationAdvisory = 'Synthetic grade only; verify hazards with authoritative sources.';
  } else {
    grade = 'D';
    valuationAdvisory = 'Synthetic grade only; verify hazards with authoritative sources.';
  }

  return {
    label,
    gridId: bbox.gridId,
    coordinates: { lat, lon },
    boundingBox10m: bbox,
    floodRiskScore: floodRisk,
    wildfireRiskScore: wildfireRisk,
    soilHealthIndex: soilHealth,
    compositeGrade: grade,
    valuationAdvisory,
    embeddingSample: Array.from(embedding.slice(0, 8)).map(n => Math.round(n * 1000) / 1000),
    dataResolution: 'Approximate 10m display cell; no raster sampled',
    source: 'Aetheris coordinate-seeded synthetic fixture',
    synthetic: true,
    modelUsed: false
  };
}

/**
 * Illustrative crop stress fields for UI testing. No SAR observation is read.
 */
export function analyzeAgCropStress(lat, lon, cropType = 'Corn / Soybeans') {
  const bbox = get10mBoundingBox(lat, lon);
  const embedding = generate64DEmbedding(lat, lon);

  // Synthetic number; not a Sentinel-1 measurement.
  const sarVvVhRatioDb = Math.round((-14.2 + embedding[7] * 4.5) * 10) / 10;
  // Synthetic root-zone moisture index, not an observation.
  const rzmi = Math.min(100, Math.max(5, Math.round(55 + embedding[8] * 40)));
  // Synthetic number; not a measured lead time.
  const opticalLeadDays = Math.round(14 + Math.abs(embedding[9]) * 10); // 14 to 24 days early!

  let stressLevel = 'NOMINAL';
  let irrigationDeltaMm = 0;
  let advisory = 'Synthetic crop scenario; no moisture measurement or irrigation guidance.';

  if (rzmi < 30) {
    stressLevel = 'CRITICAL_DROUGHT';
    irrigationDeltaMm = 28;
    advisory = 'Synthetic crop scenario; confirm moisture with authorized observations before acting.';
  } else if (rzmi < 50) {
    stressLevel = 'MODERATE_STRESS';
    irrigationDeltaMm = 14;
    advisory = 'Synthetic crop scenario; confirm moisture with authorized observations before acting.';
  }

  return {
    cropType,
    gridId: bbox.gridId,
    coordinates: { lat, lon },
    boundingBox10m: bbox,
    rootZoneMoistureIndex: rzmi,
    sarPolarizationDb: sarVvVhRatioDb,
    opticalLeadDays,
    cloudPenetration: 'Not measured; no radar data loaded',
    stressLevel,
    irrigationDeltaMm,
    advisory,
    timestamp: Date.now(),
    source: 'Aetheris coordinate-seeded synthetic fixture',
    synthetic: true,
    modelUsed: false
  };
}

/**
 * Hypothetical frontier events for UI testing. No change detection is run.
 */
export function detectUnmappedFrontierAnomaly(lat, lon, biome = 'Amazon Rainforest') {
  const bbox = get10mBoundingBox(lat, lon);
  const embedding = generate64DEmbedding(lat, lon);

  const anomalyScore = Math.abs(embedding[10]);
  const isCanopyBreach = anomalyScore > 0.65;
  const latentCosineDistance = Math.round((1.0 - anomalyScore) * 1000) / 1000;

  let eventType = 'STABLE_CANOPY';
  let classification = 'Synthetic stable scenario';
  let details = 'Generated fixture; no satellite or ground observation was checked.';

  if (lat < 10 && lat > -20 && lon < -45 && lon > -75) {
    // Amazon Basin
    if (isCanopyBreach) {
      eventType = 'ILLEGAL_LOGGING_ROAD';
      classification = 'Hypothetical canopy breach';
      details = 'Generated fixture; no logging road or SAR change was detected.';
    }
  } else if (lat < -60) {
    // Antarctica
    if (isCanopyBreach) {
      eventType = 'SUB_SURFACE_ICE_RIFT';
      classification = 'Hypothetical ice rift';
      details = 'Generated fixture; no ice rift or SAR change was detected.';
    }
  }

  return {
    biome,
    gridId: bbox.gridId,
    coordinates: { lat, lon },
    boundingBox10m: bbox,
    eventType,
    classification,
    latentCosineDistance,
    details,
    unmappedStatus: 'SYNTHETIC_FIXTURE',
    source: 'Aetheris coordinate-seeded synthetic fixture',
    synthetic: true,
    modelUsed: false
  };
}

/**
 * Factory for AlphaEarth Domain Cartridge
 */
export function createAlphaEarthCartridge(options = {}) {
  const activeAlerts = new Map();

  return {
    id: CARTRIDGE_IDS.ALPHA_EARTH,
    title: 'Synthetic land scenario (AlphaEarth integration planned)',
    category: 'Illustrative land scenario',
    description: 'Coordinate-seeded demo values only. No Google AlphaEarth embeddings, satellite observations, measured risks, or live model inference are loaded.',

    onActivate(context) {
      if (context.visualizer && typeof context.visualizer.show === 'function') {
        context.visualizer.show();
      }
    },

    onDeactivate(context) {
      activeAlerts.clear();
      if (context.visualizer && typeof context.visualizer.hide === 'function') {
        context.visualizer.hide();
      }
    },

    scoreLand: scoreLandParcel,
    analyzeCropStress: analyzeAgCropStress,
    detectFrontier: detectUnmappedFrontierAnomaly,

    evaluateAlerts(parcels = []) {
      const results = [];
      for (const p of parcels) {
        const score = scoreLandParcel(p.lat, p.lon, p.label || 'Monitored Parcel');
        if (score.floodRiskScore >= 75 || score.wildfireRiskScore >= 75) {
          const alert = {
            id: `alphaearth-risk-${score.gridId}`,
            level: 'SYNTHETIC_SCENARIO',
            parcelLabel: score.label,
            gridId: score.gridId,
            floodRisk: score.floodRiskScore,
            wildfireRisk: score.wildfireRiskScore,
            soilHealth: score.soilHealthIndex,
            compositeGrade: score.compositeGrade,
            advisory: score.valuationAdvisory,
            timestamp: Date.now(),
            synthetic: true,
            modelUsed: false
          };
          results.push(alert);
          activeAlerts.set(alert.id, alert);
        }
      }
      return results;
    },

    getActiveAlerts() {
      return Array.from(activeAlerts.values());
    }
  };
}
