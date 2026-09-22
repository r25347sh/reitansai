(function(){'use strict';
var hero=document.querySelector('.seminar-hero');
if(hero&&!hero.querySelector('.noise-overlay')){
  var n=document.createElement('div');n.className='noise-overlay';hero.appendChild(n);
}
})();
