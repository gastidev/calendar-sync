/**
 * Google Calendar Color Mapping Utility
 * Maps hex colors to Google Calendar colorId (1-11)
 */

// Google Calendar predefined colors (approximate hex values)
const GOOGLE_CALENDAR_COLORS: Record<string, { id: string; name: string; hex: string }> = {
  '1': { id: '1', name: 'Lavender', hex: '#7986CB' },
  '2': { id: '2', name: 'Sage', hex: '#33B679' },
  '3': { id: '3', name: 'Grape', hex: '#8E24AA' },
  '4': { id: '4', name: 'Flamingo', hex: '#E67C73' },
  '5': { id: '5', name: 'Banana', hex: '#F6BF26' },
  '6': { id: '6', name: 'Tangerine', hex: '#F4511E' },
  '7': { id: '7', name: 'Peacock', hex: '#039BE5' },
  '8': { id: '8', name: 'Graphite', hex: '#616161' },
  '9': { id: '9', name: 'Blueberry', hex: '#3F51B5' },
  '10': { id: '10', name: 'Basil', hex: '#0B8043' },
  '11': { id: '11', name: 'Tomato', hex: '#D50000' },
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate Euclidean distance between two RGB colors
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
  );
}

/**
 * Map a hex color to the nearest Google Calendar colorId
 */
export function getColorIdFromHex(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return '1'; // Default to Lavender
  }

  let minDistance = Infinity;
  let closestColorId = '1';

  for (const [id, color] of Object.entries(GOOGLE_CALENDAR_COLORS)) {
    const colorRgb = hexToRgb(color.hex);
    if (!colorRgb) continue;

    const distance = colorDistance(
      rgb.r,
      rgb.g,
      rgb.b,
      colorRgb.r,
      colorRgb.g,
      colorRgb.b
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColorId = id;
    }
  }

  return closestColorId;
}

/**
 * Get all Google Calendar colors
 */
export function getGoogleCalendarColors(): Array<{ id: string; name: string; hex: string }> {
  return Object.values(GOOGLE_CALENDAR_COLORS);
}

/**
 * Get color info by ID
 */
export function getColorById(id: string): { id: string; name: string; hex: string } | null {
  return GOOGLE_CALENDAR_COLORS[id] || null;
}

