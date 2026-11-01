/* O Sebo Cultural: comportamento compartilhado */
gsap.registerPlugin(ScrollTrigger);
const reduz=matchMedia('(prefers-reduced-motion: reduce)').matches;
if('scrollRestoration' in history)history.scrollRestoration='manual';
scrollTo(0,0);

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const prog=sel=>{const o={p:0};ScrollTrigger.create({trigger:sel,start:'top top',end:'bottom bottom',scrub:true,onUpdate:s=>o.p=s.progress});return o};

/* rolagem suave */
let lenis;
if(window.Lenis&&!reduz){
  lenis=new Lenis({lerp:.09});
  lenis.on('scroll',ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const h=a.getAttribute('href');if(h.length<2)return;e.preventDefault();lenis.scrollTo(h,{duration:1.6})}));
}

/* cursor */
const cur=document.querySelector('.cursor');
/* no toque o cursor fica escondido (site.css), então nem é animado */
if(cur&&!matchMedia('(hover:none)').matches){
  const cx=gsap.quickTo(cur,'x',{duration:.25,ease:'power3'}),cy=gsap.quickTo(cur,'y',{duration:.25,ease:'power3'});
  addEventListener('pointermove',e=>{cx(e.clientX);cy(e.clientY)});
  document.addEventListener('pointerover',e=>cur.classList.toggle('big',!!e.target.closest('a,button,label,summary,[data-hover]')));
}

/* nav some ao descer, volta ao subir e nunca fica por cima de um título */
const nav=document.querySelector('.nav');let lastY=0,navPend=false;
const titulos=[...document.querySelectorAll('h1,h2,h3,.frase,.fundo-tit')].filter(t=>!t.closest('.nav,.menu'));
const sobTitulo=()=>{
  const fim=nav.offsetHeight-12,pecas=[...nav.children].filter(e=>e.offsetWidth).map(e=>e.getBoundingClientRect());
  return titulos.some(t=>{
    const r=t.getBoundingClientRect();
    if(!r.width||r.bottom<=0||r.top>=fim||!pecas.some(p=>r.left<p.right&&r.right>p.left))return false;
    const s=getComputedStyle(t);return s.visibility!=='hidden'&&+s.opacity>.15;
  });
};
addEventListener('scroll',()=>{
  if(navPend)return;navPend=true;
  requestAnimationFrame(()=>{
    navPend=false;const y=scrollY,desce=y>lastY;lastY=y;
    nav.classList.toggle('hide',!document.body.classList.contains('menu-aberto')&&((desce&&y>200)||(y>120&&sobTitulo())));
  });
});

/* menu mobile */
const menuBtn=document.querySelector('.menu-btn');
if(menuBtn)menuBtn.addEventListener('click',()=>{
  const aberto=document.body.classList.toggle('menu-aberto');
  menuBtn.textContent=aberto?'Fechar':'Menu';menuBtn.setAttribute('aria-expanded',aberto);
  if(lenis)aberto?lenis.stop():lenis.start();
  if(aberto)gsap.fromTo('.menu>a span',{yPercent:110},{yPercent:0,duration:1.1,ease:'expo.out',stagger:.06,delay:.25});
});

/* títulos letra a letra */
document.querySelectorAll('.split').forEach(el=>{
  const walk=n=>[...n.childNodes].forEach(c=>{
    if(c.nodeType===3){const f=document.createDocumentFragment();[...c.textContent].forEach(ch=>{const s=document.createElement('span');s.className='ch';s.textContent=ch===' '?' ':ch;f.appendChild(s)});c.replaceWith(f)}
    else if(c.nodeType===1&&c.tagName!=='BR')walk(c)});
  walk(el);
});

/* frases que acendem palavra a palavra */
document.querySelectorAll('.frase').forEach(f=>{
  const walk=n=>[...n.childNodes].forEach(c=>{
    if(c.nodeType===3){const fr=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;if(/^\s+$/.test(w)){fr.appendChild(document.createTextNode(' '));return}const s=document.createElement('span');s.className='w';s.textContent=w;fr.appendChild(s)});c.replaceWith(fr)}
    else if(c.nodeType===1)walk(c)});
  walk(f);
  gsap.fromTo(f.querySelectorAll('.w'),{opacity:.12,y:14},{opacity:1,y:0,stagger:.12,ease:'none',scrollTrigger:{trigger:f,start:'top 78%',end:'bottom 42%',scrub:true}});
});

/* arcos entre seções */
document.querySelectorAll('.arco').forEach(a=>gsap.fromTo(a,{scaleY:1},{scaleY:0,ease:'none',scrollTrigger:{trigger:a.closest('section,footer'),start:'top bottom',end:'top top',scrub:true}}));

/* linhas que sobem */
document.querySelectorAll('.reveal').forEach(el=>gsap.from(el.querySelectorAll('.line>span'),{yPercent:110,rotate:3,duration:1.3,ease:'expo.out',stagger:.1,scrollTrigger:{trigger:el,start:'top 85%'}}));

/* botões magnéticos */
document.querySelectorAll('[data-mag]').forEach(b=>{
  b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.35,y:(e.clientY-r.top-r.height/2)*.45,duration:.4,ease:'power3'})});
  b.addEventListener('pointerleave',()=>gsap.to(b,{x:0,y:0,duration:.8,ease:'elastic.out(1,.4)'}));
});

/* inclinação 3D com brilho que segue o mouse */
document.querySelectorAll('[data-tilt]').forEach(el=>{
  const f=+el.dataset.tilt||14;
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    gsap.to(el,{rotateY:x*f,rotateX:-y*f,duration:.5,ease:'power3'});el.style.setProperty('--mx',(x+.5)*100+'%');el.style.setProperty('--my',(y+.5)*100+'%')});
  el.addEventListener('pointerleave',()=>gsap.to(el,{rotateX:0,rotateY:0,duration:1.2,ease:'elastic.out(1,.5)'}));
});

/* cor de fundo que muda entre seções */
const temas=[...document.querySelectorAll('[data-bg]')];
if(temas.length){
  const b=document.body;
  const aplica=el=>gsap.to(b,{'--bg':el.dataset.bg,'--fg':el.dataset.fg,duration:reduz?0:.9,ease:'power2.out',overwrite:'auto'});
  b.style.setProperty('--bg',temas[0].dataset.bg);b.style.setProperty('--fg',temas[0].dataset.fg);
  temas.forEach((el,i)=>ScrollTrigger.create({trigger:el,start:'top 55%',end:'bottom 55%',onEnter:()=>aplica(el),onEnterBack:()=>aplica(el),onLeaveBack:()=>i&&aplica(temas[i-1])}));
}

/* estantes geradas: lombadas de alturas e cores variadas */
const corLomb=['#B3121D','#7E0B13','#FFC20E','#084C61','#177E89','#810B8E','#F4EAD5','#D9C7A3','#1E1412'];
document.querySelectorAll('.estante').forEach((e,k)=>{
  let s=k*7919+1234567;const rnd=()=>(s=s*16807%2147483647)/2147483647;
  const n=+e.dataset.prat||3;
  for(let p=0;p<n;p++){const prat=document.createElement('div');prat.className='prat';
    for(let i=0;i<40;i++){const l=document.createElement('i'),c=corLomb[rnd()*corLomb.length|0];l.className='lomb';
      l.style.cssText=`width:${12+rnd()*24|0}px;height:${58+rnd()*36|0}%;background:${c};color:${'#FFC20E#F4EAD5#D9C7A3'.includes(c)?'#1E1412':'#FFC20E'};--h:${40+rnd()*40|0}px`;
      if(rnd()<.05)l.style.transform=`rotate(${-6-rnd()*6|0}deg)`;prat.appendChild(l)}
    e.appendChild(prat)}
});

/* lojas: cada produto da loja online traz a etiqueta da unidade onde está */
const LOJAS_SEBO=[
  {nome:'Centro',tag:19,slug:'loja-centro',ret:'Retirar no Centro',em:'no Centro'},
  {nome:'Manaíra',tag:63,slug:'loja-manaira',ret:'Retirar em Manaíra',em:'em Manaíra'},
  {nome:'Bancários',tag:60,slug:'loja-bancarios',ret:'Retirar nos Bancários',em:'nos Bancários'}];
const lojasDe=p=>{const t=p.tags||[],l=LOJAS_SEBO.filter(l=>t.some(x=>x.id===l.tag||x.slug===l.slug)).map(l=>l.nome);return l.length?l:null};
const emLojas=nomes=>{const e=nomes.map(n=>LOJAS_SEBO.find(l=>l.nome===n)?.em).filter(Boolean);return e.length>1?e.slice(0,-1).join(', ')+' e '+e.at(-1):e[0]||''};

/* sacola: itens guardados no aparelho; o pedido fecha pelo WhatsApp ou no caixa do site (demonstração) */
const WHATS='5583986500540';
const brl=c=>(c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const sacola=(()=>{
  const K='sebo-sacola';let itens=[];
  try{itens=JSON.parse(localStorage.getItem(K))||[]}catch(e){}
  const g=document.createElement('aside');g.className='sacola';g.setAttribute('aria-hidden','true');
  g.innerHTML=`<div class="sc-fundo" data-fecha></div>
    <div class="sc-painel" role="dialog" aria-modal="true" aria-labelledby="sc-tit">
      <div class="sc-corpo">
        <div class="sc-topo"><h2 id="sc-tit">Sacola</h2><button class="sc-x" type="button" data-fecha aria-label="Fechar sacola">×</button></div>
        <ul class="sc-lista" data-lenis-prevent></ul>
        <div class="sc-vazia"><p>Nada aqui ainda.</p><a class="pill" href="acervo.html"><i></i>Explorar o acervo</a></div>
        <div class="sc-pe">
          <fieldset class="sc-receber"><legend class="label">Como receber</legend><div class="sc-opcoes"></div><p class="sc-nota" hidden></p></fieldset>
          <div class="sc-total"><span class="label">Total</span><b></b></div>
          <div class="sc-botoes">
            <a class="pill sc-fim" target="_blank" rel="noopener"><i></i>Finalizar pelo WhatsApp</a>
            <button class="pill sc-site" type="button"><i></i>Pagar no site · cartão ou Pix</button>
          </div>
        </div>
      </div>
      <section class="sc-caixa" aria-labelledby="cx-tit" inert>
        <div class="cx-topo"><button class="cx-volta" type="button" aria-label="Voltar para a sacola">←</button><h2 id="cx-tit">Pagamento</h2><span class="cx-demo">Demonstração</span></div>
        <div class="cx-rolo" data-lenis-prevent>
          <div class="cx-resumo"><span class="label">Seu pedido</span><ul></ul><p class="cx-rec"></p><div class="cx-soma"><span>Total</span><b></b></div></div>
          <form class="cx-form" novalidate>
            <fieldset class="cx-grupo"><legend class="label">Seus dados</legend>
              <label class="cx-campo"><span>Nome</span><input autocomplete="off" data-req="nome"></label>
              <label class="cx-campo"><span>WhatsApp</span><input type="tel" inputmode="tel" autocomplete="off" placeholder="(83) 9 0000-0000" data-req="tel" data-mask="tel"></label>
              <label class="cx-campo cx-end" hidden><span>Endereço de entrega</span><input autocomplete="off" placeholder="Rua, número e bairro" data-req="end"></label>
            </fieldset>
            <div class="cx-abas" role="tablist" aria-label="Forma de pagamento">
              <button type="button" role="tab" id="cx-aba-pix" aria-controls="cx-pix" aria-selected="true" data-aba="pix">Pix</button>
              <button type="button" role="tab" id="cx-aba-cartao" aria-controls="cx-cartao" aria-selected="false" data-aba="cartao" tabindex="-1">Cartão</button>
            </div>
            <div class="cx-pix" id="cx-pix" role="tabpanel" aria-labelledby="cx-aba-pix">
              <div class="cx-qr" aria-hidden="true"></div>
              <div class="cx-cola"><span class="label">Pix copia e cola</span><code></code><button class="cx-copia" type="button">Copiar código</button></div>
            </div>
            <div class="cx-cartao" id="cx-cartao" role="tabpanel" aria-labelledby="cx-aba-cartao" hidden>
              <div class="cx-plastico" aria-hidden="true"><span class="cx-chip"></span><b>•••• •••• •••• ••••</b><small><span>NOME NO CARTÃO</span><span>MM/AA</span></small></div>
              <label class="cx-campo"><span>Número do cartão</span><input inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" data-req="cartao" data-mask="cartao"></label>
              <div class="cx-dupla">
                <label class="cx-campo"><span>Validade</span><input inputmode="numeric" autocomplete="off" placeholder="MM/AA" data-req="val" data-mask="val"></label>
                <label class="cx-campo"><span>CVV</span><input inputmode="numeric" autocomplete="off" placeholder="123" data-req="cvv" data-mask="cvv"></label>
              </div>
              <label class="cx-campo"><span>Nome impresso no cartão</span><input autocomplete="off" data-req="nomecartao" data-mask="maiusc"></label>
              <label class="cx-campo"><span>Parcelas</span><select class="cx-parc"></select></label>
            </div>
            <p class="cx-aviso">Modo demonstração: nada é cobrado e nenhum dado sai do seu aparelho.</p>
            <button class="pill cx-pagar" type="submit"><i></i><span>Já fiz o Pix</span></button>
          </form>
        </div>
        <div class="cx-ok" hidden>
          <span class="cx-check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></span>
          <h3 tabindex="-1">Pedido recebido.</h3>
          <p class="cx-num"></p>
          <p class="cx-ok-txt"></p>
          <p class="label">Demonstração: nenhum pagamento foi feito.</p>
          <div class="cx-ok-acoes"><a class="pill" href="acervo.html"><i></i>Voltar ao acervo</a><button class="pill pill-claro" type="button" data-fecha><i></i>Fechar</button></div>
        </div>
      </section>
    </div>`;
  document.body.appendChild(g);
  const $=s=>g.querySelector(s);
  const corpo=$('.sc-corpo'),caixa=$('.sc-caixa'),lista=$('.sc-lista'),opc=$('.sc-opcoes'),nota=$('.sc-nota'),tot=$('.sc-total b'),fim=$('.sc-fim'),
        form=$('.cx-form'),pagar=$('.cx-pagar'),ok=$('.cx-ok'),rolo=$('.cx-rolo');
  const soma=()=>itens.reduce((s,i)=>s+i.preco,0);
  const recebe=()=>g.querySelector('input[name=receber]:checked')?.value||'Entrega';

  /* onde retirar: só as lojas que têm os itens; a entrega vale sempre */
  const opcoes=()=>{
    const n=itens.length,sabidos=itens.filter(i=>i.lojas?.length);
    let ops,aviso='';
    if(!sabidos.length){ops=LOJAS_SEBO.map(l=>({v:l.ret,obs:''}));if(n)aviso='A loja de cada item é confirmada pelo atendimento.'}
    else{
      const c=LOJAS_SEBO.map(l=>({l,c:itens.filter(i=>i.lojas?.includes(l.nome)).length})).filter(o=>o.c).sort((a,b)=>b.c-a.c);
      ops=c.map(o=>({v:o.l.ret,obs:o.c===n?(n>1?'todos os itens':''):`${o.c} de ${n} itens`}));
      if(!c.some(o=>o.c===n))aviso=sabidos.length<n?'Alguns itens ainda não têm loja marcada. Confirmamos pelo atendimento.':'Os itens estão em lojas diferentes. Escolha onde retirar e combinamos o resto.';
    }
    ops.push({v:'Entrega',obs:'no seu endereço'});
    return {ops,aviso};
  };

  const mensagem=()=>'Olá. Quero finalizar esse pedido, produtos:\n'+itens.map((i,k)=>`${k+1}. ${i.nome}, ${brl(i.preco)}, cód. ${i.cod}`).join('\n')+`\n\nTotal: ${brl(soma())}\n${recebe()}`;
  /* só o que depende da escolha de entrega: link do WhatsApp e resumo do caixa */
  const atualiza=()=>{
    tot.textContent=brl(soma());
    fim.href='https://wa.me/'+WHATS+'?text='+encodeURIComponent(mensagem());
    const r=recebe(),ent=r==='Entrega';
    $('.cx-end').hidden=!ent;
    $('.cx-rec').textContent=ent?'Entrega no seu endereço':r;
    $('.cx-soma b').textContent=brl(soma());
    $('.cx-resumo ul').replaceChildren(...itens.map(i=>{const li=document.createElement('li'),b=document.createElement('span'),v=document.createElement('span');b.textContent=i.nome;v.textContent=brl(i.preco);li.append(b,v);return li}));
    parcelas();
    if(aba==='cartao')pagar.lastChild.textContent='Pagar '+brl(soma());
  };
  const desenha=()=>{
    document.querySelectorAll('[data-conta]').forEach(n=>n.textContent=itens.length);
    g.classList.toggle('vazia',!itens.length);
    lista.replaceChildren(...itens.map(it=>{
      const li=document.createElement('li'),im=document.createElement('img'),tx=document.createElement('div'),b=document.createElement('b'),s=document.createElement('span'),d=document.createElement('small'),x=document.createElement('button');
      im.alt='';im.loading='lazy';if(it.img)im.src=it.img;
      b.textContent=it.nome;s.textContent=(it.autor?it.autor+' · ':'')+brl(it.preco);
      d.textContent=it.lojas?.length?'Disponível '+emLojas(it.lojas):'Loja a confirmar';d.classList.toggle('sabido',!!it.lojas?.length);
      tx.append(b,s,d);
      x.type='button';x.textContent='×';x.setAttribute('aria-label','Tirar '+it.nome+' da sacola');x.onclick=()=>tira(it.id);
      li.append(im,tx,x);return li}));
    const marcado=g.querySelector('input[name=receber]:checked')?.value,{ops,aviso}=opcoes(),fica=ops.some(o=>o.v===marcado)?marcado:ops[0].v;
    opc.replaceChildren(...ops.map(o=>{
      const l=document.createElement('label'),r=document.createElement('input'),s=document.createElement('span');
      r.type='radio';r.name='receber';r.value=o.v;r.checked=o.v===fica;
      s.textContent=o.v;if(o.obs){const m=document.createElement('small');m.textContent=o.obs;s.append(m)}
      l.append(r,s);return l}));
    nota.textContent=aviso;nota.hidden=!aviso;
    atualiza();
    dispatchEvent(new Event('sacola'));
  };
  const salva=()=>{try{localStorage.setItem(K,JSON.stringify(itens))}catch(e){}desenha()};
  const tira=id=>{itens=itens.filter(i=>i.id!==id);salva()};
  const poe=it=>{if(!itens.some(i=>i.id===it.id)){itens.push(it);salva()}};

  /* ---------- caixa do site (demonstração: nada é enviado nem cobrado) ---------- */
  let aba='pix',pedido='';
  const parcelas=()=>{const s=$('.cx-parc'),v=soma(),k=s.value;s.replaceChildren(...[1,2,3].map(n=>{const o=document.createElement('option');o.value=n;o.textContent=n===1?`À vista, ${brl(v)}`:`${n}x de ${brl(Math.ceil(v/n))} sem juros`;return o}));if(k)s.value=k};
  const qr=semente=>{
    let s=[...semente].reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7);const rnd=()=>(s=s*1103515245+12345>>>0)/4294967296;
    const N=29,olho=(x,y)=>`<path d="M${x} ${y}h7v7h-7z M${x+1} ${y+1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x+2}" y="${y+2}" width="3" height="3"/>`;
    let m='';for(let y=0;y<N;y++)for(let x=0;x<N;x++){const canto=(x<8&&y<8)||(x>N-9&&y<8)||(x<8&&y>N-9);if(!canto&&rnd()<.48)m+=`M${x} ${y}h1v1h-1z`}
    return `<svg viewBox="-2 -2 ${N+4} ${N+4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${N+4}" height="${N+4}" fill="#fff"/><g fill="#1E1412">${olho(0,0)}${olho(N-7,0)}${olho(0,N-7)}<path d="${m}"/></g></svg>`;
  };
  const trocaAba=a=>{
    aba=a;
    g.querySelectorAll('[data-aba]').forEach(b=>{const on=b.dataset.aba===a;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1});
    $('.cx-pix').hidden=a!=='pix';$('.cx-cartao').hidden=a!=='cartao';
    pagar.lastChild.textContent=a==='pix'?'Já fiz o Pix':'Pagar '+brl(soma());
    form.querySelectorAll('.erro').forEach(c=>c.classList.remove('erro'));
  };
  const abreCaixa=()=>{
    if(!itens.length)return;
    pedido='SC-'+String(Date.now()%100000).padStart(5,'0');
    const cod=`00020126BR.GOV.BCB.PIX.DEMO.${pedido}52040000530398654${String(soma()/100).replace('.',',')}5802BR5916O SEBO CULTURAL6011JOAO PESSOA6304DEMO`;
    $('.cx-qr').innerHTML=qr(pedido);$('.cx-cola code').textContent=cod;$('.cx-copia').textContent='Copiar código';
    rolo.hidden=false;ok.hidden=true;pagar.disabled=false;trocaAba(aba);rolo.scrollTop=0;
    g.classList.add('pagando');corpo.inert=true;caixa.inert=false;
    setTimeout(()=>$('.cx-volta').focus(),400);
  };
  const fechaCaixa=foco=>{g.classList.remove('pagando');corpo.inert=false;caixa.inert=true;if(foco)setTimeout(()=>$('.sc-site').focus(),300)};
  $('.sc-site').addEventListener('click',abreCaixa);
  $('.cx-volta').addEventListener('click',()=>fechaCaixa(true));
  g.querySelectorAll('[data-aba]').forEach(b=>b.addEventListener('click',()=>trocaAba(b.dataset.aba)));
  $('.cx-abas').addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;const n=aba==='pix'?'cartao':'pix';trocaAba(n);g.querySelector(`[data-aba="${n}"]`).focus()});
  $('.cx-copia').addEventListener('click',e=>{const t=$('.cx-cola code').textContent;navigator.clipboard?.writeText(t).catch(()=>{});e.currentTarget.textContent='Código copiado'});

  /* máscaras simples nos campos */
  const MASC={
    tel:v=>{v=v.replace(/\D/g,'').slice(0,11);return v.length<3?v:v.length<8?`(${v.slice(0,2)}) ${v.slice(2)}`:`(${v.slice(0,2)}) ${v.slice(2,v.length-4)}-${v.slice(-4)}`},
    cartao:v=>v.replace(/\D/g,'').slice(0,19).replace(/(\d{4})(?=\d)/g,'$1 '),
    val:v=>{v=v.replace(/\D/g,'').slice(0,4);return v.length>2?v.slice(0,2)+'/'+v.slice(2):v},
    cvv:v=>v.replace(/\D/g,'').slice(0,4),
    maiusc:v=>v.toUpperCase()
  };
  const plastico=$('.cx-plastico');
  form.addEventListener('input',e=>{
    const i=e.target,m=i.dataset.mask;if(m&&MASC[m])i.value=MASC[m](i.value);
    i.closest('.cx-campo')?.classList.remove('erro');
    if(i.dataset.req==='cartao'){const t='•••• •••• •••• ••••';plastico.querySelector('b').textContent=i.value.length>=t.length?i.value:i.value+t.slice(i.value.length)}
    if(i.dataset.req==='nomecartao')plastico.querySelector('small span').textContent=i.value||'NOME NO CARTÃO';
    if(i.dataset.req==='val')plastico.querySelector('small span+span').textContent=i.value||'MM/AA';
  });
  const valido={
    nome:v=>v.trim().length>2,tel:v=>v.replace(/\D/g,'').length>=10,end:v=>v.trim().length>5,
    cartao:v=>{const d=v.replace(/\D/g,'');return d.length>=13&&d.length<=19},
    val:v=>{const m=v.match(/^(\d\d)\/(\d\d)$/);return !!m&&+m[1]>=1&&+m[1]<=12},
    cvv:v=>/^\d{3,4}$/.test(v),nomecartao:v=>v.trim().length>2
  };
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const ruins=[...form.querySelectorAll('[data-req]')].filter(i=>!i.closest('[hidden]')&&!valido[i.dataset.req](i.value));
    form.querySelectorAll('.cx-campo').forEach(c=>c.classList.remove('erro'));
    if(ruins.length){ruins.forEach(i=>i.closest('.cx-campo').classList.add('erro'));ruins[0].focus();return}
    pagar.disabled=true;pagar.lastChild.textContent='Processando…';
    setTimeout(()=>{
      const r=recebe(),nome=form.querySelector('[data-req=nome]').value.trim().split(' ')[0];
      $('.cx-num').textContent='Pedido '+pedido;
      $('.cx-ok-txt').textContent=`Obrigado, ${nome}. `+(r==='Entrega'?'Vamos combinar a entrega pelo WhatsApp.':`Seu pedido fica separado para ${r.replace('Retirar','retirar')}.`);
      rolo.hidden=true;ok.hidden=false;
      if(!reduz)gsap.fromTo(ok.children,{y:24,opacity:0},{y:0,opacity:1,duration:.8,ease:'expo.out',stagger:.06});
      ok.querySelector('h3').focus();
      form.reset();plastico.querySelector('b').textContent='•••• •••• •••• ••••';plastico.querySelector('small').innerHTML='<span>NOME NO CARTÃO</span><span>MM/AA</span>';
      itens=[];salva();
    },reduz?300:1400);
  });

  let antes=null;
  const abre=()=>{antes=document.activeElement;document.body.classList.add('sacola-aberta');g.setAttribute('aria-hidden','false');lenis?.stop();setTimeout(()=>$('.sc-x').focus(),300);
    if(!reduz)gsap.fromTo(lista.children,{x:60,opacity:0},{x:0,opacity:1,duration:.8,ease:'expo.out',stagger:.05,delay:.25})};
  const fecha=()=>{if(!document.body.classList.contains('sacola-aberta'))return;document.body.classList.remove('sacola-aberta');g.setAttribute('aria-hidden','true');lenis?.start();antes?.focus?.();
    setTimeout(()=>{fechaCaixa(false);g.classList.toggle('vazia',!itens.length)},800)};
  g.addEventListener('click',e=>{if(e.target.closest('[data-fecha]'))fecha()});
  opc.addEventListener('change',atualiza);
  addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(g.classList.contains('pagando')&&ok.hidden)fechaCaixa(true);else fecha()});
  document.addEventListener('click',e=>{if(e.target.closest('[data-sacola]'))abre()});
  addEventListener('storage',e=>{if(e.key===K){try{itens=JSON.parse(e.newValue)||[]}catch(_){}desenha()}});
  desenha();
  /* alterna: põe se não está, tira se já está; devolve true quando o item entrou */
  const alterna=it=>{if(itens.some(i=>i.id===it.id)){tira(it.id);return false}poe(it);return true};
  return{tem:id=>itens.some(i=>i.id===id),poe,tira,alterna,abre,fecha};
})();

/* transição entre páginas: a cortina cobre a tela com a cor do destino */
const PAGINAS={
  'index.html':['O Sebo','#B3121D','#FFC20E'],
  'acervo.html':['Acervo','#1E1412','#FFC20E'],
  'livros.html':['Livros','#B3121D','#FFC20E'],
  'gibis.html':['Gibis','#084C61','#FFC20E'],
  'vinis.html':['Vinis','#1E1412','#F4EAD5'],
  'cds.html':['CDs','#177E89','#F4EAD5'],
  'dvds.html':['DVDs','#810B8E','#FFC20E'],
  'contato.html':['Contato','#FFC20E','#7E0B13'],
  'politicas.html':['Políticas','#F4EAD5','#B3121D']
};
const cortina=document.querySelector('.cortina');
const paginaDe=href=>PAGINAS[href.split(/[?#]/)[0]];
const vaiPara=href=>{
  const pag=paginaDe(href);
  if(!pag||!cortina){location.href=href;return}
  cortina.querySelector('b').textContent=pag[0];
  cortina.style.background=pag[1];cortina.style.color=pag[2];
  cortina.classList.remove('entra');void cortina.offsetWidth;cortina.classList.add('entra');
  setTimeout(()=>location.href=href,reduz?0:760);
};
document.querySelectorAll('a[href]').forEach(a=>{
  const href=a.getAttribute('href');
  if(!paginaDe(href)||!cortina)return;
  a.addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
    e.preventDefault();vaiPara(href);
  });
});
addEventListener('pageshow',e=>{if(e.persisted&&cortina)cortina.classList.remove('entra')});

/* chegou com âncora (ex.: livros.html?q=machado#produtos): pula direto para ela */
const ancora=location.hash.length>1&&document.getElementById(decodeURIComponent(location.hash.slice(1)));
addEventListener('load',()=>{
  ScrollTrigger.refresh();
  if(ancora)requestAnimationFrame(()=>lenis?lenis.scrollTo(ancora,{immediate:true,force:true}):ancora.scrollIntoView());
});
