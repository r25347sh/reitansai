(function(){'use strict';
var hero=document.querySelector('.seminar-hero');
if(!hero)return;
for(var i=0;i<12;i++){var d=document.createElement('div');d.className='chalk-dust';
d.style.left=(Math.random()*100)+'%';d.style.top=(Math.random()*100)+'%';
d.style.animationDelay=(Math.random()*3)+'s';hero.appendChild(d);}
})();
