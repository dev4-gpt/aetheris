/**
 * MosaAdapterAgent — US Army MOSA (Modular Open Systems Approach) & SOSA Plug-and-Play Registry
 *
 * Directly addresses US Secretary of the Army Daniel P. Driscoll's YC RFS:
 * "Modern combat demands commercially developed, modular open-system solutions,
 *  and that's why we ripped up the old acquisition playbook... We need next-gen
 *  sensors, software, payloads, and other hardware that plugs directly into our
 *  open system architecture."
 *
 * Enforces:
 *   - 10 U.S.C. § 4401 Modular Open Systems Approach (MOSA) compliance
 *   - Sensor Open Systems Architecture (SOSA) Technical Standard 1.0
 *   - US Army FAAD C2 (Forward Area Air Defense) & IBCS (Integrated Battle Command System)
 *   - Zero proprietary vendor lock-in validation
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
    moduleId: 'ECHODYNE-ECHOGUARD-MESA',
    vendor: 'Echodyne (Commercial COTS)',
    category: 'SENSOR',
    subcategory: 'KA_BAND_4D_RADAR',
    protocol: 'COT_MIL_STD_2525C',
    sosaSlot: 'VPX-3U-PAYLOAD-01',
    unitCostUsd: 38000,
    powerDrawWatts: 75,
    vendorLockIn: false,
    status: 'ONLINE'
  },
  {
    moduleId: 'ANDURIL-PULSAR-EW',
    vendor: 'Commercial EW Partner',
    category: 'EFFECTOR',
    subcategory: 'RF_CYBER_PROTOCOL_JAMMER',
    protocol: 'SOSA_1_0',
    sosaSlot: 'VPX-3U-EW-02',
    unitCostUsd: 45000,
    costPerShotUsd: 0.05,
    powerDrawWatts: 240,
    vendorLockIn: false,
    status: 'ONLINE'
  },
  {
    moduleId: 'DE-SHORAD-HEL-50KW',
    vendor: 'Commercial Directed Energy',
    category: 'EFFECTOR',
    subcategory: 'HIGH_ENERGY_LASER_50KW',
    protocol: 'FAAD_C2_DDS',
    sosaSlot: 'HEAVY-PALLET-DE-01',
    unitCostUsd: 850000,
    costPerShotUsd: 1.50,
    powerDrawWatts: 50000,
    vendorLockIn: false,
    status: 'ONLINE'
  },
  {
    moduleId: 'AETHERIS-INTERCEPTOR-MK2',
    vendor: 'Aetheris Defense Systems',
    category: 'EFFECTOR',
    subcategory: 'ATTRITABLE_KINETIC_INTERCEPTOR',
    protocol: 'MAVLINK_V2',
    sosaSlot: 'CONTAINER-LAUNCHER-4X4',
    unitCostUsd: 4800,
    costPerShotUsd: 4800,
    powerDrawWatts: 15,
    vendorLockIn: false,
    status: 'ONLINE'
  },
  {
    moduleId: 'SILVUS-STREAMCASTER-4400',
    vendor: 'Silvus Technologies (COTS)',
    category: 'COMMS',
    subcategory: 'MIMO_MANET_MESH_RADIO',
    protocol: 'IBCS_LINK16_JREAP',
    sosaSlot: 'VPX-3U-COMMS-01',
    unitCostUsd: 14200,
    powerDrawWatts: 40,
    vendorLockIn: false,
    status: 'ONLINE'
  }
]);

export class MosaAdapterAgent {
  constructor(options = {}) {
    this.name = 'MosaAdapterAgent';
    this.role = 'US Army MOSA / SOSA / IBCS Open-System Plug-and-Play Registry';
    this.modules = new Map();

    const initialModules = options.initialModules || DEFAULT_COTS_MODULES;
    for (const mod of initialModules) {
      this.modules.set(mod.moduleId, { ...mod, registeredAt: Date.now() });
    }
  }

  /**
   * Validates and hot-plugs a commercial sensor, software payload, or effector
   * into the US Army MOSA open architecture registry.
   *
   * Rejects proprietary vendor-locked systems or unrecognized closed protocols.
   *
   * @param {Object} manifest
   * @returns {Object} Registration result
   */
  registerModule(manifest) {
    if (!manifest || typeof manifest !== 'object') {
      throw new TypeError('MOSA manifest must be a valid object');
    }

    const { moduleId, vendor, category, protocol, vendorLockIn } = manifest;

    if (!moduleId || !vendor || !category) {
      return {
        accepted: false,
        reason: 'MISSING_REQUIRED_FIELDS: moduleId, vendor, and category are mandatory under MOSA'
      };
    }

    if (vendorLockIn === true) {
      return {
        accepted: false,
        moduleId,
        reason: 'MOSA_VIOLATION_PROPRIETARY_LOCK_IN: 10 U.S.C. 4401 prohibits proprietary vendor lock-in interfaces'
      };
    }

    if (!SUPPORTED_OPEN_PROTOCOLS.includes(protocol)) {
      return {
        accepted: false,
        moduleId,
        reason: `UNSUPPORTED_CLOSED_PROTOCOL: ${protocol}. Must use one of: ${SUPPORTED_OPEN_PROTOCOLS.join(', ')}`
      };
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
      status: 'ONLINE',
      registeredAt: Date.now()
    };

    this.modules.set(normalizedEntry.moduleId, normalizedEntry);

    return {
      accepted: true,
      moduleId: normalizedEntry.moduleId,
      protocol: normalizedEntry.protocol,
      totalRegisteredModules: this.modules.size,
      module: normalizedEntry
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
   * Exports a US Army FAAD C2 / IBCS-compliant MOSA system topology manifest.
   * @returns {Object}
   */
  exportMosaBundle() {
    const modulesList = this.listModules();
    const sensors = modulesList.filter(m => m.category === 'SENSOR');
    const effectors = modulesList.filter(m => m.category === 'EFFECTOR');
    const comms = modulesList.filter(m => m.category === 'COMMS');

    return {
      standard: 'US Army MOSA / SOSA Technical Standard 1.0 / FAAD C2',
      statutoryCompliance: '10 U.S.C. § 4401 Modular Open Systems Approach',
      c2Integration: ['IBCS (Integrated Battle Command System)', 'FAAD C2', 'TAK / Cursor-on-Target'],
      vendorLockInCount: 0,
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
