// Fit native HTML words to the exported line envelopes. Canvas measures text only;
// every visible character remains selectable HTML.
async function restoreTextShapes(){
 await document.fonts.load('10pt "Avenir"');await document.fonts.ready;
 const response=await fetch('assets/shapes.json');if(!response.ok)throw Error('Shape profiles could not load');
 const source=await response.json(),ctx=document.createElement('canvas').getContext('2d');
 const leading=11*96/72;ctx.font='10px Avenir';
 const profiles=source.shapes.map(s=>({id:s.id,lines:s.lines.map(l=>({x:l.x,y:l.y,width:Math.max(35,l.endX+ctx.measureText(l.endText||' ').width-l.x)})),text:s.lines.map(l=>l.text.trim()).join(' ').replace(/-\s+/g,'').replace(/\s+/g,' ')}));
 for(const s of source.special){const el=document.querySelector(`[data-text-block="${s.id}"]`);profiles.push({id:s.id,text:el.textContent.trim().replace(/\s+/g,' '),lines:Array.from({length:s.rows},(_,i)=>{let width=s.width-(s.width-s.last)*i/(s.rows-1);return{x:(s.width-width)/2,y:i*12,width};})});}
 ctx.font='10pt Avenir';
 function profileAt(lines,t){let f=t*(lines.length-1),i=Math.floor(f),a=lines[i],b=lines[Math.min(i+1,lines.length-1)],u=f-i;return{x:a.x+(b.x-a.x)*u,width:a.width+(b.width-a.width)*u};}
 for(const p of profiles){const el=document.querySelector(`[data-text-block="${p.id}"]`);if(!el)continue;const words=p.text.split(/\s+/);let fitted;
  for(let n=p.lines.length;n<300;n++){let word=0,rows=[];for(let i=0;i<n&&word<words.length;i++){const box=profileAt(p.lines,i/(n-1)),parts=[];while(word<words.length){const next=[...parts,words[word]].join(' ');if(parts.length&&ctx.measureText(next).width>box.width)break;parts.push(words[word++]);}rows.push({...box,text:parts.join(' ')});}if(word===words.length){fitted=rows;break;}}
  if(!fitted)continue;el.replaceChildren();el.classList.remove('flow-copy');el.classList.add('shaped-copy');
  // Keep the source anchor and horizontal shape; height follows 11pt leading.
  const originY=source.shapes.some(s=>s.id===p.id)?p.lines[0].y-leading*.8:0;
  for(let i=0;i<fitted.length;i++){const row=fitted[i],span=document.createElement('span');span.className='copy-line';span.style.cssText=`left:${row.x}px;top:${originY+i*leading}px;width:${row.width}px;line-height:11pt;font-size:10pt;`;span.textContent=row.text;el.append(span);}
 }
 document.documentElement.dataset.typographyReady='true';
}
