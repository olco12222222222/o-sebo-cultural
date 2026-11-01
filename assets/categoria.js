/* páginas de categoria; depende de site.js */

/* título do hero sobe letra a letra ao abrir a página */
gsap.from('.c-hero h1 .ch',{yPercent:105,rotate:8,duration:1.6,ease:'expo.out',stagger:.07,delay:.55});
gsap.from('.c-hero .meta>*,.c-hero .rolar',{y:20,opacity:0,duration:1,ease:'power3.out',stagger:.1,delay:1});

/* linhas da lista de gêneros caem em perspectiva */
ScrollTrigger.batch('.gen',{start:'top 92%',once:true,
  onEnter:els=>gsap.fromTo(els,{rotateX:-80,opacity:0,y:30},{rotateX:0,opacity:1,y:0,duration:1.2,ease:'expo.out',stagger:.07})});

/* prévia em pilha que segue o mouse, inclinando com a velocidade */
const prev=document.querySelector('.preview');
if(prev&&matchMedia('(hover:hover)').matches){
  const xTo=gsap.quickTo(prev,'x',{duration:.7,ease:'power3'}),yTo=gsap.quickTo(prev,'y',{duration:.7,ease:'power3'});
  let ultX=0,ultY=0,dentro=false;
  /* some na hora em que o mouse sai da linha, sem animação de saída */
  const some=()=>{dentro=false;gsap.killTweensOf(prev,'opacity,scale');gsap.set(prev,{opacity:0,scale:.4})};
  addEventListener('pointermove',e=>{xTo(e.clientX);yTo(e.clientY);gsap.to(prev,{rotate:clamp((e.clientX-ultX)*.8,-20,20),duration:.6,ease:'power2',overwrite:'auto'});ultX=e.clientX;ultY=e.clientY});
  /* rolar sem mexer o mouse não dispara pointerleave: confere o que ficou sob o cursor */
  addEventListener('scroll',()=>{if(dentro&&!document.elementFromPoint(ultX,ultY)?.closest('.gen'))some()},{passive:true});
  document.addEventListener('pointerleave',some);
  const arte=prev.querySelector('.arte'),nome=prev.querySelector('b');
  document.querySelectorAll('.gen').forEach((g,i)=>{
    g.addEventListener('pointerenter',()=>{
      dentro=true;
      prev.style.setProperty('--c',g.style.getPropertyValue('--c'));prev.style.setProperty('--ct',g.style.getPropertyValue('--ct')||'#F4EAD5');
      arte.className='arte a'+(i%6+1);nome.textContent=g.querySelector('.t').textContent;
      gsap.to(prev,{scale:1,opacity:1,duration:.45,ease:'back.out(1.5)'});
      gsap.fromTo(prev.querySelectorAll('.tr1,.tr2'),{rotate:0,xPercent:0},{rotate:(k)=>k?7:-9,duration:.7,ease:'back.out(2)'});
    });
    g.addEventListener('pointerleave',some);
  });
}

/* vitrine: trilho horizontal com capas curvadas em profundidade */
const vit=document.querySelector('.vitrine');
if(vit){
  const trilho=vit.querySelector('.trilho'),obras=[...trilho.children],tit=vit.querySelector('.fundo-tit'),
        idx=vit.querySelector('.idx'),barra=vit.querySelector('.barra i'),pv=prog('.vitrine'),total=String(obras.length).padStart(2,'0');
  let pos=[],foco=-1;
  const mede=()=>{pos=obras.map(o=>o.offsetLeft+o.offsetWidth/2)};
  mede();addEventListener('resize',mede);ScrollTrigger.addEventListener('refresh',mede);
  gsap.ticker.add(()=>{
    const ini=innerWidth/2-pos[0],x=ini-pv.p*(pos[pos.length-1]-pos[0]);
    trilho.style.transform=`translate3d(${x}px,0,0)`;
    let perto=0,dm=1e9;
    obras.forEach((o,i)=>{
      const d=(pos[i]+x-innerWidth/2)/innerWidth,ad=Math.abs(d);
      if(ad<dm){dm=ad;perto=i}
      o.style.transform=`translate3d(0,${d*d*160}px,${-ad*560}px) rotateY(${clamp(-d*75,-62,62)}deg)`;
      o.style.opacity=clamp(1.5-ad*1.2,.12,1);
    });
    if(perto!==foco){obras[foco]?.classList.remove('foco');obras[perto].classList.add('foco');foco=perto;if(idx)idx.textContent=String(perto+1).padStart(2,'0')+' / '+total}
    if(tit)tit.style.transform=`translate3d(${-pv.p*55}%,-50%,0)`;
    if(barra)barra.style.width=pv.p*100+'%';
  });
}

/* próxima categoria: o cartão se abre até ocupar a tela */
const prox=document.querySelector('.proxima');
if(prox){
  gsap.fromTo(prox,{clipPath:'inset(12% 7% 12% 7% round 36px)'},{clipPath:'inset(0% 0% 0% 0% round 0px)',ease:'none',scrollTrigger:{trigger:prox,start:'top bottom',end:'top 5%',scrub:true}});
  gsap.fromTo(prox.querySelectorAll('.nome .ch'),{yPercent:100},{yPercent:0,ease:'none',stagger:.06,scrollTrigger:{trigger:prox,start:'top 75%',end:'top 5%',scrub:true}});
  gsap.fromTo(prox.querySelector('.fantasma'),{rotate:-30,scale:.7},{rotate:30,scale:1.1,ease:'none',scrollTrigger:{trigger:prox,start:'top bottom',end:'bottom top',scrub:true}});
}
