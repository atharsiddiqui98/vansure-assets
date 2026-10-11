
/* Vansure motion preset (GSAP): hero entrance, Vee stage entrance, section reveals, card stagger. The key-phrase shimmer is CSS. Pages call window.vp2Motion() after GSAP loads; it does nothing when GSAP is missing or reduced motion is requested. */
window.vp2Motion=function(){

if(!window.gsap||!window.ScrollTrigger)return;
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
gsap.registerPlugin(ScrollTrigger);
var E='power3.out',R='.vp2 ';
gsap.from(R+'.vp2-hero .vp2-pill,'+R+'.vp2-h1,'+R+'.vp2-lead,'+R+'.vp2-btns,'+R+'.vp2-ticks',{y:24,autoAlpha:0,duration:.7,stagger:.09,ease:E});
gsap.fromTo(R+'.vp2-hl',{'--u':0},{'--u':1,duration:.8,delay:.7,ease:E});
gsap.from(R+'.vp2-stage',{autoAlpha:0,scale:.92,x:40,duration:1,delay:.25,ease:E});
gsap.utils.toArray(R+'.vp2-eye,'+R+'.vp2-h2,'+R+'.vp2-sub,'+R+'.vp2-call,'+R+'.vp2-close,'+R+'.vp2-panel,'+R+'.vp2-form,'+R+'.vp2-pills,'+R+'.vp2-cmp,'+R+'.vp2-note').forEach(function(x){gsap.from(x,{y:22,autoAlpha:0,duration:.6,ease:E,scrollTrigger:{trigger:x,start:'top 90%',once:true}})});
gsap.utils.toArray(R+'.vp2-cards,'+R+'.vp2-rows,'+R+'.vp2-steps,'+R+'.vp2-list,'+R+'.vp2-num').forEach(function(g){gsap.from(g.children,{y:26,autoAlpha:0,duration:.6,stagger:.07,ease:E,scrollTrigger:{trigger:g,start:'top 88%',once:true}})});
window.addEventListener('load',function(){ScrollTrigger.refresh()});
};

/* Page helpers. Partners pages: sticky mobile CTA and partner events. Tools hub: tool events. Events go to gtag when it exists, otherwise to window.dataLayer. No analytics library is loaded here and no form values are ever sent. */
(function(){
function ready(f){if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',f)}else{f()}}
function send(name,p){try{if(typeof window.gtag==='function'){window.gtag('event',name,p)}else{window.dataLayer=window.dataLayer||[];p.event=name;window.dataLayer.push(p)}}catch(e){}}
ready(function(){
var root=document.querySelector('.vp2');if(!root)return;
if(root.getAttribute('data-hub')==='tools'){tools(root);return}
if(location.pathname.indexOf('/partners')!==0)return;
var m=/^\/partners-([a-z-]+)/.exec(location.pathname),ptype=m?m[1]:'main';
function track(name,p){p=p||{};p.partner_type=p.partner_type||ptype;send(name,p)}
window.vp2Track=track;
track('partner_page_view');
var hero=root.querySelector('.vp2-hero'),heroCta=root.querySelector('.vp2-hero .vp2-a'),target=root.querySelector('.vp2-form')||root.querySelector('.vp2-close');
if(hero&&heroCta&&target){
var s=document.createElement('a');s.className='vp2-sticky';s.href=heroCta.getAttribute('href');s.textContent='Become a Vansure Partner';s.setAttribute('data-vp2-cta','sticky');root.appendChild(s);
var tick=false;function upd(){tick=false;var on=hero.getBoundingClientRect().bottom<0&&target.getBoundingClientRect().top>window.innerHeight;s.classList.toggle('vp2-on',on);if(on){s.removeAttribute('tabindex');s.removeAttribute('aria-hidden')}else{s.setAttribute('tabindex','-1');s.setAttribute('aria-hidden','true')}}
function req(){if(!tick){tick=true;window.requestAnimationFrame(upd)}}
window.addEventListener('scroll',req,{passive:true});window.addEventListener('resize',req);upd();
}
root.addEventListener('click',function(ev){
var a=ev.target.closest?ev.target.closest('a'):null;if(!a||!root.contains(a))return;
var h=a.getAttribute('href')||'';
if(/-calculator|^\/tools/.test(h)){track('partner_tool_click',{tool:h.replace(/^\//,'')});return}
if(a.classList.contains('vp2-a')||a.classList.contains('vp2-sticky')){var loc=a.getAttribute('data-vp2-cta')||(a.closest('.vp2-hero')?'hero':a.closest('.vp2-close')?'closing':'page');track('partner_cta_click',{cta_location:loc})}
});
var form=document.getElementById('vpt-form'),done=document.getElementById('vpt-done'),sel=document.getElementById('vpt-type');
function ft(){return sel&&sel.value?sel.value:ptype}
if(form){var started=false;form.addEventListener('focusin',function(){if(!started){started=true;track('partner_form_start',{partner_type:ft()})}})}
if(done&&window.MutationObserver){var sent=false;new MutationObserver(function(){if(!sent&&done.style.display==='block'){sent=true;track('partner_form_submit',{partner_type:ft()})}}).observe(done,{attributes:true,attributeFilter:['style']})}
});
/* Tools hub: which tool was opened and from where, plus quote and advisor button clicks. */
function tools(root){
root.addEventListener('click',function(ev){
var a=ev.target.closest?ev.target.closest('a'):null;if(!a||!root.contains(a))return;
var sec=a.closest('[data-sec]'),loc=sec?sec.getAttribute('data-sec'):'page',kind=a.getAttribute('data-cta'),tool=a.getAttribute('data-tool');
if(kind==='quote'){send('tool_quote_cta_click',{cta_location:loc,page_path:location.pathname})}
else if(kind==='advisor'){send('tool_advisor_cta_click',{cta_location:loc,page_path:location.pathname})}
else if(tool){var cat=a.closest('[data-cat]');send('tool_open',{tool_name:tool,tool_category:cat?cat.getAttribute('data-cat'):'',cta_location:loc,page_path:location.pathname})}
});
}
})();
