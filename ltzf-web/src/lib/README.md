# LTZF API Library

This directory contains the API client library for fetching data from the LTZF API during static site generation.

## Structure

```
lib/
├── api/                    # API client modules
│   ├── config.js          # API configuration
│   ├── client.js          # API client wrapper with retry logic
│   ├── errors.js          # Custom error classes
│   ├── fetchers.js        # High-level data fetching functions
│   └── index.js           # Main exports
├── data-fetcher.js        # Build-time data fetching with caching
├── constants.js           # Application constants (Bundesländer, labels, etc.)
└── types.d.ts            # TypeScript type definitions

```

## Usage

### Basic API Fetching

```javascript
import { fetchVorgaenge, fetchVorgang } from '@lib/api';

// Fetch all Vorgänge for Bavaria
const vorgaenge = await fetchVorgaenge({
    parlament: 'BY',
    wahlperiode: 18,
    fetchAll: true
});

// Fetch a single Vorgang
const vorgang = await fetchVorgang('uuid-here');
```

### Build-Time Data Fetching (with caching)

```javascript
import { getAllVorgaenge, getVorgang } from '@lib/data-fetcher';

// Fetch with automatic caching
const vorgaenge = await getAllVorgaenge({
    parlament: 'BY',
    wahlperiode: 18
});

// Force refresh (bypass cache)
const freshVorgaenge = await getAllVorgaenge({
    parlament: 'BY',
    forceRefresh: true
});
```

### Using in Astro Pages

```astro
---
import { getAllVorgaenge } from '@lib/data-fetcher';
import { BUNDESLAENDER } from '@lib/constants';

// Fetch data at build time
const vorgaenge = await getAllVorgaenge({ parlament: 'BY' });
const bundesland = BUNDESLAENDER['BY'];
---

<h1>{bundesland.fullName}</h1>
<ul>
  {vorgaenge.map(vg => (
    <li>{vg.titel}</li>
  ))}
</ul>
```

## Configuration

Set these environment variables in `.env`:

```env
PUBLIC_API_URL=https://api.ltzf.example.com
LTZF_API_KEY=your-api-key-here
BUILD_CACHE_DIR=.cache/api
BUILD_CACHE_TTL=3600
```

## Features

### Error Handling
- Custom error classes for different HTTP status codes
- Automatic retry with exponential backoff
- Rate limit detection and handling

### Caching
- Build-time caching to avoid refetching unchanged data
- Configurable TTL (time-to-live)
- `If-Modified-Since` header support for conditional requests

### Pagination
- Automatic pagination handling
- Generator-based iteration for memory efficiency
- `fetchAllPages()` helper to get all results at once

### Type Safety
- TypeScript type definitions for all models
- Type-safe filter parameters
- Comprehensive interface definitions

## API Functions

### Fetchers (raw API access)
- `fetchVorgaenge(filters, options)` - Fetch legislative processes
- `fetchVorgang(id, options)` - Fetch single process
- `fetchSitzungen(filters, options)` - Fetch sessions
- `fetchSitzung(id, options)` - Fetch single session
- `fetchDokument(id)` - Fetch document
- `fetchGremien(filters, options)` - Fetch committees
- `fetchAutoren(filters, options)` - Fetch authors
- `fetchKalender(parlament, datum, options)` - Fetch calendar for date
- `fetchKalenderList(filters, options)` - Fetch calendar with filters
- `fetchEnumeration(name, filters)` - Fetch enumeration values

### Data Fetcher (with caching)
- `getAllVorgaenge(options)` - Get all Vorgänge with caching
- `getVorgang(id, options)` - Get single Vorgang with caching
- `getAllSitzungen(options)` - Get all Sitzungen with caching
- `getSitzung(id, options)` - Get single Sitzung with caching
- `getDokument(id, options)` - Get Dokument with caching
- `getAllGremien(options)` - Get all Gremien with caching
- `getAllDocumentIds(vorgaenge)` - Extract all document IDs
- `calculateStatistics(vorgaenge)` - Calculate statistics
- `clearCache()` - Clear the build cache

### Constants
- `BUNDESLAENDER` - Object mapping state codes to names
- `VORGANGSTYP_LABELS` - Labels for process types
- `STATIONSTYP_LABELS` - Labels for station types
- `DOKTYP_LABELS` - Labels for document types
- `PAGE_PATHS` - URL path generators
- Helper functions for formatting and lookups

## Performance Tips

1. **Use caching**: The data-fetcher module caches responses automatically
2. **Fetch in parallel**: Use `Promise.all()` for independent requests
3. **Use pagination wisely**: Set `fetchAll: false` if you only need one page
4. **Clear cache when needed**: Run `clearCache()` to force fresh data
