import { parseCardString, generateSearchLinks } from './parser';

test('parseCardString extracts year, agency, rating and before part', () => {
  const s = '1998 Topps Ken Griffey Jr. [SP] 123 — PSA 6';
  const p = parseCardString(s);
  expect(p.year).toBe('1998');
  expect(p.agency).toBe('PSA');
  expect(p.rating).toBe('6');
  expect(p.before).toContain('Ken Griffey Jr.');
});

test('generateSearchLinks creates ebay sold and PSA-google links', () => {
  const s = '1998 Topps Ken Griffey Jr. #34 - PSA 6';
  const p = parseCardString(s);
  const links = generateSearchLinks(p);
  expect(links.ebayLink).toMatch(/_nkw=/);
  expect(links.ebayLink).toMatch(/LH_Sold=1/);
  expect(links.psaLink).toMatch(/google.com/);
  expect(links.psaLink).toMatch(/psacard.com/);
});
