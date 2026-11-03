// Warm, self-contained fallback portrait. Kept as an inline SVG data URI so the
// UI never depends on a third-party image host at runtime.
const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#e2cda8"/>
  <circle cx="160" cy="160" r="146" fill="none" stroke="#b7833d" stroke-width="8" opacity=".45"/>
  <circle cx="160" cy="118" r="54" fill="#8d4f2c" opacity=".78"/>
  <path d="M58 304c0-64 46-108 102-108s102 44 102 108" fill="#8d4f2c" opacity=".78"/>
</svg>
`)}`;

export default DEFAULT_AVATAR;
