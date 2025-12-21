/**
 * Build-Time Data Fetcher
 * Handles fetching and caching of data during static site generation
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { API_CONFIG } from './api/config.js';
import {
    fetchVorgaenge,
    fetchVorgang,
    fetchSitzungen,
    fetchSitzung,
    fetchDokument,
    fetchGremien,
    fetchAutoren,
    extractDocumentIds,
    extractSitzungDocumentIds,
} from './api/fetchers.js';

/**
 * Cache manager for build-time data
 */
class CacheManager {
    constructor(cacheDir = API_CONFIG.cache.directory) {
        this.cacheDir = cacheDir;
        this.enabled = API_CONFIG.cache.enabled;
        this.ttl = API_CONFIG.cache.ttl * 1000; // Convert to milliseconds
    }

    async ensureCacheDir() {
        if (this.enabled) {
            await fs.mkdir(this.cacheDir, { recursive: true });
        }
    }

    getCacheKey(key) {
        return crypto.createHash('md5').update(JSON.stringify(key)).digest('hex');
    }

    getCachePath(key) {
        const hash = this.getCacheKey(key);
        return path.join(this.cacheDir, `${hash}.json`);
    }

    async get(key) {
        if (!this.enabled) return null;

        try {
            const cachePath = this.getCachePath(key);
            const stats = await fs.stat(cachePath);

            // Check if cache is expired
            const age = Date.now() - stats.mtimeMs;
            if (age > this.ttl) {
                console.log(`Cache expired for ${JSON.stringify(key)}`);
                return null;
            }

            const data = await fs.readFile(cachePath, 'utf-8');
            console.log(`Cache hit for ${JSON.stringify(key)}`);
            return JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`Cache read error:`, error);
            }
            return null;
        }
    }

    async set(key, value) {
        if (!this.enabled) return;

        try {
            await this.ensureCacheDir();
            const cachePath = this.getCachePath(key);
            await fs.writeFile(cachePath, JSON.stringify(value, null, 2), 'utf-8');
            console.log(`Cached ${JSON.stringify(key)}`);
        } catch (error) {
            console.warn(`Cache write error:`, error);
        }
    }

    async clear() {
        if (!this.enabled) return;

        try {
            await fs.rm(this.cacheDir, { recursive: true, force: true });
            console.log(`Cache cleared`);
        } catch (error) {
            console.warn(`Cache clear error:`, error);
        }
    }
}

// Singleton cache instance
const cache = new CacheManager();

/**
 * Fetch with caching
 */
async function fetchWithCache(key, fetchFn) {
    // Try to get from cache first
    const cached = await cache.get(key);
    if (cached !== null) {
        return cached;
    }

    // Fetch fresh data
    console.log(`Fetching ${JSON.stringify(key)}`);
    const data = await fetchFn();

    // Cache the result
    await cache.set(key, data);

    return data;
}

/**
 * Build-time data fetcher for all Vorgänge
 */
export async function getAllVorgaenge(options = {}) {
    const { parlament, wahlperiode, vgtyp, forceRefresh = false } = options;

    const cacheKey = {
        type: 'vorgaenge',
        parlament,
        wahlperiode,
        vgtyp,
    };

    if (forceRefresh) {
        console.log(`Force refreshing vorgänge`);
    }

    return forceRefresh
        ? await fetchVorgaenge({ parlament, wahlperiode, vgtyp, fetchAll: true })
        : await fetchWithCache(cacheKey, () =>
              fetchVorgaenge({ parlament, wahlperiode, vgtyp, fetchAll: true })
          );
}

/**
 * Build-time data fetcher for a single Vorgang
 */
export async function getVorgang(id, options = {}) {
    const { forceRefresh = false } = options;

    const cacheKey = {
        type: 'vorgang',
        id,
    };

    return forceRefresh
        ? await fetchVorgang(id)
        : await fetchWithCache(cacheKey, () => fetchVorgang(id));
}

/**
 * Build-time data fetcher for all Sitzungen
 */
export async function getAllSitzungen(options = {}) {
    const { parlament, wahlperiode, forceRefresh = false } = options;

    const cacheKey = {
        type: 'sitzungen',
        parlament,
        wahlperiode,
    };

    return forceRefresh
        ? await fetchSitzungen({ parlament, wahlperiode, fetchAll: true })
        : await fetchWithCache(cacheKey, () =>
              fetchSitzungen({ parlament, wahlperiode, fetchAll: true })
          );
}

/**
 * Build-time data fetcher for a single Sitzung
 */
export async function getSitzung(id, options = {}) {
    const { forceRefresh = false } = options;

    const cacheKey = {
        type: 'sitzung',
        id,
    };

    return forceRefresh
        ? await fetchSitzung(id)
        : await fetchWithCache(cacheKey, () => fetchSitzung(id));
}

/**
 * Build-time data fetcher for a Dokument
 */
export async function getDokument(id, options = {}) {
    const { forceRefresh = false } = options;

    const cacheKey = {
        type: 'dokument',
        id,
    };

    return forceRefresh
        ? await fetchDokument(id)
        : await fetchWithCache(cacheKey, () => fetchDokument(id));
}

/**
 * Build-time data fetcher for all Gremien
 */
export async function getAllGremien(options = {}) {
    const { parlament, wahlperiode, forceRefresh = false } = options;

    const cacheKey = {
        type: 'gremien',
        parlament,
        wahlperiode,
    };

    return forceRefresh
        ? await fetchGremien({ parlament, wahlperiode, fetchAll: true })
        : await fetchWithCache(cacheKey, () =>
              fetchGremien({ parlament, wahlperiode, fetchAll: true })
          );
}

/**
 * Helper: Get all unique document IDs from Vorgänge
 */
export async function getAllDocumentIds(vorgaenge) {
    const allDocIds = new Set();

    for (const vorgang of vorgaenge) {
        const docIds = extractDocumentIds(vorgang);
        docIds.forEach(id => allDocIds.add(id));
    }

    return Array.from(allDocIds);
}

/**
 * Helper: Get statistics for a set of Vorgänge
 */
export function calculateStatistics(vorgaenge) {
    const stats = {
        total: vorgaenge.length,
        byType: {},
        byParlament: {},
        newest: [],
        oldest: [],
    };

    // Count by type
    for (const vg of vorgaenge) {
        const typ = vg.typ || 'unknown';
        stats.byType[typ] = (stats.byType[typ] || 0) + 1;

        // Extract parlament from first station or initiators
        const parlament = vg.stationen?.[0]?.gremium?.parlament || 'unknown';
        stats.byParlament[parlament] = (stats.byParlament[parlament] || 0) + 1;
    }

    // Sort by modification date
    const sorted = [...vorgaenge].sort((a, b) => {
        const dateA = a.stationen?.[0]?.zp_modifiziert || 0;
        const dateB = b.stationen?.[0]?.zp_modifiziert || 0;
        return new Date(dateB) - new Date(dateA);
    });

    stats.newest = sorted.slice(0, 10);
    stats.oldest = sorted.slice(-10).reverse();

    return stats;
}

/**
 * Get the last station of a vorgang based on zp_start date
 * @param {Object} vorgang - The vorgang object
 * @returns {Object|null} The last station or null if none exist
 */
export function getLastStation(vorgang) {
    if (!vorgang?.stationen || vorgang.stationen.length === 0) {
        return null;
    }

    // Sort stations by zp_start date and return the last one
    return [...vorgang.stationen].sort((a, b) => {
        const dateA = new Date(a.zp_start || 0);
        const dateB = new Date(b.zp_start || 0);
        return dateA - dateB;
    })[vorgang.stationen.length - 1];
}

/**
 * Categorize a vorgang based on its last station's type
 * @param {Object} vorgang - The vorgang object
 * @returns {string} Category: 'entwuerfe', 'beratung', 'fertig', or 'unknown'
 */
export function categorizeVorgang(vorgang) {
    const lastStation = getLastStation(vorgang);

    if (!lastStation?.typ) {
        return 'unknown';
    }

    const typ = lastStation.typ;

    // Fertig (Completed): Accepted, rejected, withdrawn, or post-parliamentary stages
    if ([
        'parl-akzeptanz',
        'parl-ablehnung',
        'parl-zurueckgz',
        'postparl-vesja',
        'postparl-vesne',
        'postparl-gsblt',
        'postparl-kraft'
    ].includes(typ)) {
        return 'fertig';
    }

    // In Beratung (In consultation): Active parliamentary discussion
    if ([
        'parl-ausschber',  // Committee report
        'parl-vollvlsgn',  // Plenary session
        'parl-ggentwurf'   // Counter-proposal
    ].includes(typ)) {
        return 'beratung';
    }

    // Aktuelle Entwürfe (Current drafts): Pre-parliamentary and initial parliamentary stages
    if ([
        'preparl-regent',
        'preparl-eckpup',
        'preparl-regbsl',
        'preparl-vbegde',
        'parl-initiativ'
    ].includes(typ)) {
        return 'entwuerfe';
    }

    return 'unknown';
}

/**
 * Clear the build cache
 */
export async function clearCache() {
    await cache.clear();
}

/**
 * Export cache manager for advanced use
 */
export { cache };
