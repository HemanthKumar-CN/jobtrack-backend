// Utility function to generate random vibrant color
function generateRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 30); // 70% - 100% (vibrant)
  const lightness = 45 + Math.floor(Math.random() * 20); // 45% - 65% (avoid too dark or too light)

  return hslToHex(hue, saturation, lightness);
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

module.exports = generateRandomColor;
