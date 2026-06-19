/* ============================================================
   script.js — Faction LUA
   Contenu :
     1. Navbar scroll effect
     2. Menu hamburger mobile
     3. Particules hero (canvas)
     4. Compteur animé (stats)
     5. AOS maison (scroll reveal)
     6. Barres de puissance factions
     7. Mini-jeu : Cristal Dodge
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────
// 1. NAVBAR — EFFET AU SCROLL
// ─────────────────────────────────────────────
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });


// ─────────────────────────────────────────────
// 2. MENU HAMBURGER (mobile)
// ─────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  // Animation des 3 barres
  hamburger.classList.toggle('active');
});

// Fermer le menu en cliquant sur un lien
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
  });
});


// ─────────────────────────────────────────────
// 3. PARTICULES HERO (canvas ambient)
// ─────────────────────────────────────────────
(function initHeroParticles() {
  const canvas = document.getElementById('heroParticles');
  const ctx    = canvas.getContext('2d');

  let W, H, particles;

  // Redimensionner le canvas
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  }, { passive: true });

  // Créer les particules
  function initParticles() {
    const count = Math.floor((W * H) / 18000);
    particles = Array.from({ length: count }, () => createParticle());
  }

  function createParticle(fromBottom = false) {
    return {
      x:     Math.random() * W,
      y:     fromBottom ? H + 4 : Math.random() * H,
      size:  Math.random() * 2 + 0.5,
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    -(Math.random() * 0.6 + 0.2),
      alpha: Math.random() * 0.6 + 0.1,
      hue:   195 + Math.random() * 40,  // bleu → cyan
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach((p, i) => {
      // Déplacement
      p.x  += p.vx;
      p.y  += p.vy;
      p.alpha -= 0.001;

      // Recycler la particule quand elle sort ou disparaît
      if (p.y < -4 || p.alpha <= 0) {
        particles[i] = createParticle(true);
        return;
      }

      // Dessin
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle   = `hsl(${p.hue}, 100%, 70%)`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  resize();
  initParticles();
  draw();
})();


// ─────────────────────────────────────────────
// 4. COMPTEURS ANIMÉS (stats hero)
// ─────────────────────────────────────────────
function animateCounter(el, target, duration = 2000) {
  const start     = performance.now();
  const startVal  = 0;

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Easing ease-out
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(startVal + (target - startVal) * ease);

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// Observer pour déclencher les compteurs à l'entrée dans le viewport
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));


// ─────────────────────────────────────────────
// 5. AOS MAISON — SCROLL REVEAL
// ─────────────────────────────────────────────
const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, idx) => {
    if (entry.isIntersecting) {
      // Délai en cascade selon la position dans la liste
      entry.target.style.transitionDelay = `${idx * 80}ms`;
      entry.target.classList.add('visible');
      aosObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));


// ─────────────────────────────────────────────
// 6. BARRES DE PUISSANCE (factions)
// ─────────────────────────────────────────────
const powerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.power-fill').forEach(bar => {
        const targetWidth = bar.dataset.width;
        bar.style.width   = targetWidth + '%';
      });
      powerObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const factionsSection = document.getElementById('factions');
if (factionsSection) powerObserver.observe(factionsSection);


// ─────────────────────────────────────────────
// 7. MINI-JEU : CRISTAL DODGE
//    Le joueur est un cristal Lua bleu (pentagone)
//    Il esquive des projectiles aux couleurs des
//    3 factions adverses (JS jaune, Ruby rouge, Rust orange)
//    Score en temps réel + système de vies + niveaux
// ─────────────────────────────────────────────
(function CristalDodge() {

  // ── Éléments DOM
  const canvas       = document.getElementById('gameCanvas');
  const ctx          = canvas.getContext('2d');
  const overlay      = document.getElementById('gameOverlay');
  const startBtn     = document.getElementById('startBtn');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const bestDisplay  = document.getElementById('bestScoreDisplay');
  const levelDisplay = document.getElementById('levelDisplay');
  const livesDisplay = document.getElementById('livesDisplay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText  = document.getElementById('overlayText');
  const overlayScore = document.getElementById('overlayScore');

  // ── Dimensions du canvas
  const BASE_W = 800;
  const BASE_H = 480;

  function resizeCanvas() {
    const maxW      = Math.min(window.innerWidth - 48, BASE_W);
    const scale     = maxW / BASE_W;
    canvas.width    = BASE_W;
    canvas.height   = BASE_H;
    canvas.style.width  = (BASE_W * scale) + 'px';
    canvas.style.height = (BASE_H * scale) + 'px';
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // ── Couleurs des factions
  const COLORS = {
    lua:    { fill: '#00B4FF', stroke: '#00EEFF', glow: 'rgba(0,238,255,0.6)' },
    js:     { fill: '#FFB800', stroke: '#FFD54F', glow: 'rgba(255,184,0,0.5)' },
    ruby:   { fill: '#FF4040', stroke: '#FF7070', glow: 'rgba(255,64,64,0.5)' },
    rust:   { fill: '#FF6B00', stroke: '#FF9040', glow: 'rgba(255,107,0,0.5)' },
  };

  const FACTION_TYPES = ['js', 'ruby', 'rust'];

  // ── État du jeu
  let gameState = 'idle'; // 'idle' | 'running' | 'dead'
  let score     = 0;
  let bestScore = parseInt(localStorage.getItem('lua_best_score') || '0', 10);
  let level     = 1;
  let lives     = 3;
  let lastTime  = 0;
  let elapsed   = 0;
  let spawnTimer = 0;
  let invincible = false;
  let invTimer   = 0;

  bestDisplay.textContent = bestScore;

  // ── Joueur
  const player = {
    x:      BASE_W / 2,
    y:      BASE_H / 2,
    size:   22,
    speed:  4.5,
    color:  COLORS.lua,
    trail:  [],        // traîne lumineuse
  };

  // ── Projectiles
  let projectiles = [];

  // ── Étoiles de fond
  let stars = Array.from({ length: 80 }, () => ({
    x:     Math.random() * BASE_W,
    y:     Math.random() * BASE_H,
    size:  Math.random() * 1.5 + 0.3,
    alpha: Math.random() * 0.5 + 0.1,
    speed: Math.random() * 0.3 + 0.1,
  }));

  // ── Particules d'explosion
  let explosions = [];

  // ── Touches pressées
  const keys = {};

  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Démarrer avec Enter ou Espace si sur l'overlay
    if ((e.key === 'Enter' || e.key === ' ') && gameState === 'idle') {
      startGame();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ── Contrôles mobiles
  function bindMobileBtn(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('pointerup',   e => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('pointerleave',e => { keys[key] = false; });
  }
  bindMobileBtn('ctrlUp',    'ArrowUp');
  bindMobileBtn('ctrlDown',  'ArrowDown');
  bindMobileBtn('ctrlLeft',  'ArrowLeft');
  bindMobileBtn('ctrlRight', 'ArrowRight');

  // ── Bouton START / RESTART
  startBtn.addEventListener('click', startGame);

  // ────────────────────────────
  // DÉMARRER LA PARTIE
  // ────────────────────────────
  function startGame() {
    // Reset
    score        = 0;
    level        = 1;
    lives        = 3;
    elapsed      = 0;
    spawnTimer   = 0;
    invincible   = false;
    invTimer     = 0;
    projectiles  = [];
    explosions   = [];
    player.x     = BASE_W / 2;
    player.y     = BASE_H / 2;
    player.trail = [];

    updateHUD();

    // Cacher l'overlay
    overlay.classList.add('hidden');
    gameState = 'running';
    lastTime  = performance.now();
    requestAnimationFrame(gameLoop);
  }

  // ────────────────────────────
  // BOUCLE PRINCIPALE
  // ────────────────────────────
  function gameLoop(now) {
    if (gameState !== 'running') return;

    const dt = Math.min(now - lastTime, 50); // cap à 50ms
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // ────────────────────────────
  // UPDATE
  // ────────────────────────────
  function update(dt) {
    const dtS = dt / 1000; // secondes

    // ── Score (temps survécu × 10)
    score  += dtS * 10 * level;
    elapsed += dtS;

    // ── Niveau (augmente toutes les 10 secondes)
    level = Math.floor(elapsed / 10) + 1;

    // ── Timer invincibilité
    if (invincible) {
      invTimer -= dtS;
      if (invTimer <= 0) invincible = false;
    }

    // ── Déplacement joueur
    movePlayer(dtS);

    // ── Spawn des projectiles
    const spawnInterval = Math.max(0.4, 1.5 - level * 0.08);
    spawnTimer += dtS;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnProjectile();
    }

    // ── Mise à jour projectiles
    projectiles.forEach(p => {
      p.x += p.vx * dtS;
      p.y += p.vy * dtS;
    });

    // Supprimer les projectiles hors écran
    projectiles = projectiles.filter(p =>
      p.x > -60 && p.x < BASE_W + 60 &&
      p.y > -60 && p.y < BASE_H + 60
    );

    // ── Collisions
    if (!invincible) {
      checkCollisions();
    }

    // ── Mise à jour étoiles (parallaxe)
    stars.forEach(s => {
      s.x -= s.speed * dtS * 60;
      if (s.x < 0) { s.x = BASE_W; s.y = Math.random() * BASE_H; }
    });

    // ── Mise à jour explosions
    explosions.forEach(e => {
      e.particles.forEach(p => {
        p.x     += p.vx * dtS * 60;
        p.y     += p.vy * dtS * 60;
        p.alpha -= 1.5 * dtS;
        p.size  *= 0.97;
      });
      e.particles = e.particles.filter(p => p.alpha > 0);
    });
    explosions = explosions.filter(e => e.particles.length > 0);

    // ── Traîne du joueur
    player.trail.push({ x: player.x, y: player.y, alpha: 0.5 });
    if (player.trail.length > 12) player.trail.shift();
    player.trail.forEach(t => { t.alpha -= 0.04; });

    // ── MAJ HUD
    updateHUD();
  }

  // ────────────────────────────
  // DÉPLACEMENT JOUEUR
  // ────────────────────────────
  function movePlayer(dtS) {
    const speed = player.speed * 60 * dtS;
    const diag  = speed / Math.SQRT2;

    const up    = keys['ArrowUp']    || keys['z'] || keys['Z'];
    const down  = keys['ArrowDown']  || keys['s'] || keys['S'];
    const left  = keys['ArrowLeft']  || keys['q'] || keys['Q'];
    const right = keys['ArrowRight'] || keys['d'] || keys['D'];

    const moving = up || down || left || right;
    const diagMove = (up || down) && (left || right);

    if (up)    player.y -= diagMove ? diag : speed;
    if (down)  player.y += diagMove ? diag : speed;
    if (left)  player.x -= diagMove ? diag : speed;
    if (right) player.x += diagMove ? diag : speed;

    // Limites du terrain (avec marge)
    const m = player.size;
    player.x = Math.max(m, Math.min(BASE_W - m, player.x));
    player.y = Math.max(m, Math.min(BASE_H - m, player.y));
  }

  // ────────────────────────────
  // SPAWN PROJECTILE
  // ────────────────────────────
  function spawnProjectile() {
    // Choisir un côté (0=haut, 1=droite, 2=bas, 3=gauche)
    const side  = Math.floor(Math.random() * 4);
    const type  = FACTION_TYPES[Math.floor(Math.random() * FACTION_TYPES.length)];
    const speed = (180 + level * 20) * (Math.random() * 0.4 + 0.8);

    let x, y, vx, vy;
    const margin = 20;

    switch (side) {
      case 0: // haut
        x = Math.random() * BASE_W;
        y = -margin;
        // Viser vaguement le joueur avec variante aléatoire
        vx = (player.x - x) / BASE_H * speed + (Math.random() - 0.5) * 80;
        vy = speed;
        break;
      case 1: // droite
        x = BASE_W + margin;
        y = Math.random() * BASE_H;
        vx = -speed;
        vy = (player.y - y) / BASE_W * speed + (Math.random() - 0.5) * 80;
        break;
      case 2: // bas
        x = Math.random() * BASE_W;
        y = BASE_H + margin;
        vx = (player.x - x) / BASE_H * speed + (Math.random() - 0.5) * 80;
        vy = -speed;
        break;
      case 3: // gauche
        x = -margin;
        y = Math.random() * BASE_H;
        vx = speed;
        vy = (player.y - y) / BASE_W * speed + (Math.random() - 0.5) * 80;
        break;
    }

    // Normaliser la vitesse
    const mag = Math.sqrt(vx * vx + vy * vy);
    vx = vx / mag * speed;
    vy = vy / mag * speed;

    projectiles.push({ x, y, vx, vy, type, size: 10 + level * 0.5, color: COLORS[type] });
  }

  // ────────────────────────────
  // DÉTECTION DE COLLISION
  // ────────────────────────────
  function checkCollisions() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p    = projectiles[i];
      const dist = Math.hypot(p.x - player.x, p.y - player.y);

      if (dist < player.size + p.size - 6) {
        // Collision !
        createExplosion(p.x, p.y, p.color.fill);
        projectiles.splice(i, 1);
        loseLife();
        break; // une seule collision par frame
      }
    }
  }

  // ────────────────────────────
  // PERDRE UNE VIE
  // ────────────────────────────
  function loseLife() {
    lives--;
    invincible = true;
    invTimer   = 1.5; // 1.5 secondes d'invincibilité

    // Flash du canvas
    flashCanvas();

    if (lives <= 0) {
      endGame();
    }
  }

  function flashCanvas() {
    let flashes = 0;
    const flash = () => {
      ctx.fillStyle = 'rgba(255, 40, 40, 0.15)';
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      flashes++;
      if (flashes < 3) setTimeout(flash, 100);
    };
    flash();
  }

  // ────────────────────────────
  // FIN DE PARTIE
  // ────────────────────────────
  function endGame() {
    gameState = 'idle';
    const finalScore = Math.floor(score);

    // Mettre à jour le meilleur score
    if (finalScore > bestScore) {
      bestScore = finalScore;
      localStorage.setItem('lua_best_score', bestScore);
      bestDisplay.textContent = bestScore;
    }

    // Afficher l'overlay Game Over
    overlayTitle.textContent = 'GAME OVER';
    overlayText.innerHTML   = `Tu as survécu <strong>${Math.floor(elapsed)}s</strong> jusqu'au niveau <strong>${level}</strong>.`;
    overlayScore.innerHTML  = `Score final : <strong style="color: var(--lua-neon)">${finalScore}</strong>
      ${finalScore >= bestScore ? ' <span style="color:#00FF88">🏆 Nouveau record !</span>' : ''}`;
    startBtn.textContent    = 'Rejouer';
    overlay.classList.remove('hidden');
  }

  // ────────────────────────────
  // EXPLOSION DE PARTICULES
  // ────────────────────────────
  function createExplosion(x, y, color) {
    const particles = Array.from({ length: 16 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      return {
        x, y,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed,
        size:  Math.random() * 4 + 1,
        alpha: 1,
        color,
      };
    });
    explosions.push({ particles });
  }

  // ────────────────────────────
  // MISE À JOUR HUD
  // ────────────────────────────
  function updateHUD() {
    scoreDisplay.textContent = Math.floor(score);
    levelDisplay.textContent = level;
    livesDisplay.textContent = '♦ '.repeat(lives).trim() || '—';
    bestDisplay.textContent  = Math.max(bestScore, Math.floor(score));
  }

  // ────────────────────────────
  // RENDU
  // ────────────────────────────
  function render() {
    // Fond
    ctx.fillStyle = '#060A12';
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    // Grille de fond
    drawGrid();

    // Étoiles
    drawStars();

    // Traîne du joueur
    drawTrail();

    // Projectiles
    projectiles.forEach(drawProjectile);

    // Joueur
    drawPlayer();

    // Explosions
    explosions.forEach(e => e.particles.forEach(drawParticle));

    // Overlay niveau (flash entre niveaux)
    drawLevelBadge();
  }

  // ── Grille cyber subtile
  function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 100, 180, 0.06)';
    ctx.lineWidth   = 1;
    const step      = 50;
    for (let x = 0; x < BASE_W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
    }
    for (let y = 0; y < BASE_H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
    }
  }

  // ── Étoiles
  function drawStars() {
    stars.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle   = '#7FDDFF';
      ctx.shadowColor = '#00B4FF';
      ctx.shadowBlur  = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Traîne lumineuse du joueur
  function drawTrail() {
    player.trail.forEach((t, i) => {
      const size = player.size * 0.3 * (i / player.trail.length);
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle   = '#00B4FF';
      ctx.shadowColor = '#00EEFF';
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      drawPentagon(ctx, t.x, t.y, size);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Joueur (cristal pentagone)
  function drawPlayer() {
    const { x, y, size, color } = player;

    ctx.save();

    // Clignotement en mode invincible
    if (invincible && Math.floor(invTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    // Halo externe
    const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 2.5);
    gradient.addColorStop(0, 'rgba(0, 238, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 180, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Corps du cristal
    ctx.fillStyle   = color.fill;
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth   = 2;
    ctx.shadowColor = color.glow;
    ctx.shadowBlur  = 20;

    ctx.beginPath();
    drawPentagon(ctx, x, y, size);
    ctx.fill();
    ctx.stroke();

    // Reflet interne
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    drawPentagon(ctx, x - size * 0.2, y - size * 0.2, size * 0.4);
    ctx.fill();

    ctx.restore();
  }

  // ── Pentagone (forme du cristal)
  function drawPentagon(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const px    = cx + r * Math.cos(angle);
      const py    = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  // ── Projectile ennemi
  function drawProjectile(p) {
    const { x, y, size, color } = p;

    ctx.save();
    ctx.fillStyle   = color.fill;
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = color.glow;
    ctx.shadowBlur  = 15;

    // Forme : carré rotatif (distinct du joueur pentagone)
    const angle = Math.atan2(p.vy, p.vx) + Math.PI / 4;
    ctx.translate(x, y);
    ctx.rotate(angle + performance.now() / 600);

    ctx.beginPath();
    ctx.rect(-size / 2, -size / 2, size, size);
    ctx.fill();
    ctx.stroke();

    // Badge faction (lettre)
    ctx.rotate(-(angle + performance.now() / 600));
    ctx.fillStyle   = 'rgba(0,0,0,0.5)';
    ctx.font        = `bold ${size * 0.7}px Orbitron, monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur  = 0;
    const label     = p.type === 'js' ? 'JS' : p.type === 'ruby' ? 'RB' : 'RS';
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }

  // ── Particule d'explosion
  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Badge niveau (affiché brièvement au changement de niveau)
  let lastLevel = 1;
  let levelFlashTimer = 0;

  function drawLevelBadge() {
    if (level !== lastLevel) {
      lastLevel        = level;
      levelFlashTimer  = 1.5;
    }

    if (levelFlashTimer > 0) {
      levelFlashTimer -= 1 / 60;
      const alpha       = Math.min(1, levelFlashTimer);
      ctx.save();
      ctx.globalAlpha   = alpha * 0.9;
      ctx.fillStyle     = '#00EEFF';
      ctx.font          = `bold 40px Orbitron, monospace`;
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.shadowColor   = '#00B4FF';
      ctx.shadowBlur    = 30;
      ctx.fillText(`NIVEAU ${level}`, BASE_W / 2, BASE_H / 2);
      ctx.restore();
    }
  }

  // ── Premier rendu (fond statique avant le début)
  function renderIdle() {
    ctx.fillStyle = '#060A12';
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    drawGrid();
    drawStars();
  }

  renderIdle();

})(); // fin CristalDodge