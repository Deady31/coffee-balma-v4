/* Utilitaires et données partagés (toutes les données sont fictives) */
window.CB=(function(){'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var clamp=function(v,a,b){a=a==null?0:a;b=b==null?1:b;return Math.min(b,Math.max(a,v))};
var lerp=function(a,b,t){return a+(b-a)*t};
var easeIO=function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
var root=document.documentElement;
var MOTION=root.classList.contains('motion');
var BAR=64;
var NB=' ', NNB=' ';
function fmt(n,d){d=d||0;return n.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d})}
function eur(n){return fmt(n,2)+NB+'€'}
function mmss(s){s=Math.max(0,Math.round(s));var m=Math.floor(s/60),r=s%60;return m+':'+(r<10?'0':'')+r}

/* ===== Identité sonore et haptique (désactivée par défaut) ===== */
var FX={tick:function(){},keyUp:function(){},tink:function(){},crack:function(){},thud:function(){},drip:function(){},on:false};

/* ===== Données des cafés (toutes fictives) ===== */
var CAFES={
 aube:{key:'aube',name:'Soleil Levant',article:'Soleil Levant',roast:'Clair',roastN:1,sw:'#a9c4a1',t:['#8fb08a','#cfe0c8','#3f5c3a'],img:'images/opt/pack-aube.webp',method:'filtre',tOff:1,
  sub:"Café d'Éthiopie, zone de Gedeo (Yirgacheffe)",
  info:[['Pays','Éthiopie'],['Région','Gedeo, Yirgacheffe'],['Altitude','1 900 à 2 200 m'],['Variétés','Variétés locales (heirloom)'],['Procédé','Lavé'],['Récolte','Octobre à janvier'],['Torréfaction','Claire, sortie à 205 °C'],['Notes','Agrumes, miel, fleur blanche'],['Prix','9,90 € les 250 g']],
  profile:[['Acidité',5],['Douceur',4],['Corps',2],['Amertume',1],['Arômes',5]],
  intro:"Soleil Levant est le café le plus clair de l'atelier. Il vient du sud de l'Éthiopie et se prépare de préférence au filtre.",
  secs:[['Origine',"Yirgacheffe est une zone de la région Gedeo, dans le sud de l'Éthiopie. Les cerises poussent entre 1 900 et 2 200 mètres, sur de petites parcelles familiales.<sup>[1]</sup> La ferme, le lot (ETH-24-07) et les producteurs de cette fiche n'existent pas."],
   ['Variétés et procédé',"Les caféiers d'Éthiopie descendent de populations locales, que les torréfacteurs regroupent sous le nom de variétés heirloom. Le café est lavé : la pulpe est retirée avant le séchage, ce qui donne une tasse nette et claire.<sup>[2]</sup>"],
   ['Torréfaction',"Soleil Levant est chargé à 198 °C et sort à 205 °C après 9 min 30. Le premier craquement arrive à 8 min 30 : on s'arrête environ une minute plus tard, pour garder l'acidité du fruit. Perte de masse : 12 %. Phase de développement : 10 % du temps total.<sup>[3]</sup>"],
   ['En tasse',"Au nez, un zeste d'orange et une fleur blanche. En bouche, une acidité vive de clémentine, puis du miel. La finale est courte et propre. À boire sans sucre."],
   ['Préparation',"Filtre V60, 1 g de café pour 16 g d'eau, 94 °C, mouture moyenne-fine, 3 minutes. Le comptoir de préparation calcule la dose pour vous."]]},
 zenith:{key:'zenith',name:'Crépuscule',article:'Crépuscule',roast:'Moyen',roastN:2,sw:'#c4562a',t:['#c4562a','#e8a37c','#7a2d10'],img:'images/opt/pack-zenith.webp',method:'filtre',tOff:0,
  sub:'Mélange maison, Brésil et Colombie',
  info:[['Pays','Brésil et Colombie'],['Composition','Mélange maison'],['Altitude','1 600 à 1 900 m'],['Variétés','Arabica (Bourbon, Caturra)'],['Procédé','Lavé'],['Récolte','Octobre à décembre, avril à juin'],['Torréfaction','Moyenne, sortie à 213 °C'],['Notes','Caramel, noisette, chocolat au lait'],['Prix','9,90 € les 250 g']],
  profile:[['Acidité',3],['Douceur',5],['Corps',3],['Amertume',2],['Arômes',3]],
  intro:"Crépuscule est le café rond de l'atelier. C'est un mélange maison de Brésil et de Colombie, qui s'accorde avec le filtre comme avec l'espresso.",
  secs:[['Origine',"Le mélange associe un café du Brésil et un café du Huila, en Colombie. Le Huila occupe le sud-ouest de la Colombie, entre deux cordillères. Les familles y cultivent de petites parcelles de un à trois hectares.<sup>[1]</sup> Le lot (COL-24-03), la ferme et les producteurs de cette fiche sont fictifs."],
   ['Variétés et procédé',"Caturra et Castillo dominent. Le café est lavé, puis séché sur des patios couverts. Le grain sort régulier, ce qui facilite la torréfaction.<sup>[2]</sup>"],
   ['Torréfaction',"Crépuscule est chargé à 198 °C et sort à 213 °C après 11 minutes. Le sucre du grain caramélise sans virer à l'amertume. Perte de masse : 14 %. Phase de développement : 16 % du temps total.<sup>[3]</sup>"],
   ['En tasse',"Du caramel au nez, de la noisette grillée, puis du chocolat au lait. Peu d'acidité, un corps rond. Il supporte le lait et un peu de sucre."],
   ['Préparation',"Filtre 1:15 à 93 °C, ou espresso 1:2 en 28 secondes. Mouture moyenne-fine pour le filtre, fine pour l'espresso."]]},
 nuit:{key:'nuit',name:'Nocturne',article:'Nocturne',roast:'Foncé',roastN:3,sw:'#1f3e73',t:['#1f3e73','#6d8fcf','#0a1a3c'],img:'images/opt/pack-nuit.webp',method:'espresso',tOff:-2,
  sub:"Robusta d'Indonésie, Sumatra",
  info:[['Pays','Indonésie'],['Région','Sumatra-Nord'],['Altitude','1 100 à 1 500 m'],['Variétés','Robusta'],['Procédé','Humide-hullé (giling basah)'],['Récolte','Octobre à février'],['Torréfaction','Foncée, sortie à 224 °C'],['Notes','Cacao noir, épices, fruits secs grillés'],['Prix','9,90 € les 250 g']],
  profile:[['Acidité',1],['Douceur',2],['Corps',5],['Amertume',4],['Arômes',4]],
  intro:"Nocturne est le café le plus foncé de l'atelier. Il vient de Sumatra et tient bien face au lait.",
  secs:[['Origine',"Sumatra est une grande île de forêts humides. Les caféiers y poussent entre 1 100 et 1 500 mètres, chez de petits producteurs.<sup>[1]</sup> Le lot (IDN-24-11), la ferme et les producteurs de cette fiche sont fictifs."],
   ['Variétés et procédé',"Le grain est dépulpé, séché en partie dans sa membrane, puis décortiqué encore humide. Cette méthode, le giling basah, donne un grain bleu-vert et un goût de sous-bois.<sup>[2]</sup>"],
   ['Torréfaction',"Nocturne est chargé à 196 °C et sort à 224 °C après 13 minutes. L'amertume du cacao noir domine, l'acidité disparaît. Perte de masse : 17 %. Phase de développement : 27 % du temps total.<sup>[3]</sup>"],
   ['En tasse',"Du cacao noir et des épices au nez, du cèdre et des fruits secs grillés en bouche. Le corps est épais, la finale longue."],
   ['Préparation',"Piston 1:15 à 91 °C, quatre minutes. Ou espresso 1:2 à 91 °C, mouture fine."]]}
};
var CKEYS=['aube','zenith','nuit'];
var METHODS={
 filtre:{name:'Filtre V60',ratio:16,temp:93,time:180,grind:'Moyenne-fine',micron:'environ 600 µm',gs:7,dose:{min:10,max:40,val:18,step:1},cup:250,waterLbl:'Eau'},
 piston:{name:'Piston',ratio:15,temp:93,time:240,grind:'Grosse',micron:'environ 1 000 µm',gs:12,dose:{min:12,max:60,val:30,step:1},cup:250,waterLbl:'Eau'},
 espresso:{name:'Espresso',ratio:2,temp:93,time:28,grind:'Fine',micron:'environ 250 µm',gs:3,dose:{min:14,max:22,val:18,step:.5},cup:36,waterLbl:'Sortie en tasse'},
 moka:{name:'Cafetière italienne',ratio:10,temp:90,time:210,grind:'Fine à moyenne',micron:'environ 400 µm',gs:5,dose:{min:8,max:24,val:15,step:1},cup:60,waterLbl:'Eau (jusqu\'à la valve)'}
};
var PRICE={1:9.9,2:18.8,4:36};

function bagSVG(key,empty){
  var c=CAFES[key]||{sw:'#fff',name:'?'},band=key==='nuit'?'#1f3e73':(key==='zenith'?'#c4562a':'#a9c4a1'),txt=key==='aube'?'#1a2a1c':'#ffffff',L=key==='aube'?'S':(key==='zenith'?'C':'N');
  if(empty)return '<svg viewBox="0 0 80 120" aria-hidden="true"><path d="M12 22 22 6H58L68 22V112a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4Z" fill="none" stroke="#43271a" stroke-width="3" stroke-dasharray="6 6"/></svg>';
  return '<svg viewBox="0 0 80 120" aria-hidden="true"><path d="M12 22 22 6H58L68 22V112a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4Z" fill="#d8bd91" stroke="#43271a" stroke-width="4" stroke-linejoin="round"/><path d="M12 22H68" stroke="#43271a" stroke-width="4"/><rect x="22" y="46" width="36" height="44" fill="'+band+'" stroke="#43271a" stroke-width="3"/><text x="40" y="78" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="28" fill="'+txt+'">'+L+'</text></svg>';
}

var ORIG={
 eth:{cafe:'aube',name:'Éthiopie',place:'Yirgacheffe, zone de Gedeo',ll:[38.2,6.16],alt:'1 900 à 2 200 m',variety:'Variétés locales',proc:'Lavé',bag:'Sacs de 60 kg',transit:'4 à 6 semaines',lot:'ETH-24-07',main:[10,11,12,1],second:[]},
 col:{cafe:'zenith',name:'Colombie',place:'Huila, entre deux cordillères',ll:[-75.6,2.6],alt:'1 600 à 1 900 m',variety:'Caturra, Bourbon',proc:'Lavé',bag:'Sacs de 70 kg',transit:'4 à 5 semaines',lot:'COL-24-03',main:[10,11,12],second:[4,5,6]},
 idn:{cafe:'nuit',name:'Indonésie',place:'Sumatra-Nord',ll:[98.8,2.2],alt:'1 100 à 1 500 m',variety:'Robusta',proc:'Humide-hullé',bag:'Sacs de 60 kg',transit:'5 à 7 semaines',lot:'IDN-24-11',main:[10,11,12,1,2],second:[]}
};
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
return {'$':$,'$$':$$,'clamp':clamp,'lerp':lerp,'easeIO':easeIO,'root':root,'MOTION':MOTION,'BAR':BAR,'NB':NB,'NNB':NNB,'fmt':fmt,'eur':eur,'mmss':mmss,'FX':FX,'CAFES':CAFES,'CKEYS':CKEYS,'METHODS':METHODS,'PRICE':PRICE,'bagSVG':bagSVG,'ORIG':ORIG,'esc':esc};
})();
