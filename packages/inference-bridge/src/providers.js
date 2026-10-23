/**
 * @aetheris/inference-bridge - providers.js
 * Inference provider execution adapters (Local GPU, Cloud Serverless, and Offline Simulator).
 */

export class OfflineSyntheticProvider {
  constructor(options = {}) {
    this.name = 'offline-synthetic';
    this.latencyMs = options.latencyMs || 25;
  }

  async generate(job) {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, this.latencyMs));
    const executionDuration = Date.now() - startTime;

    const { modelId, prompt, spatialConditioning, duration = 5.0, aspectRatio = '16:9' } = job;

    return {
      status: 'synthetic',
      jobId: `syn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: this.name,
      modelId,
      prompt,
      aspectRatio,
      duration,
      output: {
        type: job.type || 'video',
        url: null,
        previewPosterUrl: null,
        spatialConditioningApplied: !!spatialConditioning,
        depthMapIncluded: !!(spatialConditioning && spatialConditioning.depthBuffer),
        cameraTrajectorySampleCount: spatialConditioning?.cameraPoses?.length || 0,
        fps: 24,
        resolution: job.resolution || '1080p'
      },
      telemetry: {
        executionMs: executionDuration,
        vramConsumedMb: 0,
        inferenceEngine: 'synthetic-no-inference',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export class LocalGPUProvider {
  constructor(endpoint = 'http://127.0.0.1:8188') {
    this.name = 'local-gpu';
    this.endpoint = endpoint;
  }

  async generate(job) {
    // When live local server is not accessible, gracefully fallback or execute via fetch
    try {
      const response = await fetch(`${this.endpoint}/api/aetheris/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });
      if (!response.ok) throw new Error(`Local GPU server returned HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      // Return structured fallback result with warning
      return {
        status: 'fallback-offline',
        provider: this.name,
        error: `Local server unreachable at ${this.endpoint}: ${err.message}`,
        fallbackNotice: 'No media was generated. Local GPU service is unavailable.'
      };
    }
  }
}

export class CloudServerlessProvider {
  constructor(options = {}) {
    this.name = options.platform || 'fal-serverless';
    this.apiKey = options.apiKey || process.env.AETHERIS_CLOUD_KEY;
  }

  async generate(job) {
    // No remote endpoint is implemented. Never return an invented media URL.
    return {
      status: 'unavailable',
      jobId: null,
      provider: this.name,
      modelId: job.modelId,
      prompt: job.prompt,
      output: null,
      error: 'Cloud inference adapter is not implemented; no media generated.'
    };
  }
}
