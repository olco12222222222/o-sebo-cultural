/* catálogo ao vivo: todos os produtos da loja, com filtros, busca e sacola; depende de site.js */
(()=>{
const sec=document.querySelector('.catalogo');if(!sec)return;

/* mesma origem em produção (fetch); fora dela, JSONP do WordPress com cabeçalhos no envelope */
const API=window.SEBO_API||'https://lojasebocultural.com.br/wp-json/wc/store/v1';
const MESMA=new URL(API,location.href).origin===location.origin;
const POR=24;
const NA_LINHA=9; /* "Tudo" + 9 = 10 filtros à vista; o resto fica em "Todos os filtros" */

/* subcategorias da loja, das mais cheias para as menores */
const SUBS={
  17:[[37,'Literatura estrangeira'],[24,'Religião'],[49,'Infantil e juvenil'],[52,'Literatura brasileira'],[86,'Medicina e saúde'],[18,'Pedagogia'],[43,'Administração'],[39,'Sociologia'],[84,'Psicologia'],[32,'História geral'],[46,'Poemas e poesias'],[54,'Biografias'],[48,'Filosofia'],[66,'Ciências políticas'],[81,'Autoajuda'],[68,'Direito'],[41,'História do Brasil'],[78,'Paraíba'],[112,'Outros assuntos'],[85,'Esoterismo'],[35,'Economia'],[83,'Crítica literária'],[101,'Artes'],[56,'Comunicação'],[118,'Linguística'],[132,'Agricultura'],[102,'Ciências exatas'],[119,'Idiomas'],[93,'Engenharia'],[141,'Didáticos'],[122,'Teatro'],[123,'Ecologia'],[126,'Dicionários'],[120,'Sexualidade'],[145,'Esportes'],[75,'Informática'],[146,'Música'],[98,'Turismo'],[113,'Culinária'],[159,'Revistas'],[110,'Contos'],[131,'Arquitetura'],[153,'Cinema'],[107,'Antropologia'],[172,'Fotografia'],[117,'Humor'],[177,'Biologia'],[108,'Livros raros'],[169,'Guerra'],[151,'Folclore'],[121,'Contabilidade'],[165,'Pecuária'],[161,'Romance'],[156,'Jogos'],[69,'Brasil'],[143,'Astronomia'],[185,'Moda'],[210,'Botânica'],[188,'Documentos'],[167,'Comportamento'],[283,'Enciclopédias'],[183,'Arqueologia'],[150,'Hobbies'],[190,'Ficção científica'],[305,'Jornais'],[278,'Artesanato'],[166,'Genealogia'],[223,'Decoração']],
  402:[[426,'Jazz'],[428,'MPB'],[435,'Rock'],[414,'Clássico'],[417,'Eletrônica'],[436,'Samba'],[431,'Pop'],[419,'Forró'],[439,'Outros'],[438,'Trilha sonora'],[420,'Funk'],[418,'Folk'],[421,'Gospel'],[413,'Bossa nova'],[437,'Sertanejo'],[424,'Infantil'],[415,'Country'],[411,'Axé'],[434,'Reggae'],[422,'Hip hop'],[412,'Blues'],[425,'Instrumental']],
  375:[[383,'MPB'],[376,'Rock'],[382,'Jazz'],[390,'Pop'],[394,'Samba'],[385,'Forró'],[395,'Eletrônica'],[386,'Trilha sonora'],[380,'Clássico'],[379,'Bossa nova'],[398,'Outros'],[393,'Funk'],[392,'Folk'],[378,'Blues'],[387,'Sertanejo'],[391,'Gospel'],[389,'Reggae'],[396,'Hip hop'],[397,'Country'],[388,'Infantil'],[381,'Instrumental'],[377,'Axé']],
  441:[[446,'Drama'],[442,'Ação e aventura'],[444,'Comédia'],[456,'Shows'],[454,'Suspense'],[455,'Terror'],[449,'Infantil'],[457,'Western'],[447,'Ficção'],[453,'Romance'],[445,'Documentários'],[450,'Musicais'],[448,'Guerra'],[443,'Clássicos'],[458,'Outros']],
  88:[]
};
const ORDENS=[['date-desc','Chegaram agora'],['price-asc','Menor preço'],['price-desc','Maior preço'],['title-asc','A a Z']];
const PAL=['#B3121D','#084C61','#810B8E','#177E89','#7E0B13','#1E1412'];

const raiz=+sec.dataset.cat,tipo=sec.dataset.tipo||'livro';
const grade=sec.querySelector('.grade'),total=sec.querySelector('.cat-total'),mais=sec.querySelector('.mais'),
      busca=sec.querySelector('.busca input'),filtros=sec.querySelector('.filtros'),aviso=sec.querySelector('.cat-aviso');

const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
const ta=document.createElement('textarea');
const dec=s=>{ta.innerHTML=s||'';return ta.value.trim()};
const num=n=>n.toLocaleString('pt-BR');
/* "Mitos Gregos – Histórias extraordinárias": o nome vem antes do traço e o resto é a descrição */
const partes=n=>{const m=n.split(/\s+[–—-]\s+/);return m.length>1&&m[0].length<60?{nome:m[0],desc:m.slice(1).join(', ')}:{nome:n,desc:''}};
const attrs=p=>Object.fromEntries((p.attributes||[]).map(a=>[a.name,a.terms.map(t=>t.name).filter(t=>t.length>1).join(', ')]).filter(a=>a[1]));
const seta='<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

/* ---------- API ---------- */
let jn=0;
const pede=(caminho,q)=>{
  const u=new URL(API+caminho,location.href);
  Object.entries(q).forEach(([k,v])=>{if(v!==''&&v!=null)u.searchParams.set(k,v)});
  if(MESMA)return fetch(u).then(r=>{if(!r.ok)throw r.status;return r.json().then(body=>({body,total:+r.headers.get('X-WP-Total'),paginas:+r.headers.get('X-WP-TotalPages')}))});
  return new Promise((ok,falha)=>{
    const cb='__sebo'+(jn++)+Date.now().toString(36),s=document.createElement('script');
    const fim=()=>{window[cb]=()=>{};s.remove();clearTimeout(t)};
    const t=setTimeout(()=>{fim();falha('tempo')},20000);
    window[cb]=d=>{fim();d&&d.status<300?ok({body:d.body,total:+d.headers['X-WP-Total'],paginas:+d.headers['X-WP-TotalPages']}):falha(d&&d.status)};
    s.onerror=()=>{fim();falha('rede')};
    u.searchParams.set('_envelope','1');u.searchParams.set('_jsonp',cb);s.src=u;document.head.appendChild(s);
  });
};
/* respostas recentes ficam na sessão: voltar de uma ficha ou repetir um filtro não espera a rede */
const VALE=5*60e3;
const lembra=k=>{try{const c=JSON.parse(sessionStorage.getItem('sebo-c:'+k));if(c&&Date.now()-c.t<VALE)return c.r}catch(e){}};
const guarda=(k,r)=>{
  const v=JSON.stringify({t:Date.now(),r});
  try{sessionStorage.setItem('sebo-c:'+k,v)}catch(e){
    try{Object.keys(sessionStorage).filter(c=>c.startsWith('sebo-c:')).forEach(c=>sessionStorage.removeItem(c));sessionStorage.setItem('sebo-c:'+k,v)}catch(_){}
  }
};

/* ---------- estado ---------- */
const url=new URLSearchParams(location.search);
const subs=SUBS[raiz]||[];
const st={cat:+url.get('c')||raiz,q:url.get('q')||'',ordem:ORDENS.some(o=>o[0]===url.get('o'))?url.get('o'):'date-desc',pagina:1,paginas:1};
if(st.cat!==raiz&&!subs.some(s=>s[0]===st.cat))st.cat=raiz;
const prods=new Map();
let req=0;
busca.value=st.q;

const guardaUrl=()=>{const u=new URLSearchParams();if(st.cat!==raiz)u.set('c',st.cat);if(st.q)u.set('q',st.q);if(st.ordem!=='date-desc')u.set('o',st.ordem);history.replaceState(null,'',location.pathname+(u.size?'?'+u:'')+location.hash)};

/* ---------- ordenação: menu próprio no desenho das pílulas ---------- */
const ord=el('div','ordem'),ordBtn=el('button','ordem-btn'),ordTxt=el('span','ordem-txt'),ordLista=el('ul','ordem-lista');
ordBtn.type='button';ordBtn.setAttribute('aria-haspopup','listbox');ordBtn.setAttribute('aria-expanded','false');ordBtn.setAttribute('aria-label','Ordenar');
ordBtn.append(el('span','label','Ordem'),ordTxt);ordBtn.insertAdjacentHTML('beforeend',seta);
ordLista.setAttribute('role','listbox');ordLista.setAttribute('aria-label','Ordenar');ordLista.tabIndex=-1;ordLista.hidden=true;
ORDENS.forEach(([v,t])=>{const li=el('li','',t);li.setAttribute('role','option');li.dataset.v=v;li.id='ordem-'+v;ordLista.append(li)});
ord.append(ordBtn,ordLista);
sec.querySelector('.ordem')?.replaceWith(ord);
let oi=0;
const marcaOrdem=()=>{ordTxt.textContent=ORDENS.find(o=>o[0]===st.ordem)[1];[...ordLista.children].forEach(li=>li.setAttribute('aria-selected',li.dataset.v===st.ordem))};
const destaca=()=>{[...ordLista.children].forEach((li,i)=>li.classList.toggle('ativo',i===oi));ordLista.setAttribute('aria-activedescendant',ordLista.children[oi].id)};
const abreOrdem=()=>{ordLista.hidden=false;ordBtn.setAttribute('aria-expanded','true');oi=ORDENS.findIndex(o=>o[0]===st.ordem);destaca();ordLista.focus({preventScroll:true});
  if(!reduz)gsap.fromTo(ordLista,{opacity:0,y:-8},{opacity:1,y:0,duration:.3,ease:'power3.out'})};
const fechaOrdem=volta=>{if(ordLista.hidden)return;ordLista.hidden=true;ordBtn.setAttribute('aria-expanded','false');if(volta)ordBtn.focus({preventScroll:true})};
const escolhe=v=>{fechaOrdem(true);if(v===st.ordem)return;st.ordem=v;marcaOrdem();carrega(true)};
ordBtn.addEventListener('click',()=>ordLista.hidden?abreOrdem():fechaOrdem());
ordBtn.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();abreOrdem()}});
ordLista.addEventListener('click',e=>{const li=e.target.closest('li');if(li)escolhe(li.dataset.v)});
ordLista.addEventListener('pointermove',e=>{const li=e.target.closest('li');if(li){oi=[...ordLista.children].indexOf(li);destaca()}});
ordLista.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();oi=(oi+(e.key==='ArrowDown'?1:ORDENS.length-1))%ORDENS.length;destaca()}
  else if(e.key==='Home'||e.key==='End'){e.preventDefault();oi=e.key==='Home'?0:ORDENS.length-1;destaca()}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();escolhe(ORDENS[oi][0])}
  else if(e.key==='Escape'){e.stopPropagation();fechaOrdem(true)}
  else if(e.key==='Tab')fechaOrdem();
});
document.addEventListener('pointerdown',e=>{if(!ord.contains(e.target))fechaOrdem()});
marcaOrdem();

/* ---------- filtros: 10 na linha + todos em ordem alfabética ---------- */
const nomeDe=id=>id===raiz?'Tudo':subs.find(s=>s[0]===id)[1];
const chip=id=>{const b=el('button','filtro',nomeDe(id));b.type='button';b.dataset.cat=id;return b};
let linha=[raiz,...subs.slice(0,NA_LINHA).map(s=>s[0])],todos,painel;
if(subs.length){
  todos=el('button','filtro filtro-todos');todos.type='button';todos.setAttribute('aria-expanded','false');todos.setAttribute('aria-controls','todos-filtros');
  todos.append('Todos os filtros',el('span','filtro-n',subs.length));todos.insertAdjacentHTML('beforeend',seta);
  painel=el('div','filtros-todos');painel.id='todos-filtros';painel.hidden=true;painel.setAttribute('aria-label','Todos os filtros, de A a Z');
  let letra='',grupo;
  [...subs].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).forEach(([id,nome])=>{
    const l=nome.normalize('NFD')[0].toUpperCase();
    if(l!==letra){letra=l;const g=el('div','letra');g.append(el('b','',l));grupo=el('div');g.append(grupo);painel.append(g)}
    grupo.append(chip(id));
  });
  filtros.after(painel);
}else filtros.remove();
const marcaFiltro=()=>{if(!subs.length)return;sec.querySelectorAll('.filtro[data-cat]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.cat===st.cat))};
const desenhaFiltros=()=>{
  if(!subs.length)return;
  /* escolheu um que não estava à vista: entra logo depois de "Tudo" */
  if(!linha.includes(st.cat))linha=[raiz,st.cat,...linha.slice(1,NA_LINHA)];
  filtros.replaceChildren(...linha.map(chip),todos);
  marcaFiltro();
  const b=filtros.querySelector('[aria-pressed=true]');
  if(b&&filtros.scrollWidth>filtros.clientWidth)filtros.scrollTo({left:b.offsetLeft-filtros.clientWidth/2+b.offsetWidth/2,behavior:'smooth'});
};
const abrePainel=abre=>{
  painel.hidden=!abre;todos.setAttribute('aria-expanded',abre);
  if(abre&&!reduz)gsap.fromTo(painel.children,{opacity:0,y:12},{opacity:1,y:0,duration:.45,ease:'power3.out',stagger:.015});
  ScrollTrigger.refresh();
};
desenhaFiltros();

/* ---------- cartões ---------- */
const preco=(alvo,p)=>{
  const pr=p.prices||{},v=+pr.price,r=+pr.regular_price;
  alvo.replaceChildren();
  if(p.on_sale&&r>v)alvo.append(el('s','',brl(r)));
  alvo.append(document.createTextNode(brl(v)));
};
const capaFalsa=(nome,desc,id)=>{const f=el('span','capa-falsa');f.style.setProperty('--c1',PAL[id%PAL.length]);f.append(el('b','',nome),el('i','',desc));return f};
const imagem=(img,alt,primeiros)=>{
  const im=new Image(),m=img.thumbnail.match(/-(\d+)x(\d+)\.\w+$/);
  if(m){im.width=+m[1];im.height=+m[2]}
  im.alt=alt;im.decoding='async';
  /* as primeiras já baixam enquanto o visitante está no hero, mas sem prioridade alta para não disputar com as imagens do hero */
  if(!primeiros)im.loading='lazy';
  im.onload=()=>im.classList.add('ok');im.onerror=()=>im.replaceWith(capaFalsa(alt,'',0));im.src=img.thumbnail;
  if(im.complete&&im.naturalWidth)im.classList.add('ok');
  return im;
};
const marcaAdd=(b,id)=>{const tem=sacola.tem(id);b.classList.toggle('na-sacola',tem);b.textContent=tem?'✓':'+';b.setAttribute('aria-label',tem?'Tirar da sacola':'Adicionar à sacola');b.title=tem?'Tirar da sacola':'Adicionar à sacola'};
const ficha=p=>'produto.html?id='+p.id+'&t='+tipo;

const cartao=(p,i)=>{
  const cheio=dec(p.name),{nome,desc}=partes(cheio),a=attrs(p),img=p.images?.[0];
  const art=el('article','prod');art.dataset.id=p.id;
  /* a capa e o título levam à página do produto; só o título conta para leitores de tela */
  const capa=el('a','prod-capa');capa.href=ficha(p);capa.tabIndex=-1;capa.setAttribute('aria-hidden','true');
  const obj=el('span','prod-obj');
  if(tipo==='lp')obj.append(el('i','vinil'));
  obj.append(img?imagem(img,cheio,i<8):capaFalsa(nome,desc,p.id));
  capa.append(obj);
  /* nome grande em cima, descrição pequena embaixo */
  const info=el('div','prod-info'),h=el('h3'),ha=el('a','',nome);ha.href=capa.href;h.append(ha);
  info.append(el('span','label',[a['Condição'],a['Ano']].filter(Boolean).join(' · ')||'Usado'),h);
  if(desc)info.append(el('span','prod-desc',desc));
  const pe=el('div','prod-pe'),pr=el('b');preco(pr,p);
  const add=el('button','add');add.type='button';marcaAdd(add,p.id);
  if(!p.is_in_stock){add.disabled=true;add.textContent='×';add.setAttribute('aria-label','Esgotado');add.title='Esgotado'}
  pe.append(pr,add);info.append(pe);art.append(capa,info);
  return art;
};
const esqueletos=n=>Array.from({length:n},()=>{const a=el('article','prod esqueleto');a.innerHTML='<span class="prod-capa"><span class="prod-obj"></span></span><div class="prod-info"><span></span><span></span></div>';return a});

/* ---------- carga ---------- */
const avisa=(tipoAviso)=>{
  aviso.replaceChildren();aviso.hidden=!tipoAviso;if(!tipoAviso)return;
  const wa='https://wa.me/'+WHATS+'?text='+encodeURIComponent(st.q?`Olá! Vocês têm "${st.q}"?`:'Olá! Queria ajuda para encontrar um item do acervo.');
  if(tipoAviso==='vazio'){
    aviso.append(el('p','',st.q?`Nada com "${st.q}" por aqui.`:'Nada nesta estante agora.'),el('p','label','A loja física tem muito mais. Pergunte.'));
  }else{
    aviso.append(el('p','','O acervo não respondeu.'),el('p','label','Tente de novo ou fale com a gente.'));
    const b=el('button','pill',null);b.type='button';b.append(el('i'),'Tentar de novo');b.onclick=()=>carrega(true);aviso.append(b);
  }
  const w=el('a','pill pill-w',null);w.href=wa;w.target='_blank';w.rel='noopener';w.append(el('i'),'Perguntar no WhatsApp');aviso.append(w);
};
const carrega=async reset=>{
  const id=++req;
  if(reset){st.pagina=1;guardaUrl()}
  const [ob,od]=st.ordem.split('-');
  /* na loja os gibis moram dentro de livros; aqui cada um tem sua estante, então "Tudo" em livros soma as subcategorias sem os gibis */
  const cat=st.cat===17?subs.map(s=>s[0]).join(','):st.cat;
  const q={category:cat,search:st.q,per_page:POR,page:st.pagina,orderby:ob,order:od},chave=JSON.stringify(q);
  const pronto=lembra(chave);
  if(reset&&!pronto)grade.classList.add('carregando');
  sec.classList.add('ocupado');mais.disabled=true;mais.lastChild.textContent='Carregando…';
  try{
    const r=pronto||await pede('/products',q);
    if(id!==req)return;
    if(!pronto)guarda(chave,r);
    if(reset){grade.replaceChildren();grade.classList.remove('carregando')}
    st.paginas=r.paginas||1;
    if(raiz===17)r.body=r.body.filter(p=>!p.categories?.some(c=>c.id===88));
    r.body.forEach(p=>prods.set(p.id,p));
    const base=grade.children.length;
    grade.append(...r.body.map((p,i)=>cartao(p,base+i)));
    total.textContent=num(r.total||0)+(r.total===1?' título':' títulos');
    mais.hidden=st.pagina>=st.paginas;
    avisa(r.total?'':'vazio');
  }catch(e){
    if(id!==req)return;
    if(reset){grade.replaceChildren();grade.classList.remove('carregando')}
    mais.hidden=true;avisa('erro');
  }finally{
    if(id===req){sec.classList.remove('ocupado');mais.disabled=false;mais.lastChild.textContent='Carregar mais';ScrollTrigger.refresh()}
  }
};

/* a busca sai assim que a página abre, enquanto o visitante ainda está no hero */
grade.append(...esqueletos(8));
carrega(true);

mais.addEventListener('click',()=>{st.pagina++;carrega(false)});
let tb;
busca.addEventListener('input',()=>{clearTimeout(tb);tb=setTimeout(()=>{if(busca.value.trim()===st.q)return;st.q=busca.value.trim();carrega(true)},450)});
busca.closest('form')?.addEventListener('submit',e=>{e.preventDefault();clearTimeout(tb);st.q=busca.value.trim();carrega(true);busca.blur()});

const vaiAoCatalogo=()=>lenis?lenis.scrollTo(sec,{offset:-10,duration:1.4}):sec.scrollIntoView({behavior:reduz?'auto':'smooth'});
const filtra=id=>{if(id!==raiz&&!subs.some(s=>s[0]===id))return;st.cat=id;desenhaFiltros();carrega(true)};
sec.addEventListener('click',e=>{
  if(e.target.closest('.filtro-todos'))return abrePainel(painel.hidden);
  const b=e.target.closest('.filtro[data-cat]');if(!b)return;
  if(painel&&painel.contains(b))abrePainel(false);
  filtra(+b.dataset.cat);
});
/* linhas de gênero da página viram filtros */
document.querySelectorAll('[data-filtro]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();filtra(+a.dataset.filtro);vaiAoCatalogo()}));
/* onde não há subcategorias, as linhas viram buscas prontas */
document.querySelectorAll('[data-busca]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();busca.value=st.q=a.dataset.busca;st.cat=raiz;desenhaFiltros();carrega(true);vaiAoCatalogo()}));
/* capas da vitrine buscam o título no acervo */
document.querySelectorAll('.vitrine .obra').forEach(o=>{
  const b=o.querySelector('.capa b');if(!b)return;
  o.style.cursor='pointer';o.setAttribute('role','button');o.tabIndex=0;o.setAttribute('aria-label','Procurar '+b.textContent+' no acervo');
  const vai=()=>{busca.value=st.q=b.textContent;st.cat=raiz;desenhaFiltros();carrega(true);vaiAoCatalogo()};
  o.addEventListener('click',vai);o.addEventListener('keydown',e=>{if(e.key==='Enter')vai()});
});

/* prévia das linhas de gênero: três capas reais daquela estante, buscadas quando a lista se aproxima */
const prev=document.querySelector('.preview'),gens=[...document.querySelectorAll('.gen')];
if(prev&&gens.length&&matchMedia('(hover:hover)').matches){
  const camadas=[prev.querySelector('.frente'),prev.querySelector('.tr2'),prev.querySelector('.tr1')];
  const nomeG=el('span','nome-g');camadas[0].append(nomeG);
  const capas=new Map();let sob=null;
  const capasDe=g=>{
    if(capas.has(g))return capas.get(g);
    const q={category:g.dataset.filtro||raiz,search:g.dataset.busca||'',per_page:8},chave='gen:'+JSON.stringify(q);
    const salvo=lembra(chave);
    const pr=(salvo?Promise.resolve(salvo):pede('/products',q).then(r=>{
      const l=r.body.filter(p=>p.images?.[0]).slice(0,3).map(p=>({src:p.images[0].thumbnail,nome:dec(p.name)}));
      guarda(chave,l);return l;
    })).then(l=>l.map(c=>{const im=new Image();im.alt='';im.decoding='async';im.src=c.src;return {im,nome:c.nome}})).catch(()=>[]);
    capas.set(g,pr);return pr;
  };
  const mostra=l=>{
    camadas.forEach((c,k)=>{const velha=c.querySelector(':scope>img');if(velha&&velha!==l[k]?.im)velha.remove();if(l[k])c.prepend(l[k].im)});
    camadas[0].classList.toggle('tem-capa',!!l[0]);nomeG.textContent=l[0]?.nome||'';
  };
  gens.forEach(g=>{
    g.addEventListener('pointerenter',()=>{sob=g;mostra([]);capasDe(g).then(l=>{if(sob===g)mostra(l)})});
    g.addEventListener('pointerleave',()=>{if(sob===g)sob=null});
  });
  new IntersectionObserver((es,io)=>{if(es.some(e=>e.isIntersecting)){io.disconnect();gens.forEach(capasDe)}},{rootMargin:'600px 0px'}).observe(gens[0].parentElement);
}

/* ---------- sacola: capa voa até o botão ---------- */
const voa=(origem)=>{
  const alvo=[...document.querySelectorAll('.pill-sacola')].find(b=>b.offsetParent);if(!origem||!alvo||reduz)return;
  nav.classList.remove('hide');
  const r=origem.getBoundingClientRect(),c=origem.cloneNode(true);
  c.className='voando';Object.assign(c.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});document.body.append(c);
  const t=alvo.getBoundingClientRect();
  gsap.timeline({onComplete:()=>{c.remove();gsap.fromTo(alvo,{scale:1.25},{scale:1,duration:.8,ease:'elastic.out(1,.4)'})}})
    .to(c,{x:t.left+t.width/2-r.left-r.width/2,y:t.top+t.height/2-r.top-r.height/2,scale:.12,rotate:-25,duration:.9,ease:'power3.inOut'})
    .to(c,{opacity:0,duration:.2},'-=.2');
};
/* o + põe na sacola; clicar de novo tira */
const alterna=(p,origem,botao)=>{
  const {nome,desc}=partes(dec(p.name));
  const entrou=sacola.alterna({id:p.id,nome,autor:desc,preco:+p.prices.price,img:p.images?.[0]?.thumbnail||'',cod:p.sku||String(p.id),lojas:lojasDe(p)});
  if(entrou)voa(origem);
  else if(!reduz)gsap.fromTo(botao,{scale:.6,rotate:-90},{scale:1,rotate:0,duration:.7,ease:'elastic.out(1,.45)'});
};
grade.addEventListener('click',e=>{
  const art=e.target.closest('.prod');if(!art||art.classList.contains('esqueleto'))return;
  const p=prods.get(+art.dataset.id);if(!p)return;
  const b=e.target.closest('.add');
  if(b)alterna(p,art.querySelector('.prod-obj img,.prod-obj .capa-falsa'),b);
  /* a página do produto abre na hora com o que já veio da lista */
  else if(e.target.closest('a'))try{sessionStorage.setItem('sebo-p:'+p.id,JSON.stringify(p))}catch(_){}
});
addEventListener('sacola',()=>grade.querySelectorAll('.prod').forEach(a=>{const b=a.querySelector('.add');if(b&&!b.disabled)marcaAdd(b,+a.dataset.id)}));
})();
