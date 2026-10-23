# WorldClaw feasibility for Aetheris

**Reviewed 20 October 2026; repository availability rechecked 23 October 2026. Decision:** use the published design as research guidance for **synthetic, explorable planning scenes**. Do not claim that Aetheris runs WorldClaw or that generated scenery represents a real installation.

## Availability and fit

The [WorldClaw repository](https://github.com/Tencent-Hunyuan/Hunyuan3D-WorldClaw) currently contains a README and assets, with no released implementation, checkpoints, or code license. The [paper](https://arxiv.org/html/2608.05248v1) describes an agent pipeline: a structured scene plan; region-aware terrain; editable 3D objects; and render, inspect, refine loops. Its experiments used Claude Opus 4.8, GPT-Image-2, SAM3, SAM3D, Hunyuan3D, Blender 5.1.1, and four NVIDIA H20 GPUs. The authors report quality, code-generation stability, latency, and compute limitations. This is not presently a free drop-in dependency.

Aetheris's Cesium view already represents mapped geography and can use real imagery or terrain when the provider and rights allow. A WorldClaw-style output would improve the **visual plausibility of a hypothetical scene**, but its generated terrain and objects do not establish geographic accuracy, surveyed dimensions, physical behavior, or sensor truth. The appropriate first use is a separate scenario sandbox for tabletop planning and interface research.

## Buildable path

1. Define a scene manifest with `sceneType: "synthetic"`, prompt, generator/version, asset sources and rights, local coordinate frame, scale units, region boundaries, object transforms, and creation time. Keep it separate from observation feeds and mapped imagery.
2. Generate a small scene with locally runnable procedural terrain and licensed assets. Keep terrain and objects independently editable. Export glTF/GLB and the manifest together. Do not copy WorldClaw code until code and reuse terms are actually published.
3. Preview the scene in an isolated viewer or clearly marked scenario layer. Require an explicit georeferencing transform and evidence before placing an asset on the live globe. Preserve an always-visible **SYNTHETIC SCENARIO** label.
4. Compare output across several camera viewpoints. Inspect seams between regions, object scale and terrain contact, mesh validity, texture resolution, browser frame rate, and file size. For any claim about a real place, compare against permissioned surveyed or measured references and report error bounds.
5. Run a user study for the base-resilience workflow. Measure whether the added detail improves a defined planning task, rather than treating visual appeal as evidence of operational value.

## What the current benchmark actually measures

`@aetheris/worldgen-bench` computes exploratory camera-position RMSE, normalized depth-array agreement, and embedding cosine similarity. These video-oriented metrics **do not measure** mesh realism, object contact, navigability, geographic fidelity, or operational performance. World Studio now accepts a local JSON file with paired measurements and refuses to score missing data. The values are user supplied and unverified.

Example file shape for the Studio benchmark control:

```json
{
  "intendedPoses": [{ "pos": [0, 0, 0] }],
  "recoveredPoses": [{ "pos": [0.1, 0, 0] }],
  "groundTruthDepth": [0.5],
  "estimatedDepth": [0.52],
  "embeddingShotA": [1, 0],
  "embeddingShotB": [0.99, 0.01]
}
```

All paired arrays must be nonempty and equal length; depth values are normalized to 0–1. The composite weights are exploratory and have not been calibrated against human ratings. A real WorldClaw-style scene evaluation needs a separate 3D benchmark and reference dataset.
