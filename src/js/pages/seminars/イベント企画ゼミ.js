(function(){'use strict';
var hero=document.querySelector('.seminar-hero');
if(!hero)return;
var colors=['#f0c040','#ff8f6b','#5ec8c8','#a78bfa','#e07098'];
function confetti(){var c=document.createElement('div');c.className='confetti';
c.style.left=(Math.random()*100)+'%';c.style.top='10%';
c.style.background=colors[Math.floor(Math.random()*colors.length)];
c.style.animationDuration=(1.5+Math.random()*1.5)+'s';
c.style.animationDelay=(Math.random()*0.5)+'s';
hero.appendChild(c);setTimeout(function(){c.remove();},3000);}
setInterval(confetti,400);
})();
