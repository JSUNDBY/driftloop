// LoopPatch — generic patch save/share store. No deps, browser-only.
// Stores/encodes arbitrary JSON-serializable objects; knows nothing about app state.
(function(){
  "use strict";
  const LS_KEY="loopstation:patches";

  function encode(obj){
    try{
      const json=JSON.stringify(obj);
      let b64=btoa(unescape(encodeURIComponent(json)));         // utf-8 safe
      return b64.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");  // url-safe
    }catch(e){ return ""; }
  }
  function decode(str){
    try{
      if(!str) return null;
      let b=str.replace(/-/g,"+").replace(/_/g,"/");
      while(b.length%4) b+="=";                                  // re-pad
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    }catch(e){ return null; }
  }
  function shareURL(obj){ return location.origin+location.pathname+"#p="+encode(obj); }
  function readURL(){
    try{
      const h=location.hash||""; const m=h.match(/[#&]p=([^&]+)/);
      return m ? decode(m[1]) : null;
    }catch(e){ return null; }
  }
  function copyShare(obj){
    const url=shareURL(obj);
    return new Promise(res=>{
      try{
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(()=>res(url),()=>res(url)); return; }
      }catch(e){}
      try{ const ta=document.createElement("textarea"); ta.value=url; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }catch(e){}
      res(url);
    });
  }
  function readStore(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||"{}")||{}; }catch(e){ return {}; } }
  function writeStore(o){ try{ localStorage.setItem(LS_KEY,JSON.stringify(o)); }catch(e){} }
  function save(name,obj){ const s=readStore(); s[name]=obj; writeStore(s); }
  function list(){ try{ return Object.keys(readStore()); }catch(e){ return []; } }
  function load(name){ const s=readStore(); return Object.prototype.hasOwnProperty.call(s,name)?s[name]:null; }
  function remove(name){ const s=readStore(); delete s[name]; writeStore(s); }

  window.LoopPatch={ encode, decode, shareURL, readURL, copyShare, save, list, load, remove };
})();
