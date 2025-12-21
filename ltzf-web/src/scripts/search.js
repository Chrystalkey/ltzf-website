/**
 * search.js
 * Client-side search functionality for legislative processes
 * Implements fuzzy search across titles, descriptions, and metadata
 */

/**
 * Normalize text for searching (lowercase, remove diacritics)
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .trim();
}

/**
 * Check if text matches search query
 * @param {string} text - Text to search in
 * @param {string} query - Search query
 * @returns {boolean} True if matches
 */
function matchesQuery(text, query) {
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(query);

    // Split query into words
    const queryWords = normalizedQuery.split(/\s+/);

    // Check if all query words are found in text
    return queryWords.every(word => normalizedText.includes(word));
}

/**
 * Search through items based on query
 * @param {HTMLElement[]} items - Array of DOM elements to search
 * @param {string} query - Search query
 * @param {Function} getSearchableText - Function to extract searchable text from element
 * @returns {HTMLElement[]} Filtered items that match query
 */
function searchItems(items, query, getSearchableText) {
    if (!query || query.trim() === '') {
        return items;
    }

    return items.filter(item => {
        const searchableText = getSearchableText(item);
        return matchesQuery(searchableText, query);
    });
}

/**
 * Extract searchable text from a Vorgang card
 * @param {HTMLElement} card - Vorgang card element
 * @returns {string} Searchable text
 */
function getVorgangSearchableText(card) {
    const title = card.querySelector('.card-title')?.textContent || '';
    const summary = card.querySelector('.summary')?.textContent || '';
    const type = card.querySelector('.vorgang-type')?.textContent || '';
    const initiators = card.querySelector('.initiators-list')?.textContent || '';

    return `${title} ${summary} ${type} ${initiators}`;
}

/**
 * Extract searchable text from a Sitzung card
 * @param {HTMLElement} card - Sitzung card element
 * @returns {string} Searchable text
 */
function getSitzungSearchableText(card) {
    const title = card.querySelector('.card-title')?.textContent || '';
    const parlament = card.querySelector('.parlament-badge')?.textContent || '';
    const date = card.querySelector('time')?.textContent || '';

    return `${title} ${parlament} ${date}`;
}

/**
 * Extract searchable text from a Document item
 * @param {HTMLElement} item - Document item element
 * @returns {string} Searchable text
 */
function getDokumentSearchableText(item) {
    const title = item.querySelector('.document-title')?.textContent || '';
    const type = item.querySelector('.document-type')?.textContent || '';
    const authors = item.querySelector('.document-authors')?.textContent || '';
    const tags = Array.from(item.querySelectorAll('.tag')).map(t => t.textContent).join(' ');

    return `${title} ${type} ${authors} ${tags}`;
}

/**
 * Initialize search functionality
 * @param {Object} options - Configuration options
 * @param {string} options.inputId - ID of search input element
 * @param {string} options.containerSelector - Selector for container with searchable items
 * @param {string} options.itemSelector - Selector for individual searchable items
 * @param {string} options.itemType - Type of items ('vorgang', 'sitzung', 'dokument')
 * @param {string} options.resultCountId - ID of element to display result count
 * @param {Function} options.onSearch - Callback function when search is performed
 */
function initSearch(options) {
    const {
        inputId = 'search-input',
        containerSelector = '.searchable-container',
        itemSelector = '.searchable-item',
        itemType = 'vorgang',
        resultCountId = 'result-count',
        onSearch = null
    } = options;

    const searchInput = document.getElementById(inputId);
    const container = document.querySelector(containerSelector);
    const resultCountElement = document.getElementById(resultCountId);

    if (!searchInput || !container) {
        console.warn('Search initialization failed: missing elements');
        return;
    }

    // Get all items
    const items = Array.from(container.querySelectorAll(itemSelector));

    // Choose appropriate text extractor based on item type
    let getSearchableText;
    switch (itemType) {
        case 'sitzung':
            getSearchableText = getSitzungSearchableText;
            break;
        case 'dokument':
            getSearchableText = getDokumentSearchableText;
            break;
        case 'vorgang':
        default:
            getSearchableText = getVorgangSearchableText;
            break;
    }

    // Perform search
    function performSearch() {
        const query = searchInput.value;
        const matchingItems = searchItems(items, query, getSearchableText);

        // Hide/show items
        items.forEach(item => {
            if (matchingItems.includes(item)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        // Update result count
        if (resultCountElement) {
            const count = matchingItems.length;
            const total = items.length;
            resultCountElement.textContent = query
                ? `${count} von ${total} Ergebnissen`
                : `${total} Ergebnisse`;
        }

        // Call callback if provided
        if (onSearch) {
            onSearch({
                query,
                matchingItems,
                totalItems: items.length,
                matchCount: matchingItems.length
            });
        }
    }

    // Debounce search input
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 300);
    });

    // Initial display
    performSearch();
}

/**
 * Create a search index for faster searching
 * @param {Array} data - Array of objects to index
 * @param {string[]} fields - Fields to include in search index
 * @returns {Map} Search index
 */
function createSearchIndex(data, fields) {
    const index = new Map();

    data.forEach((item, idx) => {
        const searchableText = fields
            .map(field => {
                const value = field.split('.').reduce((obj, key) => obj?.[key], item);
                return value || '';
            })
            .join(' ');

        index.set(idx, {
            item,
            searchableText: normalizeText(searchableText)
        });
    });

    return index;
}

/**
 * Search through indexed data
 * @param {Map} index - Search index
 * @param {string} query - Search query
 * @returns {Array} Matching items
 */
function searchIndex(index, query) {
    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/);
    const results = [];

    index.forEach((entry) => {
        const matches = queryWords.every(word => entry.searchableText.includes(word));
        if (matches) {
            results.push(entry.item);
        }
    });

    return results;
}

// Export functions
export {
    normalizeText,
    matchesQuery,
    searchItems,
    getVorgangSearchableText,
    getSitzungSearchableText,
    getDokumentSearchableText,
    initSearch,
    createSearchIndex,
    searchIndex
};
