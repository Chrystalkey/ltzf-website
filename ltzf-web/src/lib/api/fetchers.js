/**
 * Data Fetching Utilities
 * High-level functions to fetch data from the LTZF API
 */

import UnauthorisiertApi from '../../../../oapicode/src/api/UnauthorisiertApi.js';
import VorgangApi from '../../../../oapicode/src/api/VorgangApi.js';
import SitzungApi from '../../../../oapicode/src/api/SitzungApi.js';
import MiscellaneousApi from '../../../../oapicode/src/api/MiscellaneousApi.js';
import { apiClient, apiRequest, buildQueryParams, fetchAllPages } from './client.js';
import { NotModifiedError } from './errors.js';

// Create API instances
const unauthorizedApi = new UnauthorisiertApi(apiClient);
const vorgangApi = new VorgangApi(apiClient);
const sitzungApi = new SitzungApi(apiClient);
const miscApi = new MiscellaneousApi(apiClient);

/**
 * Fetch all Vorgänge (legislative processes) with optional filters
 */
export async function fetchVorgaenge(filters = {}, options = {}) {
    const {
        parlament,
        wahlperiode,
        vgtyp,
        updatedSince,
        updatedUntil,
        fetchAll = false,
    } = filters;

    const params = buildQueryParams({
        p: parlament,
        wp: wahlperiode,
        vgtyp,
        since: updatedSince,
        until: updatedUntil,
    });

    if (fetchAll) {
        return fetchAllPages(
            ({ page, per_page }) =>
                apiRequest(
                    (callback) =>
                        unauthorizedApi.vorgangGet({
                            ...params,
                            page,
                            perPage: per_page,
                        }, callback),
                    { includeHeaders: true }
                ),
            options
        );
    }

    return apiRequest((callback) => unauthorizedApi.vorgangGet(params, callback));
}

/**
 * Fetch a single Vorgang by ID
 */
export async function fetchVorgang(id, options = {}) {
    const { ifModifiedSince } = options;

    try {
        return await apiRequest((callback) =>
            unauthorizedApi.vorgangGetById(id, {
                ifModifiedSince,
            }, callback)
        );
    } catch (error) {
        if (error instanceof NotModifiedError) {
            return null;
        }
        throw error;
    }
}

/**
 * Fetch all Sitzungen (sessions) with optional filters
 */
export async function fetchSitzungen(filters = {}, options = {}) {
    const {
        parlament,
        wahlperiode,
        vorgangId,
        gremium,
        updatedSince,
        updatedUntil,
        fetchAll = false,
    } = filters;

    const params = buildQueryParams({
        p: parlament,
        wp: wahlperiode,
        vgid: vorgangId,
        gr: gremium,
        since: updatedSince,
        until: updatedUntil,
    });

    if (fetchAll) {
        return fetchAllPages(
            ({ page, per_page }) =>
                apiRequest(
                    (callback) =>
                        unauthorizedApi.sGet({
                            ...params,
                            page,
                            perPage: per_page,
                        }, callback),
                    { includeHeaders: true }
                ),
            options
        );
    }

    return apiRequest((callback) => unauthorizedApi.sGet(params, callback));
}

/**
 * Fetch a single Sitzung by ID
 */
export async function fetchSitzung(id, options = {}) {
    const { ifModifiedSince } = options;

    try {
        return await apiRequest((callback) =>
            unauthorizedApi.sGetById(id, {
                ifModifiedSince,
            }, callback)
        );
    } catch (error) {
        if (error instanceof NotModifiedError) {
            return null;
        }
        throw error;
    }
}

/**
 * Fetch a single Dokument by ID
 */
export async function fetchDokument(id) {
    return apiRequest((callback) => unauthorizedApi.dokumentGetById(id, callback));
}

/**
 * Fetch Gremien (committees) with optional filters
 */
export async function fetchGremien(filters = {}, options = {}) {
    const { parlament, wahlperiode, gremium, fetchAll = false } = filters;

    const params = buildQueryParams({
        p: parlament,
        wp: wahlperiode,
        gr: gremium,
    });

    if (fetchAll) {
        return fetchAllPages(
            ({ page, per_page }) =>
                apiRequest(
                    (callback) =>
                        unauthorizedApi.gremienGet({
                            ...params,
                            page,
                            perPage: per_page,
                        }, callback),
                    { includeHeaders: true }
                ),
            options
        );
    }

    return apiRequest((callback) => unauthorizedApi.gremienGet(params, callback));
}

/**
 * Fetch Autoren (authors) with optional filters
 */
export async function fetchAutoren(filters = {}, options = {}) {
    const { person, organisation, fachgebiet, fetchAll = false } = filters;

    const params = buildQueryParams({
        person,
        org: organisation,
        fach: fachgebiet,
    });

    if (fetchAll) {
        return fetchAllPages(
            ({ page, per_page }) =>
                apiRequest(
                    (callback) =>
                        unauthorizedApi.autorenGet({
                            ...params,
                            page,
                            perPage: per_page,
                        }, callback),
                    { includeHeaders: true }
                ),
            options
        );
    }

    return apiRequest((callback) => unauthorizedApi.autorenGet(params, callback));
}

/**
 * Fetch calendar entries for a specific parliament and date
 */
export async function fetchKalender(parlament, datum, options = {}) {
    return apiRequest((callback) => unauthorizedApi.kalDateGet(parlament, datum, options, callback));
}

/**
 * Fetch calendar entries with filters
 */
export async function fetchKalenderList(filters = {}, options = {}) {
    const {
        parlament,
        wahlperiode,
        gremium,
        year,
        month,
        day,
        updatedSince,
        updatedUntil,
        fetchAll = false,
    } = filters;

    const params = buildQueryParams({
        p: parlament,
        wp: wahlperiode,
        gr: gremium,
        y: year,
        m: month,
        dom: day,
        since: updatedSince,
        until: updatedUntil,
    });

    if (fetchAll) {
        return fetchAllPages(
            ({ page, per_page }) =>
                apiRequest(
                    (callback) =>
                        unauthorizedApi.kalGet({
                            ...params,
                            page,
                            perPage: per_page,
                        }, callback),
                    { includeHeaders: true }
                ),
            options
        );
    }

    return apiRequest((callback) => unauthorizedApi.kalGet(params, callback));
}

/**
 * Fetch enumeration values
 */
export async function fetchEnumeration(name, filters = {}) {
    const { contains } = filters;

    const params = buildQueryParams({
        contains,
    });

    return apiRequest((callback) => unauthorizedApi.enumGet(name, params, callback));
}

/**
 * Helper: Get all document IDs from a Vorgang
 */
export function extractDocumentIds(vorgang) {
    const documentIds = new Set();

    // Extract from stations
    if (vorgang.stationen) {
        for (const station of vorgang.stationen) {
            if (station.dokumente) {
                for (const doc of station.dokumente) {
                    if (typeof doc === 'string') {
                        documentIds.add(doc);
                    } else if (doc.api_id) {
                        documentIds.add(doc.api_id);
                    }
                }
            }

            if (station.stellungnahmen) {
                for (const stln of station.stellungnahmen) {
                    if (typeof stln === 'string') {
                        documentIds.add(stln);
                    } else if (stln.api_id) {
                        documentIds.add(stln.api_id);
                    }
                }
            }
        }
    }

    return Array.from(documentIds);
}

/**
 * Helper: Get all document IDs from a Sitzung
 */
export function extractSitzungDocumentIds(sitzung) {
    const documentIds = new Set();

    // Extract from TOPs
    if (sitzung.tops) {
        for (const top of sitzung.tops) {
            if (top.dokumente) {
                for (const doc of top.dokumente) {
                    if (typeof doc === 'string') {
                        documentIds.add(doc);
                    } else if (doc.api_id) {
                        documentIds.add(doc.api_id);
                    }
                }
            }
        }
    }

    // Extract from session documents
    if (sitzung.dokumente) {
        for (const doc of sitzung.dokumente) {
            if (typeof doc === 'string') {
                documentIds.add(doc);
            } else if (doc.api_id) {
                documentIds.add(doc.api_id);
            }
        }
    }

    return Array.from(documentIds);
}
