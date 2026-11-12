async function setupOpening({atEnd = false, fromChapter = false} = {}) {
  if(document.querySelector('.opening-view'))return;
  cancelAnimationFrame(animation);moving=false;
  document.body.classList.add('opening-active');
  document.body.style.setProperty('--opening-ui-progress',atEnd?'1':'0');
  const [html] = await Promise.all([
    fetch('assets/opening-text.html').then(r=>{if(!r.ok)throw Error('Opening text could not load');return r.text();}),
    document.fonts.load('36px "AI-Avenir-Black"')
  ]);
  const opening=document.createElement('section');
  opening.className='opening-view';
  opening.setAttribute('aria-label','Bamboo scaffoldings — opening');
  const stage=document.createElement('div');stage.className='opening-stage';stage.style.visibility='hidden';
  const art=new Image();art.alt='';art.src='assets/opening-art.svg';
  stage.append(art);stage.insertAdjacentHTML('beforeend',html);
  // Continue the same scaffold coordinates into the first chapter.
  document.querySelectorAll('.html-copy .ai-word').forEach(word=>{
    const y=parseFloat(word.style.top);
    if(y>=pages[0].y&&y<=pages[0].y+pages[0].h){
      const clone=word.cloneNode(true);
      clone.style.top=(y+2548.05)+'px';stage.append(clone);
    }
  });
  const next=document.createElement('button');next.className='opening-continue';
  next.textContent='↓';
  next.setAttribute('aria-label','Continue to How it grows');
  opening.append(stage,next);document.body.append(opening);
  history.replaceState(null,'','#opening');
  document.querySelector('#number').textContent='';
  document.querySelector('#title').textContent='Opening';
  await art.decode();
  let frame=0,ready=false,leaving=false,touchY=null;
  const scale=()=>destination(0).s;
  function draw(y) {
    const s=scale();
    // The last title runs from x=3771 to approximately 4250.
    const centerX=destination(0).x;
    stage.style.transform=`translate(${innerWidth/2-centerX*s}px,${innerHeight/2-y*s}px) scale(${s})`;
  }
  const start=performance.now(),duration=reduced.matches?0:fromChapter?1100:atEnd?0:4200;
  const firstY=fromChapter?destination(0).y+2548.05:atEnd?3058:innerHeight/(2*scale());
  draw(firstY);stage.style.visibility='visible';
  function tick(now){
    const t=duration?Math.min(1,(now-start)/duration):1;
    const eased=1-Math.pow(1-t,3);
    draw(firstY+(3058-firstY)*eased);
    document.body.style.setProperty('--opening-ui-progress',String(atEnd?1:Math.max(0,Math.min(1,(t-.55)/.45))));
    if(t<1)frame=requestAnimationFrame(tick);
    else{ready=true;opening.dataset.ready='true';}
  }
  frame=requestAnimationFrame(tick);
  function resize(){if(ready)draw(3058);}
  window.addEventListener('resize',resize);
  function cleanup(){
    cancelAnimationFrame(frame);
    window.removeEventListener('resize',resize);
    opening.remove();
    document.body.classList.remove('opening-active');
    document.body.style.removeProperty('--opening-ui-progress');
    window.closeOpening=null;
  }
  window.closeOpening=()=>{if(!leaving)cleanup();};
  function enter(){
    if(!ready||leaving)return;
    leaving=true;cancelAnimationFrame(frame);
    window.removeEventListener('resize',resize);
    go(0);
    const target=destination(0).y+2548.05;
    const begin=performance.now(),length=reduced.matches?0:1000;
    function finish(now){
      const t=length?Math.min(1,(now-begin)/length):1;
      const eased=t*t*(3-2*t);
      draw(3058+(target-3058)*eased);
      next.style.opacity=String(1-t);
      if(t<1)frame=requestAnimationFrame(finish);
      else{cleanup();cooldown=performance.now()+350;}
    }
    frame=requestAnimationFrame(finish);
  }
  next.onclick=enter;
  opening.addEventListener('wheel',e=>{e.preventDefault();if(e.deltaY>0)enter();},{passive:false});
  opening.addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;},{passive:true});
  opening.addEventListener('touchend',e=>{if(touchY!==null&&touchY-e.changedTouches[0].clientY>30)enter();touchY=null;});
  function key(e){if(['ArrowDown','PageDown',' ' ,'Enter'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();enter();}}
  opening.addEventListener('keydown',key);
  next.focus({preventScroll:true});
}
