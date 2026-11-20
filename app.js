'use strict';
(()=>{
  const $=s=>document.querySelector(s);
  const storageKey='itm325-vibecoding-progress-v1';
  const saved=(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}})();
  let platform=['Windows','Mac'].includes(saved.platform)?saved.platform:(navigator.userAgent.includes('Mac')?'Mac':'Windows');
  let complete=new Set(Array.isArray(saved.complete)?saved.complete:[]),last=saved.last||null;
  let manifest,chapters=[],lessons=[],current=null;
  const escape=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=u=>/^(https?:\/\/|themes-english\.zip$|#)/.test(u)?u:'#';
  function inline(text,links=[]){
    let s=String(text??'');const tokens=[];
    const token=html=>{tokens.push(html);return '\u0001'+(tokens.length-1)+'\u0002'};
    for(const link of links){if(link.text&&link.target&&/^https?:\/\//.test(link.target)&&s.includes(link.text))s=s.replace(link.text,token('<a href="'+escape(link.target)+'" target="_blank" rel="noopener">'+escape(link.text)+'</a>'));}
    s=s.replace(/`([^`]+)`/g,(_,c)=>token('<code>'+escape(c)+'</code>'));
    s=s.replace(/https?:\/\/[^\s<>]+/g,u=>{let end='';while(/[.,;)]$/.test(u)){end=u.slice(-1)+end;u=u.slice(0,-1)}return token('<a href="'+escape(u)+'" target="_blank" rel="noopener">'+escape(u)+'</a>')+end});
    s=escape(s).replace(/\u0001(\d+)\u0002/g,(_,n)=>tokens[Number(n)]);
    return s;
  }
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify({platform,complete:[...complete],last}))}catch{}}
  function route(l,s=0){return '#lesson='+encodeURIComponent(l)+'&step='+s;}
  function announce(t){$('#announcement').textContent=t;}
  function normalShell(where){return where.replace('normal shell',platform==='Windows'?'PowerShell':'Mac shell').replace('PowerShell or Mac shell',platform==='Windows'?'PowerShell':'Mac shell');}
  function actualCode(b){return platform==='Windows'&&b.windows?b.windows:platform==='Mac'&&b.mac?b.mac:b.text;}
  function codeHtml(b,extra=''){
    const text=actualCode(b),note=b.note||'',where=normalShell(b.where||'');
    if(!b.copy)return '<div class="reference"><div class="kind">'+escape(b.label||'Read this example — do not type')+'</div><pre><code>'+escape(text)+'</code></pre>'+(note?'<p>'+inline(note)+'</p>':'')+'</div>';
    const filePrompt=b.mode==='prompt'&&where.includes('prompt.md');
    return '<section class="input-area '+extra+'" aria-label="'+escape(b.label||'Input')+'"><div class="input-destination"><div class="input-location"><span class="where-label">Where to paste</span><strong>'+escape(where)+'</strong></div><button type="button" class="copy" aria-label="Copy '+escape(b.label||'input')+'">Copy</button></div><pre><code>'+escape(text)+'</code></pre>'+(note?'<p class="input-note">'+inline(note)+'</p>':'')+'</section>'+(filePrompt?'<div class="launch-prompt"><p>After saving the file, paste this instruction into <strong>Claude Code</strong> and press Enter.</p>'+codeHtml({mode:'command',copy:true,where:'Claude Code input · in the VS Code terminal panel',label:'Claude Code instruction',text:'Read @prompt.md and carry out the instructions in that file.'},'compact')+'</div>':'');
  }
  function setupHtml(b){
    const scope=b.scope?'<div class="setup-scope"><h4>Do in the guide</h4><p>'+inline(b.scope)+'</p></div>':'';
    const checks=Array.isArray(b.checks)&&b.checks.length?'<section class="check"><h3>Stop when</h3><ul>'+b.checks.map(t=>'<li>'+inline(t)+'</li>').join('')+'</ul></section>':'';
    const returnLink=b.returnUrl&&/^#lesson=[0-9.]+&step=\d+$/.test(b.returnUrl)?'<a class="button" href="'+escape(b.returnUrl)+'">'+escape(b.returnLabel||'Continue in this book')+'</a>':'';
    const back=b.returnText?'<section class="setup-return"><h4>Back in this book</h4><p>'+inline(b.returnText)+'</p>'+returnLink+'</section>':'';
    const html='<section class="setup-card"><h3>'+escape(b.label)+'</h3><p>'+inline(b.text)+'</p>'+scope+'<a class="button primary" href="'+escape(safeUrl(b.url))+'" target="_blank" rel="noopener">Open guide</a>'+checks+back+'</section>';
    return b.optional?'<details class="optional"><summary>'+escape(b.label)+'</summary>'+html+'</details>':html;
  }
  function renderBlocks(blocks,actionCount={value:0}){
    let html='',list=false;
    for(const b of blocks){
      if(b.platform&&b.platform!==platform)continue;
      if(b.type==='bullet'){if(!list){html+='<ul>';list=true}html+='<li>'+inline(b.text,b.links)+'</li>';continue}
      if(list){html+='</ul>';list=false}
      switch(b.type){
        case 'action':html+='<section class="action-block"><div class="action-heading"><span class="action-number">'+(++actionCount.value)+'</span><div><div class="action-location">'+escape(normalShell(b.where||''))+'</div><h3>'+inline(b.title)+'</h3></div></div><div class="action-content">'+renderBlocks(b.blocks||[])+'</div></section>';break;
        case 'explanation':html+='<section class="explanation-block"><div class="explanation-label">Explanation</div>'+renderBlocks(b.blocks||[])+'</section>';break;
        case 'paragraph':html+='<p>'+inline(b.text,b.links)+'</p>';break;
        case 'subheading':html+='<h3 class="subheading">'+inline(b.text)+'</h3>';break;
        case 'code':html+=codeHtml(b);break;
        case 'output':html+='<div class="reference"><div class="kind">'+escape(b.label||'Example output — do not type')+'</div><pre><code>'+escape(b.text)+'</code></pre></div>';break;
        case 'note':html+=b.optional?'<details class="optional"><summary>'+escape(b.title)+'</summary><p>'+inline(b.text)+'</p></details>':'<aside class="notice"><h3>'+escape(b.title)+'</h3><p>'+inline(b.text)+'</p></aside>';break;
        case 'details':html+='<details class="optional"><summary>'+escape(b.title)+'</summary><div class="optional-content">'+renderBlocks(b.blocks||[])+'</div></details>';break;
        case 'check':html+='<section class="check"><h3>Done when</h3><p>'+inline(b.text)+'</p></section>';break;
        case 'setup':html+=setupHtml(b);break;
        case 'download':html+='<section class="setup-card"><h3>'+escape(b.label)+'</h3><p>'+inline(b.text)+'</p><a class="button" href="'+escape(safeUrl(b.url))+'" download>Download themes</a></section>';break;
        case 'table':html+='<div class="table-wrap"><table class="data-table"><thead><tr>'+b.rows[0].map(t=>'<th scope="col">'+inline(t)+'</th>').join('')+'</tr></thead><tbody>'+b.rows.slice(1).map(r=>'<tr>'+r.map(t=>'<td>'+inline(t)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';break;
        case 'image':html+='<figure class="guide-image"><button type="button" class="image-button" aria-label="Enlarge '+escape(b.alt)+'"><img src="'+escape(b.src)+'" alt="'+escape(b.alt)+'" loading="lazy" decoding="async"></button><figcaption>'+escape(b.caption)+' Select image to enlarge.</figcaption></figure>';break;
      }
    }
    if(list)html+='</ul>';return html;
  }
  function renderNav(){
    $('#chapter-nav').innerHTML=chapters.map(ch=>'<details class="chapter" '+(current?.chapter===ch.number?'open':'')+'><summary>'+ch.number+'. '+escape(ch.shortTitle)+'</summary><ol>'+ch.lessons.map(l=>'<li><a href="'+route(l.id)+'" '+(current?.id===l.id?'aria-current="page"':'')+' class="'+(l.platform&&l.platform!==platform?'other-os':'')+'"><span class="lesson-number">'+l.id+'</span><span>'+escape(l.title)+(complete.has(l.id)?' ✓':'')+'</span></a></li>').join('')+'</ol></details>').join('');
  }
  function home(){
    current=null;document.title='ITM 325 · Vibe Coding';
    const resume=last&&lessons.find(l=>l.id===last.lesson);
    $('#main').innerHTML='<section class="home-intro"><div class="eyebrow">Your course companion</div><h1>Build your project.<br>Understand each step.</h1><p class="lead">Follow the same order as your guidebook. Read the explanation, follow the numbered actions in the named app, and check the result before moving on.</p></section><div class="continue-panel"><div><strong>'+(resume?'Continue where you left off':'Start with the terminal')+'</strong><p>'+(resume?escape(resume.id+' '+resume.title):'Choose your computer at the top. Follow only its Windows or Mac instructions.')+'</p></div><a class="button primary" href="'+(resume?route(resume.id,last.step):route('1.1'))+'">'+(resume?'Continue reading':'Start the book')+'</a></div><h2>Course sequence</h2><p class="lead">Nine chapters, in the original teaching order. Deployment stays in Lesson 4.7.</p><div class="course-map">'+chapters.map(ch=>'<section class="chapter-card"><div class="chapter-count">Chapter '+ch.number+'</div><h2>'+escape(ch.shortTitle)+'</h2><p>'+ch.lessons.length+' lessons · '+ch.lessons[0].id+'–'+ch.lessons[ch.lessons.length-1].id+'</p><a href="'+route(ch.lessons[0].id)+'">Open chapter</a></section>').join('')+'</div><details class="reading-guide" open><summary>How to use this book</summary><div class="legend"><section><h3>Read or do?</h3><p>Read pages explain concepts. Do this pages show numbered actions with the app or screen to use. Optional details stay folded.</p></section><section><h3>Copy only the input</h3><p>Copy buttons appear on prompts, commands, and file contents. The label names the exact place to paste.</p></section><section><h3>Check your result</h3><p>Compare the required behavior, not just the appearance. AI-generated pages may look different.</p></section></div><p>Installation guides open in a new tab. Complete only the steps named in this book, check the stopping point, and return to the lesson shown. Authentication and authorization stay at the concept level. Your reading position is saved in this browser.</p></details>';
    renderNav();
  }
  function adjacent(l,delta){let i=lessons.indexOf(l)+delta;while(i>=0&&i<lessons.length){const next=lessons[i];if(!next.platform||next.platform===platform)return next;i+=delta}return null;}
  function stepLabel(kind){return kind==='Understand'?'Read · explanation':kind==='Practice'?'Do this · practice':kind==='Optional'?'Optional · choose if useful':'Only if needed · reference';}
  function readingPages(l){
    const fallback=()=>l.steps.map((s,i)=>({title:s.title,steps:[i]}));
    if(!Array.isArray(l.pages)||!l.pages.length)return fallback();
    if(l.pages.some(p=>typeof p.title!=='string'||!Array.isArray(p.steps)||!p.steps.length))return fallback();
    const indices=l.pages.flatMap(p=>p.steps);
    return indices.length===l.steps.length&&indices.every((n,i)=>n===i)?l.pages:fallback();
  }
  function pageKind(l,page){
    const kinds=page.steps.map(i=>l.steps[i].kind);
    return kinds.includes('Practice')?'Practice':kinds.includes('Only if needed')?'Only if needed':kinds.includes('Optional')?'Optional':'Understand';
  }
  function lessonPage(l,index){
    const pages=readingPages(l),pageIndex=pages.findIndex(p=>p.steps.includes(index)),page=pages[pageIndex];
    current={id:l.id,chapter:l.chapter,step:index};last={lesson:l.id,step:index};persist();document.title=l.id+' '+l.title+' · ITM 325';
    const ch=chapters.find(c=>c.number===l.chapter),prev=adjacent(l,-1),next=adjacent(l,1);
    const prevHref=pageIndex?route(l.id,pages[pageIndex-1].steps[0]):prev?route(prev.id,readingPages(prev).at(-1).steps[0]):'#';
    const nextHref=pageIndex<pages.length-1?route(l.id,pages[pageIndex+1].steps[0]):next?route(next.id):'#';
    const stepNav='<nav class="step-menu" aria-label="Pages in this lesson"><h3>IN THIS LESSON</h3><ol>'+pages.map((p,j)=>'<li><a href="'+route(l.id,p.steps[0])+'" '+(j===pageIndex?'aria-current="step"':'')+'><span class="step-index">'+(j+1)+'</span><span>'+escape(p.title)+'</span></a></li>').join('')+'</ol></nav>';
    const actionCount={value:0},combined=page.steps.length>1;
    const content=(combined?'<h2 class="reading-page-title">'+escape(page.title)+'</h2>':'')+page.steps.map(i=>{
      const s=l.steps[i];
      return '<section class="lesson-part" id="lesson-step-'+i+'" tabindex="-1"><div class="step-context">Step '+(i+1)+' · '+escape(stepLabel(s.kind))+'</div>'+(combined?'<h3 class="part-title">'+escape(s.title)+'</h3>':'<h2>'+escape(s.title)+'</h2>')+renderBlocks(s.blocks,actionCount)+'</section>';
    }).join('');
    $('#main').innerHTML='<div class="breadcrumb"><a href="#">Course</a> / '+ch.number+' '+escape(ch.shortTitle)+' / '+l.id+'</div><header class="lesson-lead"><h1>'+escape(l.id+' '+l.title)+'</h1>'+(l.conceptOnly?'<div class="concept-badge">Concept lesson · no implementation task</div>':'')+(l.objective?'<p class="objective">'+inline(l.objective)+'</p>':'')+'</header>'+(l.platform&&l.platform!==platform?'<p class="cross-platform">This lesson is for '+escape(l.platform)+'. Your selected computer is '+escape(platform)+'. You can read it, or select your platform’s lesson from Contents.</p>':'')+'<div class="lesson-progress"><span>Page '+(pageIndex+1)+' of '+pages.length+' · '+escape(stepLabel(pageKind(l,page)))+'</span><progress max="'+pages.length+'" value="'+(pageIndex+1)+'" aria-label="Current lesson position"></progress></div><div class="lesson-layout"><article class="step-body">'+(pageIndex===0&&l.intro.length?'<div class="lesson-intro">'+renderBlocks(l.intro)+'</div>':'')+content+(pageIndex===pages.length-1?'<label class="complete-label"><input type="checkbox" id="complete-lesson" '+(complete.has(l.id)?'checked':'')+'> I have completed this lesson</label>':'')+'<footer class="step-footer"><a class="button" href="'+prevHref+'">'+(pageIndex?'Previous page':'Previous lesson')+'</a><span class="footer-label">'+l.id+' · '+(pageIndex+1)+' / '+pages.length+'</span><a class="button primary" href="'+nextHref+'">'+(pageIndex<pages.length-1?'Next page':next?'Next lesson':'Course overview')+'</a></footer></article>'+stepNav+'</div>';
    renderNav();announce(l.id+', '+page.title);
    return index===page.steps[0]?null:'lesson-step-'+index;
  }
  function render(){
    const params=new URLSearchParams(location.hash.replace(/^#/,'')),id=params.get('lesson');
    const l=lessons.find(x=>x.id===id);let index=Number(params.get('step')||0);
    let target=null;
    if(l){if(!Number.isInteger(index)||index<0||index>=l.steps.length)index=0;target=lessonPage(l,index)}else home();
    $('#sidebar').classList.remove('is-open');$('#outline-toggle').setAttribute('aria-expanded','false');
    return target;
  }
  function positionReading(target,focusMain=false){
    if(target){const section=$('#'+target);section.scrollIntoView({block:'start',behavior:'instant'});section.focus({preventScroll:true})}
    else if(focusMain){window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true})}
  }
  document.addEventListener('click',async e=>{
    const copy=e.target.closest('.copy');
    if(copy){const el=copy.closest('.input-area').querySelector('pre code');try{await navigator.clipboard.writeText(el.textContent);copy.textContent='Copied';announce('Input copied.');setTimeout(()=>{if(copy.isConnected)copy.textContent='Copy'},1800)}catch{const r=document.createRange();r.selectNodeContents(el);const s=window.getSelection();s.removeAllRanges();s.addRange(r);copy.textContent='Text selected';announce('Text selected. Use your computer’s copy shortcut.')}return}
    const image=e.target.closest('.image-button');if(image){const i=image.querySelector('img'),dialog=$('#image-dialog');dialog.querySelector('img').src=i.src;dialog.querySelector('img').alt=i.alt;dialog.querySelector('p').textContent=i.alt;dialog.showModal();return}
  });
  $('#close-image').addEventListener('click',()=>$('#image-dialog').close());
  $('#image-dialog').addEventListener('click',e=>{if(e.target===$('#image-dialog'))$('#image-dialog').close()});
  $('#platform').value=platform;
  $('#platform').addEventListener('change',e=>{platform=e.target.value;persist();render()});
  $('#outline-toggle').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('is-open');$('#outline-toggle').setAttribute('aria-expanded',String(open))});
  document.addEventListener('change',e=>{if(e.target.id==='complete-lesson'&&current){e.target.checked?complete.add(current.id):complete.delete(current.id);persist();renderNav()}});
  $('#search').addEventListener('input',e=>{
    const q=e.target.value.trim().toLowerCase(),result=$('#search-results');result.hidden=!q;$('#chapter-nav').hidden=!!q;
    if(!q){result.innerHTML='';return}
    const found=lessons.map(l=>({l,step:l.steps.findIndex(s=>(s.title+' '+JSON.stringify(s.blocks)).toLowerCase().includes(q))})).filter(x=>(x.l.id+' '+x.l.title).toLowerCase().includes(q)||x.step>=0).slice(0,30);
    result.innerHTML=found.length?found.map(({l,step})=>'<a href="'+route(l.id,Math.max(0,step))+'">'+escape(l.id+' '+l.title)+'</a>').join(''):'<p>No matching lesson. Try a shorter word.</p>';
  });
  $('#search-results').addEventListener('click',e=>{if(e.target.closest('a')){$('#search').value='';$('#search-results').hidden=true;$('#chapter-nav').hidden=false}});
  window.addEventListener('hashchange',()=>{positionReading(render(),true)});
  async function start(){
    try{
      const r=await fetch('book.json');if(!r.ok)throw new Error('Book index is unavailable.');manifest=await r.json();
      chapters=await Promise.all(manifest.chapters.map(async c=>{const res=await fetch(c.file);if(!res.ok)throw new Error('A chapter could not be loaded.');return res.json()}));
      const entries=new Map(manifest.chapters.flatMap(c=>c.lessons.map(l=>[l.id,l])));
      lessons=chapters.flatMap(c=>c.lessons.map(l=>({...l,chapter:c.number,pages:entries.get(l.id)?.pages})));positionReading(render());
    }catch(e){$('#main').innerHTML='<section class="error-state"><h1>The book could not open</h1><p>Check your connection and reload this page.</p><button class="button" id="reload-book" type="button">Reload book</button><p><a href="https://github.com/cyj-oss/itm325-vibecoding">Open the course repository</a></p></section>';$('#reload-book').addEventListener('click',()=>location.reload());}
  }
  start();
})();
