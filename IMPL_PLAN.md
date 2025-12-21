# Implementation Plan: LTZF Static Website with Astro

## Overview
Build a static website using Astro to display legislative data from the LTZF API. The site follows a static generation model where data is fetched asynchronously, converted to HTML pages, and can be deployed via rsync.

## Project Structure

```
ltzf-website/
├── ltzf-web/              # Astro project
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   ├── layouts/       # Page layouts
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utility functions & API client
│   │   └── scripts/       # Client-side scripts
│   └── public/            # Static assets
├── oapicode/              # Generated API client
│   └── src/
│       ├── model/         # 27 data models
│       └── api/           # API endpoints
└── oapi-generator/        # OpenAPI spec
```

## Page Structure (from README)

```
/index.html
  /btzf                          # Federal level overview
  /ltzf-overview                 # Overall statistics, newest, best, worst laws
  /ltzf-[Bundesland]             # State-specific pages (e.g., /ltzf-BY for Bavaria)
    /legislaturperioden-archiv   # Archive of legislative periods
    /aktuelle-entwuerfe          # Current drafts
    /frisch                      # Fresh in parliament
    /in-beratung                 # In committees
    /fertig                      # Finished (rejected/passed/published)
    /gesamtuebersicht            # Complete overview
    /gesetzesvorhaben            # Legislative proposals
    /gesetzesvorhaben/{uuid}     # a single legislative proposal
    /dokument/{uuid}             # Document detail pages
    /sitzungen                   # Sessions
    /sitzungen/{uuid}            # a single session. perma-link
```

## Implementation Phases

### Phase 1: Project Setup & Configuration

#### 1.1 Astro Configuration
- **File**: `ltzf-web/astro.config.mjs`
- **Tasks**:
  - Configure static site generation (SSG) mode
  - Set up output directory for generated HTML
  - Configure base path and trailing slash handling
  - Add integrations if needed (sitemap, RSS)

#### 1.2 API Client Integration
- **Directory**: `ltzf-web/src/lib/api/`
- **Tasks**:
  - Create wrapper around generated oapicode client
  - Set up API configuration (base URL, authentication)
  - Implement error handling and retry logic
  - Create data fetching utilities for build-time data access
  - Add TypeScript type definitions based on models

#### 1.3 Data Fetching Strategy
- **File**: `ltzf-web/src/lib/data-fetcher.js`
- **Tasks**:
  - Implement async data fetching during build
  - Create caching mechanism for API responses
  - Implement pagination handling (API returns max 64 items)
  - Add data validation using generated model validators
  - Handle rate limiting (256 requests/second)

### Phase 2: Core Components & Layouts

#### 2.1 Base Layout Components
- **Directory**: `ltzf-web/src/layouts/`
- **Components to create**:
  - `BaseLayout.astro` - Main layout with header, footer, meta tags
  - `LtzfLayout.astro` - Layout for state-specific pages
  - `VorgangLayout.astro` - Layout for legislative process details
  - `SitzungLayout.astro` - Layout for session pages

#### 2.2 Reusable Components
- **Directory**: `ltzf-web/src/components/`
- **Components to create**:
  - `VorgangCard.astro` - Display legislative process summary
  - `StationTimeline.astro` - Timeline of legislative stages
  - `DokumentList.astro` - List of documents with lazy loading
  - `SitzungCard.astro` - Session summary card
  - `Statistics.astro` - Display statistics (newest, best, worst)
  - `NavigationMenu.astro` - Main navigation
  - `BundeslandSelector.astro` - State selector dropdown
  - `Pagination.astro` - Pagination controls
  - `SearchFilter.astro` - Client-side search/filter UI

#### 2.3 Client-Side Scripts
- **Directory**: `ltzf-web/src/scripts/`
- **Scripts to create**:
  - `document-loader.js` - Lazy load documents by UUID on demand
  - `search.js` - Client-side search functionality
  - `filter.js` - Filter legislative processes by type, status
  - `sort.js` - Sort and order lists

### Phase 3: Page Generation

#### 3.1 Index & Overview Pages
- **Files to create**:
  - `src/pages/index.astro` - Main landing page
  - `src/pages/btzf.astro` - Federal overview
  - `src/pages/ltzf-overview.astro` - Overall statistics page

**Data needed**:
  - Aggregate statistics across all parliaments
  - Recent vorgänge (legislative processes)
  - Top rated and worst rated laws

#### 3.2 Bundesland Pages (Dynamic Routes)
- **File**: `src/pages/ltzf-[bundesland]/index.astro`
- **Dynamic routes for**: BB, BY, BE, HB, HH, HE, MV, NI, NW, RP, SL, SN, TH, SH, BW, ST

**Sub-pages to create**:
  - `legislaturperioden-archiv.astro`
  - `aktuelle-entwuerfe.astro`
  - `frisch-im-parlament.astro`
  - `in-den-ausschuessen.astro`
  - `fertig.astro`
  - `gesamtuebersicht/index.astro`

**Data needed**:
  - Filter vorgänge by `parlament` parameter
  - Filter by `wahlperiode` (electoral period)
  - Filter sitzungen by parlament and date

#### 3.3 Gesetzesvorhaben (Legislative Proposal) Pages
- **File**: `src/pages/ltzf-[bundesland]/gesamtuebersicht/gesetzesvorhaben/[id].astro`

**Implementation**:
  - Use `getStaticPaths()` to generate all proposal pages at build time
  - Fetch vorgang by UUID via `/api/v2/vorgang/{vorgang_id}`
  - Display full vorgang details including:
    - Title, type, electoral period
    - Initiators (with authors)
    - Stations (timeline of legislative process)
    - Document placeholders (UUIDs)
    - Lobby register entries if available
  - Add client-side script to lazy load full documents

#### 3.4 Document Detail Pages
- **File**: `src/pages/dokument/[id].astro`

**Implementation**:
  - Generate pages for all documents
  - Fetch document via `/api/v2/dokument/{api_id}`
  - Display:
    - Title, type, dates
    - Authors and affiliations
    - Full text (volltext)
    - Summary (zusammenfassung)
    - Keywords (schlagworte)
    - Opinion rating if applicable

#### 3.5 Session Pages
- **File**: `src/pages/sitzungen/[id].astro`

**Implementation**:
  - Fetch session via `/api/v2/sitzung/{sid}`
  - Display:
    - Session details (date, committee, public/private)
    - Agenda items (TOPs)
    - Associated documents
    - Expert witnesses if applicable

### Phase 4: Data Management & Optimization

#### 4.1 Build-Time Data Fetching
- **File**: `ltzf-web/src/lib/build-data.js`

**Strategy**:
  1. Fetch all vorgänge with pagination
  2. Fetch all sitzungen with pagination
  3. Extract document UUIDs from vorgänge and sitzungen
  4. Store minimal data in static JSON files for client-side features
  5. Pre-generate all static pages

**Caching**:
  - Use `If-Modified-Since` header to avoid refetching unchanged data
  - Cache API responses locally during build
  - Implement incremental builds if possible

#### 4.2 Document Lazy Loading
- **Implementation**:
  - Store document UUIDs in page HTML as data attributes
  - Use client-side JavaScript to fetch documents on demand
  - Cache fetched documents in browser storage
  - Show loading states and error handling

#### 4.3 Performance Optimization
- Implement proper pagination (API max: 64 items per page)
- Use Astro's built-in image optimization
- Minimize client-side JavaScript
- Generate sitemap for SEO
- Add proper meta tags and structured data

### Phase 5: Features & Enhancements

#### 5.1 Statistics & Rankings
- **Pages**: Overview pages show statistics

**Metrics to calculate**:
  - Newest laws (by `zp_modifiziert` date)
  - Most active committees
  - Most productive initiators
  - Laws by type and status
  - Timeline visualizations

#### 5.2 Search & Filtering
- Client-side search through pre-built search index
- Filter by:
  - Vorgangstyp (process type)
  - Parlament (parliament)
  - Wahlperiode (electoral period)
  - Date ranges
  - Authors/Initiators
  - Keywords (schlagworte)

#### 5.3 Calendar View
- **File**: `src/pages/kalender.astro`
- Display sessions by date using `/api/v2/kalender` endpoint
- Month/year navigation
- Committee filtering

### Phase 6: Build & Deployment

#### 6.1 Build Script
- **File**: `ltzf-web/scripts/build.sh`

**Steps**:
  1. Run API client generation (`oapigen.sh`)
  2. Fetch latest data from API
  3. Run Astro build (`astro build`)
  4. Generate deployment artifacts
  5. Validate generated HTML

#### 6.2 Deployment
- Configure rsync deployment script
- Set up deployment to static hosting
- Implement CI/CD if needed
- Schedule regular rebuilds to update data

## Technical Decisions

### Data Models (from oapicode/src/model/)
Key models to use:
- **Vorgang** - Main legislative process
- **Station** - Legislative stages
- **Dokument** - Documents
- **Sitzung** - Sessions
- **Gremium** - Committees
- **Autor** - Authors/Initiators
- **Parlament** - Enum of German parliaments
- **Vorgangstyp** - Types of legislative processes
- **Stationstyp** - Types of legislative stages

### API Endpoints to Use
- `GET /api/v2/vorgang` - List all vorgänge (with filters)
- `GET /api/v2/vorgang/{id}` - Get specific vorgang
- `GET /api/v2/sitzung` - List sessions
- `GET /api/v2/sitzung/{id}` - Get specific session
- `GET /api/v2/dokument/{id}` - Get document (for lazy loading)
- `GET /api/v2/kalender` - Calendar view
- `GET /api/v2/gremien` - List committees
- `GET /api/v2/autoren` - List authors

### Bundesland (State) Codes
Map to full names:
- BT: Bundestag, BR: Bundesrat, BV: Bundesversammlung
- BB: Brandenburg, BY: Bayern, BE: Berlin
- HB: Bremen, HH: Hamburg, HE: Hessen
- MV: Mecklenburg-Vorpommern, NI: Niedersachsen
- NW: Nordrhein-Westfalen, RP: Rheinland-Pfalz
- SL: Saarland, SN: Sachsen, TH: Thüringen
- SH: Schleswig-Holstein, BW: Baden-Württemberg, ST: Sachsen-Anhalt

## Development Workflow

1. **Setup**: Install dependencies, configure API client
2. **Components**: Build reusable components in isolation
3. **Pages**: Create page templates with mock data
4. **Integration**: Connect to real API, test data fetching
5. **Optimization**: Implement caching, lazy loading
6. **Testing**: Validate all pages generate correctly
7. **Deployment**: Set up build and deployment pipeline

## Success Criteria

- All pages from README structure are generated
- Data fetched correctly from API with pagination
- Documents load lazily via JavaScript
- Site can be built statically and deployed via rsync
- Performance is optimized (fast page loads)
- SEO-friendly with proper meta tags and sitemap
- Accessible and responsive design
