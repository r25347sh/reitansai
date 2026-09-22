(function(){'use strict';
var hero=document.querySelector('.seminar-hero');
if(!hero)return;
function spark(){var s=document.createElement('div');s.className='spark';
s.style.left=(10+Math.random()*80)+'%';s.style.top=(20+Math.random()*40)+'%';
s.style.background=['#ff8f6b','#ffd060','#ffb090'][Math.floor(Math.random()*3)];
hero.appendChild(s);setTimeout(function(){s.remove();},2000);}
setInterval(spark,600);
document.querySelectorAll('.pres-card').forEach(function(c){
  c.addEventListener('mouseenter',function(){for(var i=0;i<3;i++)setTimeout(spark,i*80);});
});
})();
