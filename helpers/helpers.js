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
        dateAdded: ski.dateAdded ?? null  // Timestamp or null
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



export const formatDate = (dateInput, withTime = false) => {
  if (!dateInput) return '--';
  
  let date;
  if (dateInput.toDate) {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }
  
  if (isNaN(date.getTime())) return '--';
  
  return withTime 
    ? date.toLocaleString('nb-NO') 
    : date.toLocaleDateString('nb-NO');
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
