(function(){
  'use strict';
  document.querySelectorAll('[data-ml-filter]').forEach(function(button){
    button.addEventListener('click',function(){
      var section=button.closest('.ml-journal');
      section.querySelectorAll('[data-ml-filter]').forEach(function(b){b.setAttribute('aria-pressed',String(b===button));});
      section.querySelectorAll('[data-ml-category]').forEach(function(card){card.hidden=button.dataset.mlFilter!=='all'&&card.dataset.mlCategory!==button.dataset.mlFilter;});
    });
  });
  document.querySelectorAll('[data-ml-copy]').forEach(function(button){
    button.addEventListener('click',async function(){
      var status=button.closest('.ml-contact-grid').querySelector('.ml-copy-status');
      try{await navigator.clipboard.writeText(button.dataset.mlCopy);status.textContent='Номер скопирован — найдите контакт в MAX.';}
      catch(_){status.textContent='Номер для MAX: +7 (918) 402-99-32';}
    });
  });
}());
