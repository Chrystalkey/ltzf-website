/**
 * filter.js
 * Client-side filtering for legislative processes
 * Supports multiple filter criteria and combinations
 */

/**
 * Extract filter value from a card element
 * @param {HTMLElement} card - Card element
 * @param {string} filterName - Name of the filter attribute
 * @returns {string} Filter value
 */
function getFilterValue(card, filterName) {
    // Check data attribute first
    const dataAttr = `data-${filterName}`;
    if (card.hasAttribute(dataAttr)) {
        return card.getAttribute(dataAttr) || '';
    }

    // Fallback to specific selectors based on filter name
    switch (filterName) {
        case 'vorgangstyp':
            return card.querySelector('.vorgang-type')?.textContent?.trim() || '';
        case 'parlament':
            return card.querySelector('.parlament-badge')?.textContent?.trim() || '';
        case 'wahlperiode':
            const wpText = card.querySelector('.wahlperiode')?.textContent?.trim() || '';
            return wpText.replace(/\.\s*WP/, '').trim();
        case 'status':
            return card.querySelector('.status-value')?.textContent?.trim() || '';
        default:
            return '';
    }
}

/**
 * Check if card matches filter criteria
 * @param {HTMLElement} card - Card element
 * @param {Object} filters - Active filter values
 * @returns {boolean} True if card matches all filters
 */
function matchesFilters(card, filters) {
    return Object.entries(filters).every(([filterName, filterValue]) => {
        // Empty filter value means "show all"
        if (!filterValue || filterValue === '') {
            return true;
        }

        const cardValue = getFilterValue(card, filterName);
        return cardValue === filterValue;
    });
}

/**
 * Apply filters to items
 * @param {HTMLElement[]} items - Array of DOM elements to filter
 * @param {Object} filters - Active filter values
 * @returns {HTMLElement[]} Filtered items
 */
function filterItems(items, filters) {
    return items.filter(item => matchesFilters(item, filters));
}

/**
 * Initialize filter functionality
 * @param {Object} options - Configuration options
 * @param {string} options.containerSelector - Selector for container with filterable items
 * @param {string} options.itemSelector - Selector for individual filterable items
 * @param {string[]} options.filterNames - Array of filter names to track
 * @param {string} options.resultCountId - ID of element to display result count
 * @param {string} options.searchInputId - ID of search input (to combine with search)
 * @param {Function} options.onFilter - Callback function when filters are applied
 */
function initFilter(options) {
    const {
        containerSelector = '.filterable-container',
        itemSelector = '.filterable-item',
        filterNames = [],
        resultCountId = 'result-count',
        searchInputId = 'search-input',
        onFilter = null
    } = options;

    const container = document.querySelector(containerSelector);
    const resultCountElement = document.getElementById(resultCountId);
    const searchInput = document.getElementById(searchInputId);

    if (!container) {
        console.warn('Filter initialization failed: container not found');
        return;
    }

    // Get all items
    const items = Array.from(container.querySelectorAll(itemSelector));

    // Get all filter select elements
    const filterSelects = filterNames.map(name => {
        return document.querySelector(`[data-filter-name="${name}"]`);
    }).filter(Boolean);

    if (filterSelects.length === 0) {
        console.warn('No filter selects found');
        return;
    }

    // Get current filter values
    function getCurrentFilters() {
        const filters = {};
        filterSelects.forEach(select => {
            const filterName = select.dataset.filterName;
            filters[filterName] = select.value;
        });
        return filters;
    }

    // Get current search query
    function getCurrentSearchQuery() {
        return searchInput ? searchInput.value.toLowerCase().trim() : '';
    }

    // Check if item matches search query
    function matchesSearch(item, query) {
        if (!query) return true;

        const searchableText = item.textContent.toLowerCase();
        const queryWords = query.split(/\s+/);
        return queryWords.every(word => searchableText.includes(word));
    }

    // Apply all filters and search
    function applyFilters() {
        const filters = getCurrentFilters();
        const searchQuery = getCurrentSearchQuery();

        let visibleCount = 0;

        items.forEach(item => {
            const matchesFiltersCheck = matchesFilters(item, filters);
            const matchesSearchCheck = matchesSearch(item, searchQuery);

            if (matchesFiltersCheck && matchesSearchCheck) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Update result count
        if (resultCountElement) {
            const total = items.length;
            const hasActiveFilters = Object.values(filters).some(v => v !== '') || searchQuery !== '';

            if (hasActiveFilters) {
                resultCountElement.textContent = `${visibleCount} von ${total} Ergebnissen`;
            } else {
                resultCountElement.textContent = `${total} Ergebnisse`;
            }
        }

        // Call callback if provided
        if (onFilter) {
            onFilter({
                filters,
                searchQuery,
                visibleCount,
                totalCount: items.length
            });
        }
    }

    // Add event listeners to filter selects
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });

    // Add event listener to search input if it exists
    if (searchInput) {
        let searchDebounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(applyFilters, 300);
        });
    }

    // Add event listener to reset button
    const resetButton = document.getElementById('filter-reset');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Reset all filter selects
            filterSelects.forEach(select => {
                select.value = '';
            });

            // Reset search input
            if (searchInput) {
                searchInput.value = '';
            }

            // Apply filters (will show all)
            applyFilters();
        });
    }

    // Initial application
    applyFilters();

    // Return cleanup function
    return () => {
        filterSelects.forEach(select => {
            select.removeEventListener('change', applyFilters);
        });
        if (searchInput) {
            searchInput.removeEventListener('input', applyFilters);
        }
    };
}

/**
 * Build filter options from items
 * @param {HTMLElement[]} items - Array of items to analyze
 * @param {string} filterName - Name of the filter
 * @returns {Array<{value: string, label: string, count: number}>} Filter options with counts
 */
function buildFilterOptions(items, filterName) {
    const counts = new Map();

    items.forEach(item => {
        const value = getFilterValue(item, filterName);
        if (value) {
            counts.set(value, (counts.get(value) || 0) + 1);
        }
    });

    const options = Array.from(counts.entries())
        .map(([value, count]) => ({
            value,
            label: value,
            count
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    return options;
}

/**
 * Populate filter select with options
 * @param {HTMLSelectElement} select - Select element
 * @param {Array} options - Filter options
 * @param {boolean} showCounts - Whether to show counts in labels
 */
function populateFilterSelect(select, options, showCounts = true) {
    // Clear existing options except the first one (usually "All")
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Add new options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = showCounts
            ? `${option.label} (${option.count})`
            : option.label;
        select.appendChild(optionElement);
    });
}

/**
 * Initialize dynamic filter options
 * @param {Object} options - Configuration options
 */
function initDynamicFilters(options) {
    const {
        containerSelector = '.filterable-container',
        itemSelector = '.filterable-item',
        filterConfigs = [] // Array of {name, selectId, showCounts}
    } = options;

    const container = document.querySelector(containerSelector);
    if (!container) return;

    const items = Array.from(container.querySelectorAll(itemSelector));

    filterConfigs.forEach(config => {
        const select = document.getElementById(config.selectId);
        if (!select) return;

        const filterOptions = buildFilterOptions(items, config.name);
        populateFilterSelect(select, filterOptions, config.showCounts !== false);
    });
}

// Export functions
export {
    getFilterValue,
    matchesFilters,
    filterItems,
    initFilter,
    buildFilterOptions,
    populateFilterSelect,
    initDynamicFilters
};
