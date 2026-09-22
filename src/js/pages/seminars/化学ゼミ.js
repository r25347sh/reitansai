(function(){'use strict';
var hero=document.querySelector('.seminar-hero');
if(hero){for(var i=0;i<14;i++){var b=document.createElement('div');b.className='bubble';
var size=8+Math.random()*28;b.style.width=size+'px';b.style.height=size+'px';
b.style.left=(5+Math.random()*90)+'%';b.style.bottom=(Math.random()*40)+'%';
b.style.animationDelay=(Math.random()*5)+'s';b.style.animationDuration=(3.5+Math.random()*4)+'s';
hero.appendChild(b);}}
})();
