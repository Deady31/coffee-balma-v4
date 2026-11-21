/* Navigation entre les pages : transition liquide, brouillon de boîte (stockage local), intention de choix */
(function(){'use strict';
var root=document.documentElement,MOTION=root.classList.contains('motion');
var KEY='cb-sub-v1',IKEY='cb-intent',WKEY='cb-wipe';
function sget(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function sset(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
function sdel(k){try{sessionStorage.removeItem(k)}catch(e){}}
CB.store={
  read:function(){try{var d=JSON.parse(localStorage.getItem(KEY));return d&&typeof d==='object'?d:null}catch(e){return null}},
  write:function(o){try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}},
  clear:function(){try{localStorage.removeItem(KEY)}catch(e){}},
  takeIntent:function(){var v=sget(IKEY);sdel(IKEY);try{return v?JSON.parse(v):null}catch(e){return null}}
};
var busy=false;
function layers(w){w.setAttribute('aria-hidden','true');w.innerHTML='<i></i><i></i><i></i>'}
/* trois nappes cuivre (comme l'ombre empilée des titres) recouvrent l'écran depuis le clic, puis la page change */
CB.go=function(url,x,y){
  if(busy)return;
  if(!MOTION){location.href=url;return}
  busy=true;
  var w=document.createElement('div');w.className='wipe';layers(w);
  w.style.setProperty('--x',(x==null?innerWidth/2:x)+'px');w.style.setProperty('--y',(y==null?innerHeight/2:y)+'px');
  document.body.appendChild(w);w.getBoundingClientRect();w.classList.add('in');
  sset(WKEY,'1');
  setTimeout(function(){location.href=url},900);
  setTimeout(function(){busy=false;if(w.parentNode)w.parentNode.removeChild(w)},4000);
};
CB.goSubscribe=function(opt){
  if(opt&&opt.choose)sset(IKEY,JSON.stringify({choose:opt.choose}));
  CB.go('abonnement.html');
};
/* arrivée : l'écran est déjà couvert, les nappes se retirent en révélant la page */
(function(){
  if(!sget(WKEY))return;
  sdel(WKEY);
  if(!MOTION){root.classList.remove('cb-arrive');return}
  var w=document.createElement('div');w.className='wipe in arrive';layers(w);
  w.style.setProperty('--x','50%');w.style.setProperty('--y','55%');
  document.body.appendChild(w);root.classList.remove('cb-arrive');
  w.getBoundingClientRect();
  requestAnimationFrame(function(){requestAnimationFrame(function(){w.classList.remove('arrive');w.classList.add('out')})});
  setTimeout(function(){if(w.parentNode)w.parentNode.removeChild(w)},1700);
})();
addEventListener('pageshow',function(e){if(e.persisted){busy=false;var o=document.querySelector('.wipe');if(o)o.remove();root.classList.remove('cb-arrive')}});
document.addEventListener('click',function(e){
  if(e.defaultPrevented||e.button>0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  var a=e.target.closest&&e.target.closest('a[data-wipe]');if(!a)return;
  var h=a.getAttribute('href');if(!h||h.charAt(0)==='#')return;
  e.preventDefault();CB.go(h,e.clientX||null,e.clientY||null);
});
/* un brouillon existe : la touche de la barre propose de reprendre la boîte */
(function(){
  if(document.body.getAttribute('data-page')!=='home')return;
  var d=CB.store.read();if(!d||!d.mix)return;
  var n=(+d.mix.aube||0)+(+d.mix.zenith||0)+(+d.mix.nuit||0);if(!n)return;
  var b=document.querySelector('.topbar .bar-tools .btn-main');if(b)b.textContent='Reprendre ma boîte';
})();
})();
