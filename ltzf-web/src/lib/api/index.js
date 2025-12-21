/**
 * API Module Exports
 * Main entry point for API functionality
 */

// Configuration
export { API_CONFIG, getApiUrl, getApiKey } from './config.js';

// Client
export {
    createApiClient,
    apiClient,
    apiRequest,
    withRetry,
    buildQueryParams,
    paginatedRequest,
    fetchAllPages,
    withConditionalRequest,
} from './client.js';

// Errors
export {
    ApiError,
    RateLimitError,
    NotFoundError,
    NotModifiedError,
    ValidationError,
    parseApiError,
    isRetryableError,
} from './errors.js';

// Fetchers
export {
    fetchVorgaenge,
    fetchVorgang,
    fetchSitzungen,
    fetchSitzung,
    fetchDokument,
    fetchGremien,
    fetchAutoren,
    fetchKalender,
    fetchKalenderList,
    fetchEnumeration,
    extractDocumentIds,
    extractSitzungDocumentIds,
} from './fetchers.js';
