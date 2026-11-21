(function(){'use strict';
var $=CB.$,$$=CB.$$,clamp=CB.clamp,lerp=CB.lerp,easeIO=CB.easeIO,root=CB.root,MOTION=CB.MOTION,BAR=CB.BAR,NB=CB.NB,NNB=CB.NNB,fmt=CB.fmt,eur=CB.eur,mmss=CB.mmss,FX=CB.FX,CAFES=CB.CAFES,CKEYS=CB.CKEYS,METHODS=CB.METHODS,PRICE=CB.PRICE,bagSVG=CB.bagSVG,ORIG=CB.ORIG,esc=CB.esc;
/* ===== Abonnement ===== */
var DRAFT=CB.store.read(),INTENT=CB.store.takeIntent(),ready=false;
var sub={plan:2,mix:{aube:1,zenith:1,nuit:0},done:false};
function sum(){return sub.mix.aube+sub.mix.zenith+sub.mix.nuit}
function fitMix(){
  while(sum()>sub.plan){var k=CKEYS.slice().sort(function(a,b){return sub.mix[b]-sub.mix[a]})[0];sub.mix[k]--}
}
var lbCafe=null;
function renderLabel(){
  var keys=CKEYS.filter(function(k){return sub.mix[k]>0});if(!keys.length)keys=['zenith'];
  if(keys.indexOf(lbCafe)<0)lbCafe=keys[0];
  var c=CAFES[lbCafe],o=ORIG[{aube:'eth',zenith:'col',nuit:'idn'}[lbCafe]],name=($('#f-name').value||'').trim().slice(0,40);
  var mk=['filtre','piston','espresso','moka'][Math.max(0,$('#f-gear').selectedIndex)],M=METHODS[mk],dose=M.dose.val,out=mk==='espresso'?dose*2:dose*M.ratio,temp=M.temp+c.tOff;
  var d=new Date(Date.now()+86400000),dd=new Date(d.getTime()+42*86400000);
  function f(x){return x.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})}
  $('#lb-cafe').textContent=c.name;$('#lb-origin').textContent=o.name+', '+o.place.split(',')[0];
  var rows=[['Pour',name||'vous'],['Torréfié le',f(d)],['À boire avant',f(dd)],['Lot',o.lot+' (fictif)'],['Mouture','Grains entiers, '+M.grind.toLowerCase()+' pour '+M.name.toLowerCase()],['Recette',fmt(dose,dose%1?1:0)+' g, '+Math.round(out)+' g, '+temp+' °C']];
  $('#lb-rows').innerHTML=rows.map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+esc(r[1])+'</dd></div>'}).join('');
  $('#lb-tabs').innerHTML=keys.length>1?keys.map(function(k){return '<button type="button" data-lb="'+k+'" aria-pressed="'+(k===lbCafe)+'">'+CAFES[k].name+'</button>'}).join(''):'';
}
var BXNS='http://www.w3.org/2000/svg',BXP={aube:[401,760],zenith:[389,760],nuit:[424,760]},BXW=330,bxList=[];
function bxWidth(n){return n<=1?330:(n==2?300:250)}
var BXSLOT={1:[960],2:[790,1090],4:[580,780,980,1180]};
function bxLine(x){return 1011+(x-373)*.1098}
function bxPos(i,n,k){var cx=(BXSLOT[n]||BXSLOT[4])[i],h=BXW*BXP[k][1]/BXP[k][0];return{x:cx-BXW/2,y:bxLine(cx)+185-h,h:h,r:((i*37)%7-3)*.9}}
function bxMake(k){
  var o=document.createElementNS(BXNS,'g'),d=document.createElementNS(BXNS,'g'),im=document.createElementNS(BXNS,'image');
  o.setAttribute('class','bx-slot');d.setAttribute('class','bx-drop');
  im.setAttribute('href','images/opt/pack-'+k+'.webp');im.setAttribute('width',BXW);im.setAttribute('height',BXW*BXP[k][1]/BXP[k][0]);
  d.appendChild(im);o.appendChild(d);return{k:k,o:o,d:d,im:im,fresh:true}
}
function bxLeave(b){b.d.classList.remove('in');b.d.classList.add('out');setTimeout(function(){if(b.o.parentNode)b.o.parentNode.removeChild(b.o)},MOTION?500:0)}
/* le carton : les sachets choisis glissent dedans (derrière le rabat avant) et dépassent par le haut */
function boxRender(n){
  var g=$('#bx-bags'),gh=$('#bx-ghosts');if(!g)return;
  BXW=bxWidth(n);
  var want={},keep=[];CKEYS.forEach(function(k){want[k]=sub.mix[k]});
  bxList.forEach(function(b){if(want[b.k]>0){want[b.k]--;keep.push(b)}else bxLeave(b)});
  bxList=keep;
  CKEYS.forEach(function(k){while(want[k]-->0){var b=bxMake(k);g.appendChild(b.o);bxList.push(b)}});
  bxList.forEach(function(b,i){var p=bxPos(i,n,b.k);b.im.setAttribute('width',BXW);b.im.setAttribute('height',p.h);b.o.style.transform='translate('+p.x+'px,'+p.y+'px)';b.d.style.setProperty('--r',p.r+'deg');
    if(b.fresh){b.fresh=false;b.o.getBoundingClientRect();b.d.classList.add('in')}});
  var h='';for(var i=bxList.length;i<n;i++){var p=bxPos(i,n,'aube');h+='<rect class="bx-ghost" x="'+p.x+'" y="'+(p.y+20)+'" width="'+BXW+'" height="'+(p.h-20)+'" rx="16"/>'}
  gh.innerHTML=h;
}
function renderSub(wasChosen){
  var n=sub.plan,s=sum();
  $('#mix').innerHTML=CKEYS.map(function(k){var c=CAFES[k];return '<div class="mix-row"><div class="nm"><i style="--sw:'+c.sw+'"></i><span>'+c.name+' <small>'+c.roast+'</small></span></div><div class="stepper"><button type="button" data-mix="'+k+'" data-d="-1" aria-label="Retirer un sachet '+deCafe(k)+'"'+(sub.mix[k]<=0?' disabled':'')+'>−</button><output class="tabnum" aria-label="'+sub.mix[k]+' sachet'+(sub.mix[k]>1?'s':'')+' de '+c.name+'">'+sub.mix[k]+'</output><button type="button" data-mix="'+k+'" data-d="1" aria-label="Ajouter un sachet '+deCafe(k)+'"'+(s>=n?' disabled':'')+'>+</button></div></div>'}).join('');
  var left=n-s;$('#mix-note').textContent=left>0?'Il reste '+left+' sachet'+(left>1?'s':'')+' à choisir.':'Boîte complète : '+n+' sachet'+(n>1?'s':'')+'.';
  boxRender(n);
  var box=$('#box'),was=box.classList.contains('closed'),now=left===0;box.classList.toggle('closed',now);if(now&&!was&&wasChosen!==undefined&&MOTION)setTimeout(function(){FX.thud()},500);
  var price=PRICE[n],per=price/n,save=n*9.9-price;
  $('#board').innerHTML='<div><dt>Par mois</dt><dd class="tabnum">'+eur(price)+'</dd></div><div><dt>Par sachet</dt><dd class="tabnum">'+eur(per)+'</dd></div><div class="save"><dt>Économie</dt><dd class="tabnum">'+(save>0.001?eur(save):'0'+NB+'€')+'</dd></div>';
  $('#recap-total').textContent=eur(price);
  renderLabel();updateSteps();if(ready)persist();
}
$('#lb-tabs').addEventListener('click',function(e){var b=e.target.closest('[data-lb]');if(b){lbCafe=b.dataset.lb;renderLabel()}});
$('#f-name').addEventListener('input',renderLabel);$('#f-gear').addEventListener('change',renderLabel);
$('#plans').addEventListener('change',function(e){sub.plan=+e.target.value;fitMix();if(sum()<sub.plan){var k=CKEYS.slice().sort(function(a,b){return sub.mix[a]-sub.mix[b]})[0];while(sum()<sub.plan){sub.mix[k]++;k=CKEYS.slice().sort(function(a,b){return sub.mix[a]-sub.mix[b]})[0]}}renderSub(true)});
$('#mix').addEventListener('click',function(e){var b=e.target.closest('[data-mix]');if(!b||b.disabled)return;var k=b.dataset.mix,d=+b.dataset.d;if(d>0&&sum()>=sub.plan)return;if(d<0&&sub.mix[k]<=0)return;sub.mix[k]+=d;renderSub(true);var nb=$('[data-mix="'+k+'"][data-d="'+d+'"]');if(nb&&!nb.disabled)nb.focus();else{var alt=$('[data-mix="'+k+'"]:not(:disabled)');if(alt)alt.focus()}});
initDraft();
renderSub();ready=true;
var form=$('#sub-form');
function bad(id,on){var f=$('#'+id).closest('.field');f.classList.toggle('invalid',on);var el=$('#'+id);if(on)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid')}
form.addEventListener('submit',function(e){
  e.preventDefault();
  var name=$('#f-name').value.trim(),mail=$('#f-mail').value.trim(),ok=$('#f-ok').checked,first=null;
  var nOk=name.length>0,mOk=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail);
  bad('f-name',!nOk);bad('f-mail',!mOk);bad('f-ok',!ok);
  if(!nOk)first='f-name';else if(!mOk)first='f-mail';else if(!ok)first='f-ok';
  if(sum()<sub.plan){$('#mix-note').textContent='Complétez la boîte : il reste '+(sub.plan-sum())+' sachet'+(sub.plan-sum()>1?'s':'')+' à choisir.';if(!first)first='mix'}
  if(first){var t=first==='mix'?$('[data-mix]:not(:disabled)'):$('#'+first);if(t)t.focus();return}
  var parts=CKEYS.filter(function(k){return sub.mix[k]>0}).map(function(k){return sub.mix[k]+' sachet'+(mix[k]>1?'s':'')+' '+deCafe(k)});
  $('#done-name').textContent=name;
  $('#done-text').textContent='Votre boîte : '+parts.join(', ')+'. '+eur(PRICE[sub.plan])+' par mois, sans engagement.';
  buildNext($('#f-start').value);CB.store.clear();
  form.classList.add('is-done');$('#done').classList.add('show');
  var rain=$('#rain');rain.innerHTML='';
  if(MOTION){for(var i=0;i<22;i++){rain.insertAdjacentHTML('beforeend','<img src="images/opt/bean-s.webp" alt="" style="--x:'+(Math.random()*96).toFixed(0)+';--s:'+(16+Math.random()*16).toFixed(0)+'px;--d:'+(Math.random()*.7).toFixed(2)+'s;--r:'+((Math.random()*540-270)|0)+'deg">')}FX.thud();setTimeout(function(){FX.tink()},180);setTimeout(function(){rain.innerHTML=''},3200)}
  $('#done').focus({preventScroll:true});$('#done').scrollIntoView({block:'start',behavior:MOTION?'smooth':'auto'});$('#f-name').value='';$('#f-mail').value='';$('#f-ok').checked=false;
});
$('#done-reset').addEventListener('click',function(){form.classList.remove('is-done');$('#done').classList.remove('show');$('#plans input:checked').focus()});
['f-name','f-mail','f-ok'].forEach(function(id){$('#'+id).addEventListener('input',function(){bad(id,false)});$('#'+id).addEventListener('change',function(){bad(id,false)})});


/* ----- étapes, brouillon, confirmation ----- */
function updateSteps(){
  var okName=$('#f-name').value.trim().length>0,okMail=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#f-mail').value.trim());
  var cur=sum()<sub.plan?2:(okName&&okMail?4:3);
  $$('#steps li').forEach(function(li,i){var n=i+1;li.classList.toggle('done',n<cur);li.classList.toggle('on',n===cur);if(n===cur)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
}
function persist(){if(!$('#resume').hidden)return;CB.store.write({plan:sub.plan,mix:sub.mix,gear:$('#f-gear').value,start:$('#f-start').value})}
function setPlan(n){sub.plan=n;var r=$('#plan'+n);if(r)r.checked=true}
function deCafe(k){return 'de '+CAFES[k].article}
function setSel(q,v){var el=$(q);if(!el||typeof v!=='string')return;for(var i=0;i<el.options.length;i++)if(el.options[i].text===v){el.selectedIndex=i;return}}
function labelOf(mix){return CKEYS.filter(function(k){return mix[k]>0}).map(function(k){return mix[k]+' sachet'+(mix[k]>1?'s':'')+' '+deCafe(k)}).join(', ')}
function toast(t){
  var el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=t;document.body.appendChild(el);
  requestAnimationFrame(function(){el.classList.add('in')});
  setTimeout(function(){el.classList.remove('in');setTimeout(function(){el.remove()},500)},4200);
}
function initDraft(){
  if(INTENT&&INTENT.choose&&CAFES[INTENT.choose]){
    var k=INTENT.choose;sub.mix={aube:0,zenith:0,nuit:0};sub.mix[k]=2;setPlan(2);
    toast('2 sachets '+deCafe(k)+' sont dans votre boîte. Ajustez à votre goût.');return;
  }
  if(!DRAFT||!DRAFT.mix||[1,2,4].indexOf(+DRAFT.plan)<0)return;
  var dm={plan:+DRAFT.plan,mix:{aube:+DRAFT.mix.aube||0,zenith:+DRAFT.mix.zenith||0,nuit:+DRAFT.mix.nuit||0}};
  var tot=dm.mix.aube+dm.mix.zenith+dm.mix.nuit;if(tot<1||tot>dm.plan)return;
  if(JSON.stringify(dm)===JSON.stringify({plan:sub.plan,mix:sub.mix}))return;
  $('#resume-text').textContent='Formule de '+dm.plan+' sachet'+(dm.plan>1?'s':'')+' : '+labelOf(dm.mix)+'.';
  $('#resume').hidden=false;
  $('#resume-yes').addEventListener('click',function(){
    sub.mix=dm.mix;setPlan(dm.plan);
    setSel('#f-gear',DRAFT.gear);
    setSel('#f-start',DRAFT.start);
    $('#resume').hidden=true;renderSub(true);$('#mix').scrollIntoView({block:'center',behavior:MOTION?'smooth':'auto'});
  });
  $('#resume-no').addEventListener('click',function(){CB.store.clear();$('#resume').hidden=true});
}
function buildNext(start){
  var d=new Date();
  if(/^Au début/.test(start)){d=new Date(d.getFullYear(),d.getMonth()+1,1)}
  function add(n){var x=new Date(d.getTime());x.setDate(x.getDate()+n);return x}
  function f(x){return x.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
  var items=[['Torréfaction de votre fournée',f(add(1)),'Six kilos sortent du tambour, votre café repose ensuite quelques jours.'],['Expédition',f(add(2)),'Votre boîte part de l\'atelier de Balma, étiquette à votre prénom.'],['Dans votre boîte aux lettres',f(add(4)),'Dégustation conseillée dans les deux semaines.']];
  $('#next-steps').innerHTML=items.map(function(it,i){return '<li><b>'+(i+1)+'</b><div><strong>'+esc(it[0])+'</strong><span>'+esc(it[1])+' (date indicative)</span><em>'+esc(it[2])+'</em></div></li>'}).join('');
}
['f-name','f-mail'].forEach(function(id){$('#'+id).addEventListener('input',updateSteps)});
['f-gear','f-start'].forEach(function(id){$('#'+id).addEventListener('change',function(){persist()})});
document.body.classList.add('ready');
var prog=$('#prog');
function onScroll(){var h=document.documentElement.scrollHeight-innerHeight;prog.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0).toFixed(3)+')'}
addEventListener('scroll',onScroll,{passive:true});onScroll();

})();
