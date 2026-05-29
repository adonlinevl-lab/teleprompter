const http = require("http");
const { WebSocketServer } = require("ws");

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
  text: "Cole seu roteiro aqui e pressione Play para comecar.\n\nUse os controles na pagina Admin para ajustar a velocidade, tamanho da fonte e posicao do texto.\n\nBoa gravacao!",
  playing: false,
  speed: 3,
  scrollPosition: 0,
  fontSize: 52,
  lineWidth: 75,
  countdown: false,
  countdownValue: 3,
  highlightLine: true,
};

// ─── HTML Pages ───────────────────────────────────────────────────────────────

const FONT = `https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap`;

function pageAdmin() {
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Teleprompter — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="${FONT}">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0f;
  --surface:#13131a;
  --surface2:#1c1c26;
  --surface3:#252530;
  --accent:#e8c547;
  --accent2:#c9a82c;
  --text:#f0ede4;
  --text2:#9996a0;
  --text3:#5a5766;
  --danger:#e05454;
  --success:#4ade80;
  --border:#2a2a38;
  --radius:10px;
}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh;display:flex;flex-direction:column;}
header{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;background:var(--surface);}
.logo{font-family:'DM Serif Display',serif;font-size:20px;color:var(--accent);letter-spacing:-0.3px;}
.logo span{color:var(--text2);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;margin-left:8px;}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--text3);margin-left:auto;transition:background .3s;}
.status-dot.connected{background:var(--success);}
.status-label{font-size:12px;color:var(--text2);}

.main{display:grid;grid-template-columns:1fr 340px;gap:0;flex:1;overflow:hidden;}

/* Editor */
.editor-panel{display:flex;flex-direction:column;border-right:1px solid var(--border);}
.editor-toolbar{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;background:var(--surface);}
.toolbar-btn{background:var(--surface2);border:1px solid var(--border);color:var(--text2);padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;}
.toolbar-btn:hover{background:var(--surface3);color:var(--text);}
.word-count{margin-left:auto;font-size:12px;color:var(--text3);}
textarea{flex:1;background:var(--surface);border:none;color:var(--text);font-family:'DM Serif Display',serif;font-size:18px;line-height:1.7;padding:24px;resize:none;outline:none;width:100%;}
textarea::placeholder{color:var(--text3);}

/* Controls */
.controls-panel{background:var(--surface);display:flex;flex-direction:column;overflow-y:auto;}
.section{padding:20px;border-bottom:1px solid var(--border);}
.section-title{font-size:11px;font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3);margin-bottom:16px;}

/* Play button */
.play-btn{width:100%;padding:16px;border-radius:var(--radius);border:none;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:10px;letter-spacing:.3px;}
.play-btn.play{background:var(--accent);color:#0a0a0f;}
.play-btn.play:hover{background:var(--accent2);}
.play-btn.pause{background:var(--surface2);color:var(--text);border:1px solid var(--border);}
.play-btn.pause:hover{background:var(--surface3);}

/* Countdown */
.countdown-row{display:flex;align-items:center;gap:10px;margin-top:12px;}
.toggle{position:relative;width:36px;height:20px;cursor:pointer;}
.toggle input{opacity:0;width:0;height:0;}
.toggle-slider{position:absolute;inset:0;background:var(--surface3);border-radius:10px;transition:.2s;}
.toggle input:checked+.toggle-slider{background:var(--accent);}
.toggle-slider::before{content:'';position:absolute;width:14px;height:14px;left:3px;top:3px;background:white;border-radius:50%;transition:.2s;}
.toggle input:checked+.toggle-slider::before{transform:translateX(16px);}
.toggle-label{font-size:13px;color:var(--text2);}

/* Slider controls */
.ctrl-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.ctrl-label{font-size:13px;color:var(--text2);width:90px;flex-shrink:0;}
.ctrl-value{font-size:13px;font-weight:500;color:var(--accent);min-width:36px;text-align:right;}
input[type=range]{flex:1;-webkit-appearance:none;appearance:none;height:4px;background:var(--surface3);border-radius:2px;outline:none;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:var(--accent);border-radius:50%;cursor:pointer;}
input[type=range]::-moz-range-thumb{width:16px;height:16px;background:var(--accent);border-radius:50%;cursor:pointer;border:none;}

/* Speed buttons */
.speed-row{display:flex;gap:8px;margin-top:8px;}
.speed-btn{flex:1;padding:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:6px;font-size:18px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;}
.speed-btn:hover{background:var(--surface3);color:var(--text);}

/* Position */
.progress-bar{height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;margin-bottom:10px;cursor:pointer;}
.progress-fill{height:100%;background:var(--accent);border-radius:3px;transition:width .1s;}
.pos-row{display:flex;justify-content:space-between;font-size:12px;color:var(--text3);}

/* Jump buttons */
.jump-row{display:flex;gap:8px;margin-top:12px;}
.jump-btn{flex:1;padding:9px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:6px;font-size:12px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;}
.jump-btn:hover{background:var(--surface3);color:var(--text);}

/* Links */
.links{padding:16px 20px;display:flex;flex-direction:column;gap:8px;margin-top:auto;}
.link-btn{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:8px;text-decoration:none;font-size:13px;transition:all .15s;cursor:pointer;}
.link-btn:hover{background:var(--surface3);color:var(--text);}
.link-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.link-dot.view{background:#60a5fa;}
.link-dot.mirror{background:#a78bfa;}
.kbd{display:inline-flex;align-items:center;justify-content:center;background:var(--surface3);border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:11px;color:var(--text3);font-family:'DM Sans',sans-serif;}
.shortcuts{display:flex;flex-direction:column;gap:6px;}
.shortcut-row{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text3);}

/* Countdown overlay */
#countdown-overlay{position:fixed;inset:0;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center;z-index:100;flex-direction:column;gap:16px;}
#countdown-overlay.show{display:flex;}
.countdown-number{font-family:'DM Serif Display',serif;font-size:180px;color:var(--accent);animation:pulse 1s ease-in-out infinite;}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.08);opacity:.8;}}
.countdown-label{font-size:16px;color:var(--text2);letter-spacing:2px;text-transform:uppercase;}
</style>
</head><body>
<header>
  <div class="logo">prompter <span>admin</span></div>
  <div class="status-dot" id="statusDot"></div>
  <div class="status-label" id="statusLabel">conectando...</div>
</header>

<div class="main">
  <div class="editor-panel">
    <div class="editor-toolbar">
      <button class="toolbar-btn" onclick="clearText()">Limpar</button>
      <button class="toolbar-btn" onclick="pasteText()">Colar</button>
      <button class="toolbar-btn" onclick="uploadFile()">Abrir .txt</button>
      <input type="file" id="fileInput" accept=".txt" style="display:none" onchange="loadFile(event)">
      <span class="word-count" id="wordCount">0 palavras · 0 min</span>
    </div>
    <textarea id="scriptText" placeholder="Cole seu roteiro aqui..." oninput="onTextChange()"></textarea>
  </div>

  <div class="controls-panel">
    <div class="section">
      <div class="section-title">Reprodução</div>
      <button class="play-btn play" id="playBtn" onclick="togglePlay()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        Play
      </button>
      <div class="countdown-row">
        <label class="toggle"><input type="checkbox" id="countdownToggle" onchange="toggleCountdown()"><span class="toggle-slider"></span></label>
        <span class="toggle-label">Contagem regressiva</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Velocidade</div>
      <div class="ctrl-row">
        <span class="ctrl-label">Velocidade</span>
        <input type="range" id="speedSlider" min="0.5" max="12" step="0.5" value="3" oninput="onSpeedChange()">
        <span class="ctrl-value" id="speedVal">3</span>
      </div>
      <div class="speed-row">
        <button class="speed-btn" onclick="changeSpeed(-0.5)">−</button>
        <button class="speed-btn" onclick="changeSpeed(0.5)">+</button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Aparência</div>
      <div class="ctrl-row">
        <span class="ctrl-label">Fonte</span>
        <input type="range" id="fontSlider" min="24" max="120" step="2" value="52" oninput="onFontChange()">
        <span class="ctrl-value" id="fontVal">52px</span>
      </div>
      <div class="ctrl-row">
        <span class="ctrl-label">Largura</span>
        <input type="range" id="widthSlider" min="40" max="100" step="5" value="75" oninput="onWidthChange()">
        <span class="ctrl-value" id="widthVal">75%</span>
      </div>
      <div class="countdown-row" style="margin-top:4px">
        <label class="toggle"><input type="checkbox" id="highlightToggle" checked onchange="toggleHighlight()"><span class="toggle-slider"></span></label>
        <span class="toggle-label">Destacar linha central</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Posição</div>
      <div class="progress-bar" id="progressBar" onclick="seekFromBar(event)">
        <div class="progress-fill" id="progressFill" style="width:0%"></div>
      </div>
      <div class="pos-row">
        <span id="posLabel">0%</span>
        <span id="timeLeft">-</span>
      </div>
      <div class="jump-row">
        <button class="jump-btn" onclick="jump(-10)">← 10 linhas</button>
        <button class="jump-btn" onclick="resetPos()">Início</button>
        <button class="jump-btn" onclick="jump(10)">10 linhas →</button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Atalhos</div>
      <div class="shortcuts">
        <div class="shortcut-row"><span>Play / Pause</span><span class="kbd">Espaço</span></div>
        <div class="shortcut-row"><span>Velocidade +</span><span class="kbd">↑</span></div>
        <div class="shortcut-row"><span>Velocidade −</span><span class="kbd">↓</span></div>
        <div class="shortcut-row"><span>Avançar linhas</span><span class="kbd">Page↓</span></div>
        <div class="shortcut-row"><span>Voltar linhas</span><span class="kbd">Page↑</span></div>
        <div class="shortcut-row"><span>Reiniciar</span><span class="kbd">Home</span></div>
      </div>
    </div>

    <div class="links">
      <a class="link-btn" href="/view" target="_blank">
        <span class="link-dot view"></span> Abrir Visualizador
      </a>
      <a class="link-btn" href="/mirror" target="_blank">
        <span class="link-dot mirror"></span> Abrir Espelhado
      </a>
    </div>
  </div>
</div>

<div id="countdown-overlay">
  <div class="countdown-number" id="countdownNum">3</div>
  <div class="countdown-label">preparando...</div>
</div>

<script>
let ws, reconnectTimer;
let localState = {text:'',playing:false,speed:3,scrollPosition:0,fontSize:52,lineWidth:75,countdown:false,countdownValue:3,highlightLine:true};
let isSending = false;

function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(proto + '://' + location.host);
  ws.onopen = () => {
    document.getElementById('statusDot').className = 'status-dot connected';
    document.getElementById('statusLabel').textContent = 'conectado';
    clearTimeout(reconnectTimer);
  };
  ws.onclose = () => {
    document.getElementById('statusDot').className = 'status-dot';
    document.getElementById('statusLabel').textContent = 'reconectando...';
    reconnectTimer = setTimeout(connect, 2000);
  };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'state') applyState(msg.state);
  };
}

function applyState(s) {
  localState = s;
  document.getElementById('scriptText').value = s.text;
  document.getElementById('speedSlider').value = s.speed;
  document.getElementById('speedVal').textContent = s.speed;
  document.getElementById('fontSlider').value = s.fontSize;
  document.getElementById('fontVal').textContent = s.fontSize + 'px';
  document.getElementById('widthSlider').value = s.lineWidth;
  document.getElementById('widthVal').textContent = s.lineWidth + '%';
  document.getElementById('countdownToggle').checked = s.countdown;
  document.getElementById('highlightToggle').checked = s.highlightLine;
  updatePlayBtn(s.playing);
  updateProgress(s.scrollPosition);
  updateWordCount(s.text);
}

function send(patch) {
  Object.assign(localState, patch);
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'update', patch }));
}

function updatePlayBtn(playing) {
  const btn = document.getElementById('playBtn');
  if (playing) {
    btn.className = 'play-btn pause';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar';
  } else {
    btn.className = 'play-btn play';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Play';
  }
}

function updateProgress(pos) {
  const pct = Math.round(pos * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('posLabel').textContent = pct + '%';
  const words = localState.text.trim().split(/\s+/).length;
  const remaining = Math.round((words * (1 - pos)) / 130);
  document.getElementById('timeLeft').textContent = remaining > 0 ? remaining + ' min restantes' : '-';
}

function updateWordCount(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const mins = Math.round(words / 130);
  document.getElementById('wordCount').textContent = words + ' palavras · ' + (mins || '<1') + ' min';
}

let textTimer;
function onTextChange() {
  const text = document.getElementById('scriptText').value;
  updateWordCount(text);
  clearTimeout(textTimer);
  textTimer = setTimeout(() => send({ text }), 400);
}

function onSpeedChange() {
  const speed = parseFloat(document.getElementById('speedSlider').value);
  document.getElementById('speedVal').textContent = speed;
  send({ speed });
}

function onFontChange() {
  const fontSize = parseInt(document.getElementById('fontSlider').value);
  document.getElementById('fontVal').textContent = fontSize + 'px';
  send({ fontSize });
}

function onWidthChange() {
  const lineWidth = parseInt(document.getElementById('widthSlider').value);
  document.getElementById('widthVal').textContent = lineWidth + '%';
  send({ lineWidth });
}

function changeSpeed(delta) {
  const slider = document.getElementById('speedSlider');
  const newVal = Math.max(0.5, Math.min(12, parseFloat(slider.value) + delta));
  slider.value = newVal;
  document.getElementById('speedVal').textContent = newVal;
  send({ speed: newVal });
}

function togglePlay() {
  if (localState.countdown && !localState.playing) {
    runCountdown();
  } else {
    send({ playing: !localState.playing });
    updatePlayBtn(!localState.playing);
  }
}

function runCountdown() {
  const overlay = document.getElementById('countdown-overlay');
  const numEl = document.getElementById('countdownNum');
  overlay.classList.add('show');
  let n = localState.countdownValue;
  numEl.textContent = n;
  const iv = setInterval(() => {
    n--;
    if (n <= 0) {
      clearInterval(iv);
      overlay.classList.remove('show');
      send({ playing: true });
      updatePlayBtn(true);
    } else {
      numEl.textContent = n;
    }
  }, 1000);
}

function toggleCountdown() {
  send({ countdown: document.getElementById('countdownToggle').checked });
}

function toggleHighlight() {
  send({ highlightLine: document.getElementById('highlightToggle').checked });
}

function jump(lines) {
  const totalLines = localState.text.split('\n').length;
  const currentLine = Math.round(localState.scrollPosition * totalLines);
  const newLine = Math.max(0, Math.min(totalLines, currentLine + lines));
  const scrollPosition = newLine / Math.max(totalLines, 1);
  send({ scrollPosition });
  updateProgress(scrollPosition);
}

function resetPos() {
  send({ scrollPosition: 0, playing: false });
  updatePlayBtn(false);
  updateProgress(0);
}

function seekFromBar(e) {
  const bar = document.getElementById('progressBar');
  const rect = bar.getBoundingClientRect();
  const scrollPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  send({ scrollPosition });
  updateProgress(scrollPosition);
}

function clearText() { document.getElementById('scriptText').value = ''; send({ text: '' }); updateWordCount(''); }
async function pasteText() { try { const t = await navigator.clipboard.readText(); document.getElementById('scriptText').value = t; send({ text: t }); updateWordCount(t); } catch(e) {} }
function uploadFile() { document.getElementById('fileInput').click(); }
function loadFile(e) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { const t = ev.target.result; document.getElementById('scriptText').value = t; send({ text: t }); updateWordCount(t); }; r.readAsText(f); }

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowUp') { e.preventDefault(); changeSpeed(0.5); }
  if (e.code === 'ArrowDown') { e.preventDefault(); changeSpeed(-0.5); }
  if (e.code === 'PageDown') { e.preventDefault(); jump(10); }
  if (e.code === 'PageUp') { e.preventDefault(); jump(-10); }
  if (e.code === 'Home') { e.preventDefault(); resetPos(); }
});

connect();
</script>
</body></html>`;
}

function pageViewer(mirrored = false) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Teleprompter${mirrored ? ' — Espelhado' : ''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="${FONT}">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
:root{--accent:#e8c547;}
html,body{height:100%;background:#000;color:#fff;overflow:hidden;}
body{display:flex;align-items:center;justify-content:center;position:relative;}

#scroller{
  position:absolute;top:0;left:0;right:0;
  padding:50vh 0;
  will-change:transform;
}
#text-wrap{
  margin:0 auto;
  ${mirrored ? 'transform:scaleX(-1);' : ''}
}
#content{
  font-family:'DM Serif Display',serif;
  line-height:1.55;
  color:#f5f2e8;
  white-space:pre-wrap;
  word-break:break-word;
}

/* Highlight overlay */
#highlight{
  position:fixed;
  left:0;right:0;
  pointer-events:none;
  z-index:10;
  transition:height .1s;
}
#highlight::before{
  content:'';
  position:absolute;
  left:0;right:0;top:0;bottom:0;
  background:linear-gradient(
    to bottom,
    rgba(0,0,0,.85) 0%,
    rgba(0,0,0,.4) 30%,
    rgba(0,0,0,0) 45%,
    rgba(0,0,0,0) 55%,
    rgba(0,0,0,.4) 70%,
    rgba(0,0,0,.85) 100%
  );
}
#highlight-line{
  position:fixed;
  left:0;right:0;
  border-top:2px solid rgba(232,197,71,.25);
  border-bottom:2px solid rgba(232,197,71,.25);
  pointer-events:none;
  z-index:11;
  display:none;
}

/* Status */
#status{
  position:fixed;top:20px;right:20px;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.1);
  border-radius:20px;
  padding:6px 14px;
  font-family:'DM Sans',sans-serif;
  font-size:12px;
  color:rgba(255,255,255,.4);
  z-index:20;
  display:flex;align-items:center;gap:8px;
  transition:opacity .3s;
}
#status.hidden{opacity:0;}
.status-indicator{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2);}
.status-indicator.live{background:#4ade80;}
.status-indicator.paused{background:#e8c547;}

/* Fullscreen btn */
#fs-btn{
  position:fixed;bottom:20px;right:20px;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.1);
  border-radius:8px;
  padding:8px 14px;
  font-family:'DM Sans',sans-serif;
  font-size:12px;
  color:rgba(255,255,255,.4);
  cursor:pointer;
  z-index:20;
  transition:all .2s;
}
#fs-btn:hover{background:rgba(255,255,255,.12);color:rgba(255,255,255,.7);}

/* Waiting */
#waiting{
  position:fixed;inset:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  background:#000;
  z-index:50;
  transition:opacity .5s;
}
#waiting.hidden{opacity:0;pointer-events:none;}
.waiting-logo{font-family:'DM Serif Display',serif;font-size:32px;color:var(--accent);}
.waiting-sub{font-family:'DM Sans',sans-serif;font-size:14px;color:rgba(255,255,255,.3);letter-spacing:2px;text-transform:uppercase;}
.waiting-dots{display:flex;gap:6px;}
.dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2);animation:dotpulse 1.4s ease-in-out infinite;}
.dot:nth-child(2){animation-delay:.2s;}
.dot:nth-child(3){animation-delay:.4s;}
@keyframes dotpulse{0%,80%,100%{transform:scale(1);opacity:.3;}40%{transform:scale(1.3);opacity:1;}}
</style>
</head><body>

<div id="waiting">
  <div class="waiting-logo">prompter</div>
  <div class="waiting-sub">${mirrored ? 'espelhado' : 'visualizador'}</div>
  <div class="waiting-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
</div>

<div id="highlight"></div>
<div id="highlight-line"></div>
<div id="scroller"><div id="text-wrap"><div id="content"></div></div></div>

<div id="status">
  <div class="status-indicator" id="statusInd"></div>
  <span id="statusTxt">conectando</span>
</div>

<button id="fs-btn" onclick="toggleFullscreen()">tela cheia</button>

<script>
let ws, reconnectTimer;
let scrollPos = 0, targetPos = 0;
let playing = false, speed = 3, fontSize = 52, lineWidth = 75, highlightLine = true;
let animFrame, lastTime = 0;
let statusHideTimer;
let ready = false;

function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(proto + '://' + location.host);
  ws.onopen = () => { showStatus('conectado', 'live'); };
  ws.onclose = () => { showStatus('reconectando', ''); reconnectTimer = setTimeout(connect, 2000); };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'state') applyState(msg.state);
    if (msg.type === 'patch') applyPatch(msg.patch);
  };
}

function applyState(s) {
  document.getElementById('content').textContent = s.text;
  document.getElementById('text-wrap').style.width = s.lineWidth + '%';
  document.getElementById('content').style.fontSize = s.fontSize + 'px';
  fontSize = s.fontSize;
  lineWidth = s.lineWidth;
  speed = s.speed;
  highlightLine = s.highlightLine;
  playing = s.playing;
  targetPos = s.scrollPosition;
  if (!ready) {
    scrollPos = targetPos;
    applyScroll();
    document.getElementById('waiting').classList.add('hidden');
    ready = true;
  }
  updateHighlight();
  updateStatusFromState(s);
  if (playing && !animFrame) startScroll();
}

function applyPatch(p) {
  if (p.text !== undefined) { document.getElementById('content').textContent = p.text; }
  if (p.fontSize !== undefined) { document.getElementById('content').style.fontSize = p.fontSize + 'px'; fontSize = p.fontSize; }
  if (p.lineWidth !== undefined) { document.getElementById('text-wrap').style.width = p.lineWidth + '%'; lineWidth = p.lineWidth; }
  if (p.speed !== undefined) speed = p.speed;
  if (p.highlightLine !== undefined) { highlightLine = p.highlightLine; updateHighlight(); }
  if (p.scrollPosition !== undefined) { targetPos = p.scrollPosition; if (!playing) { scrollPos = targetPos; applyScroll(); } }
  if (p.playing !== undefined) {
    playing = p.playing;
    if (playing) { if (!animFrame) startScroll(); }
    else { if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; } }
  }
  updateStatusFromPatch(p);
}

function applyScroll() {
  const scroller = document.getElementById('scroller');
  const totalH = scroller.scrollHeight - window.innerHeight;
  scroller.style.transform = 'translateY(-' + (scrollPos * totalH) + 'px)';
}

function startScroll() {
  lastTime = performance.now();
  function tick(now) {
    const dt = now - lastTime; lastTime = now;
    if (playing) {
      const scroller = document.getElementById('scroller');
      const totalH = scroller.scrollHeight - window.innerHeight;
      if (totalH > 0) {
        const pixelsPerSec = speed * 25;
        scrollPos += (pixelsPerSec * dt) / (1000 * totalH);
        scrollPos = Math.min(1, scrollPos);
        targetPos = scrollPos;
        applyScroll();
        if (scrollPos >= 1) { playing = false; showStatus('fim', 'paused'); return; }
      }
    }
    animFrame = requestAnimationFrame(tick);
  }
  animFrame = requestAnimationFrame(tick);
}

function updateHighlight() {
  const hl = document.getElementById('highlight');
  const hll = document.getElementById('highlight-line');
  hl.style.display = highlightLine ? 'block' : 'none';
  if (highlightLine) {
    const lh = fontSize * 1.55;
    const mid = window.innerHeight / 2;
    hll.style.display = 'block';
    hll.style.top = (mid - lh / 2) + 'px';
    hll.style.height = lh + 'px';
  } else {
    hll.style.display = 'none';
  }
}

function showStatus(txt, cls) {
  const el = document.getElementById('status');
  const ind = document.getElementById('statusInd');
  el.classList.remove('hidden');
  document.getElementById('statusTxt').textContent = txt;
  ind.className = 'status-indicator' + (cls ? ' ' + cls : '');
  clearTimeout(statusHideTimer);
  statusHideTimer = setTimeout(() => el.classList.add('hidden'), 2500);
}

function updateStatusFromState(s) {
  showStatus(s.playing ? 'ao vivo' : 'pausado', s.playing ? 'live' : 'paused');
}
function updateStatusFromPatch(p) {
  if (p.playing !== undefined) showStatus(p.playing ? 'ao vivo' : 'pausado', p.playing ? 'live' : 'paused');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
}

window.addEventListener('resize', updateHighlight);
connect();
updateHighlight();
</script>
</body></html>`;
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  const pages = {
    "/": () => { res.writeHead(302, { Location: "/admin" }); res.end(); },
    "/admin": () => { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(pageAdmin()); },
    "/view":  () => { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(pageViewer(false)); },
    "/mirror":() => { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(pageViewer(true)); },
  };
  if (pages[url]) pages[url]();
  else { res.writeHead(404); res.end("Not found"); }
});

// ─── WebSocket Server ─────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "state", state }));

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "update") {
        Object.assign(state, msg.patch);
        const broadcast = JSON.stringify({ type: "patch", patch: msg.patch });
        for (const client of clients) {
          if (client !== ws && client.readyState === 1) client.send(broadcast);
        }
      }
    } catch (e) {}
  });

  ws.on("close", () => clients.delete(ws));
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Teleprompter rodando em http://localhost:" + PORT);
  console.log("  Admin  → /admin");
  console.log("  View   → /view");
  console.log("  Mirror → /mirror");
});
