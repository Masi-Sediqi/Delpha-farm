export function groupJournalPages(entries) {
  const pages = new Map();
  entries.forEach(entry => {
    const number = entry.pageNumber || (/^JEN\d+$/i.test(entry.reference || "") ? entry.reference : "");
    const key = number ? `page:${number}` : `entry:${entry.id}`;
    if (!pages.has(key)) pages.set(key, { key, number: number || entry.reference || "قدیمی", entries: [] });
    pages.get(key).entries.push(entry);
  });
  return [...pages.values()].map(page => ({ ...page, entries: page.entries.sort((a,b)=>(Number(a.lineNumber)||0)-(Number(b.lineNumber)||0)) }))
    .sort((a,b)=>String(b.entries[0]?.date || b.entries[0]?.createdAt || "").localeCompare(String(a.entries[0]?.date || a.entries[0]?.createdAt || "")) || b.number.localeCompare(a.number));
}
export function replaceJournalPage(entries, page, replacement) {
  const ids = new Set(page.entries.map(entry=>String(entry.id)));
  return [...replacement, ...entries.filter(entry=>!ids.has(String(entry.id)))];
}
