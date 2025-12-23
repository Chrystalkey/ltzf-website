/**
 * API Client Wrapper
 * Wraps the generated OpenAPI client with error handling and retry logic
 */

import ApiClient from '../../../../oapicode/src/ApiClient.js';
import { API_CONFIG, getApiUrl, getApiKey } from './config.js';
import { parseApiError, isRetryableError } from './errors.js';

/**
 * Initialize the API client
 */
export function createApiClient() {
    const client = new ApiClient();
    client.basePath = API_CONFIG.baseUrl;

    // Always set X-API-Key header (empty string for public access, actual key for admin access)
    const apiKey = getApiKey() || '';
    client.authentications['apiKey'] = {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        apiKey: apiKey,
    };

    return client;
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry(fn, options = {}) {
    const {
        maxRetries = API_CONFIG.retry.maxRetries,
        initialDelay = API_CONFIG.retry.initialDelay,
        maxDelay = API_CONFIG.retry.maxDelay,
        backoffMultiplier = API_CONFIG.retry.backoffMultiplier,
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry if this is the last attempt
            if (attempt === maxRetries) {
                break;
            }

            // Don't retry if error is not retryable
            if (!isRetryableError(error)) {
                throw error;
            }

            // Wait before retrying
            console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Exponential backoff
            delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
    }

    throw lastError;
}

/**
 * Make an API request with error handling and retry logic
 */
export async function apiRequest(requestFn, options = {}) {
    const { includeHeaders = false } = options;

    return withRetry(async () => {
        try {
            // Wrap the callback-based API in a promise to avoid calling .end() twice
            const response = await new Promise((resolve, reject) => {
                requestFn((error, data, response) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(response);
                    }
                });
            });

            // Handle HTTP 204 No Content - return empty array for list endpoints
            if (response.status === 204 || !response.body) {
                return includeHeaders ? { data: [], headers: response.headers || {} } : [];
            }

            // Return the response body, optionally with headers
            if (includeHeaders) {
                return {
                    data: response.body,
                    headers: response.headers || {}
                };
            }

            return response.body;
        } catch (error) {
            // If it's already a response, parse the error
            if (error.response) {
                throw await parseApiError(error.response);
            }
            // Otherwise, rethrow
            throw error;
        }
    }, options);
}

/**
 * Build query parameters for API requests
 */
export function buildQueryParams(params = {}) {
    const filtered = {};

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            filtered[key] = value;
        }
    }

    return filtered;
}

/**
 * Parse Link header to extract pagination info
 * Format: <url>; rel="next", <url>; rel="last"
 */
function parseLinkHeader(linkHeader) {
    if (!linkHeader) return {};

    const links = {};
    const parts = linkHeader.split(',');

    for (const part of parts) {
        const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
        if (match) {
            const [, url, rel] = match;
            links[rel] = url;
        }
    }

    return links;
}

/**
 * Helper to handle pagination
 */
export async function* paginatedRequest(requestFn, options = {}) {
    const {
        perPage = API_CONFIG.pagination.defaultPerPage,
        maxPages = Infinity,
    } = options;

    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
        const response = await requestFn({
            page,
            per_page: perPage,
        });

        // Handle empty responses
        if (!response || (Array.isArray(response) && response.length === 0)) {
            // Empty response means no data
            return;
        }

        // Extract data from response (could be wrapped or direct array)
        const pageData = response.data || response;

        // Handle empty page data
        if (!pageData || (Array.isArray(pageData) && pageData.length === 0)) {
            return;
        }

        // Yield the current page of results
        const items = Array.isArray(pageData) ? pageData : [pageData];
        console.log(`Fetched page ${page}: ${items.length} items`);
        yield items;

        // Check for more pages using Link header
        if (response.headers) {
            const linkHeader = response.headers['link'] || response.headers['Link'];
            const links = parseLinkHeader(linkHeader);
            hasMore = !!links.next;
            if (!hasMore) {
                console.log(`Pagination complete: no more pages after page ${page}`);
            }
        } else {
            // If no headers (old behavior), assume no more pages
            hasMore = false;
            console.log(`Pagination complete: no headers found, stopping after page ${page}`);
        }

        page++;
    }
}

/**
 * Fetch all items with pagination
 */
export async function fetchAllPages(requestFn, options = {}) {
    const allItems = [];

    for await (const pageItems of paginatedRequest(requestFn, options)) {
        allItems.push(...(Array.isArray(pageItems) ? pageItems : [pageItems]));
    }

    console.log(`Total items fetched: ${allItems.length}`);
    return allItems;
}

/**
 * Add If-Modified-Since header for conditional requests
 */
export function withConditionalRequest(headers = {}, lastModified) {
    if (lastModified) {
        return {
            ...headers,
            'If-Modified-Since': lastModified,
        };
    }
    return headers;
}

// Export singleton instance
export const apiClient = createApiClient();
