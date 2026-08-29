export const defaultProductImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#f1f5f9"/>
  <rect x="24" y="42" width="48" height="20" rx="10" fill="#6366f1"/>
  <rect x="24" y="42" width="24" height="20" rx="10" fill="#ffffff"/>
  <path d="M48 42v20" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="32" cy="28" r="8" fill="#22c55e"/>
  <circle cx="64" cy="69" r="6" fill="#ef4444"/>
</svg>`);

export const productImageSrc = (product) => product?.image || product?.photo || defaultProductImage;
