// Vérifie les contrastes WCAG des couples texte/fond du site (seuil 4,5:1).
const lum = (hex) => {
  const c = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const P = { espresso: '#15100C', roast: '#2A1D15', crema: '#F1E6D3', milk: '#FBF6EC', ink: '#1A130E', caramel: '#D08A3E', ember: '#A8411B' };
const pairs = [
  ['crema', 'espresso'], ['crema', 'roast'], ['caramel', 'espresso'], ['caramel', 'roast'], ['ink', 'crema'], ['ink', 'milk'],
  ['ember', 'crema'], ['ember', 'milk'], ['milk', 'ember'], ['crema', 'ember'], ['ink', 'caramel'], ['milk', 'ink'],
];
let bad = 0;
const check = (n, fg, bg) => { const r = ratio(fg, bg); if (r < 4.5) bad++; console.log(`${r < 4.5 ? '✘' : '✔'} ${n} ${r.toFixed(2)}`); };
pairs.forEach(([f, b]) => check(`${f} sur ${b}`, P[f], P[b]));
const rows = [['Espresso','#4A2A17','#F1E6D3'],['Noisette','#7A4B22','#F1E6D3'],['Cappuccino','#6A3E2E','#F1E6D3'],['Flat white','#E8D5B2','#1A130E'],['V60','#8F3A1A','#FBF6EC'],['Cold brew','#1F2B24','#F1E6D3']];
rows.forEach(([n, bg, fg]) => check(`carte ${n}`, fg, bg));
process.exit(bad ? 1 : 0);
