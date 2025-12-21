/**
 * document-loader.js
 * Lazy loads document details by UUID on demand
 * Uses Intersection Observer for automatic loading when visible
 */

// Cache for loaded documents
const documentCache = new Map();

// API configuration
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://api.pazufa.de';

/**
 * Fetch document from API
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} Document data
 */
async function fetchDocument(documentId) {
    // Check cache first
    if (documentCache.has(documentId)) {
        return documentCache.get(documentId);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v2/dokument/${documentId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch document: ${response.statusText}`);
        }

        const document = await response.json();

        // Cache the result
        documentCache.set(documentId, document);

        return document;
    } catch (error) {
        console.error(`Error fetching document ${documentId}:`, error);
        throw error;
    }
}

/**
 * Render document item with full data
 * @param {HTMLElement} element - Container element
 * @param {Object} document - Document data
 */
function renderDocument(element, document) {
    const dokumentUrl = `/dokument/${document.api_id}`;

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Get document type label (this mirrors the getDokumenttypLabel function)
    const getDokTypLabel = (typ) => {
        const labels = {
            'preparl-entwurf': 'Vorparlamentarischer Entwurf',
            'entwurf': 'Gesetzesentwurf',
            'antrag': 'Antrag',
            'anfrage': 'Anfrage',
            'antwort': 'Antwort auf Anfrage',
            'mitteilung': 'Mitteilung',
            'beschlussempf': 'Beschlussempfehlung',
            'stellungnahme': 'Stellungnahme',
            'gutachten': 'Gutachten',
            'redeprotokoll': 'Rede-/Sitzungsprotokoll',
            'tops': 'Tagesordnung',
            'tops-aend': 'Tagesordnung (Änderung)',
            'tops-ergz': 'Tagesordnung (Ergänzung)',
            'sonstig': 'Sonstiges',
        };
        return labels[typ] || typ || 'Dokument';
    };

    // Build HTML
    const html = `
        <a href="${dokumentUrl}" class="document-link">
            <div class="document-header">
                <div class="document-meta-left">
                    <span class="document-type">${getDokTypLabel(document.typ) || getDokTypLabel(document.doktyp)}</span>
                    ${document.drucksnr ? `<span class="document-number">Nr. ${document.drucksnr}</span>` : ''}
                </div>
                ${document.datum || document.zp_referenz ? `<time datetime="${document.datum || document.zp_referenz}" class="document-date">${formatDate(document.datum || document.zp_referenz)}</time>` : ''}
            </div>
            <h3 class="document-title">${document.kurztitel || document.titel || 'Ohne Titel'}</h3>
            ${document.autoren && document.autoren.length > 0 ? `
                <p class="document-authors">
                    ${document.autoren.slice(0, 3).map(a => a.person || a.organisation).join(', ')}
                    ${document.autoren.length > 3 ? ` +${document.autoren.length - 3} weitere` : ''}
                </p>
            ` : ''}
            ${document.schlagworte && document.schlagworte.length > 0 ? `
                <div class="document-tags">
                    ${document.schlagworte.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    ${document.schlagworte.length > 3 ? `<span class="tag-more">+${document.schlagworte.length - 3}</span>` : ''}
                </div>
            ` : ''}
            ${document.link ? `
                <div class="document-footer">
                    <span class="external-link-indicator">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.5 1.5L1.5 10.5M10.5 1.5H4.5M10.5 1.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Originalquelle verfügbar
                    </span>
                </div>
            ` : ''}
        </a>
    `;

    element.innerHTML = html;
    element.classList.remove('lazy');
    element.classList.add('loaded');
}

/**
 * Render error state
 * @param {HTMLElement} element - Container element
 * @param {string} documentId - Document UUID
 */
function renderError(element, documentId) {
    element.innerHTML = `
        <div class="document-error">
            <p>Dokument konnte nicht geladen werden</p>
            <button class="retry-button" data-document-id="${documentId}">
                Erneut versuchen
            </button>
        </div>
    `;
    element.classList.add('error');
}

/**
 * Load document and render it
 * @param {HTMLElement} element - Container element with data-document-id
 */
async function loadDocument(element) {
    const documentId = element.dataset.documentId;

    if (!documentId) {
        console.error('No document ID found on element');
        return;
    }

    try {
        const document = await fetchDocument(documentId);
        renderDocument(element, document);
    } catch (error) {
        renderError(element, documentId);
    }
}

/**
 * Initialize lazy loading with Intersection Observer
 */
function initLazyLoading() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all documents immediately
        const lazyElements = document.querySelectorAll('.document-item.lazy');
        lazyElements.forEach(element => loadDocument(element));
        return;
    }

    // Create observer
    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    loadDocument(element);
                    observer.unobserve(element);
                }
            });
        },
        {
            rootMargin: '100px', // Start loading 100px before element is visible
            threshold: 0.1
        }
    );

    // Observe all lazy document elements
    const lazyElements = document.querySelectorAll('.document-item.lazy');
    lazyElements.forEach(element => observer.observe(element));
}

/**
 * Handle retry button clicks
 */
function initRetryHandlers() {
    document.addEventListener('click', (event) => {
        const retryButton = event.target.closest('.retry-button');
        if (retryButton) {
            event.preventDefault();
            const documentId = retryButton.dataset.documentId;
            const element = retryButton.closest('.document-item');

            if (element) {
                // Remove from cache to force fresh fetch
                documentCache.delete(documentId);

                // Reset element
                element.classList.remove('error');
                element.innerHTML = `
                    <div class="loading-placeholder">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-meta"></div>
                    </div>
                `;

                // Load document
                loadDocument(element);
            }
        }
    });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLazyLoading();
        initRetryHandlers();
    });
} else {
    initLazyLoading();
    initRetryHandlers();
}

// Export functions for external use
export { fetchDocument, loadDocument, documentCache };
