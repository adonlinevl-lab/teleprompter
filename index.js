const http = require("http");
const { WebSocketServer } = require("ws");

let state = {
  text: "Cole seu roteiro aqui e pressione Play para comecar.\n\nUse os controles na pagina Admin para ajustar velocidade, fonte e posicao.\n\nBoa gravacao!",
  playing: false,
  speed: 3,
  scrollPosition: 0,
  fontSize: 52,
  lineWidth: 75,
  countdown: false,
  countdownValue: 3,
  highlightLine: true,
};

const FONT = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap";

function pageAdmin() {
  return '<!DOCTYPE html><html lang="pt-BR"><head>' +
'<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<title>Teleprompter Admin</title>' +
'<link rel="preconnect" href="https://fonts.googleapis.com">' +
'<link rel="stylesheet" href="' + FONT + '">' +
'<style>' +
'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}' +
':root{' +
'--bg:#0a0a0f;--surface:#13131a;--surface2:#1c1c26;--surface3:#252530;' +
'--accent:#e8c547;--accent2:#c9a82c;--text:#f0ede4;--text2:#9996a0;' +
'--text3:#5a5766;--success:#4ade80;--border:#2a2a38;--radius:10px;' +
'}' +
'body{background:var(--bg);color:var(--text);font-family:"DM Sans",sans-serif;min-height:100vh;display:flex;flex-direction:column;}' +
'header{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;background:var(--surface);}' +
'.logo{font-family:"DM Serif Display",serif;font-size:20px;color:var(--accent);}' +
'.logo span{color:var(--text2);font-family:"DM Sans",sans-serif;font-size:13px;font-weight:300;margin-left:8px;}' +
'.sdot{width:8px;height:8px;border-radius:50%;background:var(--text3);margin-left:auto;transition:background .3s;}' +
'.sdot.on{background:var(--success);}' +
'.slabel{font-size:12px;color:var(--text2);}' +
'.main{display:grid;grid-template-columns:1fr 340px;gap:0;flex:1;overflow:hidden;}' +
'.epanel{display:flex;flex-direction:column;border-right:1px solid var(--border);}' +
'.etoolbar{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;background:var(--surface);}' +
'.tbtn{background:var(--surface2);border:1px solid var(--border);color:var(--text2);padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:"DM Sans",sans-serif;transition:all .15s;}' +
'.tbtn:hover{background:var(--surface3);color:var(--text);}' +
'.wcount{margin-left:auto;font-size:12px;color:var(--text3);}' +
'textarea{flex:1;background:var(--surface);border:none;color:var(--text);font-family:"DM Serif Display",serif;font-size:18px;line-height:1.7;padding:24px;resize:none;outline:none;width:100%;}' +
'textarea::placeholder{color:var(--text3);}' +
'.cpanel{background:var(--surface);display:flex;flex-direction:column;overflow-y:auto;}' +
'.sec{padding:20px;border-bottom:1px solid var(--border);}' +
'.stitle{font-size:11px;font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3);margin-bottom:16px;}' +
'.pbtn{width:100%;padding:16px;border-radius:var(--radius);border:none;font-family:"DM Sans",sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:10px;}' +
'.pbtn.play{background:var(--accent);color:#0a0a0f;}' +
'.pbtn.play:hover{background:var(--accent2);}' +
'.pbtn.pause{background:var(--surface2);color:var(--text);border:1px solid var(--border);}' +
'.pbtn.pause:hover{background:var(--surface3);}' +
'.trow{display:flex;align-items:center;gap:10px;margin-top:12px;}' +
'.tog{position:relative;width:36px;height:20px;cursor:pointer;}' +
'.tog input{opacity:0;width:0;height:0;}' +
'.tslider{position:absolute;inset:0;background:var(--surface3);border-radius:10px;transition:.2s;}' +
'.tog input:checked+.tslider{background:var(--accent);}' +
'.tslider::before{content:"";position:absolute;width:14px;height:14px;left:3px;top:3px;background:white;border-radius:50%;transition:.2s;}' +
'.tog input:checked+.tslider::before{transform:translateX(16px);}' +
'.tlabel{font-size:13px;color:var(--text2);}' +
'.crow{display:flex;align-items:center;gap:10px;margin-bottom:14px;}' +
'.clabel{font-size:13px;color:var(--text2);width:90px;flex-shrink:0;}' +
'.cval{font-size:13px;font-weight:500;color:var(--accent);min-width:36px;text-align:right;}' +
'input[type=range]{flex:1;-webkit-appearance:none;appearance:none;height:4px;background:var(--surface3);border-radius:2px;outline:none;}' +
'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:var(--accent);border-radius:50%;cursor:pointer;}' +
'input[type=range]::-moz-range-thumb{width:16px;height:16px;background:var(--accent);border-radius:50%;cursor:pointer;border:none;}' +
'.srow{display:flex;gap:8px;margin-top:8px;}' +
'.sbtn{flex:1;padding:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:6px;font-size:18px;cursor:pointer;transition:all .15s;font-family:"DM Sans",sans-serif;}' +
'.sbtn:hover{background:var(--surface3);color:var(--text);}' +
'.pbar{height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;margin-bottom:10px;cursor:pointer;}' +
'.pfill{height:100%;background:var(--accent);border-radius:3px;transition:width .1s;}' +
'.posrow{display:flex;justify-content:space-between;font-size:12px;color:var(--text3);}' +
'.jrow{display:flex;gap:8px;margin-top:12px;}' +
'.jbtn{flex:1;padding:9px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:6px;font-size:12px;cursor:pointer;transition:all .15s;font-family:"DM Sans",sans-serif;}' +
'.jbtn:hover{background:var(--surface3);color:var(--text);}' +
'.links{padding:16px 20px;display:flex;flex-direction:column;gap:8px;margin-top:auto;}' +
'.lbtn{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:8px;text-decoration:none;font-size:13px;transition:all .15s;}' +
'.lbtn:hover{background:var(--surface3);color:var(--text);}' +
'.ldot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}' +
'.ldot.v{background:#60a5fa;}' +
'.ldot.m{background:#a78bfa;}' +
'.kbd{display:inline-flex;align-items:center;justify-content:center;background:var(--surface3);border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:11px;color:var(--text3);}' +
'.shortcuts{display:flex;flex-direction:column;gap:6px;}' +
'.shrow{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text3);}' +
'.scrubsec{padding:20px;border-bottom:1px solid var(--border);}'  +
'#scrubpad{width:100%;height:160px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);cursor:ns-resize;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;user-select:none;position:relative;overflow:hidden;transition:border-color .15s;}'  +
'#scrubpad:hover{border-color:var(--accent);}'  +
'#scrubpad.active{border-color:var(--accent);background:var(--surface3);}'  +
'#scrubpad .sarrow{color:var(--text3);font-size:22px;line-height:1;}'  +
'#scrubpad .slbl{font-size:11px;color:var(--text3);letter-spacing:1px;text-transform:uppercase;}'  +
'#scrubfill{position:absolute;bottom:0;left:0;right:0;background:rgba(232,197,71,.1);}' +

'#cdoverlay{position:fixed;inset:0;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center;z-index:100;flex-direction:column;gap:16px;}' +
'#cdoverlay.show{display:flex;}' +
'.cdnum{font-family:"DM Serif Display",serif;font-size:180px;color:var(--accent);animation:pulse 1s ease-in-out infinite;}' +
'@keyframes pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.08);opacity:.8;}}' +
'.cdlabel{font-size:16px;color:var(--text2);letter-spacing:2px;text-transform:uppercase;}' +
'</style></head><body>' +
'<header>' +
'<div class="logo">prompter <span>admin</span></div>' +
'<div class="sdot" id="sdot"></div>' +
'<div class="slabel" id="slabel">conectando...</div>' +
'</header>' +
'<div class="main">' +
'<div class="epanel">' +
'<div class="etoolbar">' +
'<button class="tbtn" onclick="clearText()">Limpar</button>' +
'<button class="tbtn" onclick="pasteText()">Colar</button>' +
'<button class="tbtn" onclick="document.getElementById(\'fi\').click()">Abrir .txt</button>' +
'<input type="file" id="fi" accept=".txt" style="display:none" onchange="loadFile(event)">' +
'<span class="wcount" id="wcount">0 palavras</span>' +
'</div>' +
'<textarea id="scriptText" placeholder="Cole seu roteiro aqui..."></textarea>' +
'</div>' +
'<div class="cpanel">' +
'<div class="sec">' +
'<div class="stitle">Reproducao</div>' +
'<button class="pbtn play" id="pbtn" onclick="togglePlay()">' +
'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>Play' +
'</button>' +
'<div class="trow">' +
'<label class="tog"><input type="checkbox" id="cdtog" onchange="toggleCountdown()"><span class="tslider"></span></label>' +
'<span class="tlabel">Contagem regressiva</span>' +
'</div></div>' +
'<div class="sec">' +
'<div class="stitle">Velocidade</div>' +
'<div class="crow"><span class="clabel">Velocidade</span><input type="range" id="spd" min="0.5" max="12" step="0.5" value="3" oninput="onSpeedChange()"><span class="cval" id="spdval">3</span></div>' +
'<div class="srow"><button class="sbtn" onclick="changeSpeed(-0.5)">-</button><button class="sbtn" onclick="changeSpeed(0.5)">+</button></div>' +
'</div>' +
'<div class="sec">' +
'<div class="stitle">Aparencia</div>' +
'<div class="crow"><span class="clabel">Fonte</span><input type="range" id="fnt" min="24" max="120" step="2" value="52" oninput="onFontChange()"><span class="cval" id="fntval">52px</span></div>' +
'<div class="crow"><span class="clabel">Largura</span><input type="range" id="wid" min="40" max="100" step="5" value="75" oninput="onWidthChange()"><span class="cval" id="widval">75%</span></div>' +
'<div class="trow"><label class="tog"><input type="checkbox" id="hltog" checked onchange="toggleHighlight()"><span class="tslider"></span></label><span class="tlabel">Destacar linha central</span></div>' +
'</div>' +
'<div class="sec">' +
'<div class="stitle">Posicao</div>' +
'<div class="pbar" id="pbar" onclick="seekFromBar(event)"><div class="pfill" id="pfill" style="width:0%"></div></div>' +
'<div class="posrow"><span id="poslabel">0%</span><span id="timeleft">-</span></div>' +
'<div class="jrow">' +
'<button class="jbtn" onclick="jump(-10)">- 10 linhas</button>' +
'<button class="jbtn" onclick="resetPos()">Inicio</button>' +
'<button class="jbtn" onclick="jump(10)">+ 10 linhas</button>' +
'</div></div>' +
'<div class="scrubsec">' +
'<div class="stitle">Controle Manual</div>' +
'<div id="scrubpad"><div id="scrubfill" style="height:0%"></div><div class="sarrow">^</div><div class="slbl">arraste para posicionar</div><div class="sarrow">v</div></div>' +
'</div>' +
'<div class="sec">' +
'<div class="stitle">Atalhos</div>' +
'<div class="shortcuts">' +
'<div class="shrow"><span>Play / Pause</span><span class="kbd">Espaco</span></div>' +
'<div class="shrow"><span>Velocidade +</span><span class="kbd">Seta cima</span></div>' +
'<div class="shrow"><span>Velocidade -</span><span class="kbd">Seta baixo</span></div>' +
'<div class="shrow"><span>Avancar linhas</span><span class="kbd">Page Down</span></div>' +
'<div class="shrow"><span>Voltar linhas</span><span class="kbd">Page Up</span></div>' +
'<div class="shrow"><span>Reiniciar</span><span class="kbd">Home</span></div>' +
'</div></div>' +
'<div class="links">' +
'<a class="lbtn" href="/view" target="_blank"><span class="ldot v"></span>Abrir Visualizador</a>' +
'<a class="lbtn" href="/mirror" target="_blank"><span class="ldot m"></span>Abrir Espelhado</a>' +
'</div></div></div>' +
'<div id="cdoverlay"><div class="cdnum" id="cdnum">3</div><div class="cdlabel">preparando...</div></div>' +
'<script>' +
'var ws,rtimer;' +
'var ls={text:"",playing:false,speed:3,scrollPosition:0,fontSize:52,lineWidth:75,countdown:false,countdownValue:3,highlightLine:true};' +
'function connect(){' +
'var proto=location.protocol==="https:"?"wss":"ws";' +
'ws=new WebSocket(proto+"://"+location.host);' +
'ws.onopen=function(){document.getElementById("sdot").className="sdot on";document.getElementById("slabel").textContent="conectado";clearTimeout(rtimer);};' +
'ws.onclose=function(){document.getElementById("sdot").className="sdot";document.getElementById("slabel").textContent="reconectando...";rtimer=setTimeout(connect,2000);};' +
'ws.onmessage=function(e){var m=JSON.parse(e.data);if(m.type==="state")applyState(m.state);};' +
'}' +
'function applyState(s){' +
'ls=s;' +
'document.getElementById("scriptText").value=s.text;' +
'document.getElementById("spd").value=s.speed;' +
'document.getElementById("spdval").textContent=s.speed;' +
'document.getElementById("fnt").value=s.fontSize;' +
'document.getElementById("fntval").textContent=s.fontSize+"px";' +
'document.getElementById("wid").value=s.lineWidth;' +
'document.getElementById("widval").textContent=s.lineWidth+"%";' +
'document.getElementById("cdtog").checked=s.countdown;' +
'document.getElementById("hltog").checked=s.highlightLine;' +
'updatePlayBtn(s.playing);' +
'updateProgress(s.scrollPosition);' +
'updateWordCount(s.text);'
+'document.getElementById("scrubfill").style.height=Math.round(s.scrollPosition*100)+"%";' +
'}' +
'function send(patch){' +
'Object.assign(ls,patch);' +
'if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:"update",patch:patch}));' +
'}' +
'function updatePlayBtn(playing){' +
'var btn=document.getElementById("pbtn");' +
'if(playing){btn.className="pbtn pause";btn.innerHTML=\'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pausar\';}' +
'else{btn.className="pbtn play";btn.innerHTML=\'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>Play\';}' +
'}' +
'function updateProgress(pos){' +
'var pct=Math.round(pos*100);' +
'document.getElementById("pfill").style.width=pct+"%";' +
'document.getElementById("poslabel").textContent=pct+"%";' +
'var words=ls.text.trim().split(/\\s+/).length;' +
'var rem=Math.round((words*(1-pos))/130);' +
'document.getElementById("timeleft").textContent=rem>0?rem+" min":"-";' +
'}' +
'function updateWordCount(text){' +
'var w=text.trim()?text.trim().split(/\\s+/).length:0;' +
'var m=Math.round(w/130);' +
'document.getElementById("wcount").textContent=w+" palavras / "+(m||"<1")+" min";' +
'}' +
'var ttimer;' +
'function onTextChange(){' +
'var text=document.getElementById("scriptText").value;' +
'updateWordCount(text);' +
'clearTimeout(ttimer);' +
'ttimer=setTimeout(function(){send({text:text});},400);' +
'}' +
'document.getElementById("scriptText").addEventListener("input",onTextChange);' +
'function onSpeedChange(){var v=parseFloat(document.getElementById("spd").value);document.getElementById("spdval").textContent=v;send({speed:v});}' +
'function onFontChange(){var v=parseInt(document.getElementById("fnt").value);document.getElementById("fntval").textContent=v+"px";send({fontSize:v});}' +
'function onWidthChange(){var v=parseInt(document.getElementById("wid").value);document.getElementById("widval").textContent=v+"%";send({lineWidth:v});}' +
'function changeSpeed(d){var s=document.getElementById("spd");var v=Math.max(0.5,Math.min(12,parseFloat(s.value)+d));s.value=v;document.getElementById("spdval").textContent=v;send({speed:v});}' +
'function togglePlay(){if(ls.countdown&&!ls.playing){runCountdown();}else{send({playing:!ls.playing});updatePlayBtn(!ls.playing);}}' +
'function runCountdown(){' +
'var ov=document.getElementById("cdoverlay");' +
'var ne=document.getElementById("cdnum");' +
'ov.classList.add("show");' +
'var n=ls.countdownValue;' +
'ne.textContent=n;' +
'var iv=setInterval(function(){n--;if(n<=0){clearInterval(iv);ov.classList.remove("show");send({playing:true});updatePlayBtn(true);}else{ne.textContent=n;}},1000);' +
'}' +
'function toggleCountdown(){send({countdown:document.getElementById("cdtog").checked});}' +
'function toggleHighlight(){send({highlightLine:document.getElementById("hltog").checked});}' +
'function jump(lines){' +
'var total=ls.text.split("\\n").length;' +
'var cur=Math.round(ls.scrollPosition*total);' +
'var nl=Math.max(0,Math.min(total,cur+lines));' +
'var sp=nl/Math.max(total,1);' +
'send({scrollPosition:sp});updateProgress(sp);' +
'}' +
'function resetPos(){send({scrollPosition:0,playing:false});updatePlayBtn(false);updateProgress(0);}' +
'function seekFromBar(e){' +
'var bar=document.getElementById("pbar");' +
'var r=bar.getBoundingClientRect();' +
'var sp=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));' +
'send({scrollPosition:sp});updateProgress(sp);' +
'}' +
'function clearText(){document.getElementById("scriptText").value="";send({text:""});updateWordCount("");}' +
'function pasteText(){navigator.clipboard.readText().then(function(t){document.getElementById("scriptText").value=t;send({text:t});updateWordCount(t);}).catch(function(){});}' +
'function loadFile(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){var t=ev.target.result;document.getElementById("scriptText").value=t;send({text:t});updateWordCount(t);};r.readAsText(f);}' +
'document.addEventListener("keydown",function(e){' +
'if(e.target.tagName==="TEXTAREA")return;' +
'if(e.code==="Space"){e.preventDefault();togglePlay();}' +
'if(e.code==="ArrowUp"){e.preventDefault();changeSpeed(0.5);}' +
'if(e.code==="ArrowDown"){e.preventDefault();changeSpeed(-0.5);}' +
'if(e.code==="PageDown"){e.preventDefault();jump(10);}' +
'if(e.code==="PageUp"){e.preventDefault();jump(-10);}' +
'if(e.code==="Home"){e.preventDefault();resetPos();}' +
'});' +
'var scrubActive=false,scrubStart=0,scrubBase=0;'
+'function scrubInit(){'
+'var pad=document.getElementById("scrubpad");'
+'pad.addEventListener("mousedown",function(e){scrubActive=true;scrubStart=e.clientY;scrubBase=ls.scrollPosition;pad.classList.add("active");e.preventDefault();});'
+'document.addEventListener("mousemove",function(e){'
+'if(!scrubActive)return;'
+'var dy=e.clientY-scrubStart;'
+'var padH=pad.offsetHeight;'
+'var sp=Math.max(0,Math.min(1,scrubBase+(dy/padH)));'
+'ls.scrollPosition=sp;'
+'if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:"update",patch:{scrollPosition:sp,playing:false}}));'
+'updateProgress(sp);'
+'document.getElementById("scrubfill").style.height=Math.round(sp*100)+"%";'
+'});'
+'document.addEventListener("mouseup",function(){if(scrubActive){scrubActive=false;pad.classList.remove("active");}});'
+'pad.addEventListener("touchstart",function(e){scrubActive=true;scrubStart=e.touches[0].clientY;scrubBase=ls.scrollPosition;pad.classList.add("active");e.preventDefault();},{passive:false});'
+'document.addEventListener("touchmove",function(e){'
+'if(!scrubActive)return;'
+'var dy=e.touches[0].clientY-scrubStart;'
+'var padH=pad.offsetHeight;'
+'var sp=Math.max(0,Math.min(1,scrubBase+(dy/padH)));'
+'ls.scrollPosition=sp;'
+'if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:"update",patch:{scrollPosition:sp,playing:false}}));'
+'updateProgress(sp);'
+'document.getElementById("scrubfill").style.height=Math.round(sp*100)+"%";'
+'},{passive:false});'
+'document.addEventListener("touchend",function(){if(scrubActive){scrubActive=false;pad.classList.remove("active");}});'
+'}'  +
'scrubInit();connect();' +
'<\/script></body></html>';
}

function pageViewer(mirrored) {
  var mirrorStyle = mirrored ? 'transform:scaleX(-1);' : '';
  var mirrorLabel = mirrored ? 'espelhado' : 'visualizador';
  return '<!DOCTYPE html><html lang="pt-BR"><head>' +
'<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<title>Teleprompter' + (mirrored ? ' Espelhado' : '') + '</title>' +
'<link rel="preconnect" href="https://fonts.googleapis.com">' +
'<link rel="stylesheet" href="' + FONT + '">' +
'<style>' +
'*{box-sizing:border-box;margin:0;padding:0;}' +
'html,body{height:100%;background:#000;color:#fff;overflow:hidden;}' +
'body{display:flex;align-items:center;justify-content:center;position:relative;}' +
'#scroller{position:absolute;top:0;left:0;right:0;padding:50vh 0;will-change:transform;}' +
'#txtwrap{margin:0 auto;' + mirrorStyle + '}' +
'#content{font-family:"DM Serif Display",serif;line-height:1.55;color:#f5f2e8;white-space:pre-wrap;word-break:break-word;}' +
'#hl{position:fixed;left:0;right:0;pointer-events:none;z-index:10;}' +
'#hl::before{content:"";position:absolute;left:0;right:0;top:0;bottom:0;background:linear-gradient(to bottom,rgba(0,0,0,.85) 0%,rgba(0,0,0,.4) 30%,rgba(0,0,0,0) 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.4) 70%,rgba(0,0,0,.85) 100%);}' +
'#hline{position:fixed;left:0;right:0;border-top:2px solid rgba(232,197,71,.25);border-bottom:2px solid rgba(232,197,71,.25);pointer-events:none;z-index:11;display:none;}' +
'#status{position:fixed;top:20px;right:20px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:6px 14px;font-family:"DM Sans",sans-serif;font-size:12px;color:rgba(255,255,255,.4);z-index:20;display:flex;align-items:center;gap:8px;transition:opacity .3s;}' +
'#status.hidden{opacity:0;}' +
'.sind{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2);}' +
'.sind.live{background:#4ade80;}' +
'.sind.paused{background:#e8c547;}' +
'#fsbtn{position:fixed;bottom:20px;right:20px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px 14px;font-family:"DM Sans",sans-serif;font-size:12px;color:rgba(255,255,255,.4);cursor:pointer;z-index:20;transition:all .2s;}' +
'#fsbtn:hover{background:rgba(255,255,255,.12);color:rgba(255,255,255,.7);}' +
'#waiting{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#000;z-index:50;transition:opacity .5s;}' +
'#waiting.hidden{opacity:0;pointer-events:none;}' +
'.wlogo{font-family:"DM Serif Display",serif;font-size:32px;color:#e8c547;}' +
'.wsub{font-family:"DM Sans",sans-serif;font-size:14px;color:rgba(255,255,255,.3);letter-spacing:2px;text-transform:uppercase;}' +
'.wdots{display:flex;gap:6px;}' +
'.dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2);animation:dp 1.4s ease-in-out infinite;}' +
'.dot:nth-child(2){animation-delay:.2s;}' +
'.dot:nth-child(3){animation-delay:.4s;}' +
'@keyframes dp{0%,80%,100%{transform:scale(1);opacity:.3;}40%{transform:scale(1.3);opacity:1;}}' +
'</style></head><body>' +
'<div id="waiting"><div class="wlogo">prompter</div><div class="wsub">' + mirrorLabel + '</div><div class="wdots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>' +
'<div id="hl"></div><div id="hline"></div>' +
'<div id="scroller"><div id="txtwrap"><div id="content"></div></div></div>' +
'<div id="status"><div class="sind" id="sind"></div><span id="stxt">conectando</span></div>' +
'<button id="fsbtn" onclick="toggleFS()">tela cheia</button>' +
'<script>' +
'var ws,rtimer;' +
'var scrollPos=0,playing=false,speed=3,fontSize=52,lineWidth=75,hlOn=true;' +
'var af,lastT=0,sht,ready=false;' +
'function connect(){' +
'var proto=location.protocol==="https:"?"wss":"ws";' +
'ws=new WebSocket(proto+"://"+location.host);' +
'ws.onopen=function(){showStatus("conectado","live");};' +
'ws.onclose=function(){showStatus("reconectando","");rtimer=setTimeout(connect,2000);};' +
'ws.onmessage=function(e){' +
'var m=JSON.parse(e.data);' +
'if(m.type==="state")applyState(m.state);' +
'if(m.type==="patch")applyPatch(m.patch);' +
'};' +
'}' +
'function applyState(s){' +
'document.getElementById("content").textContent=s.text;' +
'document.getElementById("txtwrap").style.width=s.lineWidth+"%";' +
'document.getElementById("content").style.fontSize=s.fontSize+"px";' +
'fontSize=s.fontSize;lineWidth=s.lineWidth;speed=s.speed;hlOn=s.highlightLine;playing=s.playing;' +
'if(!ready){scrollPos=s.scrollPosition;applyScroll();document.getElementById("waiting").classList.add("hidden");ready=true;}' +
'updateHL();' +
'showStatus(s.playing?"ao vivo":"pausado",s.playing?"live":"paused");' +
'if(playing&&!af)startScroll();' +
'}' +
'function applyPatch(p){' +
'if(p.text!==undefined)document.getElementById("content").textContent=p.text;' +
'if(p.fontSize!==undefined){document.getElementById("content").style.fontSize=p.fontSize+"px";fontSize=p.fontSize;}' +
'if(p.lineWidth!==undefined){document.getElementById("txtwrap").style.width=p.lineWidth+"%";lineWidth=p.lineWidth;}' +
'if(p.speed!==undefined)speed=p.speed;' +
'if(p.highlightLine!==undefined){hlOn=p.highlightLine;updateHL();}' +
'if(p.scrollPosition!==undefined){scrollPos=p.scrollPosition;if(!playing){applyScroll();}}' +
'if(p.playing!==undefined){' +
'playing=p.playing;' +
'if(playing){if(!af)startScroll();}else{if(af){cancelAnimationFrame(af);af=null;}}' +
'showStatus(playing?"ao vivo":"pausado",playing?"live":"paused");' +
'}' +
'}' +
'function applyScroll(){' +
'var sc=document.getElementById("scroller");' +
'var tot=sc.scrollHeight-window.innerHeight;' +
'sc.style.transform="translateY(-"+(scrollPos*tot)+"px)";' +
'}' +
'function startScroll(){' +
'lastT=performance.now();' +
'function tick(now){' +
'var dt=now-lastT;lastT=now;' +
'if(playing){' +
'var sc=document.getElementById("scroller");' +
'var tot=sc.scrollHeight-window.innerHeight;' +
'if(tot>0){' +
'scrollPos+=(speed*25*dt)/(1000*tot);' +
'scrollPos=Math.min(1,scrollPos);' +
'applyScroll();' +
'if(scrollPos>=1){playing=false;showStatus("fim","paused");return;}' +
'}' +
'}' +
'af=requestAnimationFrame(tick);' +
'}' +
'af=requestAnimationFrame(tick);' +
'}' +
'function updateHL(){' +
'var h=document.getElementById("hl");' +
'var hl=document.getElementById("hline");' +
'h.style.display=hlOn?"block":"none";' +
'if(hlOn){var lh=fontSize*1.55;var mid=window.innerHeight/2;hl.style.display="block";hl.style.top=(mid-lh/2)+"px";hl.style.height=lh+"px";}' +
'else{hl.style.display="none";}' +
'}' +
'function showStatus(txt,cls){' +
'var el=document.getElementById("status");' +
'var ind=document.getElementById("sind");' +
'el.classList.remove("hidden");' +
'document.getElementById("stxt").textContent=txt;' +
'ind.className="sind"+(cls?" "+cls:"");' +
'clearTimeout(sht);sht=setTimeout(function(){el.classList.add("hidden");},2500);' +
'}' +
'function toggleFS(){if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();}' +
'window.addEventListener("resize",updateHL);' +
'connect();updateHL();' +
'<\/script></body></html>';
}

const server = http.createServer(function(req, res) {
  var url = req.url.split("?")[0];
  if (url === "/") { res.writeHead(302, { Location: "/admin" }); res.end(); return; }
  if (url === "/admin") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(pageAdmin()); return; }
  if (url === "/view") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(pageViewer(false)); return; }
  if (url === "/mirror") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(pageViewer(true)); return; }
  res.writeHead(404); res.end("Not found");
});

const wss = new WebSocketServer({ server: server });
const clients = new Set();

wss.on("connection", function(ws) {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "state", state: state }));
  ws.on("message", function(data) {
    try {
      var msg = JSON.parse(data.toString());
      if (msg.type === "update") {
        Object.assign(state, msg.patch);
        var broadcast = JSON.stringify({ type: "patch", patch: msg.patch });
        clients.forEach(function(client) {
          if (client !== ws && client.readyState === 1) client.send(broadcast);
        });
      }
    } catch(e) {}
  });
  ws.on("close", function() { clients.delete(ws); });
});

var PORT = process.env.PORT || 3000;
server.listen(PORT, function() {
  console.log("Teleprompter rodando na porta " + PORT);
});
