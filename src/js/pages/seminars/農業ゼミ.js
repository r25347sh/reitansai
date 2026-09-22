(function(){'use strict';
var hero=document.querySelector('.seminar-hero');
if(!hero)return;
var leaves=['🌿','🍃','🌱'];
for(var i=0;i<6;i++){var el=document.createElement('span');el.className='leaf-fx';
el.textContent=leaves[i%3];el.style.left=(10+i*15)+'%';el.style.top=(20+Math.random()*40)+'%';
el.style.animationDelay=(i*0.4)+'s';hero.appendChild(el);}
})();
