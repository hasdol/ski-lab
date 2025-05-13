// src/helpers/highlightSearchTerm.js
export default function highlightSearchTerm(text, term) {
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
