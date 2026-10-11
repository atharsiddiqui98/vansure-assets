
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
