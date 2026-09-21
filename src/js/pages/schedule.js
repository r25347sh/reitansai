(function(){
'use strict';
var data = window.SCHEDULE_ALL || [];
var body = document.getElementById('sched-body');
var q = document.getElementById('q');
var fS = document.getElementById('f-seminar');
var fV = document.getElementById('f-venue');
var fF = document.getElementById('f-form');
var fT = document.getElementById('f-time');
var countEl = document.getElementById('result-count');
var sortKey = 't';
var sortAsc = true;
function uniq(arr){
  var o={}; arr.forEach(function(x){ if(x) o[x]=1; });
  return Object.keys(o).sort();
}
unig = uniq;
unig(data.map(function(r){return r.s;})).forEach(function(s){
  var o=document.createElement('option'); o.value=s; o.textContent=s; fS.appendChild(o);
});
unig(data.map(function(r){return r.v;})).forEach(function(v){
  var o=document.createElement('option'); o.value=v; o.textContent=v; fV.appendChild(o);
});
unig(data.map(function(r){return r.form;})).forEach(function(f){
  if(!f) return;
  var o=document.createElement('option'); o.value=f; o.textContent=f; fF.appendChild(o);
});
function timeHour(t){
  var m = String(t||'').match(/(\d{1,2})/);
  return m ? parseInt(m[1],10) : -1;
}
function filtered(){
  var qq = (q.value||'').trim().toLowerCase();
  var ss = fS.value, vv = fV.value, ff = fF.value, th = fT.value;
  return data.filter(function(r){
    if(ss && r.s !== ss) return false;
    if(vv && r.v !== vv) return false;
    if(ff && r.form !== ff) return false;
    if(th){
      var h = timeHour(r.t);
      if(String(h) !== th) return false;
    }
    if(qq){
      var hay = (r.title+' '+r.sp+' '+r.s+' '+r.v+' '+r.form).toLowerCase();
      if(hay.indexOf(qq)<0) return false;
    }
    return true;
  });
}
function sortRows(rows){
  rows = rows.slice();
  rows.sort(function(a,b){
    var av = a[sortKey]||'', bv = b[sortKey]||'';
    if(sortKey==='t'){
      av = timeHour(a.t)*100 + (parseInt((String(a.t).match(/:(\d+)/)||[])[1]||0,10));
      bv = timeHour(b.t)*100 + (parseInt((String(b.t).match(/:(\d+)/)||[])[1]||0,10));
      return sortAsc ? av-bv : bv-av;
    }
    av = String(av); bv = String(bv);
    if(av<bv) return sortAsc?-1:1;
    if(av>bv) return sortAsc?1:-1;
    return 0;
  });
  return rows;
}
function esc(s){ var d=document.createElement('div'); d.textContent=s==null?'':String(s); return d.innerHTML; }
function render(){
  var rows = sortRows(filtered());
  countEl.textContent = String(rows.length);
  body.innerHTML = rows.map(function(r){
    var venue = r.vn ? r.v+' / '+r.vn : r.v;
    return '<tr><td class="t-time">'+esc(r.t)+'</td><td class="t-seminar">'+esc(r.s)+'</td><td class="t-title">'+esc(r.title)+'</td><td class="t-sp">'+esc(r.sp)+'</td><td class="t-form">'+esc(r.form)+'</td><td class="t-venue">'+esc(venue)+'</td></tr>';
  }).join('');
}
[q,fS,fV,fF,fT].forEach(function(el){ el.addEventListener('input', render); el.addEventListener('change', render); });
document.querySelectorAll('.sched-table th[data-sort]').forEach(function(th){
  th.addEventListener('click', function(){
    var k = th.getAttribute('data-sort');
    if(sortKey===k) sortAsc=!sortAsc; else { sortKey=k; sortAsc=true; }
    render();
  });
});
render();
})();
