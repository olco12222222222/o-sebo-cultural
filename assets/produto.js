/* página do produto: fotos, preço e em quais lojas o item está; depende de site.js */
(()=>{
const pp=document.querySelector('.pp');if(!pp)return;

const API=window.SEBO_API||'https://lojasebocultural.com.br/wp-json/wc/store/v1';
const MESMA=new URL(API,location.href).origin===location.origin;
const SITE='https://lojasebocultural.com.br/';

const TIPOS={
  livro:{pag:'livros.html',nome:'Livros',cat:17,cor:'#B3121D',destaque:'#FFC20E',ar:'2/3'},
  gibi:{pag:'gibis.html',nome:'Gibis',cat:88,cor:'#084C61',destaque:'#FFC20E',ar:'2/3'},
  lp:{pag:'vinis.html',nome:'Vinis',cat:402,cor:'#B3121D',destaque:'#F4EAD5',ar:'1/1'},
  cd:{pag:'cds.html',nome:'CDs',cat:375,cor:'#177E89',destaque:'#F4EAD5',ar:'1/1'},
  dvd:{pag:'dvds.html',nome:'DVDs',cat:441,cor:'#810B8E',destaque:'#FFC20E',ar:'27/38'}
};
/* sem ?t= na URL, o tipo sai das categorias do produto */
const tipoDe=cats=>{
  for(const {id} of cats||[]){
    if(id===88)return 'gibi';
    if(id===402||id>=411&&id<=439)return 'lp';
    if(id>=375&&id<=398)return 'cd';
    if(id>=441&&id<=458)return 'dvd';
  }
  return 'livro';
};

/* cada loja marca no produto a etiqueta "Loja …" */
const LOJAS=[
  {tag:19,slug:'loja-centro',nome:'Centro',sel:'Matriz',rua:'Av. Tabajaras, 848',bairro:'Centro',cep:'58013-270',tel:'(83) 3222-4438',geo:[-7.1192,-34.8806]},
  {tag:63,slug:'loja-manaira',nome:'Manaíra',sel:'Business Center',rua:'Av. Gov. Flávio Ribeiro Coutinho, 205, Sala 105',bairro:'Manaíra',cep:'58037-000',tel:'(83) 3185-6060',geo:[-7.0985,-34.838]},
  {tag:60,slug:'loja-bancarios',nome:'Bancários',sel:'Praça da Paz',rua:'Rua João Rodrigues Alves, 253, Sala 03',bairro:'Jardim São Paulo',cep:'58051-022',tel:'(83) 3508-4793',geo:[-7.1505,-34.8445]}
];
const mapa=l=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(`O Sebo Cultural, ${l.rua.split(/, sala/i)[0]} - ${l.bairro}, João Pessoa - PB`);

const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
const ta=document.createElement('textarea');
const dec=s=>{ta.innerHTML=s||'';return ta.value.trim()};
/* "Mitos Gregos – Histórias extraordinárias": o nome vem antes do traço e o resto é a descrição */
const partes=n=>{const m=n.split(/\s+[–—-]\s+/);return m.length>1&&m[0].length<60?{nome:m[0],desc:m.slice(1).join(', ')}:{nome:n,desc:''}};
const attrs=p=>Object.fromEntries((p.attributes||[]).map(a=>[a.name,a.terms.map(t=>t.name).filter(t=>t.length>1).join(', ')]).filter(a=>a[1]));
const wa=txt=>'https://wa.me/'+WHATS+'?text='+encodeURIComponent(txt);
/* texto puro da descrição da loja, em parágrafos, sem levar o HTML de lá */
const paragrafos=html=>{
  if(!html)return [];
  const d=new DOMParser().parseFromString(html,'text/html');
  d.querySelectorAll('br').forEach(b=>b.replaceWith('\n'));
  d.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,tr').forEach(e=>e.append('\n'));
  return d.body.textContent.split(/\n+/).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);
};

/* ---------- API ---------- */
const pede=caminho=>{
  const u=new URL(API+caminho,location.href);
  if(MESMA)return fetch(u).then(r=>{if(!r.ok)throw r.status;return r.json()});
  return new Promise((ok,falha)=>{
    const cb='__seboP'+Date.now().toString(36),s=document.createElement('script');
    const fim=()=>{window[cb]=()=>{};s.remove();clearTimeout(t)};
    const t=setTimeout(()=>{fim();falha('tempo')},20000);
    window[cb]=d=>{fim();d&&d.status<300?ok(d.body):falha(d&&d.status)};
    s.onerror=()=>{fim();falha('rede')};
    u.searchParams.set('_envelope','1');u.searchParams.set('_jsonp',cb);s.src=u;document.head.appendChild(s);
  });
};

/* ---------- elementos ---------- */
const q=s=>pp.querySelector(s);
const palco=q('.pp-palco'),obj=q('.pp-obj'),minis=q('.pp-minis'),meta=q('.pp-meta'),tit=q('.pp-tit'),res=q('.pp-resumo'),
      preco=q('.pp-preco'),add=q('.pp-add'),addTxt=add.querySelector('span'),pwa=q('.pp-wa'),lojas=q('.pp-lojas ul'),aviso=q('.pp-aviso'),
      dados=q('.pp-dados'),desc=q('.pp-desc'),cat=q('.pp-cat'),sub=q('.pp-sub'),subSep=q('.pp-sub-sep'),volta=q('.pp-volta');

/* links que ganham destino depois que site.js já ligou a cortina: liga aqui, lendo o href na hora do clique */
pp.querySelectorAll('[data-liga]:not([href])').forEach(a=>a.addEventListener('click',e=>{
  const h=a.getAttribute('href');
  if(!h||e.metaKey||e.ctrlKey||e.shiftKey||e.button||!paginaDe(h))return;
  e.preventDefault();vaiPara(h);
}));

const params=new URLSearchParams(location.search),id=+params.get('id');
let T=TIPOS[params.get('t')],p=null,fotos='';

const aplicaTipo=t=>{
  pp.dataset.tipo=t;T=TIPOS[t];
  const b=document.body.style;b.setProperty('--cor',T.cor);b.setProperty('--destaque',T.destaque);
  pp.style.setProperty('--ar',T.ar);
  document.querySelector('meta[name=theme-color]').content=T.cor;
  document.querySelectorAll('.nav a[aria-current],.menu a[aria-current]').forEach(a=>a.removeAttribute('aria-current'));
  document.querySelectorAll(`.nav a[href="${T.pag}"],.menu a[href="${T.pag}"]`).forEach(a=>a.setAttribute('aria-current','page'));
  cat.href=T.pag+'#produtos';cat.textContent=T.nome;
  /* volta para a mesma estante (com filtro e busca) de onde a pessoa veio */
  let ida=T.pag+'#produtos';
  try{const r=new URL(document.referrer);const arq=r.pathname.split('/').pop();if(r.origin===location.origin&&paginaDe(arq)&&arq!=='produto.html')ida=arq+r.search+'#produtos'}catch(_){}
  volta.href=ida;
};
if(T)aplicaTipo(params.get('t'));

/* ---------- foto ---------- */
const capaFalsa=(nome,desc)=>{const f=el('span','capa-falsa');f.style.setProperty('--c1',T.cor);f.append(el('b','',nome),el('i','',desc));return f};
const mostra=(img,alt)=>{
  const im=new Image();im.alt=alt;im.decoding='async';im.fetchPriority='high';
  /* proporção tirada do nome da miniatura: a foto já nasce no tamanho final e não pula ao trocar */
  const m=(img.thumbnail||'').match(/-(\d+)x(\d+)\.\w+$/);if(m)im.style.setProperty('--r',m[1]/m[2]);
  /* a miniatura já veio do catálogo (cache): aparece na hora; a grande troca quando chegar */
  const ok=()=>{if(!m&&im.naturalWidth)im.style.setProperty('--r',im.naturalWidth/im.naturalHeight);im.classList.add('ok')};
  im.onload=ok;im.onerror=()=>{if(im.src!==img.src)im.src=img.src};
  im.src=img.thumbnail||img.src;if(im.complete&&im.naturalWidth)ok();
  if(img.src&&img.src!==img.thumbnail){
    const hi=new Image();hi.decoding='async';
    if(img.srcset){hi.sizes='(max-width:860px) 90vw, 50vw';hi.srcset=img.srcset}
    hi.onload=()=>{im.src=hi.currentSrc||img.src};hi.src=img.src;
  }
  obj.replaceChildren();
  if(T===TIPOS.lp)obj.append(el('i','vinil'));
  obj.append(im);
};
const desenhaFotos=(imgs,nome,desc,alt)=>{
  const chave=imgs.map(i=>i.src).join('|');if(chave===fotos&&chave)return;fotos=chave;
  if(!imgs.length){obj.replaceChildren(capaFalsa(nome,desc));minis.hidden=true;return}
  mostra(imgs[0],alt);
  minis.hidden=imgs.length<2;
  minis.replaceChildren(...(imgs.length<2?[]:imgs.map((img,i)=>{
    const b=el('button','pp-mini');b.type='button';b.setAttribute('aria-label',`Foto ${i+1} de ${imgs.length}`);b.setAttribute('aria-pressed',!i);
    const m=new Image();m.alt='';m.loading='lazy';m.src=img.thumbnail||img.src;b.append(m);
    b.onclick=()=>{minis.querySelectorAll('.pp-mini').forEach(x=>x.setAttribute('aria-pressed',x===b));mostra(img,alt)};
    return b;
  })));
};

/* ---------- sacola ---------- */
const marcaAdd=()=>{
  if(!p)return;
  if(!p.is_in_stock){add.disabled=true;add.classList.remove('na-sacola');addTxt.textContent='Esgotado';return}
  const tem=sacola.tem(p.id);add.disabled=false;add.classList.toggle('na-sacola',tem);addTxt.textContent=tem?'Tirar da sacola':'Adicionar à sacola';
};
/* clicar de novo tira o item da sacola */
add.addEventListener('click',()=>{
  if(!p||!p.is_in_stock)return;
  const {nome,desc}=partes(dec(p.name));
  const entrou=sacola.alterna({id:p.id,nome,autor:desc,preco:+p.prices.price,img:p.images?.[0]?.thumbnail||'',cod:p.sku||String(p.id),lojas:lojasDe(p)});
  if(!reduz)gsap.fromTo(add,{scale:.94},{scale:1,duration:.6,ease:'elastic.out(1,.4)'});
  const alvo=[...document.querySelectorAll('.pill-sacola')].find(b=>b.offsetParent);
  if(entrou&&alvo&&!reduz){nav.classList.remove('hide');gsap.fromTo(alvo,{scale:1.25},{scale:1,duration:.8,ease:'elastic.out(1,.4)'})}
});
addEventListener('sacola',marcaAdd);

/* ---------- lojas ---------- */
const desenhaLojas=(cheio,cod)=>{
  const tags=p.tags||[],marcada=l=>tags.some(t=>t.id===l.tag||t.slug===l.slug);
  const sabe=LOJAS.some(marcada),esgotado=!p.is_in_stock;
  lojas.replaceChildren(...LOJAS.map(l=>{
    const tem=!esgotado&&sabe&&marcada(l),estado=esgotado?'nao':!sabe?'talvez':tem?'tem':'nao';
    const li=el('li','loja '+estado),info=el('div'),b=el('b',null,l.nome);
    b.append(el('small','',estado==='tem'?'Tem nesta loja':estado==='talvez'?'Confirme pelo WhatsApp':esgotado?'Esgotado':'Não está nesta loja'));
    const ad=el('address');ad.textContent=`${l.rua} · ${l.bairro} · ${l.tel}`;
    info.append(b,ad);
    const ac=el('div','loja-acoes');
    if(estado!=='nao'){
      const ir=el('a','','Como chegar');ir.href=mapa(l);ir.target='_blank';ir.rel='noopener';
      const rs=el('a','reserva',estado==='tem'?'Reservar':'Perguntar');rs.target='_blank';rs.rel='noopener';
      rs.href=wa(estado==='tem'?`Olá! Quero reservar na loja ${l.nome} para ver pessoalmente: ${cheio} (cód. ${cod}).`:`Olá! ${cheio} (cód. ${cod}) está na loja ${l.nome}?`);
      ac.append(ir,rs);
    }
    const pt=el('span','ponto');pt.setAttribute('aria-hidden','true');
    li.append(pt,info,ac);return li;
  }));
  aviso.hidden=sabe||esgotado;
  aviso.textContent='A loja ainda não marcou onde este item está. Pergunte antes de ir.';
  return LOJAS.filter(l=>!esgotado&&sabe&&marcada(l));
};

/* ---------- SEO: título, descrição e dados estruturados do item ---------- */
const seo=(cheio,a,ondes,texto)=>{
  const v=+p.prices.price/100,url=SITE+'produto.html?id='+p.id;
  document.title=`${cheio} | ${T.nome} usados em João Pessoa | O Sebo Cultural`;
  const d=`${cheio}${a['Ano']?' ('+a['Ano']+')':''} por ${brl(+p.prices.price)} no O Sebo Cultural, João Pessoa (PB).`+(ondes.length?` Para ver pessoalmente: loja ${ondes.map(l=>l.nome).join(', ')}.`:'')+' Entrega em até 48h.';
  const meta=(sel,attr,val)=>{let m=document.head.querySelector(sel);if(m)m.setAttribute(attr,val)};
  meta('meta[name=description]','content',d);
  meta('link[rel=canonical]','href',url);
  meta('meta[property="og:title"]','content',cheio);
  meta('meta[property="og:description"]','content',d);
  if(p.images?.[0])meta('meta[property="og:image"]','content',p.images[0].src);
  let og=document.head.querySelector('meta[property="og:url"]');if(!og){og=el('meta');og.setAttribute('property','og:url');document.head.append(og)}og.content=url;
  const cond=(a['Condição']||'').toLowerCase().startsWith('novo')?'NewCondition':'UsedCondition';
  const lojaLd=l=>({'@type':'BookStore',name:'O Sebo Cultural, '+l.nome,telephone:'+55 '+l.tel,
    address:{'@type':'PostalAddress',streetAddress:l.rua+' - '+l.bairro,addressLocality:'João Pessoa',addressRegion:'PB',postalCode:l.cep,addressCountry:'BR'},
    geo:{'@type':'GeoCoordinates',latitude:l.geo[0],longitude:l.geo[1]}});
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'Product','@id':url+'#item',name:cheio,url,sku:p.sku||String(p.id),category:T.nome,
      image:(p.images||[]).map(i=>i.src),description:texto.slice(0,500)||d,
      offers:{'@type':'Offer',url,price:v.toFixed(2),priceCurrency:'BRL',itemCondition:'https://schema.org/'+cond,
        availability:'https://schema.org/'+(p.is_in_stock?'InStock':'OutOfStock'),seller:{'@id':SITE+'#sebo'},
        ...(ondes.length?{availableAtOrFrom:ondes.map(lojaLd)}:{})}},
    {'@type':'BreadcrumbList','itemListElement':[
      {'@type':'ListItem',position:1,name:'Início',item:SITE},
      {'@type':'ListItem',position:2,name:'Acervo',item:SITE+'acervo.html'},
      {'@type':'ListItem',position:3,name:T.nome,item:SITE+T.pag},
      {'@type':'ListItem',position:4,name:cheio,item:url}]},
    {'@type':'BookStore','@id':SITE+'#sebo',name:'O Sebo Cultural',url:SITE,telephone:'+55-83-3222-4438'}
  ]};
  let s=document.getElementById('ld-produto');
  if(!s){s=el('script');s.type='application/ld+json';s.id='ld-produto';document.head.append(s)}
  s.textContent=JSON.stringify(ld);
};

/* ---------- desenha a ficha ---------- */
const desenha=prod=>{
  p=prod;
  if(!T)aplicaTipo(tipoDe(p.categories));
  const cheio=dec(p.name),{nome,desc:resumo}=partes(cheio),a=attrs(p),cod=p.sku||String(p.id);
  desenhaFotos(p.images||[],nome,resumo,cheio);
  meta.textContent=[a['Condição'],a['Ano']].filter(Boolean).join(' · ')||'Usado';
  /* nome grande em cima, descrição pequena embaixo */
  tit.textContent=nome;
  res.textContent=resumo;res.hidden=!resumo;

  const pr=p.prices||{},v=+pr.price,r=+pr.regular_price;
  preco.replaceChildren();
  if(p.on_sale&&r>v)preco.append(el('s','',brl(r)));
  preco.append(document.createTextNode(brl(v)));
  if(!p.is_in_stock)preco.append(el('span','label','Esgotado'));
  marcaAdd();
  pwa.href=wa(`Olá! Tenho interesse em: ${cheio} (cód. ${cod}) · ${brl(v)}`);

  /* subcategoria na trilha, quando há uma além da raiz */
  const s=(p.categories||[]).find(c=>c.id!==T.cat);
  sub.hidden=subSep.hidden=!s;
  if(s){sub.textContent=dec(s.name);sub.href=T.pag+'?c='+s.id+'#produtos'}

  const ondes=desenhaLojas(cheio,cod);

  const linhas=[...Object.entries(a),['Categoria',(p.categories||[]).map(c=>dec(c.name)).join(', ')],['Código',cod]].filter(l=>l[1]);
  dados.replaceChildren(...linhas.flatMap(([k,val])=>[el('dt','',k),el('dd','',val)]));

  const ps=paragrafos(p.description||p.short_description);
  desc.replaceChildren(...(ps.length?[el('h2','','Sobre'),...ps.map(t=>el('p','',t))]:[]));

  seo(cheio,a,ondes,ps.join(' '));
  pp.classList.remove('carregando');
  ScrollTrigger.refresh();
};

const erro=()=>{
  if(p)return;
  if(!T)aplicaTipo('livro');
  pp.classList.remove('carregando');
  q('.pp-grade').hidden=true;q('.pp-erro').hidden=false;
  document.title='Item não encontrado | O Sebo Cultural';
  document.head.querySelector('meta[name=robots]').content='noindex,follow';
};

if(!id){erro();return}
/* abre na hora com o que veio da lista; depois confere preço e estoque na loja */
let guardado=null;
try{guardado=JSON.parse(sessionStorage.getItem('sebo-p:'+id))}catch(_){}
if(guardado&&guardado.id===id)desenha(guardado);
pede('/products/'+id).then(prod=>{
  if(!prod||prod.id!==id)throw 0;
  try{sessionStorage.setItem('sebo-p:'+id,JSON.stringify(prod))}catch(_){}
  if(!guardado||JSON.stringify(guardado)!==JSON.stringify(prod))desenha(prod);
}).catch(erro);
})();
