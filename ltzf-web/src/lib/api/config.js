/**
 * API Configuration
 * Centralized configuration for the LTZF API client
 */

export const API_CONFIG = {
    // API Base URL - should be set via environment variable in production
    baseUrl: import.meta.env.PUBLIC_API_URL || 'https://api.ltzf.example.com',

    // API version
    version: 'v2',

    // Rate limiting
    rateLimit: {
        maxRequests: 256,
        perSecond: 1,
    },

    // Pagination
    pagination: {
        defaultPerPage: 32,
        maxPerPage: 64,
    },

    // Timeouts
    timeout: 30000, // 30 seconds

    // Retry configuration
    retry: {
        maxRetries: 3,
        initialDelay: 1000, // 1 second
        maxDelay: 10000, // 10 seconds
        backoffMultiplier: 2,
    },

    // Cache configuration (for build-time caching)
    cache: {
        enabled: true,
        ttl: 3600, // 1 hour in seconds
        directory: '.cache/api',
    },
};

/**
 * Get full API URL
 */
export function getApiUrl(path) {
    const basePath = `/api/${API_CONFIG.version}`;
    return `${API_CONFIG.baseUrl}${basePath}${path}`;
}

/**
 * Get API key from environment
 */
export function getApiKey() {
    return import.meta.env.LTZF_API_KEY || '';
}
