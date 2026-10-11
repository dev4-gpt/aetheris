/**
 * ContestedLogisticsAgent — Resilient Logistics, Forward Additive Manufacturing & Autonomous Resupply
 *
 * Directly addresses US Secretary of the Army Daniel P. Driscoll's YC RFS:
 * "We need cutting-edge drones, resilient logistics, and advanced manufacturing,
 *  and we need it all to survive the most extreme climates on Earth."
 *
 * Capabilities:
 *   1. Real-time Magazine Depletion & "Time-to-Winchester" (zero-ammo) forecasting
 *   2. Forward Mobile Micro-Factory (ISO-containerized CF-PEEK 3D printing + COTS motor cell)
 *   3. Autonomous TRV-150 Tactical Cargo UAS nap-of-the-earth pod reload dispatch
 */

export class ContestedLogisticsAgent {
  constructor(options = {}) {
    this.name = 'ContestedLogisticsAgent';
    this.role = 'Contested Logistics, Forward 3D Micro-Factory & Autonomous UAS Resupply';

    // Forward Mobile Micro-Factory state at the FOB
    this.microFactory = {
      unitId: options.factoryId || 'MFG-CELL-ALPHA-01',
      status: 'OPERATIONAL',
      printMaterial: 'Carbon-Fiber Reinforced PEEK (MIL-STD-810H Rated)',
      fabricationRatePerHour: options.fabricationRatePerHour || 1.5,
      rawFeedstockKg: options.rawFeedstockKg ?? 240, // 3.2 kg per airframe
      kgPerAirframe: 3.2,
      cotsMotorSeekerKits: options.cotsMotorSeekerKits ?? 32,
      assembledReserveStock: options.assembledReserveStock ?? 12,
      totalManufacturedCount: 0
    };

    // Autonomous Tactical Resupply UAS fleet (e.g. Malloy / US Army TRV-150)
    this.cargoFleet = {
      platform: 'TRV-150 Autonomous Tactical Resupply UAS',
      payloadCapacityRounds: 4,
      cruiseSpeedKmh: 108,
      noeAltitudeM: 12, // Nap-of-the-earth terrain-masked flight
      sortiesCompleted: 0
    };
  }

  /**
   * Evaluates battery magazine readiness and predicts "Time-to-Winchester"
   * (minutes until zero kinetic rounds remain under current threat tempo).
   *
   * @param {Object} battery - FireControlAgent battery map (POD-A .. POD-D)
   * @param {number} [expectedThreatsPerHour=16] - Projected adversary saturation tempo
   * @returns {Object} Logistics readiness & Winchester forecast
   */
  evaluateLogisticsState(battery = {}, expectedThreatsPerHour = 16) {
    const pods = Object.entries(battery);
    let totalLoaded = 0;
    let maxCapacity = pods.length * 4 || 16;
    const depletedPods = [];

    for (const [podId, pod] of pods) {
      const count = Number(pod.count ?? 0);
      totalLoaded += count;
      if (count < 4) {
        depletedPods.push({ podId, currentCount: count, deficit: 4 - count });
      }
    }

    const burnRatePerMin = Math.max(0.05, expectedThreatsPerHour / 60);
    const timeToWinchesterMinutes = Number((totalLoaded / burnRatePerMin).toFixed(1));
    const sustainableWithReserveMinutes = Number(
      ((totalLoaded + this.microFactory.assembledReserveStock) / burnRatePerMin).toFixed(1)
    );

    const maxBuildableFromFeedstock = Math.min(
      Math.floor(this.microFactory.rawFeedstockKg / this.microFactory.kgPerAirframe),
      this.microFactory.cotsMotorSeekerKits
    );

    let supplyStatus = 'NOMINAL';
    if (totalLoaded === 0) supplyStatus = 'WINCHESTER_CRITICAL';
    else if (totalLoaded <= 6) supplyStatus = 'RESUPPLY_URGENT';
    else if (totalLoaded < 12) supplyStatus = 'DEPLETED_STANDBY';

    return {
      agent: this.name,
      supplyStatus,
      totalLoadedRounds: totalLoaded,
      maxPodCapacity: maxCapacity,
      readinessPct: Math.round((totalLoaded / maxCapacity) * 100),
      depletedPods,
      timeToWinchesterMinutes,
      sustainableWithReserveMinutes,
      microFactory: {
        ...this.microFactory,
        maxBuildableFromFeedstock
      },
      cargoFleet: { ...this.cargoFleet },
      timestamp: Date.now()
    };
  }

  /**
   * Simulates forward additive manufacturing inside the containerized FOB Micro-Factory.
   * Converts raw CF-PEEK polymer feedstock + COTS motor/seeker kits into ready interceptors.
   *
   * @param {number} [hours=2] - Production window in hours
   * @returns {Object} Manufacturing batch report
   */
  fabricateInterceptors(hours = 2) {
    const targetUnits = Math.max(1, Math.floor(hours * this.microFactory.fabricationRatePerHour));
    const maxByFeedstock = Math.floor(this.microFactory.rawFeedstockKg / this.microFactory.kgPerAirframe);
    const produced = Math.min(targetUnits, maxByFeedstock, this.microFactory.cotsMotorSeekerKits);

    if (produced <= 0) {
      return {
        success: false,
        producedCount: 0,
        reason: 'INSUFFICIENT_FEEDSTOCK_OR_COTS_KITS',
        assembledReserveStock: this.microFactory.assembledReserveStock
      };
    }

    this.microFactory.rawFeedstockKg = Number(
      (this.microFactory.rawFeedstockKg - produced * this.microFactory.kgPerAirframe).toFixed(1)
    );
    this.microFactory.cotsMotorSeekerKits -= produced;
    this.microFactory.assembledReserveStock += produced;
    this.microFactory.totalManufacturedCount += produced;

    return {
      success: true,
      producedCount: produced,
      hoursElapsed: hours,
      unitProductionCostUsd: 4800,
      assembledReserveStock: this.microFactory.assembledReserveStock,
      remainingFeedstockKg: this.microFactory.rawFeedstockKg,
      remainingCotsKits: this.microFactory.cotsMotorSeekerKits,
      timestamp: Date.now()
    };
  }

  /**
   * Dispatches an autonomous TRV-150 Tactical Resupply UAS to hot-reload depleted launcher pods
   * from the FOB Micro-Factory reserve stock.
   *
   * @param {Object} battery - FireControlAgent battery object (mutated in-place to reload pods)
   * @param {string} [targetPodId] - Optional specific pod ID; if omitted, reloads all depleted pods
   * @returns {Object} Resupply mission telemetry
   */
  dispatchAutonomousResupply(battery, targetPodId = null) {
    if (!battery || typeof battery !== 'object') {
      throw new TypeError('dispatchAutonomousResupply requires a valid battery object');
    }

    // If reserve stock is low, automatically run a 2-hour micro-factory print batch first
    let autoFabricated = 0;
    if (this.microFactory.assembledReserveStock < 4) {
      const fab = this.fabricateInterceptors(4);
      autoFabricated = fab.producedCount;
    }

    const reloadedPods = [];
    let totalRoundsDelivered = 0;

    const podIds = targetPodId ? [targetPodId] : Object.keys(battery);
    for (const podId of podIds) {
      const pod = battery[podId];
      if (!pod) continue;
      const deficit = Math.max(0, 4 - pod.count);
      if (deficit > 0 && this.microFactory.assembledReserveStock > 0) {
        const delivered = Math.min(deficit, this.microFactory.assembledReserveStock);
        pod.count += delivered;
        pod.ready = pod.count > 0;
        this.microFactory.assembledReserveStock -= delivered;
        totalRoundsDelivered += delivered;
        reloadedPods.push({ podId, delivered, newCount: pod.count });
      }
    }

    if (totalRoundsDelivered > 0) {
      this.cargoFleet.sortiesCompleted += 1;
    }

    const totalLoadedAfter = Object.values(battery).reduce((sum, p) => sum + (p.count || 0), 0);

    return {
      agent: this.name,
      resupplyDispatched: totalRoundsDelivered > 0,
      platform: this.cargoFleet.platform,
      flightProfile: `NOE ${this.cargoFleet.noeAltitudeM}m AGL Terrain-Masked`,
      totalRoundsDelivered,
      autoFabricatedBeforeSortie: autoFabricated,
      reloadedPods,
      totalLoadedAfter,
      remainingReserveStock: this.microFactory.assembledReserveStock,
      sortiesCompleted: this.cargoFleet.sortiesCompleted,
      timestamp: Date.now()
    };
  }
}
