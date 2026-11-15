// Numeric WCAG contrast check for every text/background pair used by the design tokens.
const lum = (h) => { const c = [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255).map(v => v<=0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };
const T = { bg:'#f7f3ec', bg2:'#efe9de', surface:'#ffffff', surface2:'#fbf8f3', ink:'#1b1a17', ink2:'#5b5648', ink3:'#6a6454', ok:'#2e7d4f', warn:'#8f5f10', danger:'#b3261e', onAccent:'#ffffff',
  fAccent:'#0f5f58', fSoft:'#d8ede8', fCanvasEnd:'#e7f1ec', oAccent:'#c2431f', oSoft:'#fdf0e8', oCanvasEnd:'#fbe6dc', oBright:'#d9532f', fBright:'#1f8a80' };
// [name, fg, bg, min]
const pairs = [
 ['ink / bg', 'ink','bg',4.5], ['ink / surface','ink','surface',4.5], ['ink2 / bg','ink2','bg',4.5], ['ink2 / surface','ink2','surface',4.5], ['ink2 / bg2','ink2','bg2',4.5],
 ['ink3 / bg','ink3','bg',4.5], ['ink3 / surface','ink3','surface',4.5], ['ink3 / foco canvas end','ink3','fCanvasEnd',4.5], ['ink3 / ocio canvas end','ink3','oCanvasEnd',4.5],
 ['ink / foco canvas end','ink','fCanvasEnd',4.5], ['ink2 / foco canvas end','ink2','fCanvasEnd',4.5], ['ink2 / ocio canvas end','ink2','oCanvasEnd',4.5],
 ['foco accent / surface','fAccent','surface',4.5], ['foco accent / bg','fAccent','bg',4.5], ['foco accent / accent-soft','fAccent','fSoft',4.5], ['white / foco accent (button)','onAccent','fAccent',4.5],
 ['ocio accent / surface','oAccent','surface',4.5], ['ocio accent / bg','oAccent','bg',4.5], ['ocio accent / accent-soft','oAccent','oSoft',4.5], ['white / ocio accent (button)','onAccent','oAccent',4.5],
 ['ink / foco accent-soft','ink','fSoft',4.5], ['ink / ocio accent-soft','ink','oSoft',4.5], ['ink2 / ocio accent-soft','ink2','oSoft',4.5], ['ink2 / foco accent-soft','ink2','fSoft',4.5],
 ['ok / surface','ok','surface',4.5], ['warn / surface','warn','surface',4.5], ['danger / surface','danger','surface',4.5],
 ['ocio bright / surface (LARGE ≥24px only)','oBright','surface',3], ['foco bright / surface (LARGE only)','fBright','surface',3],
];
let fail = 0; console.log('Pair'.padEnd(46),'Ratio','Min','Result');
for (const [n,f,b,m] of pairs) { const r = ratio(T[f],T[b]); const ok = r>=m; if(!ok) fail++; console.log(n.padEnd(46), r.toFixed(2).padStart(5), String(m).padStart(3), ok?'PASS':'FAIL'); }
console.log(`\n${pairs.length-fail}/${pairs.length} pass, ${fail} fail`); process.exit(fail?1:0);
