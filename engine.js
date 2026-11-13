/* ---------- quiz engine: menu, navigation (prev / next / skip / jump), restart, redo, resume ---------- */
const CATS=[["tut","Tutorial originals"],["var","Tutorial rewordings"],["con","Concepts & details"],["fig","Figures & models"],["calc","Calculations"],["trap","Traps & corrections"],["open","Open-ended"]];
const view=document.getElementById("view");
const store={get(k,d){try{const v=localStorage.getItem("em0508:"+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("em0508:"+k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem("em0508:"+k)}catch(e){}}};
let cfg=store.get("cfg",{topics:[1],cats:CATS.map(c=>c[0]),count:20,mode:"practice"});
let run=null;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
const catOf=q=>{const s=new Set([q.c]);if(q.k==="open")s.add("open");if(q.img)s.add("fig");if(q.k==="gen")s.add("calc");return s};
function pool(topics,cats){return QB.filter(q=>topics.includes(q.t)&&[...catOf(q)].some(c=>cats.includes(c)))}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function instantiate(q){
  const si=QB.indexOf(q);
  if(q.k==="gen"){const r=q.fn();return Object.assign({t:q.t,c:q.c,si},r,{k:r.k||"num"})}
  const o={...q,si};
  if((q.k==="mcq"||q.k==="multi")&&!q.o.some(x=>/of the above|both|none of/i.test(x))){
    const idx=shuffle(q.o.map((_,i)=>i));o.o=idx.map(i=>q.o[i]);
    o.a=q.k==="multi"?q.a.map(a=>idx.indexOf(a)):idx.indexOf(q.a)}
  return o}
const srcOf=q=>QB[q.si];
function save(){if(!run)return;store.set("run",{qs:run.qs.map(q=>{const c={...q};delete c.fn;return c}),ans:run.ans,i:run.i,mode:run.mode,done:run.done,title:run.title})}
function openLB(src){document.getElementById("lbimg").src=src;document.getElementById("lb").hidden=false}
document.getElementById("lb").onclick=()=>document.getElementById("lb").hidden=true;

/* ---------- menu ---------- */
function home(){
  run=null;
  const best=store.get("best",{}), saved=store.get("run",null);
  const counts=t=>QB.filter(q=>q.t===t).length;
  const savedInfo=saved&&!saved.done?`${saved.title||"Quiz"} · question ${saved.i+1} of ${saved.qs.length} · ${saved.ans.filter(Boolean).length} answered`:"";
  view.innerHTML=`<section class="setup">
  ${savedInfo?`<div class="panel resume"><div><div class="label">Unfinished quiz</div><div>${esc(savedInfo)}</div></div><div class="row"><button class="btn" id="resume">Resume</button><button class="btn ghost" id="discard">Discard</button></div></div>`:""}
  <div class="panel group"><div class="label">Quick start</div>
    <div class="row">${Object.keys(TOPICS).map(n=>`<button class="pill" data-qs="${n}">Topic ${n}</button>`).join("")}</div>
    <div class="row" style="margin-top:8px">
      <button class="pill" data-preset="tut">All tutorial questions</button>
      <button class="pill" data-preset="calc">Calculation drill</button>
      <button class="pill" data-preset="fig">Figures & models</button>
      <button class="pill" data-preset="trap">Traps only</button>
      <button class="pill" data-preset="mock">Mock exam · 40 · all topics</button>
    </div><p class="hint" style="margin:8px 0 0">Quick start ignores the custom setup below.</p></div>
  <div class="panel group"><div class="label">Select topics</div>
    <div class="chips">${Object.entries(TOPICS).map(([n,name])=>`<button class="chip" data-t="${n}" aria-pressed="${cfg.topics.includes(+n)}"><b>Topic ${n}</b><span>${name}</span><small>${counts(+n)} questions${best[n]!=null?` · best ${best[n]}%`:""}</small></button>`).join("")}</div>
    <div class="row" style="margin-top:10px"><button class="pill" id="allT">Select all chapters</button><button class="pill" id="noneT">Clear</button></div></div>
  <div class="panel group"><div class="label">Question types</div>
    <div class="row">${CATS.map(([k,l])=>`<button class="pill" data-c="${k}" aria-pressed="${cfg.cats.includes(k)}">${l}</button>`).join("")}</div>
    <div class="row" style="margin-top:10px"><button class="pill" id="allC">All types</button></div>
    <p class="hint" style="margin:8px 0 0">Calculations draw new numbers each run. Choosing only Calculations gives three versions of every calculation.</p></div>
  <div class="panel group"><div class="label">Length & mode</div>
    <div class="row">${[10,20,40,80,0].map(n=>`<button class="pill" data-n="${n}" aria-pressed="${cfg.count===n}">${n||"Everything"}</button>`).join("")}</div>
    <div class="row" style="margin-top:10px">${[["practice","Practice · answer shown after each question"],["exam","Exam · answers shown at the end"]].map(([m,l])=>`<button class="pill" data-m="${m}" aria-pressed="${cfg.mode===m}">${l}</button>`).join("")}</div></div>
  <div class="actions"><span class="count" id="avail"></span><button class="btn" id="go">Start quiz</button></div>
  </section>`;
  const upd=()=>{const n=pool(cfg.topics,cfg.cats).length;document.getElementById("avail").textContent=`${n} questions match`;document.getElementById("go").disabled=!n;store.set("cfg",cfg)};
  const $=s=>view.querySelector(s), $$=s=>view.querySelectorAll(s);
  if($("#resume")){$("#resume").onclick=()=>{run=Object.assign(saved,{});run.qs.forEach(q=>{if(srcOf(q)&&srcOf(q).fn)q.fn=undefined});render()};$("#discard").onclick=()=>{store.del("run");home()}}
  $$("[data-qs]").forEach(b=>b.onclick=()=>start(pool([+b.dataset.qs],CATS.map(c=>c[0])),{count:20,mode:cfg.mode,title:`Topic ${b.dataset.qs}`}));
  $$("[data-preset]").forEach(b=>b.onclick=()=>{const p=b.dataset.preset,all=[1,2,3,4,5,6,7,8];
    if(p==="mock")start(pool(all,CATS.map(c=>c[0])),{count:40,mode:"exam",title:"Mock exam"});
    else if(p==="calc")start(pool(cfg.topics.length?cfg.topics:all,["calc"]),{count:0,mode:cfg.mode,triple:true,title:"Calculation drill"});
    else start(pool(all,[p]),{count:0,mode:cfg.mode,title:b.textContent})});
  $$("[data-t]").forEach(b=>b.onclick=()=>{const t=+b.dataset.t;cfg.topics=cfg.topics.includes(t)?cfg.topics.filter(x=>x!==t):[...cfg.topics,t];b.setAttribute("aria-pressed",cfg.topics.includes(t));upd()});
  $("#allT").onclick=()=>{cfg.topics=[1,2,3,4,5,6,7,8];store.set("cfg",cfg);home()};
  $("#noneT").onclick=()=>{cfg.topics=[];store.set("cfg",cfg);home()};
  $("#allC").onclick=()=>{cfg.cats=CATS.map(c=>c[0]);store.set("cfg",cfg);home()};
  $$("[data-c]").forEach(b=>b.onclick=()=>{const c=b.dataset.c;cfg.cats=cfg.cats.includes(c)?cfg.cats.filter(x=>x!==c):[...cfg.cats,c];b.setAttribute("aria-pressed",cfg.cats.includes(c));upd()});
  $$("[data-n]").forEach(b=>b.onclick=()=>{cfg.count=+b.dataset.n;$$("[data-n]").forEach(x=>x.setAttribute("aria-pressed",x===b));upd()});
  $$("[data-m]").forEach(b=>b.onclick=()=>{cfg.mode=b.dataset.m;$$("[data-m]").forEach(x=>x.setAttribute("aria-pressed",x===b));upd()});
  $("#go").onclick=()=>start(pool(cfg.topics,cfg.cats),{count:cfg.count,mode:cfg.mode,triple:cfg.cats.length===1&&cfg.cats[0]==="calc",title:"Custom quiz"});
  upd();window.scrollTo(0,0);
}

/* ---------- run lifecycle ---------- */
function start(src,o){
  let list=shuffle(src);
  if(o.triple)list=shuffle(list.flatMap(q=>q.k==="gen"?[q,q,q]:[q]));
  if(o.count)list=list.slice(0,o.count);
  if(!list.length)return;
  run={qs:list.map(instantiate),ans:[],i:0,mode:o.mode,done:false,title:o.title||"Quiz"};
  save();render();
}
function redo(sameNumbers){ // same questions, answers cleared
  const qs=sameNumbers?run.qs.map(q=>{const c={...q};return c}):run.qs.map(q=>instantiate(srcOf(q)));
  run={qs,ans:[],i:0,mode:run.mode,done:false,title:run.title};save();render();
}

/* ---------- question view ---------- */
function tagHtml(q){const L={tut:"Tutorial",var:"Tutorial · reworded",con:"Concept",fig:"Figure",calc:"Calculation",trap:"Trap",open:"Open-ended"};
  return `<div class="tags"><span class="tag">Topic ${q.t}</span><span class="tag ${q.c}">${L[q.c]||q.c}</span>${q.ref?`<span class="tag">${esc(q.ref)}</span>`:""}</div>`}
function figHtml(q){if(!q.img)return"";const [src,cap]=Array.isArray(q.img)?q.img:[q.img,""];return `<figure><img src="img/${src}" alt="${esc(cap||"Course figure")}" loading="lazy">${cap?`<figcaption>${esc(cap)}</figcaption>`:""}</figure>`}
function dotState(i){const a=run.ans[i];if(!a)return run.seen&&run.seen[i]?"skipped":"";if(a.skip)return"skipped";if(run.mode==="exam"&&!run.done)return"answered";return a.ok?"right":"wrong"}
function navGrid(){return `<div class="dots" role="navigation" aria-label="Question map">${run.qs.map((_,i)=>`<button class="dot ${dotState(i)} ${i===run.i?"cur":""}" data-go="${i}" aria-label="Question ${i+1}">${i+1}</button>`).join("")}</div>`}
function render(){
  const q=run.qs[run.i], n=run.qs.length, a=run.ans[run.i]&&!run.ans[run.i].skip?run.ans[run.i]:null;
  run.seen=run.seen||[];run.seen[run.i]=true;
  const locked=!!a&&(run.mode==="practice"||run.done);
  const answered=run.ans.filter(x=>x&&!x.skip).length;
  let body="";
  if(q.k==="mcq"||q.k==="tf"||q.k==="multi"){
    body=`<div class="opts">${q.o.map((o,i)=>`<button class="opt" data-i="${i}" aria-pressed="false"><span class="k">${q.k==="tf"?"":String.fromCharCode(65+i)}</span><span>${o}</span></button>`).join("")}</div>${q.k==="multi"?`<p class="hint" style="margin:0">Select every correct option, then check.</p>`:""}`;
  }else if(q.k==="num"){
    body=`<div class="numrow"><input id="num" inputmode="decimal" autocomplete="off" placeholder="Your answer"><span class="count">${esc(q.unit||"")}</span></div><p class="hint" style="margin:0">Accepted within ±${Math.round((q.tol||0.02)*100)}%. Scientific notation like 7.66e3 works.</p>`;
  }else if(q.k==="open"){
    body=`<textarea id="ta" placeholder="Write your answer, then compare it with the model answer."></textarea>`;
  }
  const checkLabel=q.k==="open"?"Show model answer":run.mode==="exam"&&!run.done?"Save answer":"Check";
  view.innerHTML=`<div class="bar">
    <div class="meta"><span>${esc(run.title)} · Question ${run.i+1} / ${n}</span><span>${answered} answered${run.mode==="practice"||run.done?` · ${run.ans.filter(x=>x&&x.ok).length} correct`:""} · ${run.done?"review":run.mode}</span></div>
    <div class="track"><div class="fill" style="width:${answered/n*100}%"></div></div>
    <details class="mapwrap" ${n<=40?"open":""}><summary>Question map</summary>${navGrid()}</details></div>
  <article class="panel qcard">${tagHtml(q)}<div class="qtext">${q.q}</div>${figHtml(q)}${body}<div id="fb"></div>
    <div class="row" id="checkrow">${(q.k==="multi"||q.k==="num"||q.k==="open")&&!locked?`<button class="btn" id="check">${checkLabel}</button>`:""}</div>
  </article>
  <nav class="navbar">
    <button class="btn ghost" id="prev" ${run.i===0?"disabled":""}>← Previous</button>
    <span class="row">${!a&&!run.done?`<button class="btn ghost" id="skip">Skip</button>`:""}<button class="btn" id="next">${run.i+1<n?"Next →":run.done?"Back to results":"Finish quiz"}</button></span>
  </nav>
  <div class="row subnav">${run.done?`<button class="pill" id="toResults">Results</button>`:`<button class="pill" id="finish">Finish now</button>`}<button class="pill" id="restart">Restart this quiz</button><button class="pill" id="exit">Exit to menu</button></div>
  <div id="confirm"></div>`;
  const $=s=>view.querySelector(s);
  // restore previous answer
  if(a){
    if(q.k==="num"){$("#num").value=a.user}
    if(q.k==="open"){$("#ta").value=a.user==="(blank)"?"":a.user}
    view.querySelectorAll(".opt").forEach(b=>{const i=+b.dataset.i;const picked=Array.isArray(a.user)?a.user.includes(i):i===a.user;b.setAttribute("aria-pressed",picked)});
    if(locked)showLocked(q,a);
  }
  const sel=new Set(a&&Array.isArray(a.user)?a.user:[]);
  view.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{if(locked)return;const i=+b.dataset.i;
    if(q.k==="multi"){sel.has(i)?sel.delete(i):sel.add(i);b.setAttribute("aria-pressed",sel.has(i))}
    else record(q,i)});
  const chk=$("#check");
  if(chk)chk.onclick=()=>{
    if(q.k==="multi")record(q,[...sel]);
    else if(q.k==="num"){const v=parseFloat(String($("#num").value).replace(/,/g,"").replace(/×10\^/,"e"));if(isNaN(v)){$("#fb").innerHTML=`<p class="hint">Enter a number first.</p>`;return}record(q,v)}
    else if(q.k==="open")showOpen(q)};
  const ni=$("#num");if(ni&&!locked){ni.focus();ni.onkeydown=e=>{if(e.key==="Enter"&&chk)chk.click()}}
  if(ni&&locked)ni.disabled=true;
  $("#prev").onclick=()=>go(run.i-1);
  if($("#skip"))$("#skip").onclick=()=>{run.ans[run.i]=run.ans[run.i]||{skip:true};go(run.i+1<n?run.i+1:run.i,true)};
  $("#next").onclick=()=>{if(run.i+1<n)go(run.i+1);else if(run.done)results();else finish()};
  if($("#finish"))$("#finish").onclick=finish;
  if($("#toResults"))$("#toResults").onclick=results;
  $("#restart").onclick=()=>confirmBox("Restart this quiz? Your answers in this run will be cleared.",[["Restart with same numbers",()=>redo(true)],["Restart with new numbers",()=>redo(false)]]);
  $("#exit").onclick=()=>{save();home()};
  view.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(+b.dataset.go));
  view.querySelectorAll("figure img").forEach(im=>im.onclick=()=>openLB(im.src));
  save();
}
function go(i,fromSkip){if(i<0||i>=run.qs.length){if(fromSkip)finish();return}run.i=i;render();window.scrollTo(0,0)}
function confirmBox(msg,btns){const c=document.getElementById("confirm");c.innerHTML=`<div class="panel confirm"><p style="margin:0 0 10px">${msg}</p><div class="row">${btns.map((b,i)=>`<button class="btn ${i?"ghost":""}" data-cb="${i}">${b[0]}</button>`).join("")}<button class="btn ghost" data-cb="x">Cancel</button></div></div>`;
  c.querySelectorAll("[data-cb]").forEach(b=>b.onclick=()=>{if(b.dataset.cb==="x")c.innerHTML="";else btns[+b.dataset.cb][1]()});c.scrollIntoView({block:"nearest"})}
function finish(){
  const left=run.qs.map((_,i)=>i).filter(i=>!run.ans[i]||run.ans[i].skip);
  if(left.length&&!run.done)return confirmBox(`${left.length} question${left.length>1?"s are":" is"} unanswered or skipped (${left.slice(0,12).map(i=>i+1).join(", ")}${left.length>12?"…":""}). Unanswered questions count as wrong.`,[["Finish anyway",()=>{run.done=true;save();results()}],["Go to first unanswered",()=>go(left[0])]]);
  run.done=true;save();results();
}
function fmtAns(q,a){if(q.k==="num")return `${sig(a,4)} ${q.unit||""}`;if(Array.isArray(a))return a.map(i=>q.o[i]).join(" · ")||"(nothing selected)";return q.o[a]}
function isRight(q,a){if(q.k==="num"){const tol=q.tol||0.02;return Math.abs(a-q.a)<=Math.abs(q.a)*tol+(q.abs||0)}if(q.k==="multi")return a.length===q.a.length&&a.every(x=>q.a.includes(x));return a===q.a}
function record(q,a){
  run.ans[run.i]={ok:isRight(q,a),user:a};save();
  render();
  if(run.mode==="exam"&&!run.done)document.getElementById("fb").innerHTML=`<p class="hint">Answer saved. You can change it until you finish.</p>`;
}
function showLocked(q,a){
  view.querySelectorAll(".opt").forEach(b=>{b.disabled=true;const i=+b.dataset.i;const right=q.k==="multi"?q.a.includes(i):i===q.a;const picked=Array.isArray(a.user)?a.user.includes(i):i===a.user;if(right)b.classList.add("right");else if(picked)b.classList.add("wrong")});
  const ta=document.getElementById("ta");if(ta)ta.disabled=true;
  document.getElementById("fb").innerHTML=q.k==="open"?`<div class="verdict ${a.ok?"ok":"bad"}">${a.ok?"Marked: covered":"Marked: missed points"}</div><div class="exp"><p><b>Model answer</b></p>${q.e}</div>`:feedback(q,a.ok);
}
function feedback(q,ok){
  const corr=q.k==="num"?`<p><b>Answer:</b> ${sig(q.a,4)} ${esc(q.unit||"")}</p>`:(ok?"":`<p><b>Correct:</b> ${fmtAns(q,q.a)}</p>`);
  return `<div class="verdict ${ok?"ok":"bad"}">${ok?"Correct":"Not quite"}</div><div class="exp">${corr}${q.e?`<div>${q.e}</div>`:""}</div>`}
function showOpen(q){
  const c=document.getElementById("check");if(c)c.hidden=true;
  document.getElementById("fb").innerHTML=`<div class="exp"><p><b>Model answer</b></p>${q.e}</div><p class="hint">Mark yourself honestly against the model answer.</p><div class="row"><button class="btn" id="got">I covered the key points</button><button class="btn ghost" id="miss">I missed key points</button></div>`;
  const done=ok=>{run.ans[run.i]={ok,user:document.getElementById("ta").value||"(blank)"};save();render()};
  document.getElementById("got").onclick=()=>done(true);document.getElementById("miss").onclick=()=>done(false);
}
document.addEventListener("keydown",e=>{
  if(!run||!view.querySelector(".qcard")||e.target.tagName==="TEXTAREA"||e.target.tagName==="INPUT")return;
  if(e.key==="ArrowRight"){document.getElementById("next").click();return}
  if(e.key==="ArrowLeft"){const p=document.getElementById("prev");if(!p.disabled)p.click();return}
  const k=e.key.toUpperCase();
  if(/^[A-F]$/.test(k)||/^[1-6]$/.test(e.key)){const idx=/^[1-6]$/.test(e.key)?+e.key-1:k.charCodeAt(0)-65;const b=view.querySelector(`.opt[data-i="${idx}"]`);if(b&&!b.disabled)b.click()}
});

/* ---------- results ---------- */
function results(){
  const qs=run.qs, ans=run.ans, n=qs.length, ok=ans.filter(a=>a&&a.ok).length, pct=n?Math.round(ok/n*100):0;
  const best=store.get("best",{});const byT={};
  qs.forEach((q,i)=>{byT[q.t]=byT[q.t]||{n:0,ok:0};byT[q.t].n++;if(ans[i]&&ans[i].ok)byT[q.t].ok++});
  if(!run.scored){Object.entries(byT).forEach(([t,v])=>{if(v.n>=5){const p=Math.round(v.ok/v.n*100);if(best[t]==null||p>best[t])best[t]=p}});store.set("best",best);run.scored=true;save()}
  const missed=qs.map((q,i)=>({q,a:ans[i],i})).filter(x=>!x.a||!x.a.ok);
  const skipped=missed.filter(x=>!x.a||x.a.skip).length;
  let showAll=false;
  const reviewHtml=list=>list.map(({q,a,i})=>`<div class="ritem">${tagHtml(q)}<div class="row" style="justify-content:space-between"><span class="hint">Question ${i+1} · ${!a||a.skip?"skipped":a.ok?"correct":"wrong"}</span><button class="pill" data-open="${i}">Open question</button></div><div class="qtext">${q.q}</div>${figHtml(q)}
      ${q.k==="open"?"":`<div class="${a&&a.ok?"ca":"ua"}">Your answer: ${a&&!a.skip?esc(fmtAns(q,a.user)):"(not answered)"}</div>${a&&a.ok?"":`<div class="ca">Correct: ${esc(q.k==="num"?sig(q.a,4)+" "+(q.unit||""):fmtAns(q,q.a))}</div>`}`}
      <div class="exp">${q.e||""}</div></div>`).join("");
  view.innerHTML=`<section class="panel" style="display:flex;flex-direction:column;gap:16px">
    <div class="eyebrow">Debrief · ${esc(run.title)}</div><div class="row" style="gap:18px;align-items:baseline"><span class="score">${pct}%</span><span class="count">${ok} of ${n} correct${skipped?` · ${skipped} skipped`:""}</span></div>
    <div class="breakdown">${Object.entries(byT).sort().map(([t,v])=>`<div class="bd"><b>Topic ${t}</b>${v.ok}/${v.n} · ${Math.round(v.ok/v.n*100)}%</div>`).join("")}</div>
    <div class="label" style="margin:0">Map – click a number to revisit</div>${navGrid()}
    <div class="row">
      ${missed.length?`<button class="btn" id="retry">Retry the ${missed.length} missed</button>`:""}
      <button class="btn ghost" id="redoSame">Redo this quiz</button>
      <button class="btn ghost" id="redoNew">Redo with new numbers</button>
      <button class="btn ghost" id="again">New random set</button>
      <button class="btn ghost" id="home">Back to menu</button>
    </div></section>
    <section class="review"><div class="row" style="justify-content:space-between"><h2 id="revTitle">Review what you missed</h2><button class="pill" id="toggle">Show all questions</button></div><div id="revList">${missed.length?reviewHtml(missed):`<p>Nothing missed – full marks.</p>`}</div></section>`;
  const $=s=>view.querySelector(s);
  const bindOpen=()=>view.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>go(+b.dataset.open));
  view.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(+b.dataset.go));
  $("#home").onclick=()=>{store.del("run");home()};
  $("#redoSame").onclick=()=>redo(true);
  $("#redoNew").onclick=()=>redo(false);
  $("#again").onclick=()=>{const srcs=[...new Set(run.qs.map(srcOf))];const t=[...new Set(srcs.map(q=>q.t))];start(pool(t,CATS.map(c=>c[0])),{count:n,mode:run.mode,title:run.title})};
  if($("#retry"))$("#retry").onclick=()=>{const qs=missed.map(x=>instantiate(srcOf(x.q)));run={qs:shuffle(qs),ans:[],i:0,mode:run.mode,done:false,title:run.title+" · retry"};save();render()};
  $("#toggle").onclick=()=>{showAll=!showAll;$("#toggle").textContent=showAll?"Show only missed":"Show all questions";$("#revTitle").textContent=showAll?"Review all questions":"Review what you missed";$("#revList").innerHTML=reviewHtml(showAll?qs.map((q,i)=>({q,a:ans[i],i})):missed);bindOpen();view.querySelectorAll("#revList figure img").forEach(im=>im.onclick=()=>openLB(im.src))};
  bindOpen();
  view.querySelectorAll("figure img").forEach(im=>im.onclick=()=>openLB(im.src));
  window.scrollTo(0,0);
}
home();
