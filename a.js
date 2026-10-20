(function(){var S='a[data-cat]',P="/_p/",fatte={};
function sonda(a){var c=a.getAttribute('data-cat')||'altro',k=c+'|'+a.href,now=Date.now();
 if(fatte[k]&&now-fatte[k].t<3000)return fatte[k].f;
 var f=null;try{f=document.createElement('iframe');f.style.display='none';f.src=P+c+'/';document.body.appendChild(f);
  setTimeout(function(){try{f.remove()}catch(e){}},10000)}catch(e){}
 fatte[k]={t:now,f:f};return f}
function partita(f){try{return f.contentWindow.performance.getEntriesByType('resource').some(function(r){return r.name.indexOf('/cdn-cgi/rum')>-1})}catch(e){return false}}
document.addEventListener('pointerdown',function(ev){var a=ev.target.closest(S);if(a)sonda(a)},true);
document.addEventListener('click',function(ev){var a=ev.target.closest(S);if(!a)return;var f=sonda(a);
 if(!f||(window.matchMedia&&matchMedia('(pointer:fine)').matches)||ev.metaKey||ev.ctrlKey||ev.shiftKey)return;
 ev.preventDefault();var u=a.href,t0=Date.now(),via=false;
 function vai(){if(via)return;via=true;location.href=u}
 (function guarda(){if(partita(f)||Date.now()-t0>450)return setTimeout(vai,60);setTimeout(guarda,50)})()});
})();
(function(){var i=document.getElementById('q'),r=document.getElementById('ris'),f=document.getElementById('fq'),D=null;
if(!i)return;function carica(cb){if(D)return cb();fetch('/indice.json').then(function(x){return x.json()}).then(function(j){D=j;cb()})}
function n(s){return(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function trova(){var q=n(i.value.trim());if(q.length<2){r.style.display='none';return[]}
var p=q.split(/\s+/);return D.filter(function(x){var t=n(x.n+' '+x.c);return p.every(function(w){return t.indexOf(w)>-1})})}
i.addEventListener('input',function(){carica(function(){var o=trova();if(!i.value.trim()||i.value.trim().length<2)return;
r.innerHTML=o.length?o.slice(0,40).map(function(x){return '<a href="'+x.u+'">'+x.n.replace(/</g,'&lt;')+'<small>'+x.c+'</small></a>'}).join(''):'<a>Nessun risultato: prova con un\'altra parola</a>';
r.style.display='block'})});
f.addEventListener('submit',function(ev){ev.preventDefault();carica(function(){var o=trova();if(o.length)location.href=o[0].u})});
document.addEventListener('click',function(ev){if(!f.contains(ev.target))r.style.display='none'})})();