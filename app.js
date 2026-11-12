const showOpeningOnLoad = !location.hash || location.hash === '#opening';
if(showOpeningOnLoad)document.body.classList.add('opening-active');
const $=s=>document.querySelector(s), pages=window.issuePages;
let pageCount = 0;
const pageNumbers = pages.map(page => page.chapterHeader ? null : ++pageCount);
const world=$('#world'), viewport=$('#viewport');
let active=Math.max(0,Math.min(pages.length-1,(parseInt(location.hash.slice(1))||1)-1));
let camera={x:0,y:0,s:1}, overview=false, moving=false, animation=0, drag=null, cooldown=0, wheelIntent=0, lastWheel=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overviewLabels = document.createElement('div');
overviewLabels.className = 'overview-labels';
viewport.append(overviewLabels);
const mapTitles = pages.map((page, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = page.title;
  button.onclick = () => go(index);
  overviewLabels.append(button);
  return button;
});
function render() {
  const left = innerWidth / 2 - camera.x * camera.s;
  const top = innerHeight / 2 - camera.y * camera.s;
  world.dataset.activeSection = String(active + 1);
  world.style.setProperty('--copy-scale', 1 / camera.s);
  world.style.transform = `translate(${left}px,${top}px) scale(${camera.s})`;
  document.querySelectorAll('.portrait-caption').forEach(caption => {
    const anchor = Number(caption.dataset.anchorX);
    const width = caption.offsetWidth * camera.s;
    const screenLeft = clamp(left + anchor * camera.s, 16, Math.max(16, innerWidth - 16 - width));
    caption.style.left = (screenLeft - left) / camera.s + 'px';
  });
  if (overview) pages.forEach((page, index) => {
    mapTitles[index].style.left = (left + (page.x + page.w) * camera.s + 8) + 'px';
    mapTitles[index].style.top = (top + (page.y + page.h / 2) * camera.s) + 'px';
  });
}
function overviewDestination() {
  const left = Math.min(...pages.map(page => page.x));
  // The construction photo extends past the right edge of its section.
  const right = Math.max(5971.11, ...pages.map(page => page.x + page.w));
  const top = Math.min(...pages.map(page => page.y));
  const bottom = Math.max(...pages.map(page => page.y + page.h));
  const leftMargin = 24;
  const rightMargin = innerWidth <= 650 ? 118 : 158;
  const topMargin = 68;
  const bottomMargin = 58;
  const scale = Math.min(
    Math.max(1, innerWidth - leftMargin - rightMargin) / (right - left),
    Math.max(1, innerHeight - topMargin - bottomMargin) / (bottom - top)
  );
  return {
    x: (left + right) / 2 + (rightMargin - leftMargin) / (2 * scale),
    y: (top + bottom) / 2 + (bottomMargin - topMargin) / (2 * scale),
    s: scale
  };
}
function destination(i) {
  const page = pages[i];
  const narrow = innerWidth <= 650;
  const topMargin = narrow ? 82 : 96;
  const usableWidth = Math.max(1, innerWidth - 48);

  const scale = narrow || i === pages.length - 1 ? Math.min(1, usableWidth / page.w) : 1;
  return {
    x: page.x + page.w / 2,
    y: page.y + (innerHeight / 2 - topMargin) / scale,
    s: scale
  };
}
function verticalBounds(){const p=pages[active],top=destination(active).y;return {top,bottom:top+p.h};}
function travel(to,onComplete){cancelAnimationFrame(animation);moving=true;world.dataset.settledSection='';const from={...camera},start=performance.now(),duration=reduced.matches?0:1100;function tick(now){const t=duration?Math.min(1,(now-start)/duration):1,e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;camera={x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e,s:Math.exp(Math.log(from.s)+(Math.log(to.s)-Math.log(from.s))*e)};render();if(t<1)animation=requestAnimationFrame(tick);else{moving=false;world.dataset.settledSection=overview?'overview':String(active+1);cooldown=performance.now()+350;onComplete?.();}}animation=requestAnimationFrame(tick);}
function update(){const p=pages[active];$('#number').textContent=p.chapterHeader ? 'CHAPTER ' + String(pages.slice(0,active+1).filter(page=>page.chapterHeader).length).padStart(2,'0') : `${String(pageNumbers[active]).padStart(2,'0')} / ${pageCount}`;$('#title').textContent=p.title;$('#previous').disabled=active===0;$('#next').disabled=active===pages.length-1;$('#announce').textContent=`Section ${active+1}: ${p.title}`;document.querySelectorAll('[data-page]').forEach(b=>{b.setAttribute('aria-current',String(+b.dataset.page===active));if(b.classList.contains('region'))b.tabIndex=overview?0:-1;});$('#overview').setAttribute('aria-pressed',String(overview));$('#hint').textContent=overview?'Choose a section to enter':'Drag to explore · Scroll to follow';history.replaceState(null,'',`#${active+1}`);}
function go(i){if(i>=0)window.closeOpening?.();if(i<0){returnToOpening();return;}if(i>=pages.length)return;active=i;overview=false;document.body.classList.remove('map-mode');wheelIntent=0;update();travel(destination(i));}
function toggleMap(){window.closeOpening?.();overview=!overview;document.body.classList.toggle('map-mode',overview);update();if(overview)travel(overviewDestination());else travel(destination(active));}
pages.forEach((p,i)=>{const b=document.createElement('button');b.dataset.page=i;b.title=p.chapterHeader ? p.title : `${pageNumbers[i]}. ${p.title}`;b.innerHTML=`<span>${String(pageNumbers[i] ?? '').padStart(2,'0')}</span>`;b.setAttribute('aria-label',b.title);b.onclick=()=>go(i);if (!p.chapterHeader) $('#index').append(b);const box=b.cloneNode(true);box.className='region';box.style.cssText=`left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`;box.onclick=()=>go(i);$('#regions').append(box);});
function returnToOpening(){
  if(document.querySelector('.opening-view'))return;
  cancelAnimationFrame(animation);overview=false;active=0;
  document.body.classList.remove('map-mode');
  wheelIntent=0;update();
  const target=destination(0);
  const finish=()=>setupOpening({atEnd:true,fromChapter:true});
  if(Math.abs(camera.y-target.y)<1 && Math.abs(camera.x-target.x)<1 && Math.abs(camera.s-target.s)<.001)finish();
  else travel(target,finish);
}
$('#overview').onclick=toggleMap;
$('#next').onclick=()=>go(document.querySelector('.opening-view')?0:active+1);
$('#previous').onclick=()=>go(active-1);
$('#recenter').onclick=returnToOpening;
$('#home').onclick=e=>{e.preventDefault();returnToOpening();};
viewport.addEventListener('wheel', event => {
  const column = event.target.closest('.section-copy-panel');
  if (column && column.scrollHeight > column.clientHeight) return;
  event.preventDefault();
  if (overview || moving || performance.now() < cooldown) return;

  const now = performance.now();
  if (now - lastWheel > 200) wheelIntent = 0;
  lastWheel = now;
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
  if (!delta) return;

  const bounds = verticalBounds();
  const proposedY = camera.y + delta / camera.s * .7;
  const halfView = innerHeight / (2 * camera.s);
  const nextPage = pages[active + 1];
  if (!nextPage) {
    const lastPage = pages[active];
    bounds.bottom = lastPage.y + lastPage.h + halfView;
    if (delta > 0 && proposedY >= bounds.bottom) {
      wheelIntent = 0;
      toggleMap();
      return;
    }
  } else {
    const requiredHeight = nextPage.h * .25;
    if (2 * halfView > requiredHeight) {
      const entryY = nextPage.y + requiredHeight - halfView;
      const exitY = nextPage.y + nextPage.h - requiredHeight + halfView;
      if (delta > 0 && proposedY > entryY && camera.y < exitY) {
        go(active + 1);
        return;
      }
      bounds.bottom = Math.max(bounds.bottom, entryY);
    }
  }

  camera.y = clamp(proposedY, bounds.top, bounds.bottom);
  render();
  if (proposedY > bounds.bottom || proposedY < bounds.top) {
    wheelIntent += delta;
    if (Math.abs(wheelIntent) > 65) {
      if(active===0 && delta<0)returnToOpening();
      else go(active + (delta > 0 ? 1 : -1));
      wheelIntent = 0;
    }
  } else {
    wheelIntent = 0;
  }
}, { passive: false });
viewport.addEventListener('pointerdown',e=>{if(overview||moving||e.button!==0||e.target.closest('button,.map-copy,.ai-word,.section-copy-panel'))return;drag={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');});
viewport.addEventListener('pointermove',e=>{if(!drag)return;const p=pages[active];camera.x=clamp(drag.cx-(e.clientX-drag.x)/camera.s,p.x,p.x+p.w);const bounds=verticalBounds();camera.y=clamp(drag.cy-(e.clientY-drag.y)/camera.s,bounds.top,bounds.bottom);render();});
function stopDrag(){drag=null;viewport.classList.remove('dragging');}viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);
window.addEventListener('keydown',e=>{if(e.target.closest('.article-reader,.section-copy-panel'))return;if(e.target.closest('button,a')&&['Enter',' '].includes(e.key))return;const actions={ArrowDown:()=>go(active+1),PageDown:()=>go(active+1),' ':()=>go(active+1),ArrowUp:()=>go(active-1),PageUp:()=>go(active-1),Home:returnToOpening,End:()=>go(pages.length-1),Escape:()=>overview?toggleMap():go(active),m:toggleMap};if(actions[e.key]){e.preventDefault();actions[e.key]();}});
window.addEventListener('resize',()=>{cancelAnimationFrame(animation);moving=false;if(overview){camera=overviewDestination();}else camera=destination(active);render();});
// Artwork and HTML copy are separate layers; SVG text is never rendered.
Promise.all([fetch('assets/text.html').then(r=>{if(!r.ok)throw Error('Text could not load');return r.text();}),new Promise((resolve,reject)=>{const img=new Image();img.className='artwork-layer';img.alt='';img.draggable=false;img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Artwork could not load'));img.src='assets/artwork.svg';})]).then(async ([html,img])=>{$('#content').append(img);const copy=document.createElement('div');copy.className='html-copy';copy.innerHTML=html;$('#content').append(copy);
for (const detail of copy.querySelectorAll('.bamboo-detail')) {
  detail.addEventListener('click', () => {
    detail.setAttribute('aria-pressed', String(detail.getAttribute('aria-pressed') !== 'true'));
  });
}
const materialsCopy = copy.querySelector('.materials-body-copy');
const materialsParagraph = materialsCopy.querySelector('p');
new ResizeObserver(() => {
  // Keep the exclusion at its widest point after the diagonal ends.
  const height = Math.max(177, materialsParagraph.offsetHeight);
  materialsCopy.style.setProperty('--materials-wrap-height', height + 'px');
}).observe(materialsParagraph);
await applyAITypography();setupPortraitCaptions();setupTypeHovers();render();setupColumnBounds();setupTechniqueDiagrams();setupArticlePreview();await setupMaterialsPopup();$('#loading').remove();if(showOpeningOnLoad)await setupOpening();}).catch(err=>{$('#loading').textContent=err.message+' — please run node server.cjs and open the local URL.';});
camera=destination(active);render();update();world.dataset.settledSection=String(active+1);










function setupTechniqueDiagrams() {
  const files = ["GDCBS-diagram-01-double-layered-bamboo-scaffolds.png","GDCBS-diagram-02-putlog-and-catch-fan.png","GDCBS-diagram-03-truss-out-bamboo-scaffolds.png","GDCBS-diagram-04-signboard-bamboo-scaffolds.png","GDCBS-diagram-05-base-support-double-layered-scaffolds.png","GDCBS-diagram-06-base-support-truss-out-scaffolds.png"];
  const holder = document.createElement('div');
  holder.className = 'technique-slideshow';
  const diagram = document.createElement('img');
  diagram.className = 'technique-diagram';
  diagram.draggable = false;
  const controls = document.createElement('div');
  controls.className = 'technique-controls';
  const counter = document.createElement('span');
  counter.setAttribute('aria-live', 'polite');
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = '→';
  next.setAttribute('aria-label', 'Next diagram');
  controls.append(counter, next);
  holder.append(diagram, controls);
  document.querySelector('.html-copy').append(holder);
  let index = 0;
  function show() {
    const file = files[index];
    diagram.src = 'assets/technique-diagrams/' + encodeURIComponent(file);
    diagram.alt = file.replace(/^GDCBS-diagram-\d+-|\.png$/g, '').replaceAll('-', ' ');
    counter.textContent = (index + 1) + ' / ' + files.length;
  }
  next.onclick = () => {
    index = (index + 1) % files.length;
    show();
  };
  show();
}

function setupColumnBounds() {
  const columns = [
    ['The three types body text', 1],
    ['The materials body text', 2],
    ['The techniques body text', 3],
    ['Between construction and the walker body text', 5],
    ['Beyond the facade body text', 6],
    ['Safety debate body text', 7]
  ];
  const originalHeights = pages.map(page => page.h);
  const observer = new ResizeObserver(updateBounds);
  const elements = columns.map(([label, index]) => {
    const element = document.querySelector('[aria-label="' + label + '"]');
    if (!element) throw new Error('Missing body column ' + label);
    observer.observe(element);
    return { element, index };
  });
  function updateBounds() {
    if (innerWidth <= 650 || overview || moving) return;
    const heights = [...originalHeights];
    for (const { element, index } of elements) {
      if (!element.offsetHeight) continue;
      const bottom = parseFloat(element.style.top) + element.offsetHeight + 64;
      heights[index] = Math.max(heights[index], (bottom - pages[index].y) * (index === 7 ? 1.2 : 1));
    }
    pages.forEach((page, index) => {
      page.h = heights[index];
      const region = document.querySelector('.region[data-page="' + index + '"]');
      if (region) region.style.height = page.h + 'px';
    });
  }
  window.addEventListener('resize', updateBounds);
  new MutationObserver(updateBounds).observe(world, {
    attributes: true,
    attributeFilter: ['data-settled-section']
  });
  updateBounds();
}

function setupPortraitCaptions() {
  const words = [...document.querySelectorAll('.ai-word')].filter(e => parseFloat(e.style.top) > 10000);
  const names = words.filter(e => Number(e.dataset.size) === 14);
  const rows = [...new Set(names.map(e => e.style.top))];
  rows.forEach(top => {
    const y = parseFloat(top);
    const group = words.filter(e => Math.abs(parseFloat(e.style.top) - y) < 85);
    const title = group.filter(e => Number(e.dataset.size) === 14);
    const role = group.filter(e => Number(e.dataset.size) !== 14);
    const caption = document.createElement('div');
    caption.className = 'portrait-caption';
    caption.style.left = Math.min(...title.map(e => parseFloat(e.style.left))) + 'px';
    caption.dataset.anchorX = String(Math.min(...title.map(e => parseFloat(e.style.left))));
    caption.style.top = (y - 14) + 'px';
    const name = document.createElement('strong');
    name.textContent = title.map(e => e.textContent).join(' ').replace(/-$/, '');
    const description = document.createElement('p');
    description.textContent = role.map(e => e.textContent).join(' ').replace(/-\s+/g, '');
    caption.append(name, description);
    document.querySelector('.html-copy').append(caption);
    group.forEach(e => e.remove());
  });
}

function setupTypeHovers() {
 const copy=document.querySelector('.html-copy');
 const old=copy.querySelector('[aria-label="The three types body text"]');
 const paragraphs=[...old.querySelectorAll('p')].map(p=>p.textContent);
 old.hidden=true;
 // Replace the separately positioned title words with wrapping HTML labels.
 copy.querySelectorAll('.ai-word').forEach(e=>{
   const y=parseFloat(e.style.top);
   if(Number(e.dataset.size)>15.9&&Number(e.dataset.size)<16.1&&y>2300&&y<2450)e.remove();
 });
 const details=[
  ['Double Layered Scaffolds',3219.91,2339.5648,paragraphs[1]],
  ['Truss-Out Scaffolds',3564.32,2333.1848,paragraphs[0]],
  ['Signboard Scaffolds',3901.31,2333.1848,paragraphs[2]]
 ];
 const description=document.createElement('div');
 description.className='type-description';
 description.setAttribute('role','status');
 copy.append(description);
 let selected=null;
 const buttons=[];
 function show(index){
   selected=index;
   buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
   description.textContent=index===null?'':details[index][3];
   description.hidden=index===null;
   if(index!==null){
     const [,x,y]=details[index];
     description.style.left=(x+18)+'px';
     description.style.top=(y+190)+'px';
     description.scrollTop=0;
   }
 }
 details.forEach(([title,x,y,body],index)=>{
   const label=document.createElement('div');label.className='type-image-title';label.textContent=title;
   label.style.cssText='left:'+x+'px;top:'+(y+330)+'px';copy.append(label);
   const button=document.createElement('button');button.className='type-image-hover';
   button.setAttribute('aria-label',title);button.setAttribute('aria-pressed','false');
   button.style.cssText='left:'+x+'px;top:'+y+'px;width:322.3px;height:322.2px';
   button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')show(index);});
   button.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse' && !description.contains(e.relatedTarget))show(null);});
   button.addEventListener('focus',()=>show(index));
   button.addEventListener('blur',()=>show(null));
   button.addEventListener('click',e=>{if(e.pointerType!=='mouse')show(index);});
   buttons.push(button);copy.append(button);
 });
 description.addEventListener('pointerleave',e=>{
   if(e.pointerType==='mouse'&&!buttons.some(b=>b.contains(e.relatedTarget)))show(null);
 });
 show(null);
}
