(function(){'use strict';
var hero=document.querySelector('.seminar-hero');
if(hero){for(var i=0;i<4;i++){var b=document.createElement('div');b.className='ink-blot';
b.style.left=(10+Math.random()*70)+'%';b.style.top=(20+Math.random()*50)+'%';
b.style.width=(30+Math.random()*40)+'px';b.style.height=(30+Math.random()*40)+'px';
hero.appendChild(b);}}
})();
