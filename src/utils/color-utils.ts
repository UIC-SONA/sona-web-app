const ColorUtils = {
  // Convierte RGB a HSL
  rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  },

  // Convierte HSL a RGB
  hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    h /= 360;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r * 255, g * 255, b * 255].map(Math.round) as [number, number, number];
  },

  // Convierte HEX a RGB
  hexToRgb(hex: string): [number, number, number] {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return [r, g, b];
  },

  // Parsea cualquier formato de color a HSL
  parseColorToHsl(color: string): [number, number, number] {
    // Si ya es HSL
    if (color.startsWith('hsl')) {
      return color.match(/\d+(\.\d+)?/g)!.map(Number) as [number, number, number];
    }

    // Si es RGB
    if (color.startsWith('rgb')) {
      const [r, g, b] = color.match(/\d+/g)!.map(Number);
      return this.rgbToHsl(r, g, b);
    }

    // Si es HEX
    if (color.startsWith('#')) {
      const [r, g, b] = this.hexToRgb(color);
      return this.rgbToHsl(r, g, b);
    }

    // Para nombres de colores, creamos un elemento temporal
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    const computedColor = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    const [r, g, b] = computedColor.match(/\d+/g)!.map(Number);
    return this.rgbToHsl(r, g, b);
  },

  // Ajusta el brillo de cualquier color
  adjustBrightness(color: string, amount: number): string {
    try {
      const [h, s, l] = this.parseColorToHsl(color);
      const newL = Math.max(0, Math.min(100, l + amount));
      return `hsl(${h} ${s}% ${newL}%)`;
    } catch (error) {
      console.warn('Color parsing failed, returning original color:', error);
      return color;
    }
  },

  // Obtiene el color de texto apropiado (blanco o negro) basado en el brillo del fondo
  getContrastText(backgroundColor: string): string {
    const [, , l] = this.parseColorToHsl(backgroundColor);
    return l > 60 ? 'black' : 'white';
  }
};

export default ColorUtils;