const PREDEFINED_ACTIVITY_COLORS: Record<string, string> = {
  Coding: '#4F8CFF',
  Study: '#6CC070',
  Gaming: '#B07CFF',
  Exercise: '#FF8A65',
  Reading: '#FFD54F',
};

const ACTIVITY_PALETTE = [
  '#4F8CFF',
  '#6CC070',
  '#B07CFF',
  '#FF8A65',
  '#FFD54F',
  '#4DD0E1',
  '#F06292',
  '#81C784',
  '#9575CD',
  '#FFB74D',
];

const normalizeKey = (label: string): string => label.trim().toLowerCase();

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Runtime in-memory mapping to ensure colors persist during app runtime
const activityColorMap: Record<string, string> = {};
const usedColors = new Set<string>();

// Initialize mapping with predefined names (normalize keys)
Object.keys(PREDEFINED_ACTIVITY_COLORS).forEach((name) => {
  const key = normalizeKey(name);
  const color = PREDEFINED_ACTIVITY_COLORS[name];
  activityColorMap[key] = color;
  usedColors.add(color);
});

export const getActivityColor = (activityName: string): string => {
  const raw = activityName == null ? '' : activityName;
  const trimmed = raw.trim();
  if (!trimmed) return '#9CA3AF'; // fallback gray for empty labels

  const key = normalizeKey(trimmed);

  // Return existing mapping if present
  if (activityColorMap[key]) return activityColorMap[key];

  // Find next unused color from palette
  const nextColor = ACTIVITY_PALETTE.find((c) => !usedColors.has(c));
  if (nextColor) {
    activityColorMap[key] = nextColor;
    usedColors.add(nextColor);
    return nextColor;
  }

  // Palette exhausted: deterministic fallback based on name hash
  const hash = hashString(key);
  const hue = hash % 360;
  const saturation = 62;
  const lightness = 56;
  const fallback = hslToHex(hue, saturation, lightness);
  activityColorMap[key] = fallback;
  return fallback;
};

export default PREDEFINED_ACTIVITY_COLORS;
