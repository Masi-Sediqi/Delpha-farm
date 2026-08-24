export const defaultProductGroups = [
  { id: "group-a", name: "A" },
  { id: "group-b", name: "B" },
];

export const defaultProductCountries = [
  { id: "country-afghanistan", name: "Afghanistan", en: "Afghanistan", fa: "افغانستان", ps: "افغانستان" },
  { id: "country-united-kingdom", name: "United Kingdom", en: "United Kingdom", fa: "انگلستان", ps: "انګلستان" },
  { id: "country-pakistan", name: "Pakistan", en: "Pakistan", fa: "پاکستان", ps: "پاکستان" },
  { id: "country-turkey", name: "Turkey", en: "Turkey", fa: "ترکیه", ps: "ترکیه" },
  { id: "country-russia", name: "Russia", en: "Russia", fa: "روسیه", ps: "روسیه" },
  { id: "country-north-sudan", name: "North Sudan", en: "North Sudan", fa: "سودان شمالی", ps: "شمالي سوډان" },
  { id: "country-malaysia", name: "Malaysia", en: "Malaysia", fa: "مالیزیا", ps: "مالیزیا" },
  { id: "country-india", name: "India", en: "India", fa: "هند", ps: "هند" },
  { id: "country-vietnam", name: "Vietnam", en: "Vietnam", fa: "ویتنام", ps: "ویتنام" },
];

export const normalizeMasterName = (value) => String(value || "").trim().toLowerCase();

export const groupNameById = (groups, id, fallback = "") => {
  const row = (groups || []).find((item) => String(item.id) === String(id));
  return row?.name || row?.title || fallback || "";
};

export const countryById = (countries, id) =>
  (countries || []).find((item) => String(item.id) === String(id));

export const countryNameById = (countries, id, language = "en", fallback = "") => {
  const row = countryById(countries, id);
  if (!row) return fallback || "";
  return row?.[language] || row?.en || row?.name || fallback || "";
};

export const makeMasterId = (prefix, name) => {
  const slug = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${prefix}-${slug || Date.now()}`;
};
