/**
 * sort.js
 * Client-side sorting functionality for lists
 * Supports sorting by various criteria with ascending/descending order
 */

/**
 * Extract sortable value from element
 * @param {HTMLElement} element - Element to extract value from
 * @param {string} sortBy - Sort criteria
 * @returns {string|number|Date} Sortable value
 */
function getSortValue(element, sortBy) {
    // Check for data attribute first
    const dataAttr = `data-sort-${sortBy}`;
    if (element.hasAttribute(dataAttr)) {
        const value = element.getAttribute(dataAttr);

        // Try to parse as date
        if (sortBy.includes('date') || sortBy.includes('datum')) {
            return new Date(value);
        }

        // Try to parse as number
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            return numValue;
        }

        return value;
    }

    // Fallback to specific selectors based on sort criteria
    switch (sortBy) {
        case 'title':
        case 'titel':
            return element.querySelector('.card-title')?.textContent?.trim().toLowerCase() || '';

        case 'date':
        case 'datum':
            const timeElement = element.querySelector('time');
            if (timeElement && timeElement.dateTime) {
                return new Date(timeElement.dateTime);
            }
            return new Date(0); // Default to epoch if no date found

        case 'type':
        case 'typ':
            return element.querySelector('.vorgang-type, .document-type')?.textContent?.trim() || '';

        case 'parlament':
            return element.querySelector('.parlament-badge')?.textContent?.trim() || '';

        case 'wahlperiode':
            const wpText = element.querySelector('.wahlperiode')?.textContent?.trim() || '';
            const wpNum = parseInt(wpText.replace(/\D/g, ''));
            return isNaN(wpNum) ? 0 : wpNum;

        case 'document-count':
            const docCount = element.querySelector('.document-count')?.textContent?.trim() || '0';
            return parseInt(docCount.replace(/\D/g, '')) || 0;

        default:
            return '';
    }
}

/**
 * Compare two values for sorting
 * @param {any} a - First value
 * @param {any} b - Second value
 * @param {boolean} ascending - Sort direction
 * @returns {number} Comparison result
 */
function compareValues(a, b, ascending = true) {
    let comparison = 0;

    if (a instanceof Date && b instanceof Date) {
        comparison = a.getTime() - b.getTime();
    } else if (typeof a === 'number' && typeof b === 'number') {
        comparison = a - b;
    } else {
        // String comparison
        const strA = String(a).toLowerCase();
        const strB = String(b).toLowerCase();
        comparison = strA.localeCompare(strB, 'de');
    }

    return ascending ? comparison : -comparison;
}

/**
 * Sort array of elements
 * @param {HTMLElement[]} elements - Elements to sort
 * @param {string} sortBy - Sort criteria
 * @param {boolean} ascending - Sort direction
 * @returns {HTMLElement[]} Sorted elements
 */
function sortElements(elements, sortBy, ascending = true) {
    return [...elements].sort((a, b) => {
        const valueA = getSortValue(a, sortBy);
        const valueB = getSortValue(b, sortBy);
        return compareValues(valueA, valueB, ascending);
    });
}

/**
 * Apply sort order to DOM
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement[]} sortedElements - Sorted elements
 */
function applySortToDOM(container, sortedElements) {
    // Create document fragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();

    sortedElements.forEach(element => {
        fragment.appendChild(element);
    });

    container.appendChild(fragment);
}

/**
 * Initialize sort functionality
 * @param {Object} options - Configuration options
 * @param {string} options.containerSelector - Selector for container with sortable items
 * @param {string} options.itemSelector - Selector for individual sortable items
 * @param {string} options.sortSelectId - ID of sort criteria select element
 * @param {string} options.orderButtonId - ID of sort order toggle button
 * @param {string} options.defaultSort - Default sort criteria
 * @param {boolean} options.defaultAscending - Default sort direction
 * @param {Function} options.onSort - Callback function when sort is applied
 */
function initSort(options) {
    const {
        containerSelector = '.sortable-container',
        itemSelector = '.sortable-item',
        sortSelectId = 'sort-select',
        orderButtonId = 'sort-order-button',
        defaultSort = 'date',
        defaultAscending = false,
        onSort = null
    } = options;

    const container = document.querySelector(containerSelector);
    const sortSelect = document.getElementById(sortSelectId);
    const orderButton = document.getElementById(orderButtonId);

    if (!container) {
        console.warn('Sort initialization failed: container not found');
        return;
    }

    // State
    let currentSort = defaultSort;
    let currentAscending = defaultAscending;

    // Get all items
    function getItems() {
        return Array.from(container.querySelectorAll(itemSelector));
    }

    // Update order button icon/text
    function updateOrderButton() {
        if (orderButton) {
            orderButton.textContent = currentAscending ? '↑ Aufsteigend' : '↓ Absteigend';
            orderButton.setAttribute('aria-label', currentAscending ? 'Aufsteigend sortiert' : 'Absteigend sortiert');
        }
    }

    // Apply current sort
    function applySort() {
        const items = getItems();
        const sortedItems = sortElements(items, currentSort, currentAscending);
        applySortToDOM(container, sortedItems);

        // Call callback if provided
        if (onSort) {
            onSort({
                sortBy: currentSort,
                ascending: currentAscending,
                itemCount: items.length
            });
        }
    }

    // Event listeners
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            applySort();
        });

        // Set initial value
        sortSelect.value = currentSort;
    }

    if (orderButton) {
        orderButton.addEventListener('click', () => {
            currentAscending = !currentAscending;
            updateOrderButton();
            applySort();
        });

        updateOrderButton();
    }

    // Initial sort
    applySort();

    // Return API for external control
    return {
        sort: (sortBy, ascending) => {
            currentSort = sortBy;
            currentAscending = ascending;
            if (sortSelect) sortSelect.value = sortBy;
            updateOrderButton();
            applySort();
        },
        getCurrentSort: () => ({ sortBy: currentSort, ascending: currentAscending }),
        refresh: applySort
    };
}

/**
 * Create sort select options
 * @param {Array} sortOptions - Array of {value, label} objects
 * @returns {string} HTML for select options
 */
function createSortOptions(sortOptions) {
    return sortOptions
        .map(option => `<option value="${option.value}">${option.label}</option>`)
        .join('');
}

/**
 * Create a sort control UI
 * @param {Object} config - Configuration
 * @returns {HTMLElement} Sort control element
 */
function createSortControl(config) {
    const {
        sortOptions = [
            { value: 'date', label: 'Datum' },
            { value: 'title', label: 'Titel' },
            { value: 'type', label: 'Typ' }
        ],
        sortSelectId = 'sort-select',
        orderButtonId = 'sort-order-button',
        defaultSort = 'date',
        defaultAscending = false
    } = config;

    const container = document.createElement('div');
    container.className = 'sort-control';

    container.innerHTML = `
        <div class="sort-group">
            <label for="${sortSelectId}" class="sort-label">Sortieren nach:</label>
            <select id="${sortSelectId}" class="sort-select">
                ${createSortOptions(sortOptions)}
            </select>
            <button type="button" id="${orderButtonId}" class="sort-order-button">
                ${defaultAscending ? '↑ Aufsteigend' : '↓ Absteigend'}
            </button>
        </div>
    `;

    // Set default value
    const select = container.querySelector(`#${sortSelectId}`);
    if (select) {
        select.value = defaultSort;
    }

    return container;
}

// Export functions
export {
    getSortValue,
    compareValues,
    sortElements,
    applySortToDOM,
    initSort,
    createSortOptions,
    createSortControl
};
