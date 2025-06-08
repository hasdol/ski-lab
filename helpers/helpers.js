export const mapRankingsToTournamentData = (rankings, selectedSkis) => {
  // Map each ranking to include the necessary ski data
  return {
    rankings: rankings.map(({ cumulativeScore, skiId }) => {
      // Find the ski in selectedSkis that matches the skiId
      const ski = selectedSkis.find(ski => ski.id === skiId);
      // Check if ski is found
      if (!ski) {
        console.error(`Ski with id ${skiId} not found in selectedSkis`);
        return {
          score: cumulativeScore,
          skiId: skiId,
          serialNumber: 'Unknown',
          grind: 'Unknown',
          brand: 'Unknown',
          dateAdded: null
        };
      }
      // Return the ranking object with ski data
      return {
        score: cumulativeScore,
        skiId: ski.id,
        serialNumber: ski.serialNumber,
        grind: ski.grind,
        brand: ski.brand,
        dateAdded: ski.dateAdded
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
