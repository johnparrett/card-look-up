export function parseCardString(input) {
  const original = String(input || '').trim();
  // Detect trailing agency and rating like "- PSA 6" or "— PSA 6"
  const agencyMatch = original.match(/\s[-–—]\s*([A-Za-z]+)\s*(\d+)\s*$/);
  let agency = null;
  let rating = null;
  let before = original;
  if (agencyMatch) {
    agency = agencyMatch[1];
    rating = agencyMatch[2];
    before = original.slice(0, agencyMatch.index).trim();
  }

  // Try to pull a 4-digit year at the start
  const yearMatch = before.match(/^\s*(\d{4})\b/);
  const year = yearMatch ? yearMatch[1] : null;

  return {
    original,
    before, // everything before the agency/rating suffix
    year,
    agency,
    rating
  };
}

export function sanitizeQuery(q) {
  if (!q) return '';
  // normalize spacing but keep any # so it can be percent-encoded later
  return q.replace(/\s+/g, ' ').trim();
}

export function generateSearchLinks(parsed) {
  const query = sanitizeQuery(parsed.before || parsed.original || '');
  const ebayBase = 'https://www.ebay.com/sch/i.html';
  // encodeURIComponent will percent-encode '#', producing %23; convert spaces to '+'
  const encoded = encodeURIComponent(query).replace(/%20/g, '+');
  const ebayParams = `_nkw=${encoded}&LH_Complete=1&LH_Sold=1`;
  const ebayLink = `${ebayBase}?${ebayParams}`;

  // PSA doesn't have a simple public price-guide URL for arbitrary queries,
  // so link to a focused Google search that includes the PSA site and query.
  const psaQuery = encodeURIComponent(`${query} site:psacard.com PSA price`);
  const psaLink = `https://www.google.com/search?q=${psaQuery}`;

  return {
    ebayLink,
    psaLink
  };
}

export default {
  parseCardString,
  generateSearchLinks,
  sanitizeQuery
};
