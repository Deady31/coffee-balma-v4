(function(){'use strict';
var $=CB.$,$$=CB.$$,clamp=CB.clamp,lerp=CB.lerp,easeIO=CB.easeIO,root=CB.root,MOTION=CB.MOTION,BAR=CB.BAR,NB=CB.NB,NNB=CB.NNB,fmt=CB.fmt,eur=CB.eur,mmss=CB.mmss,FX=CB.FX,CAFES=CB.CAFES,CKEYS=CB.CKEYS,METHODS=CB.METHODS,PRICE=CB.PRICE,bagSVG=CB.bagSVG,ORIG=CB.ORIG,esc=CB.esc;
/* ===== Parallax et scènes épinglées (transform, opacity, clip-path uniquement) ===== */
var scenes=[];
function addScene(track,fn){scenes.push({track:track,fn:fn})}
function pinP(track){var st=track.querySelector('.pin'),r=track.getBoundingClientRect(),range=track.offsetHeight-st.offsetHeight;return {p:clamp((BAR-r.top)/Math.max(1,range)),r:r,range:range}}
var pars=$$('[data-par]'),prog=$('#prog'),ticking=false;
function frame(){
  ticking=false;
  var h=innerHeight,max=document.documentElement.scrollHeight-h;
  prog.style.transform='scaleX('+(max>0?clamp(scrollY/max):0)+')';
  railTint(max>0?clamp(scrollY/max):0);
  if(!MOTION)return;
  stackCafes(h);flyUpdate(h);
  /* lectures d'abord, écritures ensuite : évite de recalculer la mise en page à chaque scène */
  var qs=[];for(var i0=0;i0<scenes.length;i0++)qs.push(pinP(scenes[i0].track));
  for(var i=0;i<scenes.length;i++){var s=scenes[i],q=qs[i];if(q.r.bottom<-50||q.r.top>h+50){if(s.last===undefined||s.last===-1)continue}
    if(q.p!==s.last){s.last=q.p;s.fn(q.p,q)}}
  for(var j=0;j<pars.length;j++){var el=pars[j],par=el.parentElement,r=par.getBoundingClientRect();if(r.bottom<0||r.top>h)continue;
    var f=parseFloat(el.dataset.par),c=(r.top+r.height/2)-h/2,extra=Math.max(0,(el.offsetHeight-par.offsetHeight)/2);
    el.style.transform='translate3d(0,'+clamp(-c*f,-extra,extra).toFixed(1)+'px,0)'}
}
function req(){if(!ticking){ticking=true;requestAnimationFrame(frame)}}
addEventListener('scroll',req,{passive:true});addEventListener('resize',function(){scenes.forEach(function(s){s.last=-1});req()});

/* ----- Scène A : plongée dans les grains ----- */
var FB=[['6%','12%',74,0,-24,.3],['80%','9%',118,3,38,.9],['91%','50%',62,0,-60,.4],['70%','76%',150,6,20,1.1],['2%','68%',128,5,-15,1],['46%','5%',44,0,50,.2],['57%','84%',56,1,-38,.5],['24%','86%',86,2,70,.7],['36%','42%',36,0,10,.15],['92%','86%',90,2,-8,.8]];
$('#fbeans').innerHTML=FB.map(function(b){return '<div class="fb" data-z="'+b[5]+'" style="--x:'+b[0]+';--y:'+b[1]+';--s:'+b[2]+'px;--b:'+b[3]+'px;--r:'+b[4]+'deg"><img src="images/opt/bean-l.webp" alt="" width="380" height="380" decoding="async"></div>'}).join('');
var lqCtl=null;
function deNote(s){return (/^[aeiouyàâéèêîôûh]/.test(s)?"d'":'de ')+s}
var hBg=$('.hero-bg'),hFb=$$('.fb'),hIntro=$('#hero-intro'),hBadge=$('#hero-badge'),hOut=$('#hero-outro'),mouse={x:0,y:0},hsc=null;
function setVis(el,o){el.style.opacity=o.toFixed(3);el.style.visibility=o<.02?'hidden':'visible'}
if(MOTION){
  addScene($('.hero-track'),function(p){
    hBg.style.transform='scale('+(1+p*.55).toFixed(3)+')';
    hFb.forEach(function(b){var z=parseFloat(b.dataset.z);b.style.transform='translate3d('+(mouse.x*z*46).toFixed(1)+'px,'+(-p*z*560+mouse.y*z*30).toFixed(1)+'px,0) scale('+(1+p*z*1.7).toFixed(3)+')'});
    var f=1-clamp((p-.1)/.3);hIntro.style.transform='translateY('+(-(1-f)*70).toFixed(1)+'px) scale('+(1-(1-f)*.06).toFixed(3)+')';setVis(hIntro,f);setVis(hBadge,f);if(lqCtl)lqCtl(f>.05);
    var o=clamp((p-.42)/.2);hOut.style.transform='translateY('+((1-o)*46).toFixed(1)+'px)';setVis(hOut,o);
  });
  hsc=scenes[scenes.length-1];
  addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;mouse.x=e.clientX/innerWidth-.5;mouse.y=e.clientY/innerHeight-.5;if(hsc){hsc.last=-1;req()}},{passive:true});
}

/* ----- Titre d'accueil liquide : shader plasma coloré en cuivre, inspiré de liquid-logo (Alan Ang, MIT) ----- */
function liquidTitle(){
  var h1=$('#h1');if(!h1||!window.WebGLRenderingContext)return;
  var cv=document.createElement('canvas');cv.id='lq';cv.setAttribute('aria-hidden','true');
  var gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false});if(!gl)return;
  var VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS=[
  'precision highp float;uniform vec2 R;uniform float T;uniform vec2 M;uniform sampler2D K;uniform vec2 S;uniform vec2 G;uniform vec2 D;',
  'float A(vec2 u){vec2 a=u*2.-1.;vec2 sg=sign(a);a=abs(a);if(max(a.x,a.y)>=1.)return 0.;vec2 w=vec2(.62);vec2 t=clamp((a-w)/(1.-w),0.,.9995);vec2 bb=w+(1.-w)*.5*log((1.+t)/(1.-t));a=mix(a,bb,step(w,a));u=(sg*a+1.)*.5;vec2 q=(u-G)*vec2(R.x/R.y,1.);float f=exp(-dot(q,q)/1.1);return smoothstep(.25,.75,texture2D(K,u-D*f).a);}',
  'void main(){',
  ' vec2 FC=gl_FragCoord.xy;vec2 uv=FC/R;float m=A(uv);',
  ' vec2 st=S/R;float sh=0.;',
  ' for(float k=1.;k<=7.;k++){if(A(uv-st*k)>.5){sh=k;break;}}',
  ' if(m<.02){',
  '  if(sh<.5){gl_FragColor=vec4(0.);return;}',
  '  vec3 c=sh<3.?vec3(.76,.31,.12):(sh<5.?vec3(.54,.2,.09):vec3(.30,.11,.04));',
  '  float e=smoothstep(.0,.25,A(uv-st*sh));gl_FragColor=vec4(c,1.);return;}',
  ' float t=T*.34;',
  ' vec2 p=(FC*2.-R)/R.y;p-=(M-.5)*vec2(.9,-.9);',
  ' float d=dot(p,p);float lx=abs(.66-d)*.36;',
  ' vec2 v=p*(1.-lx)/3.11;',
  ' v+=.5*vec2(sin(p.y*2.+t*1.3),cos(p.x*2.-t));',
  ' vec4 o=vec4(0.);',
  ' for(float i=1.;i<=7.;i++){v+=cos(v.yx*i+vec2(0.,i)+t)/i+6.;o+=(sin(vec4(v.x,v.y,v.y,v.x))+1.)*abs(v.x-v.y)*.1;}',
  ' o=o.wxyz*.5+o*.5;',
  ' vec4 r=exp(p.y*vec4(.2,0.,-.2,0.))*exp(-1.8*lx)/o;vec4 e2=exp(2.*r);o=(e2-1.)/(e2+1.);',
  ' float l=clamp(dot(o.rgb,vec3(.45,.35,.2)),0.,1.);',
  ' l=clamp((l-.15)*1.5,0.,1.);',
  ' vec3 c0=vec3(.45,.17,.06),c1=vec3(.80,.35,.13),c2=vec3(.94,.62,.36),c3=vec3(.99,.88,.68);',
  ' vec3 c=mix(c0,c1,smoothstep(0.,.35,l));c=mix(c,c2,smoothstep(.3,.7,l));c=mix(c,c3,smoothstep(.65,1.,l));',
  ' vec2 L=S*2./R;float lit=A(uv+L)-A(uv-L);',
  ' c+=clamp(-lit,0.,1.)*.35;c-=clamp(lit,0.,1.)*.28;',
  ' float g=fract(sin(dot(FC,vec2(12.9898,78.233))+T)*43758.5453)*.05-.025;',
  ' gl_FragColor=vec4(clamp(c+g,0.,1.),1.);}'
  ].join('\n');
  function sh(t,src){var o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);return gl.getShaderParameter(o,gl.COMPILE_STATUS)?o:null}
  var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);if(!vs||!fs)return;
  var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;
  gl.useProgram(pr);
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var U={};['R','T','M','K','S','G','D'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n)});
  var tex=gl.createTexture(),mask=document.createElement('canvas'),W=0,H=0,sz=0,mx=.5,my=.5,tx=.5,ty=.5,vis=true,raf=0;
  function build(){
    var dpr=1,r=h1.getBoundingClientRect();
    var fsz=parseFloat(getComputedStyle(h1).fontSize),pad=Math.ceil(fsz*.55);
    var w=Math.round((r.width+pad*2)*dpr),h=Math.round((r.height+pad*2)*dpr);if(!w||!h)return;
    W=w;H=h;sz=fsz*dpr;cv.width=w;cv.height=h;cv.style.width=(r.width+pad*2)+'px';cv.style.height=(r.height+pad*2)+'px';cv.style.left=-pad+'px';cv.style.top=-pad+'px';padPx=pad*dpr;
    mask.width=w;mask.height=h;var c=mask.getContext('2d');c.clearRect(0,0,w,h);
    c.font='700 '+sz+'px MatchaWorld,"Barlow Condensed",Impact,sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle='#fff';
    if('letterSpacing' in c)c.letterSpacing=(sz*.015)+'px';
    var cx0=padPx+(r.width*dpr)/2,cy0=padPx+(r.height*dpr)/2,lh=sz*.98;
    c.fillText('COFFEE',cx0,cy0-lh/2+sz*.36);c.fillText('BALMA',cx0,cy0+lh/2+sz*.36);
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,mask);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.viewport(0,0,w,h);
  }
  var sceneOff=false,lastT=0,padPx=0,grab=false,gx=.5,gy=.5,rx=0,ry=0,px=0,py=0,vx=0,vy=0;
  function active(){return grab||Math.abs(px)+Math.abs(py)+Math.abs(vx)+Math.abs(vy)>.4}
  function draw(ts){
    raf=0;var dt=Math.min((ts-lastT)/1000,.034),busy=active();if(!busy&&ts-lastT<66){go();return}lastT=ts;mx+=(tx-mx)*.06;my+=(ty-my)*.06;
    if(busy){
      /* ressort : suit le doigt avec un peu de retard pendant la prise, revient en rebondissant au relâchement */
      var lim=sz*1.6,tgx=grab?lim*Math.tanh(rx/lim):0,tgy=grab?lim*Math.tanh(ry/lim):0,k=grab?420:150,c=grab?34:7;
      vx+=((tgx-px)*k-vx*c)*dt;vy+=((tgy-py)*k-vy*c)*dt;px+=vx*dt;py+=vy*dt;
      if(!grab&&Math.abs(px)+Math.abs(py)+Math.abs(vx)*.05+Math.abs(vy)*.05<.4){px=py=vx=vy=0}
    }
    gl.uniform2f(U.G,gx,gy);gl.uniform2f(U.D,px/W,-py/H);
    gl.uniform2f(U.R,W,H);gl.uniform1f(U.T,ts/1000);gl.uniform2f(U.M,mx,my);gl.uniform1i(U.K,0);gl.uniform2f(U.S,sz*.032,-sz*.032);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(vis&&!sceneOff&&!document.hidden)raf=requestAnimationFrame(draw);
  }
  /* prise à la souris / au doigt : on attrape les lettres et on les étire comme un élastique */
  var sx=0,sy=0,pid=-1;
  h1.addEventListener('pointerdown',function(e){
    if(!h1.classList.contains('liquid')||e.button>0)return;
    var r=cv.getBoundingClientRect();gx=(e.clientX-r.left)/r.width;gy=1-(e.clientY-r.top)/r.height;
    sx=e.clientX;sy=e.clientY;rx=ry=0;grab=true;pid=e.pointerId;
    try{h1.setPointerCapture(pid)}catch(_){}
    h1.classList.add('grabbing');go();e.preventDefault();
  });
  h1.addEventListener('pointermove',function(e){if(!grab||e.pointerId!==pid)return;var d=window.devicePixelRatio?Math.min(window.devicePixelRatio,1.5):1;rx=(e.clientX-sx)*d;ry=(e.clientY-sy)*d;go()});
  function release(e){if(!grab||(e&&e.pointerId!==pid))return;grab=false;h1.classList.remove('grabbing');go()}
  h1.addEventListener('pointerup',release);h1.addEventListener('pointercancel',release);h1.addEventListener('lostpointercapture',release);
  function go(){if(!raf&&vis&&!sceneOff&&!document.hidden)raf=requestAnimationFrame(draw)}
  lqCtl=function(v){sceneOff=!v;if(v)go()};
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault();h1.classList.remove('liquid');if(cv.parentNode)cv.parentNode.removeChild(cv)});
  var go0=function(){build();if(!W)return;h1.appendChild(cv);h1.classList.add('liquid');go()};
  (document.fonts&&document.fonts.load?document.fonts.load('700 100px MatchaWorld','COFFEE BALMA'):Promise.resolve()).then(function(){return document.fonts?document.fonts.ready:0}).then(go0);
  var rt=0;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(h1.classList.contains('liquid')){build();go()}},150)});
  addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;tx=e.clientX/innerWidth;ty=e.clientY/innerHeight},{passive:true});
  document.addEventListener('visibilitychange',go);
  if('IntersectionObserver' in window)new IntersectionObserver(function(en){vis=en[0].isIntersecting;go()}).observe(h1);
}
if(MOTION)liquidTitle();
/* ----- vidéo d'accueil : démarre en fondu, se met en pause hors écran, absente en mouvement réduit ----- */
(function(){var v=$('.hero-bg video');if(!v)return;
  if(!MOTION){v.remove();return}
  var cn=navigator.connection||{};
  if((navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4)||cn.saveData){v.remove();return}
  function play(){var p=v.play();if(p&&p.catch)p.catch(function(){})}
  v.addEventListener('playing',function(){v.classList.add('on')});
  function later(){setTimeout(function(){v.preload='auto';play()},500)}
  if(document.readyState==='complete')later();else addEventListener('load',later);
  if('IntersectionObserver' in window)new IntersectionObserver(function(en){if(en[0].isIntersecting)play();else v.pause()}).observe($('.hero-track'));
})();
/* ----- horaires fictifs : statut ouvert / fermé à l'heure de Paris (pastille de la barre + section atelier) ----- */
(function(){var el=$('#open-now'),hp=$('#hp'),hpt=$('#hp-t');if(!el&&!hp)return;
  var SCH={2:[[9,13],[15,19]],3:[[9,13],[15,19]],4:[[9,13],[15,19]],5:[[9,13],[15,19]],6:[[9,18]]};
  var DAYS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  function paris(){var f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date()),o={};f.forEach(function(p){o[p.type]=p.value});
    return{d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday],h:(+o.hour%24)+(+o.minute)/60}}
  function status(){var t=paris(),sl=SCH[t.d]||[],cur=null,i,k,r;
    for(i=0;i<sl.length;i++)if(t.h>=sl[i][0]&&t.h<sl[i][1])cur=sl[i];
    if(cur)return{open:true,short:"Ouvert jusqu'à "+cur[1]+' h',long:"Ouvert en ce moment, jusqu'à "+cur[1]+' h (fictif)'};
    for(k=0;k<8;k++){var dd=(t.d+k)%7,ss=SCH[dd]||[];for(i=0;i<ss.length;i++){r=ss[i];if(k>0||r[0]>t.h){
      var when=k===0?'à '+r[0]+' h':(k===1?'demain '+r[0]+' h':DAYS[dd]+' '+r[0]+' h');
      return{open:false,short:'Fermé · ouvre '+when,long:'Fermé en ce moment, ouvre '+when+' (fictif)'}}}}
    return{open:false,short:'Fermé',long:'Fermé (fictif)'}}
  function upd(){var st=status();
    if(el){el.className='open-now '+(st.open?'is-open':'is-closed');el.textContent=st.long}
    if(hp){hp.className='hours-pill '+(st.open?'is-open':'is-closed');hpt.textContent=st.short;hp.setAttribute('aria-label',st.short+' (horaires fictifs), voir les horaires de l\'atelier')}}
  try{upd();setInterval(upd,60000)}catch(e){}
})();

/* ----- Scène B : du grain à la tasse ----- */
var WT=[.9,.9,2.4,1,1],BND=[0],TW=.03;WT.reduce(function(a,w){BND.push(a+w);return a+w},0);var TOT=BND[5];BND=BND.map(function(b){return b/TOT});
var stages=$$('.sb-s'),hudBtns=$$('#sb-hud button'),curStage=-1;
var ROAST={
 base:[[0,198],[.15,150],[.6,112],[1.5,92],[3,126],[4,148],[6,172],[7.5,186]],
 aube:{tail:[[8.5,195],[9.5,205]],fc:8.5,drop:9.5,dry:4,col:'#a8692f',name:"Soleil Levant"},
 zenith:{tail:[[9.25,198],[10.25,206],[11,213]],fc:9.25,drop:11,dry:4,col:'#6b3a1e',name:'Crépuscule'},
 nuit:{tail:[[9.5,199],[11.5,209],[13,224]],fc:9.5,drop:13,dry:4,col:'#2c160c',name:'Nocturne'}
};
var CH={w:360,h:178,x0:34,x1:352,y0:10,y1:150,tmax:13.5,tmin:80,tmaxT:230};
var rKey='zenith',rS=null,rLastFC=false,rQ=0;
function cx(t){return CH.x0+(t/CH.tmax)*(CH.x1-CH.x0)}
function cy(T){return CH.y1-((T-CH.tmin)/(CH.tmaxT-CH.tmin))*(CH.y1-CH.y0)}
function buildRoast(key){
  var cfg=ROAST[key],pts=ROAST.base.concat(cfg.tail),n=pts.length,samples=[],d='';
  var P=pts.map(function(p){return [cx(p[0]),cy(p[1])]});
  d='M'+P[0][0].toFixed(1)+' '+P[0][1].toFixed(1);
  for(var i=0;i<n-1;i++){
    var p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(n-1,i+2)];
    var c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
    d+='C'+c1[0].toFixed(1)+' '+c1[1].toFixed(1)+' '+c2[0].toFixed(1)+' '+c2[1].toFixed(1)+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);
    for(var s=0;s<=24;s++){var u=s/24,mu=1-u;
      var x=mu*mu*mu*p1[0]+3*mu*mu*u*c1[0]+3*mu*u*u*c2[0]+u*u*u*p2[0],y=mu*mu*mu*p1[1]+3*mu*mu*u*c1[1]+3*mu*u*u*c2[1]+u*u*u*p2[1];
      samples.push([(x-CH.x0)/(CH.x1-CH.x0)*CH.tmax,CH.tmin+((CH.y1-y)/(CH.y1-CH.y0))*(CH.tmaxT-CH.tmin)])}
  }
  rS={cfg:cfg,d:d,samples:samples,pts:pts};
  var axes='',i2;
  for(i2=0;i2<=12;i2+=2)axes+='<line x1="'+cx(i2)+'" x2="'+cx(i2)+'" y1="'+CH.y0+'" y2="'+CH.y1+'" /><text x="'+cx(i2)+'" y="'+(CH.y1+13)+'" text-anchor="middle">'+i2+'</text>';
  [100,150,200].forEach(function(T){axes+='<line x1="'+CH.x0+'" x2="'+CH.x1+'" y1="'+cy(T)+'" y2="'+cy(T)+'" /><text x="'+(CH.x0-5)+'" y="'+(cy(T)+3)+'" text-anchor="end">'+T+'</text>'});
  axes+='<text x="'+CH.x1+'" y="'+(CH.y1+13)+'" text-anchor="end" style="font-weight:600">min</text><text x="2" y="8">°C</text>';
  var bands='<rect x="'+cx(0)+'" y="'+CH.y0+'" width="'+(cx(cfg.dry)-cx(0))+'" height="'+(CH.y1-CH.y0)+'" fill="#f2c98f" opacity=".07"/><rect x="'+cx(cfg.dry)+'" y="'+CH.y0+'" width="'+(cx(cfg.fc)-cx(cfg.dry))+'" height="'+(CH.y1-CH.y0)+'" fill="#e8975a" opacity=".12"/><rect x="'+cx(cfg.fc)+'" y="'+CH.y0+'" width="'+(cx(cfg.drop)-cx(cfg.fc))+'" height="'+(CH.y1-CH.y0)+'" fill="#b3441b" opacity=".28"/>';
  var lab='<text class="phase-lbl" x="'+(cx(cfg.dry/2))+'" y="'+(CH.y1+28)+'" text-anchor="middle">Séchage</text><text class="phase-lbl" x="'+cx((cfg.dry+cfg.fc)/2)+'" y="'+(CH.y1+28)+'" text-anchor="middle">Maillard</text><text class="phase-lbl" x="'+cx((cfg.fc+cfg.drop)/2)+'" y="'+(CH.y1+28)+'" text-anchor="middle" style="font-size:9px">Dév.</text>';
  var fcT=tempAt(cfg.fc);
  $('#chart').innerHTML='<svg viewBox="0 0 '+CH.w+' '+CH.h+'" aria-hidden="true"><g>'+bands+'</g><g class="axis">'+axes+'</g>'+lab+'</svg>'+
   '<svg class="curve-clip curve-glow" id="curve-clip" viewBox="0 0 '+CH.w+' '+CH.h+'" aria-hidden="true"><path d="'+d+'" fill="none" stroke="#f2a362" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
   '<svg viewBox="0 0 '+CH.w+' '+CH.h+'" aria-hidden="true"><g id="fc-mark" opacity="0"><line x1="'+cx(cfg.fc)+'" x2="'+cx(cfg.fc)+'" y1="'+CH.y0+'" y2="'+CH.y1+'" stroke="#f4ead9" stroke-dasharray="3 3" stroke-width="1.5"/><text x="'+(cx(cfg.fc)-4)+'" y="'+(CH.y0+9)+'" text-anchor="end" style="font:600 10px Barlow,sans-serif;fill:#f4ead9">1er craquement '+Math.round(fcT)+' °C</text></g><circle id="head" r="7" cx="0" cy="0" fill="#fff3d6" stroke="#e8975a" stroke-width="3"/></svg>';
  $$('#roast-panel [data-rc]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.rc===key)});
}
function tempAt(t){var s=rS.samples;if(t<=s[0][0])return s[0][1];for(var i=1;i<s.length;i++){if(s[i][0]>=t){var a=s[i-1],b=s[i],u=(t-a[0])/Math.max(1e-6,b[0]-a[0]);return lerp(a[1],b[1],u)}}return s[s.length-1][1]}
function hex(c){return [parseInt(c.substr(1,2),16),parseInt(c.substr(3,2),16),parseInt(c.substr(5,2),16)]}
function mix(c1,c2,u){var a=hex(c1),b=hex(c2);return 'rgb('+[0,1,2].map(function(i){return Math.round(lerp(a[i],b[i],clamp(u)))}).join(',')+')'}
function beanColor(t){var c=rS.cfg,st=[[0,'#7d8a4a'],[2.5,'#8f9650'],[4.2,'#c9b45a'],[c.fc-1.4,'#b88a3e'],[c.fc,'#a8692f'],[c.drop,c.col]];
  for(var i=1;i<st.length;i++){if(t<=st[i][0])return mix(st[i-1][1],st[i][1],(t-st[i-1][0])/Math.max(.001,st[i][0]-st[i-1][0]))}return st[st.length-1][1]}
function beanFx(t){var c=rS.cfg,fin={aube:[14,1,1.5],zenith:[4,1,1.02],nuit:[0,.9,.5]}[rKey],st=[[0,[72,.7,1.22]],[2.5,[64,.75,1.22]],[4.2,[38,1,1.32]],[c.fc-1.4,[20,1.05,1.18]],[c.fc,[8,1.08,1.05]],[c.drop,fin]],i,a,b,u;
  for(i=1;i<st.length;i++){if(t<=st[i][0]){a=st[i-1];b=st[i];u=clamp((t-a[0])/Math.max(.001,b[0]-a[0]));return 'hue-rotate('+lerp(a[1][0],b[1][0],u).toFixed(1)+'deg) saturate('+lerp(a[1][1],b[1][1],u).toFixed(2)+') brightness('+lerp(a[1][2],b[1][2],u).toFixed(2)+')'}}
  return 'hue-rotate('+fin[0]+'deg) saturate('+fin[1]+') brightness('+fin[2]+')'}
var rTempN=null,rTime=$('#r-time'),rPhase=$('#r-phase'),beanImg=$('#bean-img'),lastTemp=-1,lastPh='';
function drawRoast(q){
  rQ=q;var c=rS.cfg,t=q*c.drop,T=tempAt(t);
  var clip=$('#curve-clip');if(clip)clip.style.clipPath='inset(0 '+((1-(cx(t)/CH.w))*100).toFixed(2)+'% 0 0)';
  var head=$('#head');if(head)head.style.transform='translate('+cx(t).toFixed(1)+'px,'+cy(T).toFixed(1)+'px)';
  var rt=Math.round(T);if(rt!==lastTemp){lastTemp=rt;rTempN.textContent=rt}
  rTime.textContent=mmss(t*60);
  var ph=t<c.dry?'Séchage':(t<c.fc?'Maillard':(q>=.999?'Sortie du tambour':'Développement'));if(ph!==lastPh){lastPh=ph;rPhase.textContent=ph==='Sortie du tambour'?'Sortie à '+c.drop.toString().replace('.',',')+' min':ph}
  beanImg.style.filter=beanFx(t);
  var fcOn=t>=c.fc,fm=$('#fc-mark');if(fm)fm.setAttribute('opacity',fcOn?1:0);
  if(fcOn&&!rLastFC&&MOTION)FX.crack();rLastFC=fcOn;
}
function initRoast(){
  var rt=$('#r-temp');rt.innerHTML='<span class="n">198</span><small>°C</small>';rTempN=$('.n',rt);
  buildRoast(rKey);drawRoast(MOTION?0:1);
  $$('#roast-panel [data-rc]').forEach(function(b){b.addEventListener('click',function(){rKey=b.dataset.rc;lastPh='';lastTemp=-1;rLastFC=false;buildRoast(rKey);drawRoast(rQ)})});
}
initRoast();
function stageUpdate(p,info){
  var en=[];for(var i=0;i<5;i++){en[i]=i===0?1:easeIO(clamp((p-(BND[i]-TW))/(2*TW)))}
  var act=0;for(var k=0;k<5;k++){if(p>=BND[k]-TW/2)act=k}
  stages.forEach(function(s,i){
    var e=en[i],nx=i<4?en[i+1]:0,o=clamp(e*2-1)*clamp(1-nx*2),med=s.querySelector('.sb-media'),cp=s.querySelector('.sb-copy'),pn=s.querySelector('.sb-panel');
    var vis=e>0&&nx<1;s.style.visibility=vis?'visible':'hidden';
    med.style.clipPath=e>=1?'none':'inset('+((1-e)*100).toFixed(2)+'% 0 0 0)';
    var ty=((1-e)*30-nx*20).toFixed(1)+'px';
    cp.style.opacity=o.toFixed(3);cp.style.transform='translateY('+ty+')';pn.style.opacity=o.toFixed(3);pn.style.transform='translateY('+ty+')';
  });
  hudBtns.forEach(function(b,i){if(i===act)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
  if(act!==curStage){curStage=act}
  var lp=clamp((p-BND[2]+TW)/(BND[3]-BND[2]));drawRoast(clamp((lp-.1)/.78));
}
if(MOTION){addScene($('.sb-track'),stageUpdate)}
hudBtns.forEach(function(b){b.addEventListener('click',function(){
  var tr=$('.sb-track'),st=$('.pin',tr),range=tr.offsetHeight-st.offsetHeight,i=+b.dataset.go,p=i===0?.01:BND[i]+(BND[i+1]-BND[i])*(i===2?.25:.6);
  smoothTo(tr.getBoundingClientRect().top+scrollY-BAR+p*range)})});

/* ===== Roue des saveurs ===== */
var NOTES=[
 {id:'agrumes',l:'Agrumes',c:'aube',f:0},{id:'fleur',l:'Fleur blanche',c:'aube',f:0},{id:'miel',l:'Miel',c:'aube',f:1},
 {id:'caramel',l:'Caramel',c:'zenith',f:1},{id:'noisette',l:'Noisette',c:'zenith',f:2},{id:'chocolat',l:'Chocolat au lait',c:'zenith',f:2},
 {id:'cacao',l:'Cacao noir',c:'nuit',f:2},{id:'epices',l:'Épices',c:'nuit',f:3},{id:'secs',l:'Fruits secs grillés',c:'nuit',f:3}];
var FAMS=[{l:['Fruité &','floral']},{l:['Sucré']},{l:['Noix &','cacao']},{l:['Épicé &','grillé']}];
var sel={};
function pol(r,a){var t=a*Math.PI/180;return [r*Math.cos(t),r*Math.sin(t)]}
function sector(r1,r2,a1,a2){var A=pol(r2,a1),B=pol(r2,a2),C=pol(r1,a2),D=pol(r1,a1),lg=(a2-a1)>180?1:0;
  return 'M'+A[0].toFixed(2)+' '+A[1].toFixed(2)+'A'+r2+' '+r2+' 0 '+lg+' 1 '+B[0].toFixed(2)+' '+B[1].toFixed(2)+'L'+C[0].toFixed(2)+' '+C[1].toFixed(2)+'A'+r1+' '+r1+' 0 '+lg+' 0 '+D[0].toFixed(2)+' '+D[1].toFixed(2)+'Z'}
function lblTxt(lines,r,a,cls,fill,fs){var m=pol(r,a),rot=Math.sin(a*Math.PI/180)<0?a+90:a-90,lh=(fs||14.5)*1.05,y0=-(lines.length-1)*lh/2;
  return '<text class="'+(cls||'')+'" transform="translate('+m[0].toFixed(1)+' '+m[1].toFixed(1)+') rotate('+rot.toFixed(1)+')" '+(fill?'fill="'+fill+'"':'')+'>'+lines.map(function(t,i){return '<tspan x="0" y="'+(y0+i*lh).toFixed(1)+'">'+t+'</tspan>'}).join('')+'</text>'}
function buildWheel(){
  var s='<svg viewBox="-200 -200 400 400" role="presentation">',a0=-90,i;
  for(i=0;i<9;i++){var n=NOTES[i],a1=a0+i*40+.6,a2=a0+(i+1)*40-.6,col=CAFES[n.c].sw,tx=n.c==='aube'?'#1a2a1c':'#ffffff';
    s+='<path class="seg" data-n="'+n.id+'" d="'+sector(120,196,a1,a2)+'" fill="'+col+'" data-fill="'+col+'" data-tx="'+tx+'"/>';
    s+=lblTxt(n.l.split(' ').length>1&&n.l.length>9?splitLines(n.l):[n.l],158,(a1+a2)/2,'nl',tx)}
  var starts=[0,2,4,7],counts=[2,2,3,2];
  FAMS.forEach(function(f,j){var a1=a0+starts[j]*40+.6,a2=a0+(starts[j]+counts[j])*40-.6;
    s+='<path class="fam" data-f="'+j+'" d="'+sector(64,115,a1,a2)+'"/>'+lblTxt(f.l,89,(a1+a2)/2,'ftxt')});
  s+='<circle class="hub" r="58"/><text class="hubtxt" y="-4" text-anchor="middle" id="hub-n">0</text><text class="hubsub" y="16" text-anchor="middle" id="hub-s">saveur</text></svg>';
  $('#wheel').innerHTML=s;
}
function splitLines(t){var w=t.split(' ');if(w.length===2)return w;if(w.length===3)return [w[0]+' '+w[1],w[2]];return [w.slice(0,Math.ceil(w.length/2)).join(' '),w.slice(Math.ceil(w.length/2)).join(' ')]}
function buildChips(){
  var h='';CKEYS.forEach(function(k){var c=CAFES[k];h+='<div class="chip-grp"><h3><i style="--sw:'+c.sw+'"></i>'+c.name+'</h3><div class="chip-row">'+NOTES.filter(function(n){return n.c===k}).map(function(n){return '<button class="chip" type="button" data-n="'+n.id+'" aria-pressed="false">'+n.l+'</button>'}).join('')+'</div></div>'});
  $('#chips').innerHTML=h;
}
function toggleNote(id){if(sel[id])delete sel[id];else sel[id]=1;FX.tick();renderWheel()}
function renderWheel(){
  var ids=Object.keys(sel);
  $$('#wheel .seg').forEach(function(p){var on=!!sel[p.dataset.n];p.classList.toggle('sel',on);p.setAttribute('fill',on?'#f2c98f':p.dataset.fill);var t=p.nextElementSibling;if(t)t.setAttribute('fill',on?'#1a0f09':p.dataset.tx)});
  $$('#wheel .fam').forEach(function(p){var f=+p.dataset.f,all=NOTES.filter(function(n){return n.f===f}).every(function(n){return sel[n.id]});p.classList.toggle('sel',all)});
  $$('#chips .chip').forEach(function(b){b.setAttribute('aria-pressed',!!sel[b.dataset.n])});
  $('#hub-n').textContent=ids.length;$('#hub-s').textContent=ids.length>1?'saveurs':'saveur';
  var cnt={aube:0,zenith:0,nuit:0};NOTES.forEach(function(n){if(sel[n.id])cnt[n.c]++});
  var max=Math.max(cnt.aube,cnt.zenith,cnt.nuit),leaders=CKEYS.filter(function(k){return cnt[k]===max&&max>0});
  var h='';
  if(!ids.length){h+='<h3>Choisissez au moins une saveur.</h3><p class="hand">Chaque café a trois notes. Piochez celles qui vous plaisent.</p>'}
  else if(leaders.length===1){var c=CAFES[leaders[0]];h+='<h3>Votre café : '+c.name+'</h3><p>'+max+' note'+(max>1?'s':'')+' sur 3 trouvée'+(max>1?'s':'')+'. '+c.roast+', '+c.info[0][1]+'.</p>'}
  else{h+='<h3>Égalité : '+leaders.map(function(k){return CAFES[k].name}).join(' et ')+'</h3><p>Chacun trouve '+max+' note'+(max>1?'s':'')+'. Goûtez les deux, ou prenez une formule à deux sachets.</p>'}
  h+='<div class="bars">'+CKEYS.map(function(k){return '<div class="bar-row'+(leaders.indexOf(k)>-1?' top':'')+'"><span>'+CAFES[k].name+'</span><span class="trk"><i style="transform:scaleX('+(cnt[k]/3)+')"></i></span><span class="tabnum">'+cnt[k]+'/3</span></div>'}).join('')+'</div>';
  if(leaders.length){var lk=leaders[0];h+='<div class="reco-actions"><button class="btn btn-main" type="button" data-choose="'+lk+'">Je m\'abonne avec '+CAFES[lk].article+'</button><button class="btn btn-sm btn-line" type="button" data-open="'+lk+'">Voir la fiche</button><button class="btn btn-sm btn-line" type="button" data-prep-cafe="'+lk+'">Préparer ce café</button><button class="link-btn" type="button" id="wheel-clear">Effacer</button></div>'}
  $('#reco').innerHTML=h;
  var cl=$('#wheel-clear');if(cl)cl.addEventListener('click',function(){sel={};renderWheel()});
}
buildWheel();buildChips();
$('#wheel').addEventListener('click',function(e){var s=e.target.closest('.seg'),f=e.target.closest('.fam');
  if(s){toggleNote(s.dataset.n)}
  else if(f){var fi=+f.dataset.f,ns=NOTES.filter(function(n){return n.f===fi}),all=ns.every(function(n){return sel[n.id]});ns.forEach(function(n){if(all)delete sel[n.id];else sel[n.id]=1});FX.tick();renderWheel()}});
$('#chips').addEventListener('click',function(e){var b=e.target.closest('.chip');if(b)toggleNote(b.dataset.n)});
renderWheel();

/* ===== Fiche encyclopédie ===== */
var dlg=$('#fiche'),lastTrigger=null,curCafe='zenith';
function radar(prof){
  var R=82,n=prof.length,ring='',ax='',lb='',pts=[];
  for(var r=1;r<=5;r++){var rp=[];for(var i=0;i<n;i++){var p=pol(R*r/5,-90+i*360/n);rp.push(p[0].toFixed(1)+','+p[1].toFixed(1))}ring+='<polygon class="ax" points="'+rp.join(' ')+'"/>'}
  prof.forEach(function(p,i){var a=-90+i*360/n,e=pol(R,a),v=pol(R*p[1]/5,a),l=pol(R+17,a);ax+='<line class="ax" x1="0" y1="0" x2="'+e[0].toFixed(1)+'" y2="'+e[1].toFixed(1)+'"/>';pts.push(v[0].toFixed(1)+','+v[1].toFixed(1));
    lb+='<text x="'+l[0].toFixed(1)+'" y="'+(l[1]+4).toFixed(1)+'" text-anchor="'+(Math.abs(l[0])<6?'middle':(l[0]>0?'start':'end'))+'">'+p[0]+' '+p[1]+'/5</text>'});
  return '<svg viewBox="-150 -125 300 250" role="img" aria-label="Profil en tasse : '+prof.map(function(p){return p[0]+' '+p[1]+' sur 5'}).join(', ')+'">'+ring+ax+'<polygon class="pl" points="'+pts.join(' ')+'"/>'+lb+'</svg>';
}
function openFiche(key,trigger){
  var c=CAFES[key];curCafe=key;lastTrigger=trigger||document.activeElement;
  var toc=c.secs.map(function(s,i){return '<li><a href="#f-'+i+'" data-toc="f-'+i+'">'+s[0]+'</a></li>'}).join('');
  var body=c.secs.map(function(s,i){return '<h3 id="f-'+i+'">'+s[0]+'</h3><p>'+s[1]+'</p>'}).join('');
  var info=c.info.map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>'}).join('');
  dlg.innerHTML='<div class="fiche-bar"><p>Encyclopédie du café Balma, fiche fictive</p><button class="icon-btn" type="button" data-close aria-label="Fermer la fiche"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg></button></div>'+
  '<div class="fiche-body"><div class="fiche-title"><h2 id="fiche-title">'+c.name+'</h2><p class="sub">'+c.sub+'</p></div>'+
  '<div class="fiche-grid"><div class="fiche-text"><nav class="toc" aria-label="Sommaire"><b>Sommaire</b><ol>'+toc+'</ol></nav><p class="hand" style="margin-bottom:.6rem">'+c.intro+'</p>'+body+
  '<p class="refs"><b>Notes.</b> [1] Altitudes et régions données à titre indicatif. [2] Procédés décrits de façon simplifiée. [3] Courbes et durées établies pour la démonstration. Toutes les données de cette fiche sont fictives.</p></div>'+
  '<aside class="infobox" aria-label="Fiche technique"><h3>'+c.name+'</h3><div class="ib-media" style="--ibt2:'+c.t[1]+';--ibt3:'+c.t[2]+'"><img src="'+c.img+'" width="401" height="760" alt="" loading="lazy"></div><dl>'+info+'</dl><div class="profile"><h4>Profil en tasse</h4>'+radar(c.profile)+'</div></aside></div>'+
  '<div class="fiche-actions"><button class="btn" type="button" data-prep-cafe="'+key+'">Préparer ce café</button><button class="btn btn-line" type="button" data-choose="'+key+'">Je le choisis</button><button class="btn btn-line" type="button" data-close>Fermer</button></div></div>';
  dlg.insertAdjacentHTML('beforeend','<div class="fiche-cta"><p><b>'+c.name+'</b> · 9,90'+NB+'€ les 250'+NB+'g, sans engagement</p><button class="btn btn-main" type="button" data-choose="'+key+'">Je le choisis</button></div>');
  if(!dlg.open)dlg.showModal();dlg.scrollTop=0;
}
dlg.addEventListener('click',function(e){
  if(e.target===dlg){dlg.close();return}
  var t=e.target.closest('[data-toc]');if(t){e.preventDefault();var el=document.getElementById(t.dataset.toc);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});return}
  if(e.target.closest('[data-close]'))dlg.close();
});
dlg.addEventListener('close',function(){if(lastTrigger&&lastTrigger.focus&&document.contains(lastTrigger))lastTrigger.focus()});

/* ===== Actions globales ===== */
function scrollToSel(sel){var el=$(sel);if(el)smoothTo(el.getBoundingClientRect().top+scrollY-BAR-8)}
document.addEventListener('click',function(e){
  var o=e.target.closest('[data-open]');if(o){openFiche(o.dataset.open,o);return}
  var cc=e.target.closest('[data-choose-current]');if(cc){CB.goSubscribe({choose:prepState.cafe});return}
  var oc=e.target.closest('[data-open-current]');if(oc){openFiche(prepState.cafe,oc);return}
  var pc=e.target.closest('[data-prep-cafe]');if(pc){var k=pc.dataset.prepCafe;if(dlg.open)dlg.close();setPrep({cafe:k,method:CAFES[k].method});scrollToSel('#preparation');return}
  var pm=e.target.closest('[data-prep]');if(pm){setPrep({method:pm.dataset.prep});return}
  var ch=e.target.closest('[data-choose]');if(ch){if(dlg.open)dlg.close();CB.goSubscribe({choose:ch.dataset.choose});return}
  var lk=e.target.closest('#menu a');if(lk){var m=$('#menu');if(m&&m.hidePopover)try{m.hidePopover()}catch(er){}}
});

/* ===== Quiz : le ticket ===== */
var QUIZ=[
 {q:"Votre café du matin, c'est plutôt…",a:[["Une tasse noire, bien chaude",{nuit:2,zenith:1}],["Un café allongé de lait",{zenith:2,nuit:1}],["Un filtre lent, le week-end",{aube:2,zenith:1}],["Un espresso avalé debout",{nuit:1,zenith:2}]]},
 {q:"Quelle odeur vous met de bonne humeur dans la cuisine ?",a:[["Un zeste d'orange, des fleurs",{aube:3}],["De la brioche, du caramel, des noisettes",{zenith:3}],["Du chocolat noir, des épices",{nuit:3}]]},
 {q:"Avec quel matériel préparez-vous votre café ?",a:[["Un filtre (V60, Chemex)",{aube:1,zenith:1},'filtre'],["Un piston",{zenith:1,nuit:1},'piston'],["Une machine espresso",{nuit:1,zenith:1},'espresso'],["Une cafetière italienne",{nuit:2},'moka']]},
 {q:"L'acidité dans un café, vous en pensez quoi ?",a:[["J'aime quand ça pétille",{aube:3}],["Un peu, pour la fraîcheur",{aube:1,zenith:2}],["Aucune, je veux de la rondeur",{zenith:1,nuit:2}]]}
];
var qs={i:0,score:{aube:0,zenith:0,nuit:0},method:'filtre',hist:[]};
function renderQuiz(focus){
  var T=$('#ticket'),h='';
  if(qs.i<QUIZ.length){var q=QUIZ[qs.i];
    h+='<div class="q-top"><b>Question '+(qs.i+1)+' sur '+QUIZ.length+'</b><span class="q-prog" aria-hidden="true">'+QUIZ.map(function(_,i){return '<i class="'+(i<=qs.i?'on':'')+'"></i>'}).join('')+'</span></div>';
    h+='<h3 class="q-title" id="q-title" tabindex="-1">'+q.q+'</h3><div class="answers">'+q.a.map(function(a,i){return '<button class="ans" type="button" data-a="'+i+'"><span class="k" aria-hidden="true">'+'ABCD'[i]+'</span><span>'+a[0]+'</span></button>'}).join('')+'</div>';
    if(qs.i>0)h+='<button class="link-btn q-back" type="button" id="q-back">Question précédente</button>';
  }else{
    var sc=qs.score,best='zenith',m=-1;['zenith','aube','nuit'].forEach(function(k){if(sc[k]>m){m=sc[k];best=k}});
    var c=CAFES[best],M=METHODS[qs.method],dose=M.dose.val,water=qs.method==='espresso'?dose*2:dose*M.ratio,temp=M.temp+c.tOff,sum=sc.aube+sc.zenith+sc.nuit||1;
    h+='<div class="result"><span class="sample">Votre ticket</span><h3 id="q-title" tabindex="-1">'+c.name+'</h3><p class="hand">'+c.roast+', '+c.info[0][1]+'. Notes '+deNote(c.info[7][1].toLowerCase())+'.</p>';
    h+='<div class="recipe"><div><b>'+dose+NB+'g</b><span>de grains</span></div><div><b>'+fmt(water)+NB+'g</b><span>'+(qs.method==='espresso'?'en tasse':'d\'eau')+'</span></div><div><b>'+temp+NB+'°C</b><span>'+M.name+'</span></div></div>';
    h+='<p class="fiction">Mouture conseillée : '+M.grind.toLowerCase()+' ('+M.micron+'). Moulez à la dernière minute.</p>';
    h+='<div class="bars" style="display:grid;gap:.4rem;margin:1rem 0">'+CKEYS.map(function(k){var pc=Math.round(sc[k]/sum*100);return '<div class="bar-row'+(k===best?' top':'')+'"><span>'+CAFES[k].name+'</span><span class="trk"><i style="transform:scaleX('+(pc/100)+')"></i></span><span class="tabnum">'+pc+NNB+'%</span></div>'}).join('')+'</div>';
    h+='<div class="row"><button class="btn btn-main" type="button" data-choose="'+best+'">Je m\'abonne avec '+CAFES[best].article+'</button><button class="btn btn-sm btn-line" type="button" data-prep-cafe="'+best+'" data-method="'+qs.method+'">Régler ma préparation</button></div><p style="margin-top:.8rem"><button class="link-btn" type="button" id="q-redo">Recommencer le quiz</button></p></div>';
  }
  T.innerHTML=h;
  var tt=$('#q-title');if(focus&&tt)tt.focus({preventScroll:true});
  if(qs.i>=QUIZ.length)FX.tink();
}
$('#ticket').addEventListener('click',function(e){
  var a=e.target.closest('.ans');
  if(a){var an=QUIZ[qs.i].a[+a.dataset.a];qs.hist.push({sc:an[1],m:an[2]});for(var k in an[1])qs.score[k]+=an[1][k];if(an[2])qs.method=an[2];qs.i++;renderQuiz(true);return}
  if(e.target.closest('#q-back')){var l=qs.hist.pop();for(var k2 in l.sc)qs.score[k2]-=l.sc[k2];if(l.m){qs.method='filtre';qs.hist.forEach(function(x){if(x.m)qs.method=x.m})}qs.i--;renderQuiz(true);return}
  if(e.target.closest('#q-redo')){qs={i:0,score:{aube:0,zenith:0,nuit:0},method:'filtre',hist:[]};renderQuiz(true);return}
  var pc=e.target.closest('[data-prep-cafe]');if(pc&&pc.dataset.method){e.stopPropagation();setPrep({cafe:pc.dataset.prepCafe,method:pc.dataset.method});scrollToSel('#preparation')}
},true);
renderQuiz(false);

/* ===== Origines : carte ===== */
var MAP={"W":1500,"H":492,"S":6,"LON0":-100,"LAT1":56,"land":"M803 342L804 342L826 355L827 358L835 364L832 371L833 375L837 377L837 379L835 382L836 384L835 387L837 391L840 397L842 398L837 401L831 404L827 404L825 405L821 406L819 406L812 405L807 405L806 397L804 394L802 393L797 391L793 390L789 389L787 388L784 386L781 378L778 375L777 372L777 369L776 363L779 363L781 361L783 357L785 356L784 354L783 353L783 350L785 350L785 346L783 343L785 342L791 342L803 342ZM548 170L548 172L548 181L528 180L528 196L523 196L521 199L522 208L499 208L498 210L498 207L511 207L512 205L515 202L517 194L525 187L528 180L530 179L532 175L537 174L539 175L542 175L544 173L547 173L547 170L548 170ZM-137 42L-138 42L-149 36L-154 34L-165 31L-168 26L-167 22L-175 19L-176 15L-183 10L-183 7L-180 4L-180 1L-190 -3L-196 -10L-200 -14L-206 -17L-210 -20L-213 -23L-219 -21L-225 -17L-230 -21L-234 -24L-240 -26L-246 -26L-246 -60L-246 -82L-235 -81L-225 -78L-219 -77L-214 -80L-206 -82L-198 -81L-189 -84L-179 -85L-175 -83L-170 -84L-169 -87L-165 -86L-155 -81L-147 -85L-146 -80L-138 -81L-136 -83L-129 -83L-120 -80L-106 -78L-97 -77L-91 -77L-83 -74L-92 -71L-81 -70L-65 -71L-60 -72L-53 -68L-47 -71L-53 -74L-49 -76L-42 -76L-37 -77L-32 -75L-26 -72L-19 -73L-9 -70L1 -71L9 -71L9 -74L14 -75L23 -73L23 -68L27 -73L32 -72L35 -78L28 -82L21 -85L22 -91L29 -96L37 -95L43 -92L51 -85L46 -82L57 -81L57 -75L65 -80L72 -76L70 -71L76 -67L82 -72L87 -77L87 -83L95 -83L104 -82L112 -79L113 -76L108 -73L112 -70L112 -67L100 -62L92 -62L85 -63L84 -60L78 -55L76 -53L69 -49L61 -48L56 -46L55 -42L48 -41L41 -36L35 -29L32 -25L32 -18L41 -17L43 -11L46 -7L55 -8L66 -5L72 -3L76 0L84 2L90 4L100 5L106 5L105 10L107 16L112 23L121 29L125 27L128 21L125 11L121 8L131 5L137 1L141 -3L140 -7L136 -12L129 -17L136 -23L133 -29L131 -38L136 -39L146 -38L152 -37L157 -39L163 -37L170 -33L172 -31L182 -30L182 -25L184 -18L190 -17L194 -13L203 -17L209 -23L212 -26L217 -21L225 -13L232 -6L229 -2L237 1L243 5L252 6L256 8L258 13L263 14L265 16L266 23L262 25L257 27L247 30L240 35L230 36L217 34L208 34L202 35L197 39L189 42L180 50L173 55L178 54L188 46L201 41L210 41L215 44L209 48L211 54L213 59L221 62L231 61L237 54L237 58L241 60L234 64L220 68L215 70L208 75L203 74L203 69L213 64L204 64L197 65L193 62L193 54L191 52L187 53L185 51L180 56L178 61L176 63L173 64L172 64L171 66L160 66L151 66L148 67L142 71L141 72L139 74L134 74L128 74L125 75L126 76L126 78L126 79L119 82L112 83L105 86L104 86L102 85L101 84L103 81L105 78L107 75L106 69L105 64L98 61L99 60L98 59L97 59L95 58L95 57L94 58L92 57L93 57L91 56L91 55L86 53L81 51L75 48L70 46L64 48L62 48L55 46L50 47L44 45L38 44L34 44L32 43L31 40L29 40L29 42L17 42L-4 42L-24 42L-42 42L-60 42L-78 42L-96 42L-102 42L-120 42L-137 42ZM266 28L263 32L259 37L263 35L267 36L265 38L270 40L273 39L279 41L277 45L281 44L282 47L284 51L282 56L279 56L275 55L276 50L275 49L268 55L264 54L268 52L262 50L256 51L244 50L243 49L247 46L245 45L250 41L256 32L260 28L265 26L268 26L266 28ZM213 37L215 36L223 38L229 40L229 41L226 41L218 40L213 37ZM216 54L218 57L222 58L228 57L225 60L223 60L215 58L214 56L216 54ZM-137 42L-120 42L-102 42L-96 42L-78 42L-60 42L-42 42L-24 42L-4 42L17 42L29 42L29 40L31 40L32 43L34 44L38 44L44 45L50 47L55 46L62 48L64 48L70 46L75 48L81 51L86 53L91 55L91 56L93 57L92 57L94 58L95 57L95 58L97 59L98 59L99 60L98 61L105 64L106 69L107 75L105 78L103 81L101 84L102 85L104 86L105 86L112 83L119 82L126 79L126 78L126 76L125 75L128 74L134 74L139 74L141 72L142 71L148 67L151 66L160 66L171 66L172 64L173 64L176 63L178 61L180 56L185 51L187 53L191 52L193 54L193 62L197 65L198 67L192 70L186 72L179 74L176 77L175 79L175 82L177 85L180 85L179 83L181 84L180 86L176 87L173 87L169 88L166 88L163 89L158 90L167 89L168 90L160 92L156 92L156 91L154 93L156 93L155 98L151 102L150 101L149 101L147 99L148 102L150 103L150 106L148 108L144 113L144 112L146 108L143 106L142 101L141 104L142 108L138 107L142 108L142 114L144 115L145 117L146 123L142 127L136 129L132 132L129 133L126 135L125 137L118 141L115 144L112 147L111 152L112 156L114 161L117 165L117 168L120 175L119 179L119 181L118 185L116 186L113 185L112 182L110 181L107 176L104 171L103 169L104 165L102 161L98 156L95 155L89 158L88 158L85 155L82 154L75 154L69 154L65 154L62 155L64 157L63 159L65 160L64 161L61 160L59 161L55 161L50 158L45 159L41 157L37 158L32 159L26 164L20 166L17 169L16 172L16 176L16 179L17 181L15 181L11 180L6 178L4 175L3 171L-1 167L-3 164L-6 160L-10 157L-15 157L-19 162L-24 160L-27 159L-28 155L-30 152L-34 149L-37 148L-39 145L-49 145L-49 148L-54 148L-66 148L-80 144L-89 141L-88 140L-96 140L-103 141L-104 138L-108 134L-110 134L-111 132L-114 132L-117 130L-122 129L-124 128L-124 125L-130 119L-135 111L-135 109L-138 107L-142 102L-143 97L-146 94L-145 89L-145 84L-147 79L-145 74L-144 68L-143 63L-144 55L-146 50L-148 47L-147 46L-139 48L-136 53L-134 52L-135 47L-137 42ZM1124 41L1120 45L1115 45L1114 51L1111 54L1099 52L1095 63L1092 64L1080 66L1085 77L1081 78L1082 82L1078 81L1075 79L1066 78L1056 78L1054 79L1045 76L1042 77L1041 81L1031 79L1027 80L1026 82L1022 84L1014 88L1012 92L1010 92L1008 89L1000 89L999 84L996 84L997 78L989 74L979 74L972 75L966 70L961 67L952 63L951 62L936 66L936 88L933 88L929 84L924 82L918 83L915 85L915 84L916 81L915 79L908 77L905 72L902 70L902 68L908 69L908 65L913 64L918 64L919 59L918 55L912 55L907 54L900 56L895 58L892 57L892 54L888 50L884 50L879 46L882 41L881 40L885 33L891 37L892 32L905 26L914 26L927 30L934 32L941 30L950 30L958 33L960 31L968 31L970 28L960 24L966 21L964 20L970 18L966 14L969 12L991 10L994 8L1009 6L1014 4L1025 5L1027 11L1033 10L1041 12L1041 15L1046 15L1061 9L1059 11L1067 16L1080 31L1083 28L1092 31L1100 30L1104 31L1106 34L1111 35L1113 38L1121 37L1124 41ZM936 88L936 66L951 62L952 63L961 67L966 70L972 75L979 74L989 74L997 78L996 84L999 84L1000 89L1008 89L1010 92L1012 92L1014 88L1022 84L1026 82L1028 83L1023 87L1027 89L1031 88L1038 91L1031 95L1026 95L1024 95L1023 93L1024 90L1016 92L1014 95L1011 99L1006 99L1005 101L1009 103L1010 107L1007 113L1002 112L999 112L999 108L991 106L985 103L981 100L974 96L971 89L969 88L963 89L961 87L960 83L952 79L947 83L942 85L943 88L936 88ZM1446 352L1456 356L1468 359L1472 362L1475 365L1476 369L1486 373L1487 376L1482 376L1483 380L1489 384L1492 391L1496 390L1496 393L1500 394L1498 395L1505 398L1504 399L1500 400L1499 398L1494 398L1487 397L1483 393L1479 390L1476 384L1468 382L1463 383L1460 385L1460 390L1456 392L1452 391L1446 391L1446 371L1446 352ZM1516 358L1518 360L1519 363L1517 365L1516 361L1514 359L1512 357L1508 354L1504 352L1506 351L1509 353L1511 354L1513 355L1516 358ZM1508 371L1505 373L1501 374L1498 374L1493 372L1490 370L1490 369L1496 370L1499 369L1500 366L1501 366L1501 369L1505 369L1507 367L1510 365L1509 361L1513 361L1514 362L1514 365L1512 369L1509 369L1508 371ZM1529 368L1530 369L1533 373L1536 375L1535 377L1534 378L1531 375L1528 371L1527 367L1528 366L1529 368ZM254 517L253 522L251 528L251 534L250 536L249 539L249 543L257 548L256 552L260 554L259 557L254 565L245 568L233 570L226 569L227 573L226 577L227 580L224 582L217 583L212 581L209 582L210 588L214 590L217 588L219 591L214 593L209 597L208 603L207 606L201 606L196 609L195 614L200 618L206 619L204 625L197 628L193 635L188 638L185 640L187 647L191 650L189 650L183 649L169 648L166 645L166 640L162 640L160 638L160 632L164 629L166 625L165 622L168 617L171 609L170 606L173 605L172 602L169 601L171 599L169 596L167 590L170 588L169 581L170 575L172 569L175 567L173 561L173 556L178 552L178 547L181 541L181 536L180 535L177 524L180 518L180 512L182 507L186 501L190 497L188 495L190 493L189 483L196 480L198 474L197 472L202 467L210 468L214 473L216 468L223 468L224 469L235 479L240 480L247 485L253 487L254 490L248 499L254 500L261 501L266 500L271 496L272 490L275 489L278 493L278 498L273 501L269 503L262 509L254 517ZM182 441L185 446L186 450L189 452L187 458L191 465L193 473L197 472L198 474L196 480L189 483L190 493L188 495L190 497L186 501L182 507L180 512L180 518L177 524L180 535L181 536L181 541L178 547L178 552L173 556L173 561L175 567L172 569L170 575L169 581L170 588L167 590L169 596L171 599L169 601L172 602L173 605L170 606L171 609L168 617L165 622L166 625L164 629L160 632L160 638L162 640L166 640L166 645L169 648L183 649L189 650L183 650L180 651L175 653L174 659L171 659L165 657L158 653L150 650L148 646L150 642L147 638L146 628L149 622L155 618L146 616L152 611L154 601L161 603L164 590L160 589L158 596L154 595L156 587L158 576L161 572L159 566L158 559L161 559L165 549L169 539L171 531L170 522L172 517L171 509L175 502L176 490L178 478L179 464L179 455L178 446L181 445L182 441ZM776 363L777 369L777 372L778 375L781 378L784 386L782 385L774 386L772 387L771 391L772 394L771 401L770 407L772 408L776 410L778 409L778 416L774 415L771 412L769 410L764 409L763 406L759 408L755 407L753 404L749 403L746 404L746 402L743 402L741 401L737 402L734 402L733 403L733 395L731 393L731 389L732 386L730 384L730 380L723 380L724 378L721 378L720 379L717 379L715 382L714 384L711 383L709 384L705 384L703 381L701 379L699 376L698 371L680 371L678 372L676 372L674 373L673 371L675 370L675 367L676 366L678 365L680 365L682 363L685 363L685 365L687 366L691 362L695 359L696 357L696 352L698 346L701 343L705 340L706 339L706 336L707 334L707 331L707 326L709 322L710 319L711 315L711 311L714 308L717 306L722 308L726 310L730 311L734 312L736 308L737 308L740 308L746 305L749 307L751 306L752 305L754 304L758 305L762 305L764 305L768 310L771 310L772 309L775 310L778 308L780 311L785 315L785 322L787 323L785 325L783 326L781 330L779 332L779 337L778 340L777 344L776 346L776 349L775 350L774 353L776 356L776 363ZM850 346L846 341L846 319L851 312L853 311L857 310L862 306L870 306L887 288L891 283L894 279L894 276L894 270L894 268L896 267L898 267L902 266L904 264L907 264L907 266L906 269L906 272L905 274L903 281L900 288L897 295L892 304L886 311L879 319L873 324L864 330L859 334L852 342L851 345L850 346ZM835 364L827 358L826 355L804 342L803 342L803 335L805 333L808 329L810 325L808 318L807 315L804 311L808 307L812 303L815 304L815 307L817 309L821 309L829 314L831 314L832 314L833 315L837 315L839 313L845 310L847 312L851 312L846 319L846 341L850 346L845 348L844 351L842 351L841 356L839 358L838 362L835 364ZM747 287L743 284L741 282L740 280L741 278L741 275L738 272L737 269L737 268L735 266L735 262L734 260L732 260L732 258L734 256L733 253L735 251L734 250L735 246L738 242L743 242L743 219L743 216L750 216L750 204L774 204L797 204L821 204L823 210L822 211L823 217L825 224L827 226L830 228L827 231L823 232L821 234L821 238L818 247L819 249L818 255L815 261L812 264L809 268L808 271L806 272L804 278L804 284L804 279L803 279L803 276L802 274L799 272L799 267L799 263L796 263L796 264L792 264L794 266L794 270L791 273L788 277L785 278L780 274L778 275L777 277L774 278L774 280L768 280L767 278L763 278L761 279L759 279L756 275L755 274L750 274L749 277L747 282L745 284L743 284L747 287ZM743 219L743 242L738 242L735 246L734 250L735 251L733 253L734 256L732 258L732 260L734 260L735 262L735 266L737 268L737 269L733 270L730 273L726 279L720 282L715 282L713 282L713 284L710 286L708 289L700 291L699 290L698 289L697 291L692 291L693 290L691 286L690 283L687 282L684 279L685 276L688 276L689 276L693 276L690 271L690 267L689 263L687 259L688 256L684 256L684 252L681 250L684 242L691 236L692 228L694 216L695 214L693 212L693 210L691 208L689 199L695 196L719 207L743 219ZM170 218L170 221L170 223L168 224L170 226L170 228L166 227L163 227L159 227L156 228L153 226L154 224L159 225L164 225L166 224L163 221L163 219L160 218L161 217L165 217L170 218ZM170 228L170 226L168 224L170 223L170 221L170 218L170 217L175 217L179 218L180 218L181 220L185 220L184 222L187 222L190 224L188 227L185 225L182 226L180 225L179 227L177 227L176 225L174 226L172 230L170 229L170 228ZM895 58L892 61L886 62L880 68L886 74L885 78L892 85L888 88L887 89L884 89L880 85L878 85L875 83L873 81L867 80L864 81L863 80L854 77L846 76L840 75L832 70L825 68L820 65L824 64L829 59L826 56L835 54L835 52L829 53L830 51L833 49L838 49L839 47L838 43L840 40L840 38L832 36L828 37L824 34L820 35L812 33L812 31L810 29L805 28L805 27L806 25L803 22L796 23L794 22L793 24L791 23L789 20L788 18L789 17L794 17L796 16L794 14L790 13L791 12L788 11L785 7L786 6L785 3L779 1L776 2L775 0L769 -1L767 -5L767 -7L764 -9L766 -11L765 -16L769 -20L768 -21L775 -24L768 -27L781 -35L787 -38L789 -41L780 -45L783 -49L777 -54L781 -59L774 -66L780 -70L771 -74L772 -78L776 -79L787 -81L793 -83L803 -80L819 -78L842 -72L846 -69L847 -65L840 -62L830 -60L804 -65L799 -64L809 -59L809 -57L810 -50L817 -49L822 -47L823 -50L819 -53L823 -55L838 -51L843 -53L839 -57L853 -63L858 -63L864 -60L867 -65L862 -68L865 -72L861 -75L878 -73L881 -70L873 -69L873 -66L878 -64L887 -65L889 -69L901 -72L922 -77L927 -77L921 -73L928 -73L933 -75L944 -75L953 -77L960 -74L966 -78L960 -81L963 -83L981 -81L989 -79L1011 -73L1015 -76L1009 -79L1009 -80L1002 -81L1004 -84L1000 -88L1000 -90L1011 -96L1015 -101L1020 -102L1036 -101L1037 -97L1031 -92L1035 -91L1037 -86L1035 -78L1042 -74L1039 -70L1028 -62L1035 -61L1037 -63L1044 -65L1045 -68L1050 -71L1047 -74L1050 -78L1043 -78L1042 -82L1046 -88L1039 -93L1049 -97L1048 -101L1051 -101L1054 -98L1052 -92L1058 -91L1055 -95L1065 -98L1078 -98L1089 -94L1084 -99L1083 -106L1094 -107L1108 -107L1121 -108L1116 -111L1123 -115L1130 -115L1142 -118L1157 -119L1159 -120L1175 -121L1180 -119L1194 -123L1205 -123L1206 -125L1212 -128L1226 -130L1236 -128L1228 -127L1242 -126L1243 -123L1249 -124L1266 -124L1280 -121L1285 -119L1283 -116L1277 -114L1261 -111L1256 -109L1264 -108L1273 -107L1278 -108L1281 -104L1284 -106L1293 -107L1313 -106L1314 -103L1339 -102L1340 -106L1352 -105L1362 -105L1372 -102L1374 -98L1371 -96L1378 -91L1388 -89L1394 -95L1403 -92L1413 -94L1425 -92L1429 -94L1439 -93L1435 -98L1443 -101L1497 -97L1502 -94L1518 -89L1542 -90L1554 -89L1559 -87L1558 -82L1566 -81L1574 -82L1584 -82L1596 -81L1607 -81L1617 -76L1625 -78L1620 -82L1623 -85L1642 -83L1654 -83L1672 -80L1680 -78L1680 -54L1672 -51L1664 -52L1670 -48L1673 -44L1676 -42L1677 -39L1675 -38L1664 -39L1647 -35L1642 -34L1633 -30L1624 -26L1622 -23L1613 -27L1598 -23L1595 -25L1589 -22L1581 -23L1579 -19L1572 -13L1572 -11L1579 -10L1578 -1L1573 -1L1570 4L1573 7L1562 10L1560 17L1551 18L1549 24L1541 30L1539 26L1536 17L1533 4L1535 -5L1541 -8L1541 -11L1550 -12L1561 -20L1571 -26L1582 -31L1587 -39L1580 -39L1576 -34L1561 -27L1556 -35L1540 -33L1525 -23L1530 -19L1517 -17L1508 -17L1508 -21L1499 -22L1491 -19L1473 -20L1453 -18L1434 -7L1411 8L1420 8L1423 12L1429 13L1433 10L1439 11L1448 17L1448 23L1444 29L1443 36L1440 45L1431 54L1429 58L1421 65L1413 72L1409 76L1401 79L1397 79L1394 76L1386 81L1385 83L1384 82L1384 79L1387 78L1388 71L1386 66L1391 64L1399 65L1403 59L1405 53L1407 51L1410 45L1400 47L1395 49L1386 49L1383 44L1376 39L1366 37L1364 32L1362 28L1359 25L1356 19L1350 17L1341 15L1333 15L1326 16L1321 19L1324 21L1324 24L1321 26L1316 33L1316 35L1307 39L1300 37L1293 37L1290 35L1286 35L1277 39L1269 40L1264 41L1256 40L1251 40L1247 37L1241 34L1235 34L1228 34L1222 35L1214 33L1212 28L1205 27L1200 26L1193 24L1187 30L1189 33L1184 38L1175 36L1169 36L1165 33L1159 33L1153 31L1144 34L1133 39L1127 40L1124 41L1121 37L1113 38L1111 35L1106 34L1104 31L1100 30L1092 31L1083 28L1080 31L1067 16L1059 11L1061 9L1046 15L1041 15L1041 12L1033 10L1027 11L1025 5L1014 4L1009 6L994 8L991 10L969 12L966 14L970 18L964 20L966 21L960 24L970 28L968 31L960 31L958 33L950 30L941 30L934 32L927 30L914 26L905 26L892 32L891 37L885 33L881 40L882 41L879 46L884 50L888 50L892 54L892 57L895 58ZM736 10L725 10L718 9L719 7L728 5L734 6L737 7L736 9L736 10ZM1457 14L1460 20L1459 25L1462 32L1468 42L1459 40L1455 49L1461 55L1461 59L1456 56L1453 60L1451 55L1452 49L1451 43L1453 38L1453 30L1450 24L1450 16L1456 13L1453 11L1456 10L1457 14ZM801 60L802 59L806 60L808 60L809 61L810 62L813 64L819 63L818 65L811 66L803 70L800 69L801 66L795 64L796 63L802 61L801 60ZM126 175L129 175L133 175L133 177L127 177L126 175ZM133 174L138 176L137 181L136 180L136 177L133 174ZM131 185L133 185L135 190L135 193L133 194L132 190L130 189L131 185ZM787 -81L776 -79L772 -78L774 -83L766 -85L757 -83L754 -79L748 -76L742 -77L734 -77L727 -80L724 -79L720 -78L719 -74L708 -75L706 -72L701 -72L697 -68L691 -61L681 -53L684 -51L681 -48L675 -48L672 -43L672 -35L676 -32L674 -25L669 -21L666 -17L662 -21L650 -14L642 -12L634 -16L632 -22L630 -36L635 -40L651 -45L663 -51L674 -59L689 -71L699 -75L715 -83L728 -86L738 -85L747 -90L758 -90L769 -91L788 -87L780 -85L787 -81ZM319 -160L340 -163L361 -163L368 -165L389 -166L437 -165L475 -160L464 -158L441 -158L409 -157L412 -156L433 -157L451 -155L463 -157L468 -154L461 -151L476 -153L505 -155L523 -154L527 -152L502 -147L499 -146L480 -145L494 -145L487 -140L482 -137L482 -130L489 -126L480 -126L470 -124L481 -121L482 -115L476 -115L484 -110L470 -109L477 -107L475 -105L467 -104L459 -104L466 -100L466 -97L454 -100L451 -98L459 -96L467 -93L469 -88L459 -87L454 -89L447 -93L449 -89L442 -85L458 -85L466 -85L450 -80L434 -75L416 -73L409 -73L403 -70L395 -64L382 -60L378 -60L370 -58L361 -57L356 -53L356 -49L353 -45L343 -40L346 -35L343 -30L340 -25L331 -24L322 -29L310 -29L305 -32L301 -38L290 -46L287 -50L286 -55L278 -61L280 -65L276 -67L282 -74L291 -76L294 -79L295 -84L288 -81L285 -81L279 -80L272 -82L271 -86L274 -89L279 -89L292 -87L281 -91L276 -93L270 -92L265 -94L272 -100L268 -102L263 -106L256 -112L248 -115L248 -117L232 -121L220 -121L204 -121L189 -120L182 -122L172 -126L187 -128L199 -128L174 -130L160 -132L161 -135L184 -137L206 -140L208 -143L192 -145L197 -147L218 -151L227 -152L224 -155L238 -156L257 -157L275 -157L282 -155L298 -159L312 -156L320 -156L333 -154L319 -157L319 -160ZM1350 389L1351 388L1356 387L1360 386L1362 386L1364 386L1362 388L1356 391L1351 392L1350 391L1350 389ZM698 507L701 504L703 506L704 509L707 509L711 510L714 510L719 507L719 485L721 486L725 491L724 495L725 497L730 496L733 494L735 492L737 489L740 488L742 488L745 490L750 490L754 489L755 487L756 484L759 484L761 481L763 477L768 473L777 469L779 469L782 470L784 469L787 470L790 478L792 482L791 489L791 491L788 490L786 490L786 492L784 494L784 496L788 500L791 499L792 496L797 496L795 501L795 506L793 509L789 512L788 512L785 515L784 519L780 523L774 529L769 533L765 535L759 538L755 538L755 540L751 539L748 540L742 539L738 539L735 539L729 542L724 543L720 545L718 545L715 543L713 543L711 540L710 541L709 539L710 536L708 532L709 531L709 526L705 520L702 515L698 507ZM774 510L771 508L768 509L765 511L762 515L766 520L769 519L770 517L773 516L774 514L776 512L774 510ZM774 510L776 512L774 514L773 516L770 517L769 519L766 520L762 515L765 511L768 509L771 508L774 510ZM-103 141L-96 140L-88 140L-89 141L-80 144L-66 148L-54 148L-49 148L-49 145L-39 145L-37 148L-34 149L-30 152L-28 155L-27 159L-24 160L-19 162L-15 157L-10 157L-6 160L-3 164L-1 167L3 171L4 175L6 178L11 180L15 181L17 181L15 186L14 190L13 198L13 201L14 205L16 208L17 212L21 217L22 220L25 223L31 225L33 227L39 225L43 225L48 224L52 223L55 220L57 217L57 212L58 210L62 208L69 207L74 207L78 207L79 208L79 211L76 214L74 218L75 219L74 222L73 226L71 225L70 225L69 225L67 229L66 228L65 228L65 229L60 229L54 229L54 232L51 232L54 234L56 236L56 237L57 238L57 240L50 240L47 244L47 246L47 247L47 249L40 242L37 240L32 239L28 239L24 241L21 242L16 240L12 239L6 237L2 236L-5 233L-10 230L-12 229L-15 228L-21 226L-24 224L-30 220L-33 216L-34 213L-32 213L-33 211L-32 210L-32 207L-34 205L-34 202L-36 199L-41 193L-47 189L-50 185L-56 183L-57 181L-56 177L-59 176L-62 173L-64 169L-67 168L-71 165L-73 162L-74 160L-77 156L-79 151L-79 149L-83 147L-85 147L-89 145L-90 148L-89 151L-88 155L-86 157L-82 162L-81 163L-80 163L-79 166L-78 165L-77 169L-75 171L-73 173L-70 176L-68 182L-66 184L-64 187L-64 190L-61 190L-59 193L-56 196L-57 197L-59 199L-60 199L-62 195L-66 192L-70 189L-73 188L-73 183L-74 180L-77 178L-81 175L-82 176L-83 175L-87 173L-90 170L-90 169L-87 170L-85 167L-85 165L-90 160L-93 159L-95 155L-98 151L-100 146L-103 141ZM254 517L258 517L264 521L266 521L273 525L277 528L281 532L278 535L280 539L277 542L270 546L266 545L263 545L257 543L253 543L249 539L250 536L251 534L251 528L253 522L254 517ZM280 539L278 535L281 532L277 528L273 525L266 521L264 521L258 517L254 517L262 509L269 503L273 501L278 498L278 493L275 489L272 490L273 487L274 483L274 480L272 479L270 480L268 480L267 477L266 472L265 470L261 469L259 470L252 469L253 460L251 457L253 456L252 452L254 450L255 445L254 441L250 440L250 437L251 434L239 434L237 427L238 426L238 424L237 422L237 419L233 417L230 417L227 415L223 414L221 412L214 411L208 405L208 401L207 399L208 395L200 396L197 398L192 400L190 402L187 402L183 402L179 403L177 402L177 393L172 396L167 396L165 393L161 393L162 390L159 387L156 381L158 380L158 378L161 376L161 373L162 370L163 368L170 364L174 362L175 362L181 362L183 345L183 343L183 339L180 337L180 333L183 332L184 332L185 330L181 329L181 326L193 326L195 324L196 326L198 329L199 328L202 332L207 331L208 329L212 328L215 327L216 325L220 323L219 322L214 321L214 317L214 313L211 312L212 311L217 312L221 313L223 312L227 311L234 309L236 306L236 305L239 305L240 306L239 309L241 309L243 312L241 314L240 319L242 323L242 325L246 328L249 328L249 327L251 327L254 326L256 324L259 325L261 325L264 325L265 324L264 323L264 321L267 321L269 321L273 322L275 323L277 322L279 322L279 324L282 323L285 321L287 317L290 311L292 311L294 314L297 325L300 326L300 330L296 335L298 336L308 337L308 343L313 339L321 342L331 345L333 349L333 352L339 350L351 353L360 353L369 358L377 365L381 367L386 367L389 369L391 376L392 380L389 390L386 394L378 402L374 409L369 414L368 414L366 419L367 430L365 439L364 443L362 446L361 454L355 461L354 468L349 470L348 474L342 474L332 476L328 479L321 481L314 485L309 491L308 496L309 499L308 505L307 508L302 511L296 522L291 527L286 529L284 535L280 539ZM183 402L187 402L190 402L192 400L197 398L200 396L208 395L207 399L208 401L208 405L214 411L221 412L223 414L227 415L230 417L233 417L237 419L237 422L238 424L238 426L237 427L239 434L251 434L250 437L250 440L254 441L255 445L254 450L252 452L253 456L251 457L251 455L245 452L240 452L229 454L226 459L226 462L224 469L223 468L216 468L214 473L210 468L202 467L197 472L193 473L191 465L187 458L189 452L186 450L185 446L182 441L186 435L184 430L185 428L184 426L186 423L186 418L187 413L188 411L183 402ZM181 362L175 362L174 362L170 364L163 368L162 370L161 373L161 376L158 378L158 380L156 381L159 387L162 390L161 393L165 393L167 396L172 396L177 393L177 402L179 403L183 402L188 411L187 413L186 418L186 423L184 426L185 428L184 430L186 435L182 441L181 445L178 446L172 443L171 440L159 434L149 428L144 424L141 419L142 417L137 409L131 398L126 386L123 384L121 379L117 375L113 373L114 370L112 364L113 360L118 356L119 359L117 360L117 363L120 362L122 363L125 366L128 363L129 359L133 354L140 352L147 345L149 341L148 337L149 336L153 339L155 342L158 344L162 350L166 351L169 349L172 350L175 350L180 352L176 358L178 359L181 362ZM136 284L135 285L137 288L135 290L133 290L133 293L131 291L129 288L131 286L129 286L128 284L125 282L123 282L121 284L119 286L118 286L117 287L120 291L118 291L117 292L115 293L114 289L113 290L111 290L110 287L107 287L106 286L103 286L103 288L102 287L103 285L103 284L103 283L104 282L102 282L102 279L105 279L107 281L107 282L109 282L110 282L111 283L114 283L117 281L121 280L123 278L126 279L129 279L132 281L134 282L136 284ZM105 279L102 279L102 282L104 282L103 283L103 284L103 285L102 287L99 285L98 284L98 283L98 282L97 280L94 279L92 278L92 277L90 275L91 277L89 279L88 277L86 276L85 275L85 273L86 271L84 271L86 269L87 269L91 270L92 270L94 270L95 271L97 272L98 270L100 274L102 276L105 279ZM98 270L97 272L95 271L94 270L92 270L91 270L87 269L86 269L84 268L81 265L80 263L77 261L74 259L75 258L76 259L76 258L78 258L79 256L80 256L79 253L81 253L82 253L83 252L85 253L86 252L87 252L89 250L89 249L90 249L90 247L91 247L92 248L93 248L95 248L96 248L98 247L99 246L101 246L101 247L100 248L101 250L100 252L99 255L99 257L99 259L99 261L98 262L98 265L98 266L97 268L97 269L98 270ZM101 246L99 246L98 247L96 248L95 248L93 248L92 248L91 247L90 247L90 249L89 249L89 250L87 252L86 252L85 253L83 252L82 253L81 253L79 253L80 256L79 256L78 258L76 258L75 256L73 256L74 253L73 253L72 252L69 253L69 252L67 251L66 250L64 249L65 248L65 247L65 246L68 244L71 242L73 241L74 241L75 241L76 241L79 241L81 241L83 241L84 240L86 240L87 241L89 241L90 240L93 241L94 241L96 242L97 243L100 244L101 246ZM64 249L66 250L67 251L69 252L69 253L72 252L73 253L74 253L73 256L73 257L69 257L67 256L64 255L61 255L59 254L60 253L62 251L63 251L62 250L64 249ZM47 249L47 247L47 246L47 244L50 240L57 240L57 238L56 237L56 236L54 234L51 232L54 232L54 229L60 229L65 229L65 234L65 241L66 241L68 242L69 241L71 242L68 244L65 246L65 247L65 248L64 249L62 250L63 251L62 251L60 253L59 254L56 253L53 252L50 251L47 249ZM65 229L65 228L66 228L67 229L69 225L70 225L70 226L71 226L71 228L70 230L71 231L70 233L71 234L70 237L69 238L68 239L66 241L65 241L65 234L65 229ZM236 305L236 306L234 309L227 311L223 312L221 313L217 312L212 311L211 312L214 313L214 317L214 321L219 322L220 323L216 325L215 327L212 328L208 329L207 331L202 332L199 328L197 322L195 320L193 319L196 316L196 315L194 313L193 309L194 305L195 303L196 299L194 298L190 299L186 299L184 299L179 294L176 293L168 294L167 292L165 291L165 290L166 288L165 286L164 284L163 281L160 281L162 278L163 273L164 271L167 269L168 266L172 265L172 267L168 267L170 270L170 273L168 277L170 282L172 281L174 277L172 275L172 270L179 268L178 265L180 263L182 267L187 267L191 271L191 273L196 273L203 272L206 275L211 276L214 274L214 272L222 272L229 272L224 273L226 276L230 277L235 280L236 285L239 284L241 286L237 289L236 292L238 294L237 295L233 296L233 299L232 300L236 305ZM261 325L259 325L256 324L254 326L251 327L249 327L249 328L246 328L242 325L242 323L240 319L241 314L243 312L241 309L239 309L240 306L239 305L236 305L232 300L233 299L233 296L237 295L238 294L236 292L237 289L241 286L245 288L249 292L249 295L252 295L255 298L257 300L256 306L253 307L253 309L252 312L254 316L256 316L257 319L261 325ZM273 322L269 321L267 321L264 321L264 323L265 324L264 325L261 325L257 319L256 316L254 316L252 312L253 309L253 307L256 306L257 300L264 301L265 300L270 300L276 301L273 307L274 311L276 314L275 317L274 320L273 322ZM148 337L149 341L147 345L140 352L133 354L129 359L128 363L125 366L122 363L120 362L117 363L117 360L119 359L118 356L121 352L120 349L118 352L114 349L115 348L114 342L116 341L118 338L120 334L119 331L123 330L127 328L133 331L134 331L135 334L141 334L142 334L145 335L148 337ZM202 225L205 225L206 227L205 228L200 228L197 228L197 226L197 225L202 225ZM135 225L139 226L142 227L143 229L139 229L137 230L133 229L130 227L131 225L133 225L135 225ZM106 197L112 197L116 197L122 199L124 202L130 201L132 202L137 206L141 209L143 209L146 210L146 212L150 212L155 214L154 216L150 216L146 217L142 216L133 217L137 214L135 212L131 212L129 210L128 206L124 207L119 205L117 204L109 203L107 202L109 200L103 200L99 203L97 203L96 205L93 205L90 205L93 203L95 201L97 199L100 198L105 198L106 197ZM787 470L784 469L782 470L779 469L777 469L773 466L768 465L766 461L766 459L764 458L757 452L755 448L754 447L752 442L758 443L760 444L762 444L766 440L771 435L773 434L774 432L777 430L782 429L782 431L787 431L790 432L791 434L794 434L797 436L797 444L796 448L796 453L797 454L796 458L795 458L793 463L787 470ZM777 469L768 473L763 477L761 481L759 484L756 484L755 487L754 489L750 490L745 490L742 488L740 488L737 489L735 492L733 494L730 496L725 497L724 495L725 491L721 486L719 485L719 467L725 467L725 446L730 445L739 443L741 446L745 443L747 443L751 442L752 442L754 447L755 448L757 452L764 458L766 459L766 461L768 465L773 466L777 469ZM719 485L719 507L714 510L711 510L707 509L704 509L703 506L701 504L698 507L694 503L691 499L690 493L688 488L686 479L686 472L686 469L683 466L680 461L677 454L676 450L671 444L670 440L673 439L677 438L681 438L684 441L685 440L710 440L714 443L728 444L739 441L744 440L748 440L750 441L751 442L747 443L745 443L741 446L739 443L730 445L725 446L725 467L719 467L719 485ZM500 254L497 250L494 248L497 246L500 242L501 239L503 237L506 238L509 236L513 236L515 238L519 240L523 244L527 248L527 252L528 255L531 257L531 259L531 261L530 262L527 261L526 262L525 262L521 261L518 260L507 260L505 261L503 261L500 262L499 257L504 257L506 256L507 256L509 255L512 256L514 256L517 255L516 253L514 254L512 254L510 253L508 253L506 254L500 254ZM531 261L531 259L531 257L528 255L527 252L527 248L529 247L530 244L532 244L536 245L539 244L542 244L543 243L567 243L568 239L567 238L564 212L561 186L570 186L591 199L611 212L612 215L616 217L619 218L619 222L626 221L626 235L622 239L622 243L616 244L608 244L606 246L602 246L598 246L597 245L594 246L588 249L587 251L582 253L581 255L579 256L576 255L574 257L573 261L569 266L569 268L567 270L568 274L565 275L564 275L563 273L561 274L560 273L559 275L554 275L553 274L552 275L550 273L550 271L548 271L549 269L550 268L547 265L547 263L545 262L544 262L543 263L541 264L539 265L536 264L535 263L534 263L532 264L531 264L531 261ZM498 210L499 208L522 208L521 199L523 196L528 196L528 180L548 181L548 172L570 186L561 186L564 212L567 238L568 239L567 243L543 243L542 244L539 244L536 245L532 244L530 244L529 247L527 248L523 244L519 240L515 238L513 236L509 236L506 238L503 237L501 239L501 236L502 233L503 227L502 221L502 218L502 215L501 213L498 210ZM616 298L611 299L610 295L610 281L609 280L609 277L606 275L605 273L605 270L607 269L609 267L612 266L613 264L615 263L617 263L622 266L621 268L623 272L622 274L622 276L619 279L617 281L616 285L616 289L616 298ZM689 199L691 208L693 210L693 212L695 214L694 216L692 228L691 236L684 242L681 250L684 252L684 256L688 256L687 259L685 259L685 261L684 261L680 255L679 254L674 258L669 256L666 256L664 257L661 256L657 259L654 259L647 256L644 257L641 257L639 255L633 253L626 254L625 255L624 258L622 261L622 266L617 263L615 263L613 264L613 260L606 259L606 256L603 252L602 249L602 246L606 246L608 244L616 244L622 243L622 239L626 235L626 221L634 218L651 207L672 195L681 198L685 201L689 199ZM616 298L616 289L616 285L617 281L619 279L622 276L622 274L623 272L621 268L622 266L622 261L624 258L625 255L626 254L633 253L639 255L641 257L644 257L647 256L654 259L657 259L661 256L664 257L666 256L669 256L674 258L679 254L680 255L684 261L685 261L687 263L687 265L686 267L681 271L680 275L679 278L678 279L677 284L673 286L672 289L671 292L670 294L666 296L663 294L661 294L657 297L655 297L653 303L651 307L645 310L642 309L640 311L635 310L632 307L630 302L626 298L621 298L616 298ZM687 259L689 263L690 267L690 271L693 276L689 276L688 276L685 276L684 279L687 282L690 283L691 286L693 290L692 291L689 298L687 299L687 303L687 306L687 308L690 311L690 313L692 316L695 318L695 321L696 322L696 326L691 324L686 323L678 322L674 323L671 322L668 322L658 322L659 318L656 314L654 313L652 310L651 309L651 307L653 303L655 297L657 297L661 294L663 294L666 296L670 294L671 292L672 289L673 286L677 284L678 279L679 278L680 275L681 271L686 267L687 265L687 263L685 261L685 259L687 259ZM605 270L605 273L606 275L609 277L609 280L610 281L610 295L611 299L606 300L605 298L603 295L603 292L604 286L603 284L602 279L602 275L600 272L600 270L605 270ZM600 270L600 272L602 275L602 279L603 284L604 286L603 292L603 295L605 298L606 300L597 304L594 306L588 308L583 306L583 304L581 298L582 292L585 287L583 278L582 274L582 270L593 270L595 270L597 269L600 270ZM552 275L553 274L554 275L559 275L560 273L561 274L563 273L564 275L565 275L568 274L570 275L571 277L574 278L576 277L579 277L583 278L585 287L582 292L581 298L583 304L583 306L580 306L576 305L572 305L565 306L561 308L555 310L554 310L554 305L555 304L555 302L552 299L550 299L548 297L550 295L549 292L549 290L550 290L551 287L550 286L551 285L553 285L552 280L550 277L551 275L552 275ZM518 260L521 261L525 262L526 262L527 261L530 262L531 261L531 264L532 264L534 263L535 263L536 264L539 265L541 264L543 263L544 262L545 262L547 263L547 265L550 268L549 269L548 271L550 271L550 273L552 275L551 275L550 277L552 280L553 285L551 285L550 286L551 287L550 290L549 290L548 290L546 292L545 292L544 291L544 288L541 285L540 285L539 286L537 286L537 284L536 282L536 280L535 278L533 276L528 276L527 277L525 277L524 278L524 280L521 283L518 279L516 277L514 276L513 275L512 272L511 271L509 270L512 267L514 267L515 266L517 266L518 265L517 263L518 263L518 260ZM500 262L503 261L505 261L507 260L518 260L518 263L517 263L518 265L517 266L515 266L514 267L512 267L509 270L506 267L503 267L502 265L502 264L500 263L500 262ZM549 290L549 292L550 295L548 297L550 299L552 299L555 302L555 304L554 305L554 310L552 310L546 307L541 302L535 299L531 295L533 293L533 292L536 288L539 286L540 285L541 285L544 288L544 291L545 292L546 292L548 290L549 290ZM521 283L524 280L524 278L525 277L527 277L528 276L533 276L535 278L536 280L536 282L537 284L537 286L539 286L536 288L533 292L533 293L531 295L530 295L525 292L522 289L521 287L521 283ZM568 274L567 270L569 268L569 266L573 261L574 257L576 255L579 256L581 255L582 253L587 251L588 249L594 246L597 245L598 246L602 246L602 249L603 252L606 256L606 259L613 260L613 264L612 266L609 267L607 269L605 270L600 270L597 269L595 270L593 270L582 270L582 274L583 278L579 277L576 277L574 278L571 277L570 275L568 274ZM764 305L762 305L758 305L754 304L752 305L751 306L749 307L746 305L740 308L737 308L736 308L734 312L730 311L726 310L722 308L717 306L714 308L711 311L711 315L707 315L703 314L699 317L696 322L695 321L695 318L692 316L690 313L690 311L687 308L687 306L687 303L687 299L689 298L692 291L697 291L698 289L699 290L700 291L708 289L710 286L713 284L713 282L715 282L720 282L726 279L730 273L733 270L737 269L738 272L741 275L741 278L740 280L741 282L743 284L747 287L751 289L751 291L755 294L757 297L759 300L763 303L764 305ZM711 315L710 319L709 322L707 326L707 331L707 334L706 336L706 339L705 340L701 343L698 346L696 352L696 357L695 359L691 362L687 366L685 365L685 363L682 363L680 365L678 365L676 363L674 364L671 366L667 360L671 357L669 353L671 351L675 350L675 348L679 351L684 351L686 348L687 344L686 339L683 336L686 329L684 328L680 328L678 325L678 322L686 323L691 324L696 326L696 322L699 317L703 314L707 315L711 315ZM668 322L671 322L674 323L678 322L678 325L680 328L684 328L686 329L683 336L686 339L687 344L686 348L684 351L679 351L675 348L675 350L671 351L669 353L671 357L667 360L660 354L656 349L653 343L653 341L654 339L656 334L657 330L659 330L668 330L668 322ZM658 322L668 322L668 330L659 330L657 330L656 329L658 322ZM784 386L787 388L789 389L793 390L797 391L799 394L801 399L800 401L799 406L800 411L798 413L796 418L799 420L781 425L782 429L777 430L774 432L773 434L771 435L766 440L762 444L760 444L758 443L752 442L751 442L750 441L748 440L744 440L739 441L735 437L731 432L732 413L744 413L744 411L744 409L743 406L744 403L743 402L746 402L746 404L749 403L753 404L755 407L759 408L763 406L764 409L769 410L771 412L774 415L778 416L778 409L776 410L772 408L770 407L771 401L772 394L771 391L772 387L774 386L782 385L784 386ZM797 391L802 393L804 394L806 397L807 405L806 410L807 417L809 417L812 419L814 424L815 431L812 433L810 437L806 433L806 429L807 426L807 424L804 422L803 423L799 420L796 418L798 413L800 411L799 406L800 401L801 399L799 394L797 391ZM807 405L812 405L819 406L821 406L825 405L827 404L831 404L837 401L842 398L843 401L843 407L843 412L844 421L845 424L843 428L841 433L837 436L831 439L824 442L818 448L815 449L811 453L809 455L808 459L811 464L812 467L812 469L813 469L813 474L812 477L814 478L813 481L810 483L805 485L798 488L795 490L796 493L797 493L797 496L792 496L792 494L791 491L791 489L792 482L790 478L787 470L793 463L795 458L796 458L797 454L796 453L796 448L797 444L797 436L794 434L791 434L790 432L787 431L782 431L782 429L781 425L799 420L803 423L804 422L807 424L807 426L806 429L806 433L810 437L812 433L815 431L814 424L812 419L809 417L807 417L806 410L807 405ZM792 496L791 499L788 500L784 496L784 494L786 492L786 490L788 490L791 491L792 494L792 496ZM678 365L676 366L675 367L675 370L673 371L671 366L674 364L676 363L678 365ZM674 373L676 372L678 372L680 371L698 371L699 376L701 379L703 381L705 384L709 384L711 383L714 384L715 382L717 379L720 379L721 378L724 378L723 380L730 380L730 384L732 386L731 389L731 393L733 395L733 403L734 402L737 402L741 401L743 402L744 403L743 406L744 409L744 411L744 413L732 413L731 432L735 437L739 441L728 444L714 443L710 440L685 440L684 441L681 438L677 438L673 439L670 440L670 436L671 431L673 425L673 423L675 417L676 415L680 411L682 408L682 404L682 400L680 398L679 395L677 391L678 390L679 387L678 382L676 378L673 374L674 373ZM783 350L783 353L784 354L785 356L783 357L781 361L779 363L776 363L776 356L774 353L778 354L780 350L783 350ZM814 140L813 142L811 141L810 145L811 145L810 146L810 148L812 147L813 149L810 159L809 157L806 149L807 147L807 146L809 144L810 139L811 138L811 137L813 137L813 136L815 136L815 139L814 140ZM815 136L813 136L813 137L811 137L813 133L816 128L819 128L820 131L816 133L815 136ZM897 411L899 413L900 417L901 425L903 427L902 430L901 432L899 428L898 430L899 435L899 437L897 439L897 444L894 451L891 459L888 470L885 479L883 486L878 487L872 490L869 488L864 486L863 483L862 477L860 473L860 468L861 464L863 463L863 461L866 456L867 453L865 450L864 446L864 440L866 437L867 433L870 433L873 432L875 431L878 431L881 427L886 424L888 421L887 418L890 419L893 415L893 411L895 408L897 411ZM812 147L810 148L810 146L811 145L810 145L811 141L813 142L813 145L812 147ZM500 254L506 254L508 253L510 253L512 254L514 254L516 253L517 255L514 256L512 256L509 255L507 256L506 256L504 257L499 257L500 254ZM657 154L654 143L651 141L651 140L646 136L645 131L649 128L650 123L649 117L651 114L657 112L661 113L661 116L666 113L667 115L664 118L664 120L666 122L665 127L661 130L662 133L665 133L667 136L669 137L669 142L666 144L664 145L660 148L660 150L660 153L657 154ZM548 172L548 170L548 163L558 159L564 158L569 156L571 153L578 151L578 146L582 146L584 143L592 142L593 140L592 139L590 132L589 129L587 125L593 122L599 121L603 118L609 116L619 115L629 115L632 116L638 113L644 113L646 115L651 114L649 117L650 123L649 128L645 131L646 136L651 140L651 141L654 143L657 154L659 159L659 162L658 167L659 170L658 173L658 177L656 179L659 184L660 186L662 190L665 189L669 191L672 195L651 207L634 218L626 221L619 222L619 218L616 217L612 215L611 212L591 199L570 186L548 172ZM813 142L814 140L821 142L833 136L835 143L834 144L822 147L828 153L826 154L825 156L820 157L819 159L816 161L810 160L810 159L813 149L812 147L813 145L813 142ZM909 191L911 190L911 192L915 191L920 191L924 191L928 187L933 183L936 180L938 182L938 186L935 186L935 190L936 191L933 192L933 195L931 197L931 200L930 201L912 198L910 192L909 191ZM905 187L904 183L906 180L908 179L910 181L910 185L908 188L907 189L905 187ZM888 156L889 159L889 160L890 165L886 165L885 162L879 161L884 156L888 156ZM835 143L833 136L846 129L848 122L848 118L851 116L854 113L857 112L864 112L866 114L869 113L873 120L876 122L877 125L874 128L873 132L877 138L884 141L887 146L886 150L888 150L888 153L891 156L888 156L884 156L879 161L868 161L851 149L842 145L835 143ZM931 200L931 197L933 195L933 192L936 191L935 190L935 186L938 186L941 191L944 193L949 194L952 195L955 198L957 200L959 201L959 202L957 206L956 207L953 209L951 213L948 213L947 215L946 218L947 222L946 222L943 222L940 225L939 227L938 229L934 229L932 230L932 233L929 234L925 234L921 236L919 236L917 232L912 222L930 216L934 204L931 200ZM938 182L936 180L938 178L939 178L938 181L938 182ZM1216 263L1214 256L1218 251L1226 249L1231 250L1236 253L1239 249L1244 251L1246 255L1245 262L1235 267L1237 270L1231 271L1226 273L1221 272L1219 269L1216 263ZM1231 250L1226 249L1218 251L1214 256L1216 263L1210 260L1205 260L1206 256L1201 256L1200 262L1197 271L1195 276L1195 281L1199 281L1202 286L1203 291L1206 295L1210 296L1213 299L1211 301L1207 302L1206 299L1202 296L1201 297L1198 295L1197 292L1194 289L1191 286L1190 289L1189 286L1190 282L1191 276L1194 270L1198 265L1195 259L1195 256L1195 253L1191 248L1189 245L1191 244L1193 239L1191 235L1187 231L1184 225L1187 224L1190 218L1194 217L1197 215L1201 213L1203 215L1204 219L1208 219L1206 226L1206 231L1213 227L1214 228L1218 228L1219 226L1224 227L1228 231L1229 237L1234 243L1233 248L1231 250ZM1244 251L1239 249L1236 253L1231 250L1233 248L1234 243L1229 237L1228 231L1224 227L1219 226L1218 228L1214 228L1213 227L1206 231L1206 226L1208 219L1204 219L1203 215L1201 213L1202 211L1207 207L1208 209L1211 209L1210 202L1213 201L1217 206L1219 211L1227 211L1229 217L1225 218L1223 220L1231 224L1236 231L1239 236L1244 241L1245 245L1244 251ZM1201 213L1197 215L1194 217L1190 218L1187 224L1184 225L1187 231L1191 235L1193 239L1191 244L1189 245L1191 248L1195 253L1195 256L1195 259L1198 265L1194 270L1191 276L1191 272L1193 267L1191 264L1191 257L1189 254L1187 247L1186 239L1183 234L1179 237L1172 242L1169 241L1165 240L1167 232L1166 227L1161 220L1162 218L1158 217L1154 212L1154 207L1156 208L1156 204L1159 202L1158 200L1160 198L1160 192L1165 193L1167 188L1168 185L1171 180L1171 177L1179 172L1183 173L1182 170L1184 169L1184 166L1187 166L1189 170L1192 171L1192 176L1192 180L1186 185L1186 193L1192 192L1193 197L1197 198L1195 203L1200 206L1202 207L1207 205L1207 207L1202 211L1201 213ZM1226 273L1231 271L1237 270L1235 267L1245 262L1246 255L1244 251L1245 245L1244 241L1239 236L1236 231L1231 224L1223 220L1225 218L1229 217L1227 211L1219 211L1217 206L1213 201L1216 200L1221 200L1227 199L1232 196L1235 198L1240 199L1239 203L1242 205L1248 207L1240 212L1235 217L1234 222L1239 228L1244 236L1250 240L1253 244L1256 255L1255 266L1250 270L1243 274L1238 279L1231 284L1229 281L1230 276L1226 273ZM1385 83ZM1384 82L1385 83L1382 82L1380 84L1378 86L1378 91L1375 92L1374 93L1372 95L1368 96L1365 97L1365 100L1364 101L1367 102L1370 104L1369 106L1367 106L1362 106L1360 109L1357 109L1357 110L1354 108L1353 109L1352 110L1351 109L1350 108L1348 107L1350 105L1351 104L1351 103L1352 100L1352 99L1348 98L1346 96L1350 93L1357 89L1361 85L1364 87L1369 87L1368 84L1378 81L1380 78L1384 82ZM1357 110L1357 109L1360 109L1362 106L1367 106L1369 106L1370 104L1375 111L1377 115L1377 122L1375 126L1369 127L1364 129L1359 130L1358 126L1359 122L1357 116L1361 115L1357 110ZM1127 40L1133 39L1144 34L1153 31L1159 33L1165 33L1169 36L1175 36L1184 38L1189 33L1187 30L1193 24L1200 26L1205 27L1212 28L1214 33L1222 35L1228 34L1235 34L1241 34L1247 37L1251 40L1256 40L1264 41L1269 40L1277 39L1286 35L1290 35L1293 37L1300 37L1297 41L1293 47L1294 50L1298 49L1304 50L1308 48L1313 50L1319 54L1318 56L1313 55L1305 56L1300 58L1296 62L1287 64L1281 67L1275 66L1271 65L1268 69L1270 72L1271 74L1267 76L1262 79L1255 81L1246 81L1237 83L1230 86L1227 85L1220 85L1211 81L1205 80L1197 81L1185 80L1178 80L1175 76L1172 71L1168 70L1161 66L1153 65L1146 64L1144 62L1146 55L1142 50L1133 48L1128 44L1127 40ZM1184 166L1184 169L1182 170L1183 173L1179 172L1171 177L1171 180L1168 185L1167 188L1165 193L1160 192L1160 198L1158 200L1159 202L1156 204L1153 194L1151 194L1150 198L1147 195L1149 192L1151 191L1154 186L1151 185L1145 185L1140 184L1139 180L1136 180L1131 177L1129 181L1134 185L1130 187L1129 189L1132 191L1131 194L1133 199L1134 204L1133 206L1129 206L1122 207L1122 212L1119 215L1110 219L1104 226L1099 230L1093 234L1093 237L1090 238L1085 240L1082 241L1080 245L1081 253L1082 258L1079 264L1079 274L1076 274L1073 279L1075 281L1070 282L1068 286L1065 288L1060 283L1057 274L1054 268L1052 265L1049 260L1048 252L1047 248L1041 240L1039 228L1037 221L1037 213L1036 208L1027 211L1023 211L1015 203L1018 201L1016 199L1009 194L1013 190L1026 190L1025 185L1022 182L1021 177L1017 174L1024 168L1031 169L1037 162L1041 156L1047 150L1046 146L1052 142L1047 139L1045 135L1042 130L1045 128L1055 129L1061 128L1067 123L1073 130L1073 135L1075 138L1075 141L1071 140L1072 147L1078 151L1087 155L1083 158L1081 163L1086 166L1092 168L1100 172L1108 173L1112 176L1116 176L1123 178L1128 178L1129 175L1128 171L1129 169L1132 167L1133 172L1133 173L1138 176L1142 175L1147 175L1152 175L1153 171L1150 169L1155 169L1160 164L1167 160L1172 162L1177 159L1180 163L1177 166L1184 166ZM1156 204L1156 208L1154 207L1154 212L1152 209L1152 206L1151 203L1149 199L1143 199L1144 202L1142 205L1139 204L1138 205L1137 204L1134 204L1133 199L1131 194L1132 191L1129 189L1130 187L1134 185L1129 181L1131 177L1136 180L1139 180L1140 184L1145 185L1151 185L1154 186L1151 191L1149 192L1147 195L1150 198L1151 194L1153 194L1156 204ZM1150 169L1153 171L1152 175L1147 175L1142 175L1138 176L1133 173L1133 172L1137 168L1140 166L1144 168L1148 168L1150 169ZM1129 169L1128 171L1129 175L1128 178L1123 178L1116 176L1112 176L1108 173L1100 172L1092 168L1086 166L1081 163L1083 158L1087 155L1089 153L1094 155L1100 159L1103 160L1105 163L1110 164L1115 167L1122 168L1129 169ZM1067 123L1061 128L1055 129L1045 128L1042 130L1045 135L1047 139L1052 142L1046 146L1047 150L1041 156L1037 162L1031 169L1024 168L1017 174L1021 177L1022 182L1025 185L1026 190L1013 190L1009 194L1005 192L1003 188L998 183L987 185L977 185L969 186L971 179L980 175L979 173L977 172L976 166L971 164L968 160L965 157L975 160L981 159L985 160L986 159L990 159L998 157L998 152L1002 148L1006 148L1007 147L1011 146L1014 146L1016 145L1016 141L1018 137L1022 136L1020 132L1025 132L1027 130L1027 128L1030 125L1029 122L1028 120L1031 117L1038 116L1044 115L1047 114L1051 113L1055 116L1057 121L1067 123ZM999 112L1002 112L1007 113L1009 114L1013 112L1015 113L1017 110L1021 110L1022 110L1022 107L1025 105L1028 106L1027 108L1029 109L1029 114L1031 116L1033 114L1036 114L1040 111L1044 111L1050 111L1051 113L1047 114L1044 115L1038 116L1031 117L1028 120L1029 122L1030 125L1027 128L1027 130L1025 132L1020 132L1022 136L1018 137L1016 141L1016 145L1014 146L1011 146L1007 147L1006 148L1002 148L998 152L998 157L990 159L986 159L985 160L981 159L975 160L965 157L971 152L970 148L966 147L965 143L963 138L966 135L963 134L965 130L967 122L973 124L978 124L979 121L984 120L987 118L988 113L994 112L994 110L997 112L999 112ZM1007 113L1010 107L1009 103L1005 101L1006 99L1011 99L1014 95L1016 92L1024 90L1023 93L1024 95L1026 95L1024 96L1017 95L1017 99L1023 98L1031 100L1042 99L1044 105L1046 104L1049 106L1049 108L1050 111L1044 111L1040 111L1036 114L1033 114L1031 116L1029 114L1029 109L1027 108L1028 106L1025 105L1022 107L1022 110L1021 110L1017 110L1015 113L1013 112L1009 114L1007 113ZM1026 82L1027 80L1031 79L1041 81L1042 77L1045 76L1054 79L1056 78L1066 78L1075 79L1078 81L1082 82L1081 83L1071 87L1069 89L1061 90L1059 93L1053 93L1049 94L1043 97L1044 98L1042 99L1031 100L1023 98L1017 99L1017 95L1024 96L1026 95L1031 95L1038 91L1031 88L1027 89L1023 87L1028 83L1026 82ZM915 85L918 83L924 82L929 84L933 88L936 88L943 88L942 85L947 83L952 79L960 83L961 87L963 89L969 88L971 89L974 96L981 100L985 103L991 106L999 108L999 112L997 112L994 110L994 112L988 113L987 118L984 120L979 121L978 124L973 124L967 122L967 117L962 117L955 112L951 111L944 108L940 107L937 108L933 108L929 112L924 113L922 109L923 102L919 100L920 96L916 96L917 91L923 92L928 90L924 87L922 83L918 85L917 89L915 85ZM891 156L888 153L888 150L886 150L887 146L884 141L877 138L873 132L874 128L877 125L876 122L873 120L869 113L865 108L867 106L865 99L869 98L870 100L873 103L877 104L879 103L886 99L888 99L890 100L888 103L892 106L893 106L895 111L901 112L905 115L914 116L923 114L924 113L929 112L933 108L937 108L940 107L944 108L951 111L955 112L962 117L967 117L967 122L965 130L963 134L966 135L963 138L965 143L966 147L970 148L971 152L965 157L968 160L971 164L976 166L977 172L979 173L980 175L971 179L969 186L958 184L951 182L944 182L942 174L939 173L934 174L928 177L921 175L915 171L909 169L905 163L901 155L897 156L894 154L891 156ZM814 140L815 139L815 136L816 133L820 131L819 128L816 128L815 124L817 121L819 120L820 118L820 115L822 116L829 115L832 116L837 116L844 113L847 114L854 113L851 116L848 118L848 122L846 129L833 136L821 142L814 140ZM879 103L877 104L874 100L874 99L872 99L870 98L869 98L866 96L862 94L863 92L861 89L870 89L871 90L873 91L872 93L875 95L874 97L876 98L879 99L879 103ZM666 -17L669 -21L674 -25L676 -32L672 -35L672 -43L675 -48L681 -48L684 -51L681 -53L691 -61L697 -68L701 -72L706 -72L708 -75L719 -74L720 -78L724 -79L732 -76L741 -72L741 -62L743 -60L733 -58L727 -54L728 -50L719 -46L707 -40L703 -32L707 -28L713 -24L707 -18L701 -16L699 -6L695 -1L688 -1L685 4L678 4L676 -2L671 -9L666 -17ZM769 -1L775 0L776 2L779 1L785 3L786 6L785 7L788 11L791 12L790 13L794 14L796 16L794 17L789 17L788 18L789 20L791 23L786 24L784 25L783 28L781 28L776 28L774 26L772 27L769 27L765 26L758 25L752 25L747 25L744 26L741 27L741 24L739 21L743 20L743 17L741 15L741 13L747 13L753 10L755 7L760 5L759 2L763 1L769 -1ZM791 23L793 24L794 22L796 23L803 22L806 25L805 27L805 28L810 29L812 31L812 33L820 35L824 34L828 37L832 36L840 38L840 40L838 43L839 47L838 49L833 49L830 51L829 53L825 54L821 56L815 56L810 58L810 62L809 61L808 60L806 60L802 59L801 60L800 60L790 58L790 56L784 57L782 60L778 64L775 63L772 64L769 63L771 62L772 60L774 58L773 57L774 57L775 58L779 58L780 57L779 57L779 56L777 54L776 52L774 51L775 49L772 47L770 47L765 45L761 46L760 47L757 47L756 48L751 49L749 50L746 48L743 48L739 47L736 49L736 47L733 45L734 43L735 41L737 42L735 39L741 34L744 33L744 32L741 27L744 26L747 25L752 25L758 25L765 26L769 27L772 27L774 26L776 28L781 28L783 28L784 25L786 24L791 23ZM741 13L741 15L743 17L743 20L739 21L741 24L741 27L744 32L744 33L741 34L735 39L737 42L735 41L730 39L725 40L722 39L719 41L716 39L713 39L710 36L706 36L705 34L701 33L700 35L697 33L697 32L693 31L690 29L688 26L688 23L687 20L684 18L686 17L685 13L689 12L698 9L706 7L712 8L712 9L718 9L725 10L736 10L739 11L741 13ZM702 47L701 50L698 50L699 51L697 55L696 56L691 56L688 57L683 57L674 55L673 53L667 54L666 55L663 55L660 54L657 53L658 52L658 51L659 51L662 52L663 51L669 51L673 50L676 50L678 51L678 50L677 46L679 46L682 43L686 45L689 42L692 42L696 44L699 43L702 44L701 45L702 47ZM733 45L736 47L736 49L733 50L730 54L726 58L721 59L718 59L713 61L711 61L706 60L701 58L699 57L698 55L697 55L699 51L698 50L701 50L702 47L705 49L707 49L712 49L713 48L715 47L718 46L719 47L721 46L723 45L725 44L731 46L733 45ZM760 47L761 46L765 45L770 47L772 47L775 49L774 51L776 52L777 54L779 56L779 57L780 57L779 58L775 58L774 57L773 57L774 58L772 60L771 62L769 63L768 60L769 58L769 55L765 52L763 49L762 47L760 47ZM769 63L772 64L775 63L778 64L778 66L775 67L773 67L771 74L768 73L763 71L756 72L753 74L745 74L740 73L738 73L736 71L735 70L736 69L735 68L733 69L729 67L729 65L725 64L725 62L721 59L726 58L730 54L733 50L736 49L739 47L743 48L746 48L749 50L751 49L756 48L757 47L760 47L762 47L763 49L765 52L769 55L769 58L768 60L769 63ZM759 2L760 5L755 7L753 10L747 13L741 13L739 11L736 10L736 9L737 7L734 6L728 5L726 0L733 -2L743 -2L749 -2L750 -1L753 -1L759 2ZM764 -9L767 -7L767 -5L769 -1L763 1L759 2L753 -1L750 -1L749 -2L743 -2L733 -2L726 0L727 -5L729 -8L735 -11L740 -6L745 -6L746 -11L751 -12L754 -11L759 -9L764 -9ZM768 -21L769 -20L765 -16L766 -11L764 -9L759 -9L754 -11L751 -12L746 -11L747 -14L744 -14L741 -16L740 -19L748 -21L755 -22L762 -21L768 -21ZM685 13L686 17L684 18L687 20L688 23L688 26L690 29L687 30L686 29L684 30L680 32L678 33L673 34L674 36L675 39L678 40L682 43L679 46L677 46L678 50L678 51L676 50L673 50L669 51L663 51L662 52L659 51L658 51L651 49L650 50L645 50L646 46L649 42L640 41L637 39L637 37L636 35L637 31L636 25L640 25L641 23L643 17L641 15L643 14L648 14L649 15L653 12L651 10L651 6L656 7L660 6L660 8L666 10L666 12L672 11L675 9L682 12L685 13ZM736 71L738 73L740 73L745 74L753 74L756 72L763 71L768 73L771 74L768 76L766 81L768 84L763 83L757 85L757 88L751 89L747 86L742 88L738 88L737 84L734 82L735 81L736 79L738 77L735 74L734 72L736 71ZM758 124L757 126L748 126L748 125L741 124L742 122L745 124L750 123L755 124L754 125L758 124ZM738 88L742 88L747 86L751 89L757 88L757 85L760 87L758 90L756 91L753 91L750 90L742 92L746 95L743 96L740 96L737 93L736 94L737 98L740 101L738 102L741 105L744 107L744 110L739 108L740 112L737 112L739 117L735 118L730 115L728 110L727 106L724 103L721 100L721 98L724 95L724 93L726 93L726 91L730 90L732 89L736 89L737 88L738 88ZM869 113L866 114L864 112L857 112L854 113L847 114L844 113L837 116L832 116L829 115L822 116L820 115L820 118L819 120L817 121L815 118L817 116L813 117L808 115L804 119L795 119L790 116L784 116L782 118L778 119L772 116L766 116L762 110L758 107L761 102L757 99L764 93L773 93L775 89L787 89L794 86L801 84L811 84L821 88L830 90L837 89L842 90L849 87L856 87L861 89L863 92L862 94L866 96L869 98L865 99L867 106L865 108L869 113ZM757 85L763 83L768 84L769 86L774 88L773 90L766 90L763 92L758 95L756 92L756 91L758 90L760 87L757 85ZM726 91L726 93L724 93L724 95L721 98L720 98L720 97L716 94L716 92L716 88L717 86L716 85L716 83L718 80L719 81L720 80L722 82L723 83L724 85L723 87L724 89L726 91ZM699 57L701 58L706 60L711 61L713 61L714 63L716 65L714 67L711 66L707 66L702 65L699 65L698 66L696 65L695 67L697 70L699 72L701 74L704 75L706 78L711 80L711 81L705 79L702 77L696 75L691 71L692 70L690 68L689 66L686 65L684 67L682 65L682 63L686 63L688 62L690 63L692 63L692 62L694 61L695 59L699 57ZM658 51L658 52L657 53L660 54L663 55L662 57L660 58L655 57L654 60L651 60L650 59L647 61L644 61L641 60L639 57L636 58L636 56L641 52L640 51L643 51L645 50L650 50L651 49L658 51ZM636 35L637 37L637 39L635 39L634 39L635 35L636 35ZM637 31L636 35L635 35L634 39L629 36L626 37L622 34L619 31L616 31L615 29L620 28L624 28L630 27L634 30L637 31ZM641 15L643 17L641 23L640 25L636 25L637 31L634 30L630 27L624 28L620 28L623 26L628 17L636 15L641 15ZM546 85L548 83L550 82L552 85L555 85L556 84L560 85L562 88L559 89L559 94L558 95L558 98L555 98L557 102L556 106L558 108L557 109L555 111L555 113L553 115L550 114L547 115L548 110L547 106L544 106L543 104L543 100L546 97L546 95L547 91L547 89L546 87L546 85ZM555 113L555 111L557 109L558 108L556 106L557 102L555 98L558 98L558 95L559 94L559 89L562 88L560 85L556 84L555 85L552 85L550 82L548 83L546 85L546 80L544 78L552 74L559 75L568 75L574 76L579 75L589 75L591 78L602 81L604 79L611 82L618 81L618 85L613 89L605 90L604 92L601 95L598 100L601 104L597 106L596 110L591 111L587 116L580 116L574 116L570 118L568 120L565 120L563 118L561 114L555 113ZM563 13L564 17L559 22L549 26L540 25L545 19L542 13L550 8L555 5L556 8L555 12L558 12L563 13ZM1357 529L1351 532L1345 534L1344 537L1342 539L1337 539L1333 540L1328 539L1323 540L1319 540L1316 543L1314 543L1311 544L1308 546L1304 546L1300 546L1293 542L1290 541L1290 538L1293 537L1294 536L1294 533L1295 529L1294 526L1291 520L1290 516L1290 513L1288 509L1288 507L1285 505L1284 500L1281 495L1280 493L1283 495L1281 490L1284 491L1285 494L1285 491L1282 486L1282 484L1280 482L1281 479L1282 477L1283 474L1282 471L1285 467L1285 471L1288 467L1293 465L1296 462L1300 460L1303 460L1305 460L1309 458L1313 458L1314 456L1316 456L1319 456L1325 454L1328 451L1330 448L1333 445L1334 443L1334 440L1338 434L1341 440L1343 438L1341 436L1343 433L1346 434L1346 429L1350 426L1351 424L1354 423L1354 421L1357 422L1357 421L1359 420L1362 419L1367 422L1370 425L1374 425L1378 426L1376 423L1379 418L1382 416L1381 415L1384 411L1387 409L1390 410L1395 409L1395 406L1391 404L1394 403L1398 404L1401 407L1406 408L1408 408L1412 409L1415 408L1418 408L1419 407L1422 410L1420 413L1418 416L1416 416L1416 418L1415 421L1413 424L1413 426L1418 429L1422 431L1425 433L1430 437L1432 437L1435 438L1436 440L1441 442L1445 440L1446 437L1448 434L1448 431L1450 426L1449 423L1450 422L1449 418L1450 414L1451 412L1450 410L1452 407L1453 404L1453 402L1455 400L1457 403L1457 407L1459 407L1459 410L1461 413L1462 416L1461 419L1464 423L1467 421L1469 424L1472 426L1472 429L1473 434L1474 437L1475 437L1477 443L1476 446L1478 450L1485 453L1489 456L1493 458L1492 460L1496 464L1498 470L1500 469L1503 471L1504 470L1505 477L1510 480L1512 483L1517 488L1519 492L1519 496L1519 500L1521 505L1521 510L1520 513L1518 518L1519 522L1517 526L1515 531L1510 534L1508 539L1506 542L1504 547L1502 550L1500 555L1500 559L1500 561L1497 563L1490 563L1484 565L1482 568L1478 570L1473 568L1469 567L1470 563L1467 565L1462 569L1456 567L1453 566L1450 566L1444 564L1440 560L1439 556L1437 553L1434 550L1429 550L1431 547L1429 542L1426 546L1421 548L1424 544L1425 541L1427 538L1427 533L1422 539L1418 541L1416 545L1411 543L1411 540L1408 535L1405 533L1406 532L1398 528L1394 528L1388 525L1377 526L1369 528L1363 530L1357 529ZM1091 291L1090 297L1087 299L1082 300L1079 295L1078 287L1081 277L1085 280L1088 285L1091 291ZM1257 227L1252 225L1252 220L1255 217L1261 215L1265 216L1266 218L1263 220L1262 224L1257 227ZM1082 82L1081 78L1085 77L1080 66L1092 64L1095 63L1099 52L1111 54L1114 51L1115 45L1120 45L1124 41L1127 40L1128 44L1133 48L1142 50L1146 55L1144 62L1146 64L1153 65L1161 66L1168 70L1172 71L1175 76L1178 80L1185 80L1197 81L1205 80L1211 81L1220 85L1227 85L1230 86L1237 83L1246 81L1255 81L1262 79L1267 76L1271 74L1270 72L1268 69L1271 65L1275 66L1281 67L1287 64L1296 62L1300 58L1305 56L1313 55L1318 56L1319 54L1313 50L1308 48L1304 50L1298 49L1294 50L1293 47L1297 41L1300 37L1307 39L1316 35L1316 33L1321 26L1324 24L1324 21L1321 19L1326 16L1333 15L1341 15L1350 17L1356 19L1359 25L1362 28L1364 32L1366 37L1376 39L1383 44L1386 49L1395 49L1400 47L1410 45L1407 51L1405 53L1403 59L1399 65L1391 64L1386 66L1388 71L1387 78L1384 79L1384 82L1380 78L1378 81L1368 84L1369 87L1364 87L1361 85L1357 89L1350 93L1346 96L1337 98L1333 101L1326 103L1330 100L1328 97L1333 93L1330 90L1325 92L1318 97L1314 100L1308 101L1305 104L1308 108L1313 109L1313 111L1318 113L1325 109L1330 111L1334 111L1335 114L1327 116L1324 119L1318 122L1315 127L1321 130L1324 136L1327 141L1331 146L1331 150L1328 152L1329 155L1333 157L1332 162L1330 167L1327 167L1322 174L1318 182L1312 189L1304 194L1295 199L1289 200L1285 203L1283 201L1279 204L1271 207L1265 208L1263 214L1259 214L1258 210L1259 208L1251 206L1248 207L1242 205L1239 203L1240 199L1235 198L1232 196L1227 199L1221 200L1216 200L1213 201L1210 202L1211 209L1208 209L1207 207L1207 205L1202 207L1200 206L1195 203L1197 198L1193 197L1192 192L1186 193L1186 185L1192 180L1192 176L1192 171L1189 170L1187 166L1184 166L1177 166L1180 163L1177 159L1172 162L1167 160L1160 164L1155 169L1150 169L1148 168L1144 168L1140 166L1137 168L1133 172L1132 167L1129 169L1122 168L1115 167L1110 164L1105 163L1103 160L1100 159L1094 155L1089 153L1087 155L1078 151L1072 147L1071 140L1075 141L1075 138L1073 135L1073 130L1067 123L1057 121L1055 116L1051 113L1050 111L1049 108L1049 106L1046 104L1044 105L1042 99L1044 98L1043 97L1049 94L1053 93L1059 93L1061 90L1069 89L1071 87L1081 83L1082 82ZM1331 190L1327 199L1324 204L1321 199L1321 195L1324 189L1329 184L1332 186L1331 190ZM663 55L666 55L667 54L673 53L674 55L683 57L682 60L684 62L679 62L674 64L674 67L674 68L676 71L681 74L684 79L691 84L696 84L697 86L695 87L701 89L705 91L710 94L711 95L710 97L706 94L701 93L699 97L703 99L702 103L700 103L697 108L694 109L694 107L695 103L697 102L694 99L692 96L690 95L688 92L684 91L682 89L677 88L673 86L667 82L663 78L661 72L658 72L653 70L651 71L647 73L645 74L645 71L642 70L640 66L643 64L641 62L641 60L644 61L647 61L650 59L651 60L654 60L655 57L660 58L662 57L663 55ZM689 107L693 107L691 111L692 113L691 116L686 114L683 113L675 110L675 107L682 108L689 107ZM652 91L655 89L659 93L658 101L655 101L653 103L651 101L650 94L649 90L652 91ZM660 6L656 7L651 6L649 3L649 -3L650 -5L651 -7L657 -7L659 -9L663 -10L663 -7L662 -5L662 -4L665 -3L664 0L662 -1L658 3L660 6ZM674 -1L676 2L673 7L666 4L665 1L674 -1ZM563 13L558 12L555 12L556 8L555 5L560 5L566 9L563 13ZM581 16L582 12L578 8L571 7L570 6L572 3L570 1L566 4L566 -2L563 -5L565 -11L570 -16L575 -15L582 -16L576 -9L582 -10L588 -10L587 -5L581 0L587 1L588 1L593 8L597 9L601 16L603 18L610 20L609 23L606 25L609 28L603 31L595 31L585 33L582 32L578 35L573 34L569 36L565 35L574 29L580 27L579 27L570 26L568 24L575 22L571 19L573 15L581 16ZM878 85L880 85L884 89L887 89L888 88L892 85L895 88L898 93L901 93L902 94L897 95L896 100L895 102L893 103L893 106L892 106L888 103L890 100L888 99L886 99L879 103L879 99L876 98L874 97L875 95L872 93L873 91L871 90L870 89L871 88L876 89L879 90L880 89L877 86L878 85ZM877 104L873 103L870 100L869 98L870 98L872 99L874 99L874 100L877 104ZM840 75L846 76L854 77L863 80L864 81L867 80L873 81L875 83L878 85L877 86L880 89L879 90L876 89L871 88L870 89L861 89L856 87L849 87L850 84L849 80L845 78L842 77L840 75ZM1325 260L1322 255L1327 255L1329 258L1328 263L1325 260ZM1336 276L1337 274L1338 271L1341 270L1340 274L1344 269L1344 274L1342 276L1340 280L1338 282L1334 278L1336 276ZM1358 286L1359 289L1359 293L1357 298L1355 292L1352 295L1354 300L1352 303L1345 299L1344 295L1345 292L1342 289L1340 291L1337 291L1333 295L1332 293L1334 288L1338 286L1341 284L1343 287L1348 285L1349 282L1353 282L1352 277L1357 280L1358 283L1358 286ZM1311 280L1303 286L1306 282L1310 278L1314 274L1317 268L1318 273L1314 276L1311 280ZM1334 227L1333 229L1335 233L1334 238L1330 240L1329 245L1330 250L1334 251L1336 250L1344 253L1343 257L1345 258L1344 261L1340 258L1338 255L1336 257L1332 253L1327 254L1324 253L1324 250L1326 249L1324 247L1323 250L1320 246L1320 244L1319 238L1322 240L1322 230L1324 225L1328 225L1332 227L1333 225L1334 227ZM1332 268L1331 265L1335 267L1339 266L1339 269L1336 272L1332 273L1332 271L1332 268ZM1353 263L1355 270L1350 268L1350 270L1352 274L1349 275L1349 271L1347 271L1346 267L1349 268L1349 265L1346 261L1351 261L1353 263ZM1201 297L1202 296L1206 299L1207 302L1211 301L1213 299L1214 299L1218 303L1220 307L1221 311L1220 314L1221 316L1221 319L1223 321L1225 326L1225 328L1221 329L1215 324L1208 319L1208 316L1204 312L1203 307L1201 304L1202 300L1201 297ZM1307 311L1302 310L1295 310L1293 317L1291 319L1288 327L1283 329L1277 327L1274 328L1271 331L1267 330L1263 331L1259 328L1258 324L1262 326L1267 325L1268 320L1271 319L1278 317L1282 313L1285 309L1288 312L1289 310L1292 310L1292 306L1293 303L1297 299L1300 294L1303 294L1306 297L1306 300L1310 302L1315 304L1315 306L1311 306L1312 309L1307 311ZM1293 303L1292 306L1292 310L1289 310L1288 312L1285 309L1288 307L1293 303ZM683 57L688 57L691 56L696 56L697 55L698 55L699 57L695 59L694 61L692 62L692 63L690 63L688 62L686 63L682 63L684 62L682 60L683 57ZM772 -78L771 -74L780 -70L774 -66L781 -59L777 -54L783 -49L780 -45L789 -41L787 -38L781 -35L768 -27L758 -27L747 -24L737 -23L734 -26L728 -28L729 -34L726 -40L729 -43L735 -47L748 -53L752 -55L752 -57L743 -60L741 -62L741 -72L732 -76L724 -79L727 -80L734 -77L742 -77L748 -76L754 -79L757 -83L766 -85L774 -83L772 -78ZM735 41L734 43L733 45L731 46L725 44L723 45L721 46L719 47L718 46L715 47L713 48L712 49L707 49L705 49L702 47L701 45L702 44L703 43L705 43L707 43L707 42L709 42L709 40L710 40L711 39L713 39L716 39L719 41L722 39L725 40L730 39L735 41ZM690 29L693 31L697 32L697 33L700 35L701 33L705 34L706 36L710 36L713 39L711 39L710 40L709 40L709 42L707 42L707 43L705 43L703 43L702 44L699 43L696 44L692 42L689 42L686 45L682 43L678 40L675 39L674 36L673 34L678 33L680 32L684 30L686 29L687 30L690 29ZM819 249L818 247L821 238L821 234L823 232L827 231L830 228L834 235L836 240L839 243L847 249L850 252L854 256L856 258L858 260L857 261L854 261L852 259L850 255L847 253L845 251L840 249L836 249L835 248L831 249L827 246L826 251L819 249ZM1451 101L1446 107L1446 113L1444 118L1445 121L1442 125L1434 128L1423 128L1415 135L1411 133L1410 128L1400 130L1393 133L1386 133L1392 137L1388 147L1384 150L1381 147L1383 142L1379 140L1376 136L1382 134L1385 131L1391 128L1396 123L1408 122L1414 123L1420 112L1424 115L1433 109L1437 107L1440 99L1439 93L1442 89L1448 88L1451 96L1451 101ZM1468 72L1472 70L1473 76L1464 78L1459 84L1450 80L1446 86L1440 87L1439 81L1442 76L1448 76L1450 67L1452 63L1459 69L1463 71L1468 72ZM1394 135L1398 132L1401 132L1403 130L1408 131L1409 133L1405 137L1403 135L1400 136L1398 140L1394 138L1394 135ZM251 457L253 460L252 469L259 470L261 469L265 470L266 472L267 477L268 480L270 480L272 479L274 480L274 483L273 487L272 490L271 496L266 500L261 501L254 500L248 499L254 490L253 487L247 485L240 480L235 479L224 469L226 462L226 459L229 454L240 452L245 452L251 455L251 457ZM912 222L917 232L919 236L914 238L913 240L913 242L907 245L897 248L892 252L889 252L888 252L884 254L880 256L875 256L874 256L872 258L871 258L870 260L867 260L865 260L861 260L859 257L860 253L859 252L857 247L856 245L857 244L856 242L857 241L857 238L859 236L859 233L860 231L863 232L864 232L871 231L872 232L878 233L880 232L882 234L885 233L889 227L895 224L912 222ZM810 160L816 161L819 159L820 157L825 156L826 154L828 153L822 147L834 144L835 143L842 145L851 149L868 161L879 161L885 162L886 165L890 165L893 170L896 171L897 173L901 176L901 178L901 180L901 182L903 184L904 186L905 187L907 189L908 188L909 191L910 192L912 198L930 201L931 200L934 204L930 216L912 222L895 224L889 227L885 233L882 234L880 232L878 233L872 232L871 231L864 232L863 232L860 231L859 233L859 236L857 238L856 235L854 234L854 231L851 229L847 224L846 219L841 215L839 214L835 208L834 204L834 201L831 194L828 192L825 190L823 187L823 185L822 182L820 181L817 177L814 172L811 168L808 168L809 164L809 162L810 160ZM796 125L797 125L798 124L802 124L807 122L803 125L804 126L803 125L802 126L801 126L801 125L800 125L799 125L798 125L796 125ZM796 125L798 125L799 125L800 125L801 125L801 126L802 126L803 125L804 126L798 129L795 128L794 125L796 125ZM587 125L589 129L590 132L592 139L593 140L592 142L584 143L582 146L578 146L578 151L571 153L569 156L564 158L558 159L548 163L548 170L547 170L547 173L544 173L542 175L539 175L537 174L532 175L530 179L528 180L525 187L517 194L515 202L512 205L511 207L498 207L498 205L500 203L502 200L502 198L504 194L507 190L509 189L511 185L511 182L513 178L517 176L521 170L524 168L530 167L535 163L538 161L543 156L541 149L543 144L544 141L548 137L554 134L559 131L563 125L564 121L569 121L572 124L578 124L584 125L587 125ZM821 204L797 204L774 204L750 204L750 182L750 161L748 156L750 152L749 149L751 147L759 146L765 148L771 150L773 151L778 149L781 147L786 147L790 147L792 150L793 148L798 150L803 150L806 149L809 157L810 159L808 161L807 166L805 169L804 170L802 168L799 165L795 157L794 157L796 164L800 170L805 179L807 182L809 186L814 192L813 193L813 197L820 203L821 204ZM750 204L750 216L743 216L743 219L719 207L695 196L689 199L685 201L681 198L672 195L669 191L665 189L662 190L660 186L659 184L656 179L658 177L658 173L659 170L658 167L659 162L659 159L657 154L660 153L660 150L660 148L664 145L666 144L669 142L669 137L676 139L678 139L684 140L691 142L694 148L700 149L708 151L715 154L717 153L720 150L719 145L721 143L725 140L729 139L737 140L739 143L742 143L744 144L750 145L751 147L749 149L750 152L748 156L750 161L750 182L750 204ZM854 261L857 261L858 260L860 262L860 264L856 266L859 267L857 270L855 269L854 270L851 270L850 268L850 266L852 263L854 261ZM894 268L894 270L894 276L894 279L891 283L887 288L882 288L862 281L860 279L858 276L855 273L857 270L859 267L861 268L862 271L865 273L868 273L873 272L880 271L885 269L888 269L890 268L894 268ZM803 342L791 342L785 342L783 343L779 345L777 344L778 340L779 337L779 332L781 330L783 326L785 325L787 323L785 322L785 315L787 313L791 315L796 313L800 313L804 311L807 315L808 318L810 325L808 329L805 333L803 335L803 342ZM783 343L785 346L785 350L783 350L780 350L778 354L774 353L775 350L776 349L776 346L777 344L779 345L783 343ZM711 80L706 78L704 75L701 74L699 72L697 70L695 67L696 65L698 66L699 65L702 65L707 66L711 66L714 67L716 67L715 69L718 72L717 75L715 75L714 75L712 77L711 80ZM734 82L737 84L738 88L737 88L736 89L732 89L730 90L726 91L724 89L723 87L724 85L725 84L728 83L729 83L732 82L734 82ZM713 61L718 59L721 59L725 62L725 64L729 65L729 67L733 69L735 68L736 69L735 70L736 71L734 72L735 74L738 77L736 79L735 81L734 82L732 82L729 83L729 82L730 81L731 80L730 80L729 79L728 79L727 78L726 77L725 76L724 77L723 79L722 79L720 77L718 77L717 76L715 75L717 75L718 72L715 69L716 67L714 67L716 65L714 63L713 61ZM720 80L719 81L718 80L716 83L716 85L715 84L713 82L711 81L711 80L712 77L714 75L715 75L717 76L718 77L720 77L722 79L720 80ZM724 85L723 83L722 82L720 80L722 79L723 79L724 77L725 76L726 77L727 78L728 79L729 79L730 80L731 80L730 81L729 82L729 83L728 83L725 84L724 85ZM230 271L233 271L235 271L234 275L229 276L228 275L230 274L230 271ZM785 315L780 311L778 308L775 310L772 309L771 310L768 310L764 305L763 303L759 300L757 297L755 294L751 291L751 289L747 287L743 284L745 284L747 282L749 277L750 274L755 274L756 275L759 279L761 279L763 278L767 278L768 280L774 280L774 278L777 277L778 275L780 274L785 278L788 277L791 273L794 270L794 266L792 264L796 264L796 263L799 263L799 267L799 272L802 274L803 276L803 279L804 279L804 284L803 286L800 286L798 289L801 290L804 293L806 295L808 296L812 303L808 307L804 311L800 313L796 313L791 315L787 313L785 315Z","special":{"idn":"M1446 352L1446 371L1446 391L1441 386L1435 385L1433 386L1426 386L1428 382L1432 380L1430 373L1428 368L1416 363L1411 363L1402 357L1400 360L1398 361L1397 358L1397 356L1392 353L1398 351L1403 351L1402 349L1393 349L1391 346L1386 345L1383 342L1391 340L1394 338L1404 341L1405 343L1407 353L1413 356L1418 350L1425 346L1430 346L1435 348L1440 350L1446 352ZM1350 389L1350 391L1351 392L1347 397L1341 398L1341 397L1341 395L1344 392L1350 389ZM1405 377L1405 373L1406 371L1407 369L1408 370L1408 373L1405 377ZM1307 311L1304 317L1308 322L1307 325L1314 331L1307 331L1305 335L1305 341L1299 345L1299 351L1297 360L1296 358L1289 361L1287 357L1283 357L1280 355L1272 357L1270 354L1266 354L1261 354L1260 346L1257 344L1255 339L1254 334L1254 328L1258 324L1259 328L1263 331L1267 330L1271 331L1274 328L1277 327L1283 329L1288 327L1291 319L1293 317L1295 310L1302 310L1307 311ZM1376 353L1383 355L1385 359L1380 357L1375 356L1372 357L1367 356L1369 353L1376 353ZM1361 359L1357 358L1356 355L1362 355L1363 357L1361 359ZM1368 323L1368 326L1372 327L1372 329L1372 334L1369 334L1368 338L1370 341L1369 341L1366 338L1364 330L1366 325L1368 323ZM1338 331L1344 330L1350 326L1351 327L1347 333L1342 335L1336 333L1326 334L1321 335L1320 339L1326 344L1329 342L1340 340L1340 342L1337 342L1334 345L1329 347L1335 355L1334 357L1339 364L1339 368L1336 370L1333 368L1336 363L1330 365L1329 363L1330 361L1325 358L1326 352L1322 354L1322 361L1323 369L1319 370L1316 368L1318 363L1317 357L1314 357L1313 353L1315 349L1316 344L1319 335L1320 333L1325 328L1330 330L1338 331ZM1322 398L1314 393L1319 392L1323 394L1325 396L1324 397L1322 398ZM1328 387L1332 387L1337 385L1337 388L1328 390L1320 389L1320 387L1324 385L1328 387ZM1310 386L1313 386L1315 388L1308 389L1304 390L1300 390L1303 387L1306 387L1307 385L1310 386ZM1251 375L1252 377L1263 377L1265 375L1276 378L1278 382L1287 383L1294 386L1287 389L1281 386L1275 386L1269 386L1264 385L1257 382L1252 382L1250 383L1239 380L1238 378L1232 377L1236 371L1244 372L1248 374L1251 375ZM1226 343L1227 347L1229 350L1234 351L1237 354L1235 362L1235 371L1228 371L1223 366L1216 361L1213 358L1208 353L1205 348L1201 340L1196 335L1194 330L1192 325L1186 321L1183 316L1179 313L1172 306L1172 303L1176 303L1185 305L1190 310L1195 314L1198 317L1204 323L1210 323L1215 328L1218 333L1223 335L1221 340L1224 342L1226 343Z","col":"M199 328L198 329L196 326L195 324L193 326L181 326L181 329L185 330L184 332L183 332L180 333L180 337L183 339L183 343L183 345L181 362L178 359L176 358L180 352L175 350L172 350L169 349L166 351L162 350L158 344L155 342L153 339L149 336L148 337L145 335L142 334L141 334L135 334L134 331L133 331L127 328L126 326L128 325L128 322L129 320L132 320L135 316L137 313L135 311L136 308L135 303L136 301L135 296L133 293L133 290L135 290L137 288L135 285L136 284L139 284L143 280L146 279L146 277L147 272L151 270L154 269L155 268L160 269L164 266L167 264L169 261L172 262L173 263L172 265L168 266L167 269L164 271L163 273L162 278L160 281L163 281L164 284L165 286L166 288L165 290L165 291L167 292L168 294L176 293L179 294L184 299L186 299L190 299L194 298L196 299L195 303L194 305L193 309L194 313L196 315L196 316L193 319L195 320L197 322L199 328Z","fra":"M290 311L287 317L285 321L282 323L279 324L279 322L277 322L275 323L273 322L274 320L275 317L276 314L274 311L273 307L276 301L278 302L283 304L289 309L290 311ZM637 39L640 41L649 42L646 46L645 50L643 51L640 51L641 52L636 56L636 58L639 57L641 60L641 62L643 64L640 66L642 70L645 71L645 74L639 77L627 76L619 78L618 81L611 82L604 79L602 81L591 78L589 75L592 72L593 60L587 54L582 51L573 48L572 44L580 43L590 44L588 37L594 40L608 35L610 30L615 29L616 31L619 31L622 34L626 37L629 36L634 39L635 39L637 39ZM652 80L656 78L657 83L655 88L653 86L651 82L652 80Z","eth":"M887 288L870 306L862 306L857 310L853 311L851 312L847 312L845 310L839 313L837 315L833 315L832 314L831 314L829 314L821 309L817 309L815 307L815 304L812 303L808 296L806 295L804 293L801 290L798 289L800 286L803 286L804 284L804 278L806 272L808 271L809 268L812 264L815 261L818 255L819 249L826 251L827 246L831 249L835 248L836 249L840 249L845 251L847 253L850 255L852 259L854 261L852 263L850 266L850 268L851 270L854 270L855 269L857 270L855 273L858 276L860 279L862 281L882 288L887 288Z"}};
var BALMA=[1.5,43.61];
var OKEYS=['eth','col','idn'],oSel='eth',mv={k:1,tx:0,ty:0},mAnim=null,mDims={w:1,h:1},shipT=0;
function mp(ll){return [(ll[0]-MAP.LON0)*MAP.S,(MAP.LAT1-ll[1])*MAP.S]}
function hav(a,b){var R=6371,r=Math.PI/180,dl=(b[1]-a[1])*r,dn=(b[0]-a[0])*r,x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dn/2)*Math.sin(dn/2);return 2*R*Math.asin(Math.sqrt(x))}
function routeD(k){var a=mp(ORIG[k].ll),b=mp(BALMA),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),off=L*.22;
  var nx=-dy/L,ny=dx/L;if(ny>0){nx=-nx;ny=-ny}return 'M'+a[0].toFixed(1)+' '+a[1].toFixed(1)+'Q'+(mx+nx*off).toFixed(1)+' '+(my+ny*off).toFixed(1)+' '+b[0].toFixed(1)+' '+b[1].toFixed(1)}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function paintBeans(){
  var cv=$('#map-cv');if(!cv||!cv.getContext)return;
  var img=new Image();
  img.onload=function(){
    var ctx=cv.getContext('2d'),S=2,W=MAP.W,H=MAP.H;
    var mk=document.createElement('canvas');mk.width=W;mk.height=H;var mx=mk.getContext('2d');mx.fillStyle='#000';
    mx.fill(new Path2D(MAP.land));['fra','eth','col','idn'].forEach(function(k){mx.fill(new Path2D(MAP.special[k]))});
    var md=mx.getImageData(0,0,W,H).data;
    var sp=document.createElement('canvas');sp.width=64;sp.height=64;sp.getContext('2d').drawImage(img,0,0,64,64);
    var rnd=mulberry(11),step=4.3,y=0;
    /* peinture découpée en tranches de 6 ms : plus de gel de la page, et plus de filtre canvas par grain */
    function slice(){var t0=performance.now();
      while(y<H){
        for(var x=0;x<W;x+=step){
          var jx=x+(rnd()-.5)*step*1.7,jy=y+(rnd()-.5)*step*1.7;
          if(jx<0||jy<0||jx>=W||jy>=H)continue;
          if(md[((jy|0)*W+(jx|0))*4+3]<128)continue;
          var sz=5.6+rnd()*2.4,an=rnd()*6.283,c=Math.cos(an)*S,sn=Math.sin(an)*S;
          ctx.setTransform(c,sn,-sn,c,jx*S,jy*S);ctx.drawImage(sp,-sz/2,-sz/2,sz,sz);
        }
        y+=step;
        if(performance.now()-t0>6){requestAnimationFrame(slice);return}
      }
      ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(8,4,2,.34)';ctx.fillRect(0,0,cv.width,cv.height);ctx.globalCompositeOperation='source-over';
    }
    requestAnimationFrame(slice);
  };
  img.src='images/opt/bean-s.webp';
}
var beansDone=false;
function lazyBeans(){function go(){if(beansDone)return;beansDone=true;paintBeans()}
  if('IntersectionObserver' in window){new IntersectionObserver(function(en,ob){if(en[0].isIntersecting){ob.disconnect();go()}},{rootMargin:'900px'}).observe($('#map'))}else{setTimeout(go,1500)}}
function buildMap(){
  var pins='',routes='';
  OKEYS.forEach(function(k){routes+='<path class="route" id="rt-'+k+'" d="'+routeD(k)+'"/>';pins+='<g class="pin" data-o="'+k+'"><rect class="bub" x="-8" y="-8" width="16" height="16" transform="rotate(45)"/><text x="22" y="5">'+ORIG[k].name+'</text></g>'});
  pins+='<g class="pin home" data-o="balma"><rect class="bub" x="-7" y="-7" width="14" height="14" transform="rotate(45)"/><text x="-20" y="5" text-anchor="end">Balma</text></g>';
  $('#map').innerHTML='<div class="map-view" id="map-g" style="width:'+MAP.W+'px;height:'+MAP.H+'px"><canvas id="map-cv" width="'+(MAP.W*2)+'" height="'+(MAP.H*2)+'"></canvas><svg width="'+MAP.W+'" height="'+MAP.H+'" viewBox="0 0 '+MAP.W+' '+MAP.H+'" aria-hidden="true"><g>'+
   OKEYS.map(function(k){return '<path class="hl" id="hl-'+k+'" d="'+MAP.special[k]+'"/>'}).join('')+routes+'<g id="pins">'+pins+'</g><g id="ship" opacity="0"><circle class="ship" r="6"/></g></g></svg></div>';
  var cv=$('#map-cv');cv.style.width=MAP.W+'px';cv.style.height=MAP.H+'px';
  lazyBeans();
  $$('#pins .pin').forEach(function(el){el.addEventListener('click',function(){var o=el.dataset.o;if(o!=='balma')pickOrigin(o)})});
}
function mapPlace(){
  var g=$('#map-g');if(!g||!(mv.k>0))return;g.style.transform='translate('+mv.tx.toFixed(1)+'px,'+mv.ty.toFixed(1)+'px) scale('+mv.k.toFixed(4)+')';
  $$('#pins .pin').forEach(function(el){var o=el.dataset.o,p=mp(o==='balma'?BALMA:ORIG[o].ll);el.setAttribute('transform','translate('+p[0].toFixed(1)+' '+p[1].toFixed(1)+') scale('+(1/mv.k).toFixed(4)+')')});
  var rt=$('#rt-'+oSel);if(rt&&oSel!=='all'){var L=rt.getTotalLength(),pt=rt.getPointAtLength(L*shipT),sh=$('#ship');sh.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+') scale('+(1/mv.k).toFixed(4)+')')}
}
function targetView(o){
  var pts=o==='all'?OKEYS.map(function(k){return mp(ORIG[k].ll)}).concat([mp(BALMA)]):[mp(ORIG[o].ll),mp(BALMA)];
  var x0=Math.min.apply(null,pts.map(function(p){return p[0]})),x1=Math.max.apply(null,pts.map(function(p){return p[0]})),y0=Math.min.apply(null,pts.map(function(p){return p[1]})),y1=Math.max.apply(null,pts.map(function(p){return p[1]}));
  var padx=Math.max(150,(x1-x0)*.3),pady=Math.max(85,(y1-y0)*.42),bw=x1-x0+2*padx,bh=y1-y0+2*pady,k=Math.min(mDims.w/bw,mDims.h/bh);
  return {k:k,tx:mDims.w/2-k*(x0+x1)/2,ty:mDims.h/2-k*(y0+y1)/2};
}
function flyTo(t,instant){
  if(mAnim)cancelAnimationFrame(mAnim);
  var from={k:mv.k,tx:mv.tx,ty:mv.ty},t0=performance.now(),D=(instant||!MOTION)?0:1000;
  function step(now){var u=D?clamp((now-t0)/D):1,e=easeIO(u);mv={k:lerp(from.k,t.k,e),tx:lerp(from.tx,t.tx,e),ty:lerp(from.ty,t.ty,e)};mapPlace();if(u<1)mAnim=requestAnimationFrame(step)}
  step(t0);
}
function measureMap(){var m=$('#map');mDims={w:m.clientWidth,h:m.clientHeight}}
function pickOrigin(o,instant){
  oSel=o;
  $$('#otabs .otab').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.o===o)});
  OKEYS.forEach(function(k){$('#rt-'+k).classList.toggle('on',k===o||o==='all');$('#hl-'+k).classList.toggle('on',k===o)});
  measureMap();flyTo(targetView(o),instant);
  var c=$('#ocard'),h='';
  if(o==='all'){var ds=OKEYS.map(function(k){return Math.round(hav(ORIG[k].ll,BALMA)/100)*100});h='<h3>Trois origines</h3><p class="hand lead" style="font-size:1.4rem">Des tropiques à l\'atelier de Balma : de '+fmt(Math.min.apply(null,ds)).replace(/\s/g,NNB)+' à '+fmt(Math.max.apply(null,ds)).replace(/\s/g,NNB)+NB+'km à vol d\'oiseau.</p>'}
  else{var d=ORIG[o],km=Math.round(hav(d.ll,BALMA)/10)*10,cal='';
    for(var m=1;m<=12;m++)cal+='<span class="'+(d.main.indexOf(m)>-1?'m1':(d.second.indexOf(m)>-1?'m2':''))+'">'+'JFMAMJJASOND'[m-1]+'</span>';
    h='<h3>'+d.name+'</h3><p class="hand" style="margin-bottom:.8rem">'+d.place+'. Pour '+CAFES[d.cafe].article+'.</p><dl class="facts"><div><dt>Lot (fictif)</dt><dd>'+d.lot+'</dd></div><div><dt>Altitude</dt><dd>'+d.alt+'</dd></div><div><dt>Variétés</dt><dd>'+d.variety+'</dd></div><div><dt>Procédé</dt><dd>'+d.proc+'</dd></div><div><dt>Conditionnement</dt><dd>'+d.bag+'</dd></div><div><dt>Jusqu\'à Balma</dt><dd class="tabnum">'+fmt(km).replace(/\s/g,NNB)+NB+'km à vol d\'oiseau</dd></div><div><dt>Trajet du sac</dt><dd>'+d.transit+'</dd></div></dl>'+
     '<p style="margin-top:.9rem;font-weight:600">Calendrier de récolte</p><div class="cal" role="img" aria-label="Récolte principale : '+d.main.map(function(m){return ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][m-1]}).join(', ')+'">'+cal+'</div><p class="cal-key">Plein : récolte principale'+(d.second.length?'. Hachuré : seconde récolte':'')+'.</p>'+
     '<p style="margin-top:1rem"><button class="btn btn-sm btn-cream" type="button" data-open="'+d.cafe+'">Ouvrir la fiche '+'de '+CAFES[d.cafe].article+'</button></p>'}
  c.innerHTML=h;
}
function buildOrigTabs(){
  $('#otabs').innerHTML=OKEYS.map(function(k){var d=ORIG[k];return '<button class="otab" type="button" data-o="'+k+'" aria-pressed="false">'+d.name+'<small>'+CAFES[d.cafe].name+'</small></button>'}).join('')+'<button class="otab" type="button" data-o="all" aria-pressed="false">Vue d\'ensemble<small>Les 3 trajets</small></button>';
  $('#otabs').addEventListener('click',function(e){var b=e.target.closest('.otab');if(b){pickOrigin(b.dataset.o);FX.tink()}});
}
buildMap();buildOrigTabs();measureMap();pickOrigin('eth',true);
if(window.ResizeObserver){new ResizeObserver(function(){measureMap();flyTo(targetView(oSel),true)}).observe($('#map'))}else{addEventListener('resize',function(){measureMap();flyTo(targetView(oSel),true)})}
var mapVis=false,shipRaf=0,shipLast=0;
function shipTick(now){
  var sh=$('#ship');
  if(oSel==='all'||!MOTION){sh.setAttribute('opacity',0);shipRaf=0;return}
  shipT=(shipT+(now-shipLast)/5200)%1;shipLast=now;sh.setAttribute('opacity',1);mapPlace();
  shipRaf=mapVis?requestAnimationFrame(shipTick):0;
}
function shipKick(){if(!shipRaf&&mapVis&&MOTION&&oSel!=='all'){shipLast=performance.now();shipRaf=requestAnimationFrame(shipTick)}}
if('IntersectionObserver' in window){new IntersectionObserver(function(en){mapVis=en[0].isIntersecting;shipKick()}).observe($('#map'))}
$('#otabs').addEventListener('click',function(){setTimeout(shipKick,50)});


/* ===== Comptoir de préparation ===== */
var prepState={cafe:'zenith',method:'filtre',dose:18};
var VESSELS={
 filtre:'<svg viewBox="0 0 200 220" role="img" aria-label="Dripper posé sur une carafe qui se remplit"><defs><clipPath id="cf-c"><path d="M52 124H148L155 198Q155 206 147 206H53Q45 206 45 198Z"/></clipPath></defs><rect class="v-glass" x="45" y="120" width="110" height="88" rx="4"/><g clip-path="url(#cf-c)"><rect class="v-water" x="44" y="122" width="112" height="86" data-dir="up"/></g><path class="v-stroke" d="M50 120H150L158 198Q158 208 148 208H52Q42 208 42 198Z" fill="none"/><path class="v-stroke" d="M34 52H166L118 118H82Z" fill="#e8d4ae"/><path d="M66 70H134" stroke="#6b3a1f" stroke-width="10" stroke-linecap="round"/><path class="v-drip v-stroke" d="M100 124V146" stroke-dasharray="3 6"/></svg>',
 piston:'<svg viewBox="0 0 200 220" role="img" aria-label="Cafetière à piston qui se remplit, piston qui descend"><rect class="v-glass" x="58" y="50" width="84" height="156" rx="6"/><rect class="v-water" x="62" y="54" width="76" height="148" data-dir="up"/><g class="v-plunger" data-plunger="1"><rect x="97" y="0" width="6" height="64" fill="#43271a"/><rect x="62" y="56" width="76" height="9" fill="#43271a"/><circle cx="100" cy="6" r="9" fill="#8a3217"/></g><rect class="v-stroke" x="58" y="50" width="84" height="156" rx="6" fill="none"/><path class="v-stroke" d="M142 80H164Q172 80 172 90V120Q172 130 164 130H142" fill="none"/></svg>',
 espresso:'<svg viewBox="0 0 200 220" role="img" aria-label="Porte-filtre et tasse d\'espresso qui se remplit"><rect x="56" y="52" width="88" height="34" rx="6" fill="#43271a"/><rect x="96" y="86" width="8" height="12" fill="#43271a"/><rect x="144" y="62" width="40" height="12" rx="4" fill="#43271a"/><path class="v-drip v-stroke" d="M100 100V150" stroke-dasharray="3 5"/><defs><clipPath id="ce-c"><path d="M66 150H134L127 196Q126 202 120 202H80Q74 202 73 196Z"/></clipPath></defs><path class="v-glass" d="M66 150H134L127 196Q126 202 120 202H80Q74 202 73 196Z"/><g clip-path="url(#ce-c)"><rect class="v-water" x="64" y="150" width="72" height="54" data-dir="up" style="fill:#4a2410"/></g><path class="v-stroke" d="M64 150H136L128 198Q127 204 121 204H79Q73 204 72 198Z" fill="none"/><path class="v-stroke" d="M135 160H150Q160 160 160 170Q160 182 148 182H132" fill="none"/></svg>',
 moka:'<svg viewBox="0 0 200 220" role="img" aria-label="Cafetière italienne : l\'eau du bas monte dans le haut"><defs><clipPath id="cm-t"><path d="M70 58H130L136 112H64Z"/></clipPath><clipPath id="cm-b"><path d="M62 150H138L146 202H54Z"/></clipPath></defs><path class="v-glass" d="M70 58H130L136 112H64Z"/><g clip-path="url(#cm-t)"><rect class="v-water" x="60" y="56" width="80" height="58" data-dir="up"/></g><path class="v-glass" d="M62 150H138L146 202H54Z"/><g clip-path="url(#cm-b)"><rect class="v-water" x="52" y="150" width="96" height="54" data-dir="down" style="fill:#7aa6c2"/></g><path class="v-stroke" d="M70 58H130L136 112H64Z" fill="none"/><path class="v-stroke" d="M64 112H136L138 128H62Z" fill="#d8bd91"/><path class="v-stroke" d="M62 128H138L138 150H62Z" fill="#d8bd91"/><path class="v-stroke" d="M62 150H138L146 202H54Z" fill="none"/><path class="v-stroke" d="M68 58Q100 38 132 58" fill="#d8bd91"/><circle cx="100" cy="46" r="5" fill="#43271a"/><path class="v-stroke" d="M136 76H162Q172 76 172 88V118Q172 128 162 128H136" fill="none"/></svg>'
};
var tm={run:false,t:0,last:0,raf:0,pours:null,stepIdx:-1};
function recipe(){
  var M=METHODS[prepState.method],c=CAFES[prepState.cafe],d=prepState.dose,out=prepState.method==='espresso'?d*2:d*M.ratio,temp=M.temp+c.tOff;
  return {M:M,c:c,dose:d,out:out,temp:temp,time:M.time};
}
function stepsFor(r){
  var d=r.dose,W=r.out,m=prepState.method,f=function(n){return fmt(Math.round(n))+NB+'g'};
  if(m==='filtre')return [[0,'Rincez le filtre, tarez la balance, ajoutez '+d+NB+'g de café.'],[0,'Infusion : versez '+f(d*2)+' d\'eau en spirale. Laissez gonfler 40 s.'],[40,'Versez jusqu\'à '+f(W*.6)+', en petits cercles.'],[80,'Complétez jusqu\'à '+f(W)+'.'],[r.time,'Fin de l\'écoulement. Servez.']];
  if(m==='piston')return [[0,'Versez '+f(W)+' d\'eau à '+r.temp+NB+'°C sur '+d+NB+'g de café.'],[30,'Remuez trois tours, posez le piston sans appuyer.'],[r.time-30,'Pressez lentement, environ 20 secondes.'],[r.time,'Servez sans attendre.']];
  if(m==='espresso')return [[0,'Moulez '+d+NB+'g, tassez à plat, lancez l\'extraction.'],[7,'Les premières gouttes, couleur noisette.'],[r.time,'Stoppez à '+f(W)+' dans la tasse.']];
  return [[0,'Remplissez le bas d\'eau chaude jusqu\'à la valve, ajoutez '+d+NB+'g sans tasser. Feu doux.'],[110,'Le café monte. Couvercle ouvert.'],[r.time,'Retirez du feu dès que ça gargouille.']];
}
function outAt(t,r){
  var m=prepState.method,W=r.out,D=r.time,d=r.dose;
  if(m==='filtre'){var seq=[[0,0],[6,d*2],[40,d*2],[80,W*.6],[90,W*.6],[130,W],[D,W]];return seqV(seq,t)}
  if(m==='piston'){return seqV([[0,0],[22,W],[D,W]],t)}
  if(m==='espresso'){return seqV([[0,0],[7,0],[D,W]],t)}
  return seqV([[0,0],[40,0],[D*.9,W],[D,W]],t);
}
function seqV(s,t){for(var i=1;i<s.length;i++){if(t<=s[i][0]){var a=s[i-1],b=s[i],u=(t-a[0])/Math.max(1e-6,b[0]-a[0]);return lerp(a[1],b[1],clamp(u))}}return s[s.length-1][1]}
function fillAt(t,r){var W=r.out;if(prepState.method==='filtre'){var col=seqV([[0,0],[10,0],[r.time,W*.93]],t);return col/W}return outAt(t,r)/W}
function fillRange(rg){rg.style.setProperty('--fill',((rg.value-rg.min)/(rg.max-rg.min)*100).toFixed(1)+'%')}
function renderPrep(){
  fillRange($('#p-dose'));
  var r=recipe(),M=r.M,cups=prepState.method==='espresso'?Math.max(1,Math.round(r.out/36)):Math.max(1,Math.round(r.out/M.cup*10)/10);
  var cupTxt=prepState.method==='espresso'?(cups>1?cups+' espressos':'1 espresso'):(prepState.method==='moka'?(fmt(Math.round(r.out/60*10)/10,1).replace(',0','')+' tasses'):(fmt(cups,1).replace(',0','')+' '+(cups>1?'grandes tasses':'grande tasse')));
  $('#r-cups').textContent=cupTxt;
  $('#p-dose-out').textContent=fmt(r.dose,r.dose%1?1:0);
  var dl='<div><dt>Dose</dt><dd class="tabnum">'+fmt(r.dose,r.dose%1?1:0)+'<small>g</small></dd></div><div><dt>'+M.waterLbl+'</dt><dd class="tabnum">'+fmt(Math.round(r.out))+'<small>g</small></dd></div><div><dt>Ratio</dt><dd class="tabnum">1:'+M.ratio+'</dd></div><div><dt>Température</dt><dd class="tabnum">'+r.temp+'<small>°C</small></dd></div><div><dt>Durée</dt><dd class="tabnum">'+(r.time>=60?mmss(r.time):r.time+'<small>s</small>')+'</dd></div>';
  $('#recipe-l').innerHTML=dl;
  var gd='';for(var i=0;i<(M.gs>9?3:(M.gs>5?5:7));i++)gd+='<i style="--g:'+M.gs+'px"></i>';
  $('#gdots').innerHTML=gd;$('#grind-txt').textContent='Mouture '+M.grind.toLowerCase()+', '+M.micron+'. Grains moulus à la dernière minute.';
  $('#vessel-svg').innerHTML=VESSELS[prepState.method];
  var st=stepsFor(r);$('#steps-l').innerHTML=st.map(function(s,i){return '<li data-i="'+i+'"><b class="tabnum">'+mmss(s[0])+'</b><span>'+s[1]+'</span></li>'}).join('');
  tm.t=0;paintTimer(0,r,true);
}
function paintTimer(t,r,silent){
  r=r||recipe();var D=r.time;
  $('#t-clock').textContent=mmss(t);var o=outAt(t,r);$('#t-scale').textContent=fmt(Math.round(o))+NB+'g';
  var f=fillAt(t,r);
  $$('#vessel-svg .v-water').forEach(function(w){var down=w.dataset.dir==='down';w.style.transform='scaleY('+(down?1-clamp(f*1.0):clamp(f)).toFixed(3)+')'});
  var pl=$('#vessel-svg [data-plunger]');if(pl){var pu=clamp((t-(D-30))/20);pl.style.transform='translateY('+(pu*110).toFixed(1)+'px)'}
  var dr=$('#vessel-svg .v-drip');if(dr){var on=tm.run&&f<.995&&f>0;dr.style.opacity=on?1:0}
  var st=stepsFor(r),idx=-1;st.forEach(function(s,i){if(t>=s[0]&&(t>0||i===0))idx=i});if(t<=0)idx=-1;
  $$('#steps-l li').forEach(function(li,i){li.classList.toggle('now',i===idx);li.classList.toggle('past',i<idx)});
  if(!silent&&idx!==tm.stepIdx&&idx>-1)FX.tink();tm.stepIdx=idx;
}
function timerLoop(now){
  if(!tm.run)return;var r=recipe(),sp=$('#t-real').checked?1:8;tm.t+=(now-tm.last)/1000*sp;tm.last=now;
  if(tm.t>=r.time){tm.t=r.time;paintTimer(tm.t,r);stopTimer(true);return}
  paintTimer(tm.t,r);if(FX.on&&Math.random()<.35&&fillAt(tm.t,r)<.995)FX.drip();
  tm.raf=requestAnimationFrame(timerLoop);
}
function stopTimer(done){tm.run=false;cancelAnimationFrame(tm.raf);$('#t-go').textContent=done?'Relancer':'Lancer l\'extraction';if(done){FX.thud();paintTimer(recipe().time,recipe(),true);var dr=$('#vessel-svg .v-drip');if(dr)dr.style.opacity=0}}
$('#t-go').addEventListener('click',function(){
  if(tm.run){stopTimer(false);return}
  var r=recipe();if(tm.t>=r.time)tm.t=0;tm.run=true;tm.last=performance.now();tm.stepIdx=-1;$('#t-go').textContent='Arrêter';
  if(!MOTION){tm.t=r.time;paintTimer(r.time,r);stopTimer(true);return}
  tm.raf=requestAnimationFrame(timerLoop);
});
$('#t-real').addEventListener('change',function(){$('#t-hint').textContent=this.checked?'Temps réel.':'Démo accélérée ×8. Le son et la vibration se règlent avec le bouton en haut de la page.'});
function setPrep(o){
  if(tm.run)stopTimer(false);
  if(o.cafe)prepState.cafe=o.cafe;
  if(o.method){prepState.method=o.method;var M=METHODS[o.method];prepState.dose=M.dose.val;var rg=$('#p-dose');rg.min=M.dose.min;rg.max=M.dose.max;rg.step=M.dose.step;rg.value=M.dose.val}
  if(o.dose!=null)prepState.dose=o.dose;
  $$('#p-cafe input').forEach(function(i){i.checked=i.value===prepState.cafe});
  $$('#p-method input').forEach(function(i){i.checked=i.value===prepState.method});
  renderPrep();
}
$('#p-cafe').addEventListener('change',function(e){setPrep({cafe:e.target.value})});
$('#p-method').addEventListener('change',function(e){setPrep({method:e.target.value})});
$('#p-dose').addEventListener('input',function(e){if(tm.run)stopTimer(false);prepState.dose=parseFloat(e.target.value);renderPrep()});
renderPrep();

/* ===== Thermomètre, teinte de la page, pile des cafés ===== */
var tints=$$('.tint i.c'),railFill=$('#rail-fill'),railMark=$('#rail-mark'),railT=$('#rail-t'),railPh=$('#rail-ph'),rail=$('#rail'),lastTint='',lastRail='';
function railTint(p){
  if(MOTION){var w=tints.map(function(_,i){return Math.max(0,1-Math.abs(p*4-i))}),key=w.map(function(x){return x.toFixed(2)}).join();
    if(key!==lastTint){lastTint=key;tints.forEach(function(el,i){el.style.opacity=w[i].toFixed(3)})}}
  if(rail&&rail.offsetHeight){var T=Math.round(lerp(20,224,p)),ph=T<150?'Séchage':(T<196?'Maillard':(p>=.995?'Sortie':'Développement')),k=T+ph+rail.offsetHeight;
    if(k!==lastRail){lastRail=k;railFill.style.transform='scaleY('+p.toFixed(4)+')';railMark.style.transform='translateY('+(p*rail.offsetHeight).toFixed(1)+'px)';railT.textContent=T+'°';railPh.textContent=ph}}
}
var cafeEls=$$('.cafe');
function stackCafes(h){
  for(var i=0;i<cafeEls.length-1;i++){var nx=cafeEls[i+1].getBoundingClientRect().top,q=clamp((h-nx)/(h-BAR));
    cafeEls[i].style.transform='scale('+(1-.06*q).toFixed(4)+')';cafeEls[i].style.opacity=(1-.55*q).toFixed(3);cafeEls[i].style.pointerEvents=q>.45?'none':''}
}

/* ===== Boutons à remplissage directionnel, fiche de fournée ===== */
function btnSide(e,enter){var b=e.target.closest&&e.target.closest('.btn');if(!b)return;if(e.relatedTarget&&b.contains(e.relatedTarget))return;
  var r=b.getBoundingClientRect();b.style.setProperty('--ox',(e.clientX-r.left<r.width/2)?'0%':'100%')}
document.addEventListener('pointerover',function(e){btnSide(e,true)},true);
document.addEventListener('pointerout',function(e){btnSide(e,false)},true);
document.body.classList.add('ready');

/* ===== Carrousel : polaroïds sur un fil ===== */
(function(){
  var root=$('#pl');if(!root)return;
  var SL=[
    {image:'images/opt/slide-aube.jpg',title:"Soleil Levant",caption:'Éthiopie, Yirgacheffe. Torréfaction claire. 9,90 € les 250 g.',alt:"Sachet de Soleil Levant, étiquette vert sauge, sur fond vert",open:'aube'},
    {image:'images/opt/slide-zenith.jpg',title:'Crépuscule',caption:'Mélange Brésil et Colombie. Torréfaction moyenne. 9,90 € les 250 g.',alt:'Sachet de Crépuscule, étiquette terracotta, sur fond orangé',open:'zenith'},
    {image:'images/opt/slide-nuit.jpg',title:'Nocturne',caption:'Robusta, Sumatra. Torréfaction foncée. 9,90 € les 250 g.',alt:'Sachet de Nocturne, étiquette bleu nuit, sur fond bleu',open:'nuit'},
    {image:'images/opt/abonnement.jpg',title:'La boîte',caption:'1, 2 ou 4 sachets par mois, sans engagement. Dès 9,90 €.',alt:'Boîte kraft ouverte avec trois sachets de café debout',href:'abonnement.html',cta:"Je m'abonne"},
    {image:'images/opt/torrefaction.jpg',title:"L'atelier",caption:'Fournées de 6 kg, torréfiées à Balma.',alt:'Un torréfacteur verse des grains dans le bac de refroidissement'},
    {image:'images/opt/cerises.jpg',title:'La cerise',caption:'Le café commence par un fruit, cueilli à la main.',alt:'Deux mains ouvertes tenant des cerises de café rouges'}
  ];
  var n=SL.length,CARD=300,SAG=46,SWING=1,AUTO=4500,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var arrow=function(d){return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="'+d+'" stroke="currentColor" stroke-width="1.6"/></svg>'};
  root.innerHTML='<svg class="pl-string" aria-hidden="true"><path id="pl-path" fill="none" stroke="#b98f5d" stroke-width="1.5" stroke-linecap="round"/></svg>'+
    SL.map(function(sl,i){return '<div class="pl-card" data-i="'+i+'"><div class="pl-print"><div class="pl-shot"><img src="'+sl.image+'" alt="'+esc(sl.alt)+'" width="400" height="400" draggable="false" loading="lazy" decoding="async"></div><div class="pl-note">'+esc(sl.title)+'</div></div><div class="pl-peg"></div></div>'}).join('')+
    '<div class="pl-bar"><div class="pl-cap" id="pl-cap"></div><span class="pl-count" id="pl-count" aria-hidden="true"></span><button type="button" class="pl-btn" id="pl-prev" aria-label="Précédent">'+arrow('M10 3 5 8l5 5')+'</button><button type="button" class="pl-btn" id="pl-next" aria-label="Suivant">'+arrow('m6 3 5 5-5 5')+'</button></div><div class="sr" id="pl-live" aria-live="polite"></div>';
  var cards=$$('.pl-card',root),path=$('#pl-path'),cap=$('#pl-cap'),count=$('#pl-count'),live=$('#pl-live'),
      S={off:0,vel:0,target:0,a:[],w:[]},size={w:1200,h:700,cw:CARD},active=-1,drag=null,lastTouch=0,visible=false,raf=0,prev=0;
  function spacing(){return size.cw*1.08}
  function goTo(i){S.target=clamp(i,0,n-1)*spacing()}
  function stringY(x,w,y0,sag){var t=clamp(x/w,0,1);return y0+4*sag*t*(1-t)}
  function springStep(x,v,t,dt){var k=70,c=2*Math.sqrt(k),nv=v+(k*(t-x)-c*v)*dt;return [x+nv*dt,nv]}
  function swingStep(a,w,lv,dt,g){var nw=w+(-38*a-4.2*w+lv*.0034*g)*dt;return [clamp(a+nw*dt,-.6,.6),nw]}
  function nearestAt(off,sp){return clamp(Math.round(off/sp),0,n-1)}
  function pad2(k){return k<10?'0'+k:''+k}
  function setActive(i){
    active=i;
    cards.forEach(function(c,k){c.dataset.on=k===i?'1':'0';if(k===i)c.removeAttribute('aria-hidden');else c.setAttribute('aria-hidden','true')});
    var sl=SL[i],act='';
    if(sl.open)act='<button class="btn btn-sm" type="button" data-open="'+sl.open+'">Voir la fiche</button>';
    else if(sl.href)act='<a class="btn btn-sm btn-main" href="'+sl.href+'">'+esc(sl.cta||'Voir')+'</a>';
    cap.innerHTML='<div class="pl-cap-t" aria-hidden="true"><span class="pl-title">'+esc(sl.title)+'</span><span class="pl-sub">'+esc(sl.caption)+'</span></div>'+act;
    count.innerHTML='<b>'+pad2(i+1)+'</b> / '+pad2(n);
    live.textContent='Photo '+(i+1)+' sur '+n+' : '+sl.title+'. '+sl.caption;
  }
  function measure(){
    var r=root.getBoundingClientRect(),cw=Math.round(Math.max(150,Math.min(CARD,r.width*.42,r.height*.42))),ch=cw!==size.cw;
    size={w:r.width,h:r.height,cw:cw};root.style.setProperty('--pl-cw',cw+'px');
    if(ch&&active>=0){S.target=active*spacing();S.off=S.target}
  }
  function frame(now){
    raf=0;if(!visible)return;
    var dt=Math.min(.033,(now-prev)/1000);prev=now;
    var w=size.w,h=size.h,cw=size.cw,y0=Math.max(40,h*.2),sp=spacing(),lv;
    if(drag&&drag.moved){lv=drag.v*1000}else{var before=S.off,r=springStep(S.off,S.vel,S.target,dt);S.off=r[0];S.vel=r[1];lv=-(S.off-before)/Math.max(dt,1e-3)}
    var g=reduce?0:SWING,near=nearestAt(S.off,sp);
    for(var i=0;i<n;i++){
      var el=cards[i],x=w/2+i*sp-S.off;
      if(x<-cw*1.5||x>w+cw*1.5){el.style.visibility='hidden';continue}
      el.style.visibility='visible';
      var a=S.a[i]||0,av=S.w[i]||0,rr=swingStep(a,av,lv,dt,g);a=rr[0];av=rr[1];
      if(g)a+=Math.sin(now/1300+i*1.7)*.0009*g;
      S.a[i]=a;S.w[i]=av;
      var y=stringY(x,w,y0,SAG)-6;
      el.style.transform='translate('+(x-cw/2).toFixed(1)+'px,'+y.toFixed(1)+'px) rotate('+a.toFixed(4)+'rad)';
      el.style.zIndex=String(i===near?n+1:n-Math.abs(i-near));
    }
    path.setAttribute('d','M0 '+y0+' Q'+(w/2)+' '+(y0+2*SAG)+' '+w+' '+y0);
    if(near!==active)setActive(near);
    raf=requestAnimationFrame(frame);
  }
  measure();setActive(0);
  if(window.ResizeObserver)new ResizeObserver(measure).observe(root);else addEventListener('resize',measure);
  if('IntersectionObserver' in window)new IntersectionObserver(function(en){visible=en[0].isIntersecting;if(visible&&!raf){prev=performance.now();raf=requestAnimationFrame(frame)}}).observe(root);
  else{visible=true;raf=requestAnimationFrame(frame)}
  root.addEventListener('pointerdown',function(e){
    if(e.target.closest('.pl-bar'))return;lastTouch=performance.now();
    drag={x:e.clientX,off:S.off,lx:e.clientX,lt:e.timeStamp,v:0,moved:false};
  });
  root.addEventListener('pointermove',function(e){
    var d=drag;if(!d)return;var dx=e.clientX-d.x;
    if(!d.moved&&Math.abs(dx)>5){d.moved=true;root.dataset.drag='1';try{root.setPointerCapture(e.pointerId)}catch(er){}}
    if(!d.moved)return;
    var dt=Math.max(1,e.timeStamp-d.lt);d.v=.7*((e.clientX-d.lx)/dt)+.3*d.v;d.lx=e.clientX;d.lt=e.timeStamp;
    var max=(n-1)*spacing(),off=d.off-dx;if(off<0)off*=.35;if(off>max)off=max+(off-max)*.35;S.off=off;
  });
  function up(e){
    var d=drag;drag=null;lastTouch=performance.now();if(!d)return;
    if(d.moved){root.dataset.drag='0';S.vel=-d.v*1000;goTo(nearestAt(S.off-d.v*180,spacing()));return}
    var c=e.target.closest&&e.target.closest('[data-i]');if(c)goTo(+c.getAttribute('data-i'));
  }
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  function step(dir){lastTouch=performance.now();goTo(clamp(active+dir,0,n-1))}
  $('#pl-prev').addEventListener('click',function(){step(-1)});$('#pl-next').addEventListener('click',function(){step(1)});
  root.addEventListener('keydown',function(e){if(e.key==='ArrowRight')step(1);else if(e.key==='ArrowLeft')step(-1);else return;e.preventDefault()});
})();

/* ===== Défilement fluide (inertie), ancres, révélations, fonds vivants ===== */
function smoothMax(){return Math.max(0,document.documentElement.scrollHeight-innerHeight)}
/* distance courte : défilement doux. Longue distance : saut direct, sinon la page traverse toutes les sections lourdes et rame */
function smoothTo(y){y=clamp(y,0,smoothMax());var far=Math.abs(y-scrollY)>innerHeight*1.2;scrollTo({top:y,behavior:(MOTION&&!far)?'smooth':'instant'})}
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||a.closest('dialog'))return;
  var id=a.getAttribute('href');if(id.length<2)return;var el=document.querySelector(id);if(!el)return;
  e.preventDefault();var ty=el.getBoundingClientRect().top+scrollY-BAR-8;
  smoothTo(ty);
  if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');
  try{el.focus({preventScroll:true})}catch(_){}
  try{history.replaceState(null,'',id)}catch(_){}
  [700].forEach(function(ms){setTimeout(function(){var t2=el.getBoundingClientRect().top+scrollY-BAR-8;if(Math.abs(t2-ty)>24){ty=t2;smoothTo(t2)}},ms)});
});

/* révélations à l'entrée dans l'écran */
(function(){
  if(!MOTION||!('IntersectionObserver' in window))return;
  var H='.h2,.hero-outro h2,.bleed h2,.foot-cta h2,.cafe h3,.cafes-head h2',
      B='.lead,.story-top>div,.point,.story-sign,.cafes-head p,.cafe-body>*,.gallery .wrap>p,.sv-grid>*,.map-grid>*,.prep-grid>*,.sub-grid>*,.note,.faq details,.foot-cols>*,.foot-cta>a,.legal,.q-side>*,.ticket-wrap,.fiction';
  $$(H).forEach(function(el){el.classList.add('rv-h')});
  $$(B).forEach(function(el){if(!el.classList.contains('rv-h')&&!el.closest('.hero-track')&&!el.closest('.pl-root'))el.classList.add('rv')});
  var io=new IntersectionObserver(function(en){
    var k=0;en.forEach(function(e){if(e.isIntersecting){e.target.style.setProperty('--rd',(k*.07).toFixed(2)+'s');k++;e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:0,rootMargin:'0px 0px 12% 0px'});
  $$('.rv,.rv-h').forEach(function(el){io.observe(el)});
})();

/* fonds vivants */
var DECO=[
 ['.story',{ghost:['Atelier','-3%','5%',.05],beans:[[86,5,170,4,.1,22],[2,62,120,7,-.07,-35],[90,66,90,0,.18,60],[44,93,70,2,.14,10]],glow:[['#e8975a','80%','12%','48rem'],['#c2501f','5%','70%','36rem']]}],
 ['.gallery',{ghost:['Produits','-2%','8%',.05],beans:[[88,10,130,3,.1,30],[3,60,100,6,-.1,-20]],glow:[['#f2c98f','50%','50%','50rem']]}],
 ['.saveurs',{ghost:['Saveurs','-2%','4%',.05],beans:[[91,8,150,3,.1,20],[1,78,110,6,-.08,-50],[60,96,80,0,.16,5]],glow:[['#f2c98f','75%','50%','44rem'],['#b3441b','10%','30%','30rem']]}],
 ['.origins',{ghost:['Origines','-2%','3%',.05],beans:[[92,6,120,2,.1,40],[2,88,140,5,-.1,-15]],glow:[['#e8975a','50%','45%','52rem']]}],
 ['.prep',{ghost:['Recette','-2%','4%',.05],beans:[[90,12,140,4,.12,10],[1,70,100,6,-.08,70],[70,94,80,1,.15,-30]],glow:[['#e8975a','15%','25%','40rem'],['#7d8a4a','90%','80%','30rem']]}],
 ['.sub',{ghost:['Boîte','-2%','3%',.05],beans:[[3,8,120,3,.1,-20],[91,55,150,5,-.08,35]],glow:[['#e8975a','85%','20%','44rem']]}],
 ['.avis',{ghost:['Avis','-2%','4%',.05],beans:[[88,6,130,4,.1,15],[2,72,110,6,-.08,-60]],glow:[['#c2501f','30%','60%','44rem'],['#f2c98f','90%','20%','28rem']]}],
 ['.faq-sec',{ghost:['Questions','-2%','4%',.05],beans:[[90,10,120,3,.1,50],[2,80,100,5,-.07,-10]],glow:[['#7d8a4a','20%','30%','42rem']]}],
 ['.foot',{beans:[[88,8,150,3,.1,25],[2,38,110,5,-.08,-40],[60,92,80,1,.14,60]],glow:[['#c2501f','82%','62%','52rem'],['#e8975a','8%','18%','30rem']]}],
 ['.cafe-aube',{ghost:['Éthiopie','-2%','12%',.06],beans:[[93,8,110,3,.12,30],[48,90,80,1,-.1,-40]],glow:[]}],
 ['.cafe-zenith',{ghost:['Colombie','-2%','12%',.06],beans:[[3,10,110,3,.12,-30],[52,88,80,1,-.1,40]],glow:[]}],
 ['.cafe-nuit',{ghost:['Sumatra','-2%','12%',.06],beans:[[92,10,110,3,.12,25],[50,90,80,1,-.1,-35]],glow:[]}]
];
var flyItems=[];
DECO.forEach(function(d){
  var sec=$(d[0]);if(!sec)return;var sp=d[1],h='';
  (sp.glow||[]).forEach(function(g){h+='<i class="glow" style="--c:'+g[0]+';--x:'+g[1]+';--y:'+g[2]+';--s:'+g[3]+'"></i>'});
  if(sp.ghost)h+='<span class="ghost" data-fx="'+sp.ghost[3]+'" style="--x:'+sp.ghost[1]+';--y:'+sp.ghost[2]+'">'+sp.ghost[0]+'</span>';
  (sp.beans||[]).forEach(function(b,i){h+='<img src="images/opt/bean-l.webp" alt="" width="190" height="190" data-fy="'+b[4]+'" style="--x:'+b[0]+'%;--y:'+b[1]+'%;--s:'+b[2]+'px;--b:'+b[3]+'px;--r:'+b[5]+'deg;--o:'+(b[3]>4?.8:1)+'" loading="lazy" decoding="async">'});
  var el=document.createElement('div');el.className='deco';el.setAttribute('aria-hidden','true');el.innerHTML=h;
  sec.classList.add('has-deco');sec.insertBefore(el,sec.firstChild);
  flyItems.push({deco:el,items:$$('[data-fy],[data-fx]',el).map(function(n){return {el:n,fy:parseFloat(n.dataset.fy||0),fx:parseFloat(n.dataset.fx||0)}})});
});
function flyUpdate(h){
  for(var i=0;i<flyItems.length;i++){var f=flyItems[i],r=f.deco.getBoundingClientRect();if(r.bottom<-300||r.top>h+300)continue;
    var c=r.top+r.height/2-h/2;
    for(var j=0;j<f.items.length;j++){var it=f.items[j];it.el.style.transform='translate3d('+(-c*it.fx).toFixed(1)+'px,'+(-c*it.fy).toFixed(1)+'px,0)'}}
}
/* inclinaison des paquets à la souris */
$$('.cafe').forEach(function(c){var pk=$('.cafe-media.pack',c);if(!pk||!MOTION)return;
  c.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    pk.style.setProperty('--ry',(x*16).toFixed(1)+'deg');pk.style.setProperty('--rx',(-y*10).toFixed(1)+'deg')});
  c.addEventListener('pointerleave',function(){pk.style.removeProperty('--ry');pk.style.removeProperty('--rx')});
});

/* Départ */
frame();
if(MOTION){scenes.forEach(function(s){s.last=-1});frame()}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){scenes.forEach(function(s){s.last=-1});req()});
})();
