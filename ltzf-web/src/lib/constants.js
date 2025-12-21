/**
 * Application Constants
 * Shared constants used throughout the application
 */

/**
 * Bundesland (German state) mappings
 */
export const BUNDESLAENDER = {
    // Federal level
    BT: { code: 'BT', name: 'Bundestag', fullName: 'Deutscher Bundestag', type: 'federal' },
    BR: { code: 'BR', name: 'Bundesrat', fullName: 'Bundesrat', type: 'federal' },
    BV: {
        code: 'BV',
        name: 'Bundesversammlung',
        fullName: 'Bundesversammlung',
        type: 'federal',
    },
    EK: {
        code: 'EK',
        name: 'Europakammer',
        fullName: 'Europakammer des Bundesrats',
        type: 'federal',
    },

    // States (alphabetically)
    BB: { code: 'BB', name: 'Brandenburg', fullName: 'Landtag Brandenburg', type: 'state' },
    BE: { code: 'BE', name: 'Berlin', fullName: 'Abgeordnetenhaus von Berlin', type: 'state' },
    BW: {
        code: 'BW',
        name: 'Baden-Württemberg',
        fullName: 'Landtag Baden-Württemberg',
        type: 'state',
    },
    BY: { code: 'BY', name: 'Bayern', fullName: 'Bayerischer Landtag', type: 'state' },
    HB: { code: 'HB', name: 'Bremen', fullName: 'Bremische Bürgerschaft', type: 'state' },
    HE: { code: 'HE', name: 'Hessen', fullName: 'Hessischer Landtag', type: 'state' },
    HH: { code: 'HH', name: 'Hamburg', fullName: 'Hamburgische Bürgerschaft', type: 'state' },
    MV: {
        code: 'MV',
        name: 'Mecklenburg-Vorpommern',
        fullName: 'Landtag Mecklenburg-Vorpommern',
        type: 'state',
    },
    NI: { code: 'NI', name: 'Niedersachsen', fullName: 'Niedersächsischer Landtag', type: 'state' },
    NW: {
        code: 'NW',
        name: 'Nordrhein-Westfalen',
        fullName: 'Landtag Nordrhein-Westfalen',
        type: 'state',
    },
    RP: {
        code: 'RP',
        name: 'Rheinland-Pfalz',
        fullName: 'Landtag Rheinland-Pfalz',
        type: 'state',
    },
    SH: {
        code: 'SH',
        name: 'Schleswig-Holstein',
        fullName: 'Schleswig-Holsteinischer Landtag',
        type: 'state',
    },
    SL: { code: 'SL', name: 'Saarland', fullName: 'Landtag des Saarlandes', type: 'state' },
    SN: { code: 'SN', name: 'Sachsen', fullName: 'Sächsischer Landtag', type: 'state' },
    ST: { code: 'ST', name: 'Sachsen-Anhalt', fullName: 'Landtag Sachsen-Anhalt', type: 'state' },
    TH: { code: 'TH', name: 'Thüringen', fullName: 'Thüringer Landtag', type: 'state' },
};

/**
 * Get all state codes (excluding federal)
 */
export function getStateCodes() {
    return Object.keys(BUNDESLAENDER).filter(
        code => BUNDESLAENDER[code].type === 'state'
    );
}

/**
 * Get all federal codes
 */
export function getFederalCodes() {
    return Object.keys(BUNDESLAENDER).filter(
        code => BUNDESLAENDER[code].type === 'federal'
    );
}

/**
 * Vorgangstyp (process type) labels
 */
export const VORGANGSTYP_LABELS = {
    'gg-einspruch': 'Bundesgesetz (Einspruch)',
    'gg-zustimmung': 'Bundesgesetz (Zustimmungspflichtig)',
    'gg-land-parl': 'Landesgesetz (parlamentarisch)',
    'gg-land-volk': 'Landesgesetz (Volksgesetzgebung)',
    'bw-einsatz': 'Bundeswehreinsatz',
    sonstig: 'Sonstiges',
};

/**
 * Stationstyp (station type) labels
 */
export const STATIONSTYP_LABELS = {
    'preparl-regent': 'Referentenentwurf / Regierungsentwurf',
    'preparl-eckpup': 'Eckpunktepapier / Parlamentsentwurf',
    'preparl-regbsl': 'Kabinettsbeschluss / Regierungsbeschluss',
    'preparl-vbegde': 'Volksbegehren / Diskussionsentwurf',
    'parl-initiativ': 'Gesetzesinitiative',
    'parl-ausschber': 'Beratung im Ausschuss',
    'parl-vollvlsgn': 'Vollversammlung / Lesung',
    'parl-akzeptanz': 'Schlussabstimmung & Akzeptanz',
    'parl-ablehnung': 'Schlussabstimmung & Ablehnung',
    'parl-zurueckgz': 'Rückzug des Vorhabens',
    'parl-ggentwurf': 'Gegenentwurf auf abgelehntes Volksbegehren',
    'postparl-vesja': 'Volksentscheid (Akzeptanz)',
    'postparl-vesne': 'Volksentscheid (Ablehnung)',
    'postparl-gsblt': 'Veröffentlichung im Gesetzesblatt',
    'postparl-kraft': 'In Kraft getreten',
    sonstig: 'Sonstiges',
};

/**
 * Dokumenttyp (document type) labels
 */
export const DOKTYP_LABELS = {
    'preparl-entwurf': 'Vorparlamentarischer Entwurf',
    entwurf: 'Gesetzesentwurf',
    antrag: 'Antrag',
    anfrage: 'Anfrage',
    antwort: 'Antwort auf Anfrage',
    mitteilung: 'Mitteilung',
    beschlussempf: 'Beschlussempfehlung',
    stellungnahme: 'Stellungnahme',
    gutachten: 'Gutachten',
    redeprotokoll: 'Rede-/Sitzungsprotokoll',
    tops: 'Tagesordnung',
    'tops-aend': 'Tagesordnung (Änderung)',
    'tops-ergz': 'Tagesordnung (Ergänzung)',
    sonstig: 'Sonstiges',
};

/**
 * Page structure paths (from README)
 */
export const PAGE_PATHS = {
    index: '/',
    btzf: '/btzf',
    overview: '/ltzf-overview',
    bundesland: (code) => `/ltzf-${code}`,
    archiv: (code) => `/ltzf-${code}/legislaturperioden-archiv`,
    entwuerfe: (code) => `/ltzf-${code}/aktuelle-entwuerfe`,
    frisch: (code) => `/ltzf-${code}/frisch`,
    beratung: (code) => `/ltzf-${code}/in-beratung`,
    fertig: (code) => `/ltzf-${code}/fertig`,
    uebersicht: (code) => `/ltzf-${code}/gesamtuebersicht`,
    gesetzesvorhaben: (code) => `/ltzf-${code}/gesetzesvorhaben`,
    vorgang: (code, id) => `/ltzf-${code}/gesetzesvorhaben/${id}`,
    dokument: (id) => `/dokument/${id}`,
    sitzungen: (code) => `/ltzf-${code}/sitzungen`,
    sitzung: (code, id) => `/ltzf-${code}/sitzungen/${id}`,
};

/**
 * Special gremium names
 */
export const SPECIAL_GREMIEN = {
    plenum: 'Plenum',
    regierung: 'Regierung',
    volk: 'Volk',
};

/**
 * Default date formats
 */
export const DATE_FORMATS = {
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYear: { year: 'numeric', month: 'long' },
};

/**
 * Helper: Format date in German locale
 */
export function formatDate(dateString, format = 'long') {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', DATE_FORMATS[format]);
}

/**
 * Helper: Get label for Vorgangstyp
 */
export function getVorgangstypLabel(typ) {
    return VORGANGSTYP_LABELS[typ] || typ;
}

/**
 * Helper: Get label for Stationstyp
 */
export function getStationstypLabel(typ) {
    return STATIONSTYP_LABELS[typ] || typ;
}

/**
 * Helper: Get label for Dokumenttyp
 */
export function getDokumenttypLabel(typ) {
    return DOKTYP_LABELS[typ] || typ;
}

/**
 * Helper: Get Bundesland info
 */
export function getBundesland(code) {
    return BUNDESLAENDER[code] || null;
}
