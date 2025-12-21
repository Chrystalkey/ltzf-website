/**
 * TypeScript Type Definitions for LTZF API
 * Based on the OpenAPI spec and generated models
 */

// Parliament codes
export type Parlament =
    | 'BT' // Bundestag
    | 'BR' // Bundesrat
    | 'BV' // Bundesversammlung
    | 'EK' // Europakammer
    | 'BB' // Brandenburg
    | 'BY' // Bayern
    | 'BE' // Berlin
    | 'HB' // Bremen
    | 'HH' // Hamburg
    | 'HE' // Hessen
    | 'MV' // Mecklenburg-Vorpommern
    | 'NI' // Niedersachsen
    | 'NW' // Nordrhein-Westfalen
    | 'RP' // Rheinland-Pfalz
    | 'SL' // Saarland
    | 'SN' // Sachsen
    | 'TH' // Thüringen
    | 'SH' // Schleswig-Holstein
    | 'BW' // Baden-Württemberg
    | 'ST'; // Sachsen-Anhalt

// Process types
export type Vorgangstyp =
    | 'gg-einspruch'
    | 'gg-zustimmung'
    | 'gg-land-parl'
    | 'gg-land-volk'
    | 'bw-einsatz'
    | 'sonstig';

// Station types
export type Stationstyp =
    | 'preparl-regent'
    | 'preparl-eckpup'
    | 'preparl-regbsl'
    | 'preparl-vbegde'
    | 'parl-initiativ'
    | 'parl-ausschber'
    | 'parl-vollvlsgn'
    | 'parl-akzeptanz'
    | 'parl-ablehnung'
    | 'parl-zurueckgz'
    | 'parl-ggentwurf'
    | 'postparl-vesja'
    | 'postparl-vesne'
    | 'postparl-gsblt'
    | 'postparl-kraft'
    | 'sonstig';

// Document types
export type Doktyp =
    | 'preparl-entwurf'
    | 'entwurf'
    | 'antrag'
    | 'anfrage'
    | 'antwort'
    | 'mitteilung'
    | 'beschlussempf'
    | 'stellungnahme'
    | 'gutachten'
    | 'redeprotokoll'
    | 'tops'
    | 'tops-aend'
    | 'tops-ergz'
    | 'sonstig';

// Vorgang identifier types
export type VgIdentTyp = 'initdrucks' | 'vorgnr' | 'api-id' | 'sonstig';

// Enumeration names
export type EnumerationNames =
    | 'schlagworte'
    | 'stationstypen'
    | 'vorgangstypen'
    | 'parlamente'
    | 'vgidtypen'
    | 'dokumententypen';

// Core interfaces
export interface Autor {
    person?: string;
    organisation: string;
    fachgebiet?: string;
    lobbyregister?: string;
}

export interface Gremium {
    parlament: Parlament;
    wahlperiode: number;
    name: string;
    link?: string;
}

export interface VgIdent {
    id: string;
    typ: VgIdentTyp;
}

export interface TouchedBy {
    scraper_id?: string;
    key?: string;
}

export interface Dokument {
    api_id?: string;
    touched_by?: TouchedBy[];
    drucksnr?: string;
    typ: Doktyp;
    titel: string;
    kurztitel?: string;
    vorwort?: string;
    volltext: string;
    zusammenfassung?: string;
    zp_modifiziert: string;
    zp_referenz: string;
    zp_erstellt?: string;
    link: string;
    hash: string;
    meinung?: number; // 1-5
    schlagworte?: string[];
    autoren: Autor[];
}

export interface Station {
    api_id?: string;
    touched_by?: TouchedBy[];
    titel?: string;
    zp_start: string;
    zp_modifiziert?: string;
    gremium: Gremium;
    gremium_federf?: boolean;
    link?: string;
    typ: Stationstyp;
    trojanergefahr?: number; // 1-10
    schlagworte?: string[];
    dokumente: (Dokument | string)[]; // Can be full object or UUID
    additional_links?: string[];
    stellungnahmen?: (Dokument | string)[]; // Can be full object or UUID
}

export interface Lobbyregeintrag {
    organisation: Autor;
    interne_id: string;
    intention: string;
    link: string;
    betroffene_drucksachen: string[];
}

export interface Vorgang {
    api_id: string;
    touched_by?: TouchedBy[];
    titel: string;
    kurztitel?: string;
    wahlperiode: number;
    verfassungsaendernd: boolean;
    typ: Vorgangstyp;
    ids?: VgIdent[];
    links?: string[];
    initiatoren: Autor[];
    stationen: Station[];
    lobbyregister?: Lobbyregeintrag[];
}

export interface Top {
    nummer: number;
    titel: string;
    vorgang_id?: string[];
    dokumente?: (Dokument | string)[]; // Can be full object or UUID
}

export interface Sitzung {
    api_id?: string;
    touched_by?: TouchedBy[];
    titel?: string;
    termin: string;
    gremium: Gremium;
    nummer: number;
    public: boolean;
    link?: string;
    tops: Top[];
    dokumente?: (Dokument | string)[]; // Can be full object or UUID
    experten?: Autor[];
}

// API Filter types
export interface VorgangFilters {
    parlament?: Parlament;
    wahlperiode?: number;
    vgtyp?: Vorgangstyp;
    updatedSince?: string;
    updatedUntil?: string;
    autorContains?: string;
    autorFachgebiet?: string;
    autorOrganisation?: string;
    page?: number;
    perPage?: number;
    fetchAll?: boolean;
}

export interface SitzungFilters {
    parlament?: Parlament;
    wahlperiode?: number;
    vorgangId?: string;
    gremium?: string;
    updatedSince?: string;
    updatedUntil?: string;
    page?: number;
    perPage?: number;
    fetchAll?: boolean;
}

export interface GremiumFilters {
    parlament?: Parlament;
    wahlperiode?: number;
    gremium?: string;
    page?: number;
    perPage?: number;
    fetchAll?: boolean;
}

export interface AutorFilters {
    person?: string;
    organisation?: string;
    fachgebiet?: string;
    page?: number;
    perPage?: number;
    fetchAll?: boolean;
}

export interface KalenderFilters {
    parlament?: Parlament;
    wahlperiode?: number;
    gremium?: string;
    year?: number;
    month?: number;
    day?: number;
    updatedSince?: string;
    updatedUntil?: string;
    page?: number;
    perPage?: number;
    fetchAll?: boolean;
}

// Statistics
export interface VorgangStatistics {
    total: number;
    byType: Record<string, number>;
    byParlament: Record<string, number>;
    newest: Vorgang[];
    oldest: Vorgang[];
}

// Pagination metadata
export interface PaginationMeta {
    totalCount: number;
    totalPages: number;
    page: number;
    perPage: number;
}

// API Response with pagination
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

// Rate limit headers
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: string;
}
