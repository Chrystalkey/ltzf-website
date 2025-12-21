/**
 * API Error Classes
 * Custom error types for better error handling
 */

export class ApiError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.response = response;
    }
}

export class RateLimitError extends ApiError {
    constructor(retryAfter, response) {
        super('Rate limit exceeded', 429, response);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

export class NotFoundError extends ApiError {
    constructor(resource, id) {
        super(`${resource} not found: ${id}`, 404);
        this.name = 'NotFoundError';
        this.resource = resource;
        this.id = id;
    }
}

export class NotModifiedError extends ApiError {
    constructor() {
        super('Resource not modified', 304);
        this.name = 'NotModifiedError';
    }
}

export class ValidationError extends ApiError {
    constructor(message, validationErrors) {
        super(message, 400);
        this.name = 'ValidationError';
        this.validationErrors = validationErrors;
    }
}

/**
 * Parse error from API response
 */
export async function parseApiError(response) {
    const statusCode = response.status;

    // Handle specific status codes
    switch (statusCode) {
        case 304:
            return new NotModifiedError();

        case 404:
            return new NotFoundError('Resource', 'unknown');

        case 429: {
            const retryAfter = response.headers.get('X-RateLimit-Reset');
            return new RateLimitError(retryAfter, response);
        }

        case 400: {
            try {
                const data = await response.json();
                return new ValidationError('Validation failed', data);
            } catch {
                return new ApiError('Bad request', 400, response);
            }
        }

        default: {
            try {
                const data = await response.json();
                return new ApiError(
                    data.message || `API error: ${statusCode}`,
                    statusCode,
                    response
                );
            } catch {
                return new ApiError(
                    `API error: ${statusCode}`,
                    statusCode,
                    response
                );
            }
        }
    }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error) {
    // Retry on rate limit errors (after delay)
    if (error instanceof RateLimitError) {
        return true;
    }

    // Retry on 5xx server errors
    if (error instanceof ApiError && error.statusCode >= 500) {
        return true;
    }

    // Retry on network errors
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
        return true;
    }

    return false;
}
