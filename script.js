/* ============================================================
   script.js — Faction LUA | Refonte v2
   1. Navbar scroll
   2. Hamburger mobile
   3. Particules hero
   4. Compteurs animés
   5. AOS maison
   6. Système d'onglets factions
   7. Mini-jeu Cristal Dodge (avec correctif preventDefault scroll)
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────
   1. NAVBAR SCROLL
───────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });


/* ─────────────────────────────────────────
   2. HAMBURGER MOBILE
───────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});


/* ─────────────────────────────────────────
   3. PARTICULES HERO (canvas ambient)
───────────────────────────────────────── */
(function heroParticles() {
  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function newParticle(fromBottom = false) {
    return {
      x:     Math.random() * W,
      y:     fromBottom ? H + 4 : Math.random() * H,
      size:  Math.random() * 1.8 + 0.4,
      vx:    (Math.random() - 0.5) * 0.25,
      vy:    -(Math.random() * 0.55 + 0.15),
      alpha: Math.random() * 0.5 + 0.15,
      hue:   192 + Math.random() * 35,
    };
  }

  function init() {
    const n = Math.floor((W * H) / 16000);
    particles = Array.from({ length: n }, () => newParticle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.0009;
      if (p.y < -4 || p.alpha <= 0) { particles[i] = newParticle(true); return; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle   = `hsl(${p.hue},100%,72%)`;
      ctx.shadowColor = `hsl(${p.hue},100%,60%)`;
      ctx.shadowBlur  = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); init(); }, { passive: true });
  resize(); init(); draw();
})();


/* ─────────────────────────────────────────
   4. COMPTEURS ANIMÉS
───────────────────────────────────────── */
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const from  = 0;
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * e);
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

const cntObs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      animateCounter(en.target, +en.target.dataset.target);
      cntObs.unobserve(en.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => cntObs.observe(el));


/* ─────────────────────────────────────────
   5. AOS MAISON
───────────────────────────────────────── */
const aosObs = new IntersectionObserver(entries => {
  entries.forEach((en, i) => {
    if (en.isIntersecting) {
      en.target.style.transitionDelay = `${i * 60}ms`;
      en.target.classList.add('visible');
      aosObs.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-aos]').forEach(el => aosObs.observe(el));


/* ─────────────────────────────────────────
   6. SYSTÈME D'ONGLETS FACTIONS
───────────────────────────────────────── */
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.faction-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.faction;

    // Mise à jour des boutons
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    // Mise à jour des panels
    tabPanels.forEach(panel => {
      panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`panel-${target}`);
    if (activePanel) activePanel.classList.add('active');
  });
});


/* ─────────────────────────────────────────
   7. MINI-JEU : CRISTAL DODGE
   Correctifs :
   - preventDefault sur les touches directionnelles/ZQSD
     UNIQUEMENT quand le jeu est actif (gameState === 'running')
   - preventDefault conditionnel pour ne pas bloquer la nav
───────────────────────────────────────── */
(function CristalDodge() {

  const canvas       = document.getElementById('gameCanvas');
  const ctx          = canvas.getContext('2d');
  const overlay      = document.getElementById('gameOverlay');
  const startBtn     = document.getElementById('startBtn');
  const scoreEl      = document.getElementById('scoreDisplay');
  const bestEl       = document.getElementById('bestScoreDisplay');
  const levelEl      = document.getElementById('levelDisplay');
  const livesEl      = document.getElementById('livesDisplay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText  = document.getElementById('overlayText');
  const overlayScore = document.getElementById('overlayScore');

  const BASE_W = 780;
  const BASE_H = 460;

  function resizeCanvas() {
    const maxW = Math.min(window.innerWidth - 48, BASE_W);
    const scale = maxW / BASE_W;
    canvas.width  = BASE_W;
    canvas.height = BASE_H;
    canvas.style.width  = (BASE_W * scale) + 'px';
    canvas.style.height = (BASE_H * scale) + 'px';
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Couleurs
  const C = {
    lua:  { fill: '#00B4FF', stroke: '#00EEFF', glow: 'rgba(0,238,255,.6)' },
    js:   { fill: '#FFB800', stroke: '#FFD54F', glow: 'rgba(255,184,0,.5)' },
    ruby: { fill: '#FF4040', stroke: '#FF7070', glow: 'rgba(255,64,64,.5)' },
    rust: { fill: '#FF6B00', stroke: '#FF9040', glow: 'rgba(255,107,0,.5)' },
  };
  const ENEMIES = ['js', 'ruby', 'rust'];

  // État
  let gameState = 'idle';
  let score = 0, bestScore = parseInt(localStorage.getItem('lua_best') || '0', 10);
  let level = 1, lives = 3;
  let elapsed = 0, spawnTimer = 0;
  let lastTime = 0;
  let invincible = false, invTimer = 0;
  let projectiles = [], explosions = [], trail = [];
  let levelFlashTimer = 0, lastLevelShown = 1;

  bestEl.textContent = bestScore;

  const player = { x: BASE_W / 2, y: BASE_H / 2, size: 20, speed: 4.6 };

  // Étoiles de fond
  const stars = Array.from({ length: 75 }, () => ({
    x:     Math.random() * BASE_W,
    y:     Math.random() * BASE_H,
    size:  Math.random() * 1.4 + 0.3,
    alpha: Math.random() * 0.45 + 0.08,
    spd:   Math.random() * 0.25 + 0.08,
  }));

  // ── Touches (avec preventDefault sur les touches de jeu)
  const keys = {};
  const GAME_KEYS = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','z','Z','s','S','q','Q','d','D',' ']);

  window.addEventListener('keydown', e => {
    // Bloquer le scroll de la page UNIQUEMENT pendant une partie active
    if (gameState === 'running' && GAME_KEYS.has(e.key)) {
      e.preventDefault();
    }
    keys[e.key] = true;
    if ((e.key === 'Enter' || e.key === ' ') && gameState === 'idle') startGame();
  }, { passive: false }); // passive:false OBLIGATOIRE pour pouvoir appeler preventDefault

  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  }, { passive: true });

  // ── Contrôles mobiles
  function bindCtrl(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('pointerup',   e => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('pointerleave',e => { keys[key] = false; });
  }
  bindCtrl('ctrlUp',    'ArrowUp');
  bindCtrl('ctrlDown',  'ArrowDown');
  bindCtrl('ctrlLeft',  'ArrowLeft');
  bindCtrl('ctrlRight', 'ArrowRight');

  startBtn.addEventListener('click', startGame);

  // ── Démarrer
  function startGame() {
    score = 0; level = 1; lives = 3;
    elapsed = 0; spawnTimer = 0;
    invincible = false; invTimer = 0;
    projectiles = []; explosions = []; trail = [];
    lastLevelShown = 1; levelFlashTimer = 0;
    player.x = BASE_W / 2;
    player.y = BASE_H / 2;
    updateHUD();
    overlay.classList.add('hidden');
    gameState = 'running';
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  // ── Loop
  function loop(now) {
    if (gameState !== 'running') return;
    const dt = Math.min(now - lastTime, 48);
    lastTime = now;
    update(dt / 1000);
    render();
    requestAnimationFrame(loop);
  }

  // ── Update
  function update(dt) {
    score  += dt * 10 * level;
    elapsed += dt;
    level   = Math.floor(elapsed / 10) + 1;

    if (invincible) { invTimer -= dt; if (invTimer <= 0) invincible = false; }

    // Déplacement
    const spd = player.speed * 60 * dt;
    const dia = spd / Math.SQRT2;
    const U = keys['ArrowUp']    || keys['z'] || keys['Z'];
    const D = keys['ArrowDown']  || keys['s'] || keys['S'];
    const L = keys['ArrowLeft']  || keys['q'] || keys['Q'];
    const R = keys['ArrowRight'] || keys['d'] || keys['D'];
    const diag = (U || D) && (L || R);
    if (U) player.y -= diag ? dia : spd;
    if (D) player.y += diag ? dia : spd;
    if (L) player.x -= diag ? dia : spd;
    if (R) player.x += diag ? dia : spd;
    player.x = Math.max(player.size, Math.min(BASE_W - player.size, player.x));
    player.y = Math.max(player.size, Math.min(BASE_H - player.size, player.y));

    // Traîne
    trail.push({ x: player.x, y: player.y, a: 0.45 });
    if (trail.length > 14) trail.shift();
    trail.forEach(t => { t.a -= 0.035; });

    // Spawn
    const interval = Math.max(0.38, 1.4 - level * 0.07);
    spawnTimer += dt;
    if (spawnTimer >= interval) { spawnTimer = 0; spawnProjectile(); }

    // Proj
    projectiles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; });
    projectiles = projectiles.filter(p =>
      p.x > -80 && p.x < BASE_W + 80 && p.y > -80 && p.y < BASE_H + 80
    );

    // Collision
    if (!invincible) checkCollisions();

    // Étoiles
    stars.forEach(s => { s.x -= s.spd * dt * 60; if (s.x < 0) { s.x = BASE_W; s.y = Math.random() * BASE_H; } });

    // Explosions
    explosions.forEach(ex => {
      ex.particles.forEach(p => {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.a -= 1.4 * dt;
        p.r *= 0.975;
      });
      ex.particles = ex.particles.filter(p => p.a > 0);
    });
    explosions = explosions.filter(ex => ex.particles.length > 0);

    // Flash niveau
    if (level !== lastLevelShown) { lastLevelShown = level; levelFlashTimer = 1.8; }
    if (levelFlashTimer > 0) levelFlashTimer -= dt;

    updateHUD();
  }

  // ── Spawn projectile
  function spawnProjectile() {
    const side = Math.floor(Math.random() * 4);
    const type = ENEMIES[Math.floor(Math.random() * 3)];
    const spd  = (170 + level * 18) * (Math.random() * 0.4 + 0.8);
    const m    = 22;
    let x, y, vx, vy;

    switch (side) {
      case 0: x = Math.random()*BASE_W; y = -m; vx = (player.x - x) / BASE_H * spd + rnd(70); vy = spd; break;
      case 1: x = BASE_W+m; y = Math.random()*BASE_H; vx = -spd; vy = (player.y - y) / BASE_W * spd + rnd(70); break;
      case 2: x = Math.random()*BASE_W; y = BASE_H+m; vx = (player.x - x) / BASE_H * spd + rnd(70); vy = -spd; break;
      case 3: x = -m; y = Math.random()*BASE_H; vx = spd; vy = (player.y - y) / BASE_W * spd + rnd(70); break;
    }

    const mag = Math.hypot(vx, vy);
    projectiles.push({ x, y, vx: vx/mag*spd, vy: vy/mag*spd, type, size: 9 + level * 0.4, color: C[type] });
  }

  function rnd(n) { return (Math.random() - 0.5) * n; }

  // ── Collision
  function checkCollisions() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (Math.hypot(p.x - player.x, p.y - player.y) < player.size + p.size - 5) {
        boom(p.x, p.y, p.color.fill);
        projectiles.splice(i, 1);
        loseLife();
        break;
      }
    }
  }

  function loseLife() {
    lives--;
    invincible = true; invTimer = 1.4;
    flashScreen();
    if (lives <= 0) endGame();
  }

  function flashScreen() {
    let n = 0;
    const f = () => {
      ctx.fillStyle = 'rgba(255,40,40,.14)';
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      if (++n < 3) setTimeout(f, 90);
    };
    f();
  }

  function endGame() {
    gameState = 'idle';
    const s = Math.floor(score);
    if (s > bestScore) {
      bestScore = s;
      localStorage.setItem('lua_best', s);
      bestEl.textContent = s;
    }
    overlayTitle.textContent = 'GAME OVER';
    overlayText.innerHTML = `Survie : <strong>${Math.floor(elapsed)}s</strong> — Niveau <strong>${level}</strong>`;
    overlayScore.innerHTML = `Score : <strong style="color:var(--lua-neon)">${s}</strong>${s >= bestScore ? ' <span style="color:#00FF88">🏆 Record !</span>' : ''}`;
    startBtn.textContent = 'Rejouer';
    overlay.classList.remove('hidden');
  }

  // ── Explosion
  function boom(x, y, color) {
    const particles = Array.from({ length: 14 }, () => {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3.5 + 1;
      return { x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, r: Math.random()*3.5+1, a: 1, color };
    });
    explosions.push({ particles });
  }

  // ── HUD
  function updateHUD() {
    scoreEl.textContent = Math.floor(score);
    levelEl.textContent = level;
    livesEl.textContent = '♦ '.repeat(Math.max(0, lives)).trim() || '—';
    bestEl.textContent  = Math.max(bestScore, Math.floor(score));
  }

  // ── Render
  function render() {
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    drawGrid();
    drawStars();
    trail.forEach(drawTrailPt);
    projectiles.forEach(drawProj);
    drawPlayer();
    explosions.forEach(ex => ex.particles.forEach(drawBoomPt));
    if (levelFlashTimer > 0) drawLevelFlash();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(0,90,170,.055)';
    ctx.lineWidth = 1;
    for (let x = 0; x < BASE_W; x += 52) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,BASE_H); ctx.stroke(); }
    for (let y = 0; y < BASE_H; y += 52) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(BASE_W,y); ctx.stroke(); }
  }

  function drawStars() {
    stars.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle   = '#7FDDFF';
      ctx.shadowColor = '#00B4FF';
      ctx.shadowBlur  = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawTrailPt(t, i) {
    if (t.a <= 0) return;
    const s = player.size * 0.28 * (i / trail.length);
    ctx.save();
    ctx.globalAlpha = Math.max(0, t.a);
    ctx.fillStyle   = '#00B4FF';
    ctx.shadowColor = '#00EEFF'; ctx.shadowBlur = 8;
    pentagon(t.x, t.y, s); ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const { x, y, size } = player;
    ctx.save();
    if (invincible && Math.floor(invTimer * 10) % 2 === 0) ctx.globalAlpha = 0.28;

    // Halo
    const g = ctx.createRadialGradient(x,y,size*.4, x,y,size*2.8);
    g.addColorStop(0, 'rgba(0,238,255,.2)');
    g.addColorStop(1, 'rgba(0,180,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, size*2.8, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle   = '#00B4FF';
    ctx.strokeStyle = '#00EEFF';
    ctx.lineWidth   = 2;
    ctx.shadowColor = 'rgba(0,238,255,.6)';
    ctx.shadowBlur  = 18;
    pentagon(x, y, size); ctx.fill(); ctx.stroke();

    // Reflet
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(255,255,255,.22)';
    pentagon(x - size*.2, y - size*.2, size*.38); ctx.fill();

    ctx.restore();
  }

  function drawProj(p) {
    const { x, y, size, color } = p;
    ctx.save();
    ctx.fillStyle   = color.fill;
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth   = 1.4;
    ctx.shadowColor = color.glow;
    ctx.shadowBlur  = 14;
    ctx.translate(x, y);
    ctx.rotate(performance.now() / 600);
    ctx.beginPath();
    ctx.rect(-size/2, -size/2, size, size);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Label
    ctx.save();
    ctx.fillStyle    = 'rgba(0,0,0,.5)';
    ctx.font         = `bold ${size*.7}px Orbitron, monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const lbl = p.type === 'js' ? 'JS' : p.type === 'ruby' ? 'RB' : 'RS';
    ctx.fillText(lbl, x, y);
    ctx.restore();
  }

  function drawBoomPt(p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.a);
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawLevelFlash() {
    const a = Math.min(1, levelFlashTimer) * 0.88;
    ctx.save();
    ctx.globalAlpha    = a;
    ctx.fillStyle      = '#00EEFF';
    ctx.font           = 'bold 38px Orbitron, monospace';
    ctx.textAlign      = 'center';
    ctx.textBaseline   = 'middle';
    ctx.shadowColor    = '#00B4FF'; ctx.shadowBlur = 28;
    ctx.fillText(`NIVEAU ${level}`, BASE_W/2, BASE_H/2);
    ctx.restore();
  }

  function pentagon(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI*2*i/5) - Math.PI/2;
      i === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
              : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a));
    }
    ctx.closePath();
  }

  // Rendu initial (écran d'attente)
  ctx.fillStyle = '#050810';
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  drawGrid(); drawStars();

})(); // fin CristalDodge