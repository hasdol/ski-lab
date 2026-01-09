export const mapRankingsToTournamentData = (rankings, selectedSkis) => {
  // Map each ranking to include the necessary ski data
  return {
    rankings: rankings.map(({ cumulativeScore, skiId }) => {
      const ski = (selectedSkis || []).find(s => s.id === skiId);
      const score = Number.isFinite(Number(cumulativeScore)) ? Number(cumulativeScore) : 0;

      if (!ski) {
        console.error(`Ski with id ${skiId} not found in provided ski list`);
        return {
          score,
          skiId,
          serialNumber: 'Unknown',
          grind: 'Unknown',
          brand: 'Unknown',
          model: 'Unknown',
          base: 'Unknown',
          length: null,
          stiffness: '',
          skiType: '',
          style: '',
          construction: '',
          grindDate: null,
          dateAdded: null
        };
      }

      // Return a richer snapshot of the ski at save-time
      return {
        score,
        skiId: ski.id,
        serialNumber: ski.serialNumber ?? '',
        brand: ski.brand ?? '',
        model: ski.model ?? '',
        base: ski.base ?? '',
        length: ski.length ?? null,
        stiffness: ski.stiffness ?? '',
        skiType: ski.skiType ?? '',
        style: ski.style ?? '',
        construction: ski.construction ?? '',
        grind: ski.grind ?? '',
        grindDate: ski.grindDate ?? null, // Timestamp or null
        dateAdded: ski.dateAdded ?? null,  // Timestamp or null

        // Optional: event product tests (pseudo-ski entries)
        ...(ski.productId ? { productId: ski.productId } : {}),
        ...(ski.productBrand ? { productBrand: ski.productBrand } : {}),
        ...(ski.productName ? { productName: ski.productName } : {}),
        ...(ski.teamSkiId ? { teamSkiId: ski.teamSkiId } : {}),
      };
    })
  };
};

export const isNew = (ski) => {
  if (!ski.dateAdded) return false; // If dateAdded is not available, return false

  // Get the date six months ago from now
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 6);

  // Convert Firebase Timestamp to JavaScript Date if necessary
  let dateAdded;
  if (ski.dateAdded.toDate) {
    // If dateAdded is a Firebase Timestamp
    dateAdded = ski.dateAdded.toDate();
  } else {
    // If dateAdded is already a JavaScript Date or a valid date string
    dateAdded = new Date(ski.dateAdded);
  }

  return dateAdded >= twoMonthsAgo;
};


export const formatDateForInputWithTime = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  if (isNaN(date.getTime())) {
    return '';
  }
  const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};


export const DEFAULT_DATE_LOCALE = 'nb-NO';
export const DEFAULT_DATE_TIME_ZONE = 'Europe/Oslo';

export const toJsDate = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput?.toDate === 'function') {
    const d = dateInput.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  if (dateInput instanceof Date) {
    return !isNaN(dateInput.getTime()) ? dateInput : null;
  }
  const d = new Date(dateInput);
  return d instanceof Date && !isNaN(d.getTime()) ? d : null;
};

export const formatDateWithOptions = (
  dateInput,
  options = {},
  {
    locale = DEFAULT_DATE_LOCALE,
    timeZone = DEFAULT_DATE_TIME_ZONE,
    fallback = '--',
  } = {}
) => {
  const d = toJsDate(dateInput);
  if (!d) return fallback;

  try {
    return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(d);
  } catch {
    // If Intl/timeZone isn't available for some reason, fall back gracefully.
    return d.toLocaleString(locale);
  }
};

export const getOsloDateKey = (dateInput) => {
  const d = toJsDate(dateInput);
  if (!d) return null;
  const parts = new Intl.DateTimeFormat(DEFAULT_DATE_LOCALE, {
    timeZone: DEFAULT_DATE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
};

// For native <input type="date"/> values (always expects/returns yyyy-mm-dd)
export const formatDateForInput = (dateInput) => {
  const d = toJsDate(dateInput);
  if (!d) return '';

  // Use Oslo time zone to avoid date shifting around midnight UTC.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DEFAULT_DATE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) return '';
  return `${year}-${month}-${day}`;
};

export const parseDateInput = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

export const formatTimeShort = (dateInput) =>
  formatDateWithOptions(dateInput, { hour: '2-digit', minute: '2-digit' });

export const formatWeekdayShort = (dateInput) =>
  formatDateWithOptions(dateInput, { weekday: 'short' });

export const formatDayMonthShort = (dateInput) =>
  formatDateWithOptions(dateInput, { day: '2-digit', month: 'short' });

export const formatDateRange = (start, end) => {
  const a = toJsDate(start);
  const b = toJsDate(end);
  if (!a && !b) return '';
  if (a && !b) return formatDate(a);
  if (!a && b) return formatDate(b);
  return `${formatDate(a)} – ${formatDate(b)}`;
};



export const formatDate = (dateInput, withTime = false) => {
  if (!dateInput) return '--';

  return withTime
    ? formatDateWithOptions(dateInput, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : formatDateWithOptions(dateInput, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
};

export const getTimestamp = (date) => {
  if (!date) return null;
  if (date.toMillis) {
    // Firestore Timestamp object
    return date.toMillis();
  }
  // If date is already a timestamp or date string
  return new Date(date).getTime();
};


export const getSeason = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is zero-based

  if (month >= 10) { // October to December
    return `${year}-${year + 1}`; // Winter Season
  } else if (month <= 4) { // January to April
    return `${year - 1}-${year}`; // Winter Season
  } else if (month >= 5 && month <= 9) { // May to September
    return `Summer ${year}`; // Summer Season
  } else {
    return null; // Undefined or Off-Season
  }
};

export function formatSnowTypeLabel(snowType) {
  if (!snowType) return '--';
  return snowType
    .replace(/_/g, ' ')             // Replace underscores with spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize each word
}

export function formatSourceLabel(source) {
  if (!source) return '--';
  return source.charAt(0).toUpperCase() + source.slice(1); // Just capitalize first letter
}

export function highlightSearchTerm(text, term) {
  if (!term) return text;
  return text
    .split(new RegExp(`(${term})`, 'gi'))
    .map((part, i) =>
      part.toLowerCase() === term ? (
        <mark key={i} className="bg-yellow-200 text-gray-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
}

// Single canonical implementation
export function exportResultsToCSV(results = []) {
  if (!results || results.length === 0) {
    alert('No results to export');
    return;
  }

  const escapeCell = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const rows = [];
  rows.push([
    'serialNumber',
    'grind',
    'score',
    'snowSource',
    'snowType',
    'comment',
    'testDate',
  ]);

  results.forEach((result) => {
    const snowSource = result.snowCondition?.source || '';
    const snowType = result.snowCondition?.grainType || '';

    let testDateIso = '';
    const ts = result.timestamp;
    if (ts?.seconds) {
      testDateIso = new Date(ts.seconds * 1000).toISOString();
    } else if (ts instanceof Date) {
      testDateIso = ts.toISOString();
    } else if (typeof ts === 'number') {
      testDateIso = new Date(ts).toISOString();
    } else if (typeof ts === 'string') {
      const d = new Date(ts);
      if (!isNaN(d)) testDateIso = d.toISOString();
    }

    (result.rankings || []).forEach((r) => {
      const serial = r.skiId ? r.serialNumber : 'Deleted';
      rows.push([
        serial,
        r.grind || '',
        r.score ?? '',
        snowSource,
        snowType,
        result.comment || '',
        testDateIso,
      ]);
    });
  });

  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ski-results-export-${new Date().toISOString().slice(0,19)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
