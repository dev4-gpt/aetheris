/**
 * @aetheris/worldgen-bench - benchRunner.js
 * Automated benchmark execution harness for video foundation models.
 */

import {
  computeCameraTrajectoryError,
  computeDepthAlignmentScore,
  computeCrossShotFidelity
} from './metrics.js';

export class WorldGenBenchmark {
  constructor(options = {}) {
    this.name = 'WorldGen-Bench v1.0';
  }

  evaluateModel(modelId, sampleData) {
    const pairs = [
      ['intendedPoses', 'recoveredPoses'],
      ['groundTruthDepth', 'estimatedDepth'],
      ['embeddingShotA', 'embeddingShotB']
    ];
    for (const [left, right] of pairs) {
      const a = sampleData?.[left];
      const b = sampleData?.[right];
      if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
        throw new TypeError(`${left} and ${right} must be non-empty arrays of equal length`);
      }
    }
    for (const key of ['intendedPoses', 'recoveredPoses']) {
      if (!sampleData[key].every((pose) => {
        const xyz = pose?.pos || pose?.position;
        return Array.isArray(xyz) && xyz.length === 3 && xyz.every(Number.isFinite);
      })) throw new TypeError(`${key} must contain finite 3D positions`);
    }
    for (const key of ['groundTruthDepth', 'estimatedDepth', 'embeddingShotA', 'embeddingShotB']) {
      if (!sampleData[key].every(Number.isFinite)) throw new TypeError(`${key} must contain finite numbers`);
    }
    for (const key of ['groundTruthDepth', 'estimatedDepth']) {
      if (!sampleData[key].every((depth) => depth >= 0 && depth <= 1)) {
        throw new RangeError(`${key} must contain normalized depth values from 0 to 1`);
      }
    }
    const cte = computeCameraTrajectoryError(sampleData.intendedPoses, sampleData.recoveredPoses);
    const das = computeDepthAlignmentScore(sampleData.groundTruthDepth, sampleData.estimatedDepth);
    const csnf = computeCrossShotFidelity(sampleData.embeddingShotA, sampleData.embeddingShotB);

    // Composite WorldGen Score (0-100)
    // High DAS, Low CTE, High CSNF
    const ctePenalty = Math.min(50, cte * 5.0);
    const compositeScore = Math.max(0, Math.min(100, das * 0.5 + (100 - ctePenalty) * 0.3 + (csnf * 100) * 0.2));

    return {
      modelId,
      timestamp: new Date().toISOString(),
      metrics: {
        cameraTrajectoryError: Number(cte.toFixed(4)),
        depthAlignmentScorePercent: Number(das.toFixed(2)),
        crossShotFidelityCosine: Number(csnf.toFixed(4)),
        compositeWorldGenScore: Number(compositeScore.toFixed(2))
      },
      evaluation: 'EXPLORATORY_UNVERIFIED',
      dataStatus: 'user_submitted',
      limitations: 'Exploratory video metrics; does not establish 3D geometry realism or geographic accuracy.'
    };
  }
}
