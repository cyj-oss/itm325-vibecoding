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
    return '<section class="input-area '+extra+'" aria-label="'+escape(b.label||'Input')+'"><div class="input-destination"><span class="where-label">Where to paste</span><strong>'+escape(where)+'</strong></div><div class="code-head"><span class="kind">'+escape(b.label||'Input')+'</span><button type="button" class="copy" aria-label="Copy '+escape(b.label||'input')+'">Copy</button></div><pre><code>'+escape(text)+'</code></pre>'+(note?'<p class="input-note">'+inline(note)+'</p>':'')+'</section>'+(filePrompt?'<div class="launch-prompt"><p>After saving the file, paste this instruction into <strong>Claude Code</strong> and press Enter.</p>'+codeHtml({mode:'command',copy:true,where:'Claude Code input · in the VS Code terminal panel',label:'Claude Code instruction',text:'Read @prompt.md and carry out the instructions in that file.'},'compact')+'</div>':'');
  }
  function renderBlocks(blocks){
    let html='',list=false;
    for(const b of blocks){
      if(b.platform&&b.platform!==platform)continue;
      if(b.type==='bullet'){if(!list){html+='<ul>';list=true}html+='<li>'+inline(b.text,b.links)+'</li>';continue}
      if(list){html+='</ul>';list=false}
      switch(b.type){
        case 'paragraph':html+='<p>'+inline(b.text,b.links)+'</p>';break;
        case 'subheading':html+='<h3 class="subheading">'+inline(b.text)+'</h3>';break;
        case 'code':html+=codeHtml(b);break;
        case 'output':html+='<div class="reference"><div class="kind">'+escape(b.label||'Example output — do not type')+'</div><pre><code>'+escape(b.text)+'</code></pre></div>';break;
        case 'note':html+=b.optional?'<details class="optional"><summary>'+escape(b.title)+'</summary><p>'+inline(b.text)+'</p></details>':'<aside class="notice"><h3>'+escape(b.title)+'</h3><p>'+inline(b.text)+'</p></aside>';break;
        case 'check':html+='<section class="check"><h3>Check before continuing</h3><p>'+inline(b.text)+'</p></section>';break;
        case 'setup':case 'download':html+='<section class="setup-card"><h3>'+escape(b.label)+'</h3><p>'+inline(b.text)+'</p><a class="button" href="'+escape(safeUrl(b.url))+'" '+(b.type==='download'?'download':'target="_blank" rel="noopener"')+'>'+escape(b.type==='download'?'Download themes':'Open guide')+'</a></section>';break;
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
    $('#main').innerHTML='<section class="home-intro"><div class="eyebrow">Your course companion</div><h1>Build your project.<br>Understand each step.</h1><p class="lead">Follow the same order as your guidebook. Read the explanation, use the clearly labeled input, and check the result before moving on.</p></section><div class="continue-panel"><div><strong>'+(resume?'Continue where you left off':'Start with the terminal')+'</strong><p>'+(resume?escape(resume.id+' '+resume.title):'Choose your computer at the top. Follow only its Windows or Mac instructions.')+'</p></div><a class="button primary" href="'+(resume?route(resume.id,last.step):route('1.1'))+'">'+(resume?'Continue reading':'Start the book')+'</a></div><h2>Course sequence</h2><p class="lead">Nine chapters, in the original teaching order. Deployment stays in Lesson 4.7.</p><div class="course-map">'+chapters.map(ch=>'<section class="chapter-card"><div class="chapter-count">Chapter '+ch.number+'</div><h2>'+escape(ch.shortTitle)+'</h2><p>'+ch.lessons.length+' lessons · '+ch.lessons[0].id+'–'+ch.lessons[ch.lessons.length-1].id+'</p><a href="'+route(ch.lessons[0].id)+'">Open chapter</a></section>').join('')+'</div><details class="reading-guide" open><summary>How to use this book</summary><div class="legend"><section><h3>Read the explanation</h3><p>Normal text explains what you are doing. Additional detail opens only when you need it.</p></section><section><h3>Copy only the input</h3><p>Copy buttons appear on prompts, commands, and file contents. The label names the exact place to paste.</p></section><section><h3>Check your result</h3><p>Compare the required behavior, not just the appearance. AI-generated pages may look different.</p></section></div><p>Installation lessons open the existing course setup guides. Authentication and authorization stay at the concept level. Your reading position is saved in this browser.</p></details>';
    renderNav();
  }
  function adjacent(l,delta){let i=lessons.indexOf(l)+delta;while(i>=0&&i<lessons.length){const next=lessons[i];if(!next.platform||next.platform===platform)return next;i+=delta}return null;}
  function lessonPage(l,index){
    const st=l.steps[index];current={id:l.id,chapter:l.chapter,step:index};last={lesson:l.id,step:index};persist();document.title=l.id+' '+l.title+' · ITM 325';
    const ch=chapters.find(c=>c.number===l.chapter),prev=adjacent(l,-1),next=adjacent(l,1);
    const prevHref=index?route(l.id,index-1):prev?route(prev.id,prev.steps.length-1):'#';
    const nextHref=index<l.steps.length-1?route(l.id,index+1):next?route(next.id):'#';
    const stepNav='<nav class="step-menu" aria-label="Steps in this lesson"><h3>IN THIS LESSON</h3><ol>'+l.steps.map((s,j)=>'<li><a href="'+route(l.id,j)+'" '+(j===index?'aria-current="step"':'')+'><span class="step-index">'+(j+1)+'</span><span>'+escape(s.title)+'</span></a></li>').join('')+'</ol></nav>';
    $('#main').innerHTML='<div class="breadcrumb"><a href="#">Course</a> / '+ch.number+' '+escape(ch.shortTitle)+' / '+l.id+'</div><header class="lesson-lead"><h1>'+escape(l.id+' '+l.title)+'</h1>'+(l.conceptOnly?'<div class="concept-badge">Concept lesson · no implementation task</div>':'')+(l.objective?'<p class="objective">'+inline(l.objective)+'</p>':'')+'</header>'+(l.platform&&l.platform!==platform?'<p class="cross-platform">This lesson is for '+escape(l.platform)+'. Your selected computer is '+escape(platform)+'. You can read it, or select your platform’s lesson from Contents.</p>':'')+'<div class="lesson-progress"><span>Step '+(index+1)+' of '+l.steps.length+' · '+escape(st.kind)+'</span><progress max="'+l.steps.length+'" value="'+(index+1)+'" aria-label="Current lesson position"></progress></div><div class="lesson-layout"><article class="step-body">'+(index===0&&l.intro.length?'<div class="lesson-intro">'+renderBlocks(l.intro)+'</div>':'')+'<div class="step-context">'+escape(st.kind)+'</div><h2>'+escape(st.title)+'</h2>'+renderBlocks(st.blocks)+(index===l.steps.length-1?'<label class="complete-label"><input type="checkbox" id="complete-lesson" '+(complete.has(l.id)?'checked':'')+'> I have completed this lesson</label>':'')+'<footer class="step-footer"><a class="button" href="'+prevHref+'">'+(index?'Previous step':'Previous lesson')+'</a><span class="footer-label">'+l.id+' · '+(index+1)+' / '+l.steps.length+'</span><a class="button primary" href="'+nextHref+'">'+(index<l.steps.length-1?'Next step':next?'Next lesson':'Course overview')+'</a></footer></article>'+stepNav+'</div>';
    renderNav();announce(l.id+', '+st.title);
  }
  function render(){
    const params=new URLSearchParams(location.hash.replace(/^#/,'')),id=params.get('lesson');
    const l=lessons.find(x=>x.id===id);let index=Number(params.get('step')||0);
    if(l){if(!Number.isInteger(index)||index<0||index>=l.steps.length)index=0;lessonPage(l,index)}else home();
    $('#sidebar').classList.remove('is-open');$('#outline-toggle').setAttribute('aria-expanded','false');
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
  window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true})});
  async function start(){
    try{
      const r=await fetch('book.json');if(!r.ok)throw new Error('Book index is unavailable.');manifest=await r.json();
      chapters=await Promise.all(manifest.chapters.map(async c=>{const res=await fetch(c.file);if(!res.ok)throw new Error('A chapter could not be loaded.');return res.json()}));
      lessons=chapters.flatMap(c=>c.lessons.map(l=>({...l,chapter:c.number})));render();
    }catch(e){$('#main').innerHTML='<section class="error-state"><h1>The book could not open</h1><p>Check your connection and reload this page.</p><button class="button" id="reload-book" type="button">Reload book</button><p><a href="https://github.com/cyj-oss/itm325-vibecoding">Open the course repository</a></p></section>';$('#reload-book').addEventListener('click',()=>location.reload());}
  }
  start();
})();
