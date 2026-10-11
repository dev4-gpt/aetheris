/**
 * MosaAdapterAgent — illustrative modular systems registry for a browser demo.
 *
 * Directly addresses US Secretary of the Army Daniel P. Driscoll's YC RFS:
 * "Modern combat demands commercially developed, modular open-system solutions,
 *  and that's why we ripped up the old acquisition playbook... We need next-gen
 *  sensors, software, payloads, and other hardware that plugs directly into our
 *  open system architecture."
 *
 * Protocol names and vendor examples are scenario metadata. This registry does
 * not implement those interfaces or establish MOSA conformance.
 */

export const SUPPORTED_OPEN_PROTOCOLS = Object.freeze([
  'COT_MIL_STD_2525C',
  'SOSA_1_0',
  'FAAD_C2_DDS',
  'IBCS_LINK16_JREAP',
  'MAVLINK_V2',
  'STANAG_4586'
]);

export const DEFAULT_COTS_MODULES = Object.freeze([
  {
    moduleId: 'DEMO-RADAR-01',
    vendor: 'Illustrative sensor vendor',
    category: 'SENSOR',
    subcategory: 'KA_BAND_4D_RADAR',
    protocol: 'COT_MIL_STD_2525C',
    sosaSlot: 'VPX-3U-PAYLOAD-01',
    unitCostUsd: 38000,
    powerDrawWatts: 75,
    vendorLockIn: false,
    status: 'SIMULATED'
  },
  {
    moduleId: 'DEMO-RF-01',
    vendor: 'Illustrative RF vendor',
    category: 'EFFECTOR',
    subcategory: 'RF_CYBER_PROTOCOL_JAMMER',
    protocol: 'SOSA_1_0',
    sosaSlot: 'VPX-3U-EW-02',
    unitCostUsd: 45000,
    costPerShotUsd: 0.05,
    powerDrawWatts: 240,
    vendorLockIn: false,
    status: 'SIMULATED'
  },
  {
    moduleId: 'DEMO-ENERGY-01',
    vendor: 'Illustrative energy vendor',
    category: 'EFFECTOR',
    subcategory: 'HIGH_ENERGY_LASER_50KW',
    protocol: 'FAAD_C2_DDS',
    sosaSlot: 'HEAVY-PALLET-DE-01',
    unitCostUsd: 850000,
    costPerShotUsd: 1.50,
    powerDrawWatts: 50000,
    vendorLockIn: false,
    status: 'SIMULATED'
  },
  {
    moduleId: 'DEMO-INTERCEPTOR-01',
    vendor: 'Illustrative hardware concept',
    category: 'EFFECTOR',
    subcategory: 'ATTRITABLE_KINETIC_INTERCEPTOR',
    protocol: 'MAVLINK_V2',
    sosaSlot: 'CONTAINER-LAUNCHER-4X4',
    unitCostUsd: 4800,
    costPerShotUsd: 4800,
    powerDrawWatts: 15,
    vendorLockIn: false,
    status: 'SIMULATED'
  },
  {
    moduleId: 'DEMO-COMMS-01',
    vendor: 'Illustrative communications vendor',
    category: 'COMMS',
    subcategory: 'MIMO_MANET_MESH_RADIO',
    protocol: 'IBCS_LINK16_JREAP',
    sosaSlot: 'VPX-3U-COMMS-01',
    unitCostUsd: 14200,
    powerDrawWatts: 40,
    vendorLockIn: false,
    status: 'SIMULATED'
  }
]);

export class MosaAdapterAgent {
  constructor(options = {}) {
    this.name = 'MosaAdapterAgent';
    this.role = 'Illustrative modular systems registry';
    this.modules = new Map();

    const initialModules = options.initialModules || DEFAULT_COTS_MODULES;
    for (const mod of initialModules) {
      this.modules.set(mod.moduleId, { ...mod, status: 'SIMULATED', registeredAt: Date.now() });
    }
  }

  /**
   * Checks basic scenario metadata before adding a module to the local demo.
   *
   * Rejects proprietary vendor-locked systems or unrecognized closed protocols.
   *
   * @param {Object} manifest
   * @returns {Object} Registration result
   */
  registerModule(manifest) {
    if (!manifest || typeof manifest !== 'object') {
      throw new TypeError('Demo module entry must be a valid object');
    }

    const { moduleId, vendor, category, protocol, vendorLockIn } = manifest;

    if ([moduleId, vendor, category].some(value => typeof value !== 'string' || !value.trim())) {
      return {
        accepted: false,
        reason: 'MISSING_REQUIRED_FIELDS: moduleId, vendor, and category are required for this demo catalog'
      };
    }

    if (vendorLockIn === true) {
      return {
        accepted: false,
        moduleId,
        reason: 'MOSA_VIOLATION_PROPRIETARY_LOCK_IN: this demo catalog excludes entries declaring vendor lock-in; no legal finding is implied'
      };
    }

    if (vendorLockIn !== false) {
      return {
        accepted: false,
        moduleId,
        reason: 'UNDECLARED_INTERFACE_RIGHTS: the scenario entry must explicitly declare its interface rights'
      };
    }

    if (!SUPPORTED_OPEN_PROTOCOLS.includes(protocol)) {
      return {
        accepted: false,
        moduleId,
        reason: `UNSUPPORTED_CLOSED_PROTOCOL: ${protocol}. Must use one of: ${SUPPORTED_OPEN_PROTOCOLS.join(', ')}`
      };
    }

    for (const field of ['unitCostUsd', 'costPerShotUsd', 'powerDrawWatts']) {
      if (manifest[field] !== undefined && (!Number.isFinite(Number(manifest[field])) || Number(manifest[field]) < 0)) {
        return { accepted: false, moduleId, reason: `INVALID_SCENARIO_NUMBER: ${field} must be finite and non-negative` };
      }
    }

    const normalizedEntry = {
      moduleId: String(moduleId).trim(),
      vendor: String(vendor).trim(),
      category: String(category).toUpperCase().trim(),
      subcategory: manifest.subcategory || 'COMMERCIAL_PAYLOAD',
      protocol,
      sosaSlot: manifest.sosaSlot || 'OPEN-VPX-DYNAMIC',
      unitCostUsd: Number(manifest.unitCostUsd ?? 0),
      costPerShotUsd: Number(manifest.costPerShotUsd ?? 0),
      powerDrawWatts: Number(manifest.powerDrawWatts ?? 50),
      vendorLockIn: false,
      status: 'SIMULATED',
      registeredAt: Date.now()
    };

    this.modules.set(normalizedEntry.moduleId, normalizedEntry);

    return {
      accepted: true,
      moduleId: normalizedEntry.moduleId,
      protocol: normalizedEntry.protocol,
      totalRegisteredModules: this.modules.size,
      module: normalizedEntry,
      validationStatus: 'METADATA_ONLY_UNVERIFIED'
    };
  }

  /**
   * Lists all registered open-architecture modules, optionally filtered by category.
   * @param {string} [category] - 'SENSOR' | 'EFFECTOR' | 'COMMS' | 'SOFTWARE'
   * @returns {Array<Object>}
   */
  listModules(category) {
    const all = Array.from(this.modules.values());
    if (!category) return all;
    const catUpper = category.toUpperCase();
    return all.filter(m => m.category === catUpper);
  }

  /**
   * Exports scenario metadata. This is not a conformance or integration artifact.
   * @returns {Object}
   */
  exportMosaBundle() {
    const modulesList = this.listModules();
    const sensors = modulesList.filter(m => m.category === 'SENSOR');
    const effectors = modulesList.filter(m => m.category === 'EFFECTOR');
    const comms = modulesList.filter(m => m.category === 'COMMS');

    return {
      artifactType: 'AETHERIS_DEMO_MODULE_CATALOG',
      validationStatus: 'UNVERIFIED_SIMULATION',
      disclaimer: 'Scenario metadata only. No hardware, interface, MOSA, SOSA, FAAD C2, IBCS, or vendor conformance has been verified.',
      standardReferences: ['MOSA', 'SOSA Technical Standard 1.0'],
      proposedIntegrationTargets: ['IBCS', 'FAAD C2', 'TAK / Cursor-on-Target'],
      declaredVendorLockInCount: modulesList.filter(m => m.vendorLockIn === true).length,
      totalModules: modulesList.length,
      summary: {
        sensors: sensors.length,
        effectors: effectors.length,
        comms: comms.length
      },
      modules: modulesList,
      generatedAt: new Date().toISOString()
    };
  }
}
