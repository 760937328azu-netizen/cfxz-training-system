(function () {
  const WORLD_WIDTH = 720;
  const WORLD_HEIGHT = 540;
  const MAX_DPR = 2;
  let activeInstance = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function intersects(a, b) {
    return a.x - a.width / 2 < b.x + b.width / 2
      && a.x + a.width / 2 > b.x - b.width / 2
      && a.y - a.height / 2 < b.y + b.height / 2
      && a.y + a.height / 2 > b.y - b.height / 2;
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function shortLabel(value) {
    const replacements = {
      "工作时间玩游戏": "上班玩游戏",
      "私用团建费": "私用团建费",
      "保持办公秩序": "办公有序"
    };
    return replacements[value] || String(value || "").slice(0, 6);
  }

  function roundRect(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
  }

  function mount(options) {
    const root = options && options.root;
    if (!root) return { destroy() {} };
    if (activeInstance && typeof activeInstance.destroy === "function") activeInstance.destroy();

    const negativeWords = shuffle((options.negativeWords || []).map((word) => ({
      id: word.id,
      text: shortLabel(word.text)
    })));
    const positiveWords = shuffle((options.positiveWords || []).map((word) => ({
      id: word.id,
      text: shortLabel(word.text)
    })));

    root.innerHTML = `
      <div class="rocket-shooter" data-rocket-state="ready">
        <div class="rocket-shooter-hud" aria-live="polite">
          <span data-rocket-wave>准备开始</span>
          <span data-rocket-score>得分 0</span>
          <span data-rocket-lives>生命 3</span>
          <span class="rocket-boss-hud" data-rocket-boss-hud hidden>
            <small>秩序破坏者·违规机甲</small><i><b data-rocket-boss-bar></b></i><em data-rocket-boss-value>100%</em>
          </span>
        </div>
        <div class="rocket-canvas-shell">
          <canvas class="rocket-canvas" data-rocket-canvas aria-label="火箭打 Boss 游戏舞台"></canvas>
          <div class="rocket-game-overlay" data-rocket-overlay>
            <span data-rocket-overlay-kicker>制度守护行动</span>
            <strong data-rocket-overlay-title>${options.completed ? "本关已完成" : "识别违规行为，守护团队秩序"}</strong>
            <p data-rocket-overlay-copy>左右移动：A / D 或方向键<br>发射导弹：空格键或点击发射按钮<br>看清负面行为后，再主动发射</p>
            <button type="button" data-rocket-primary>${options.completed ? "再次挑战" : "开始挑战"}</button>
          </div>
          <button class="rocket-fire-button" type="button" data-rocket-fire aria-label="发射导弹">发射</button>
        </div>
        <div class="rocket-shooter-controls">
          <div class="rocket-mobile-steer" aria-label="移动控制">
            <button type="button" data-rocket-left aria-label="向左移动">←</button>
            <button type="button" data-rocket-right aria-label="向右移动">→</button>
          </div>
          <p>桌面端使用 A / D、方向键或拖动，按空格发射；手机端拖动火箭，点击发射按钮。</p>
          <div>
            <button type="button" data-rocket-pause disabled>暂停</button>
            <button type="button" data-rocket-restart>重新挑战</button>
          </div>
        </div>
      </div>
    `;

    const wrapper = root.querySelector(".rocket-shooter");
    const canvas = root.querySelector("[data-rocket-canvas]");
    const context = canvas.getContext("2d");
    const overlay = root.querySelector("[data-rocket-overlay]");
    const overlayKicker = root.querySelector("[data-rocket-overlay-kicker]");
    const overlayTitle = root.querySelector("[data-rocket-overlay-title]");
    const overlayCopy = root.querySelector("[data-rocket-overlay-copy]");
    const primaryButton = root.querySelector("[data-rocket-primary]");
    const fireButton = root.querySelector("[data-rocket-fire]");
    const pauseButton = root.querySelector("[data-rocket-pause]");
    const restartButton = root.querySelector("[data-rocket-restart]");
    const leftButton = root.querySelector("[data-rocket-left]");
    const rightButton = root.querySelector("[data-rocket-right]");
    const waveLabel = root.querySelector("[data-rocket-wave]");
    const scoreLabel = root.querySelector("[data-rocket-score]");
    const livesLabel = root.querySelector("[data-rocket-lives]");
    const bossHud = root.querySelector("[data-rocket-boss-hud]");
    const bossBar = root.querySelector("[data-rocket-boss-bar]");
    const bossValue = root.querySelector("[data-rocket-boss-value]");

    let destroyed = false;
    let running = false;
    let paused = false;
    let animationFrame = null;
    let lastTimestamp = 0;
    let elapsed = 0;
    let state = "ready";
    let stateTimer = 0;
    let wave = 0;
    let waveTarget = 0;
    let waveSpawned = 0;
    let waveResolved = 0;
    let spawnTimer = 0;
    let positiveTimer = 5;
    let score = 0;
    let pointerActive = false;
    let completionReported = false;
    let lastHud = "";
    let negativeIndex = 0;
    let positiveIndex = 0;
    let fireHeld = false;
    let shotsFired = 0;

    const keys = { left: false, right: false };
    const player = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT - 56,
      width: 54,
      height: 52,
      lives: 3,
      cooldown: 0,
      invulnerable: 0,
      shield: 0
    };
    let bullets = [];
    let enemies = [];
    let enemyBullets = [];
    let pickups = [];
    let particles = [];
    let boss = null;

    function notifyStatus() {
      if (typeof options.onStatus !== "function") return;
      let label = "准备开始";
      if (state === "tutorial") label = "行动提示";
      if (state === "wave") label = `第 ${wave} 波 ${waveResolved}/${waveTarget}`;
      if (state === "wave-clear") label = `第 ${wave} 波完成`;
      if (state === "boss-intro") label = "违规机甲接近";
      if (state === "boss" && boss) label = `违规机甲血量 ${Math.max(0, Math.ceil((boss.health / boss.maxHealth) * 100))}%`;
      if (state === "won") label = "已通关";
      if (state === "lost") label = "挑战失败";
      if (paused) label = "已暂停";
      options.onStatus({ state, label, score, lives: player.lives, wave });
    }

    function updateHud(force) {
      const bossPercent = boss ? Math.max(0, Math.ceil((boss.health / boss.maxHealth) * 100)) : 100;
      let waveText = "准备开始";
      if (state === "tutorial") waveText = "行动提示";
      if (state === "wave") waveText = `第 ${wave} 波 ${waveResolved}/${waveTarget}`;
      if (state === "wave-clear") waveText = `第 ${wave} 波完成`;
      if (state === "boss-intro") waveText = "违规机甲接近";
      if (state === "boss") waveText = "守护团队秩序";
      if (state === "won") waveText = "通关完成";
      if (state === "lost") waveText = "挑战失败";
      if (paused) waveText = "已暂停";
      const snapshot = `${waveText}|${score}|${player.lives}|${bossPercent}|${Boolean(boss)}`;
      if (!force && snapshot === lastHud) return;
      lastHud = snapshot;
      waveLabel.textContent = waveText;
      scoreLabel.textContent = `得分 ${score}`;
      livesLabel.textContent = `生命 ${Math.max(0, player.lives)}`;
      bossHud.hidden = !(state === "boss-intro" || state === "boss");
      bossBar.style.width = `${bossPercent}%`;
      bossValue.textContent = `${bossPercent}%`;
      wrapper.dataset.rocketState = state;
      wrapper.dataset.rocketWave = String(wave);
      wrapper.dataset.rocketLives = String(player.lives);
      wrapper.dataset.rocketScore = String(score);
      wrapper.dataset.rocketBossHealth = String(bossPercent);
      wrapper.dataset.rocketShots = String(shotsFired);
      notifyStatus();
    }

    function resizeCanvas() {
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      canvas.width = Math.round(WORLD_WIDTH * dpr);
      canvas.height = Math.round(WORLD_HEIGHT * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function resetRuntime() {
      bullets = [];
      enemies = [];
      enemyBullets = [];
      pickups = [];
      particles = [];
      boss = null;
      wave = 0;
      waveTarget = 0;
      waveSpawned = 0;
      waveResolved = 0;
      spawnTimer = 0;
      positiveTimer = 5;
      score = 0;
      elapsed = 0;
      completionReported = false;
      fireHeld = false;
      shotsFired = 0;
      player.x = WORLD_WIDTH / 2;
      player.lives = 3;
      player.cooldown = 0;
      player.invulnerable = 0;
      player.shield = 0;
      keys.left = false;
      keys.right = false;
      lastHud = "";
    }

    function setOverlay(kicker, title, copy, buttonText, visible) {
      overlayKicker.textContent = kicker;
      overlayTitle.textContent = title;
      overlayCopy.textContent = copy || "";
      overlayCopy.hidden = !copy;
      primaryButton.textContent = buttonText;
      overlay.hidden = !visible;
    }

    function startWave(number) {
      state = "wave";
      fireButton.disabled = false;
      wave = number;
      waveTarget = number === 1 ? 5 : 6;
      waveSpawned = 0;
      waveResolved = 0;
      spawnTimer = 0.35;
      updateHud(true);
    }

    function startBossIntro() {
      state = "boss-intro";
      fireButton.disabled = true;
      stateTimer = 2.2;
      boss = {
        x: WORLD_WIDTH / 2,
        y: -70,
        width: 190,
        height: 108,
        maxHealth: 105,
        health: 105,
        velocityX: 72,
        shotTimer: 1.15,
        flash: 0
      };
      enemyBullets = [];
      updateHud(true);
    }

    function startGame() {
      if (destroyed) return;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resetRuntime();
      state = "tutorial";
      stateTimer = 2.6;
      running = true;
      paused = false;
      lastTimestamp = 0;
      overlay.hidden = true;
      pauseButton.disabled = false;
      fireButton.disabled = true;
      pauseButton.textContent = "暂停";
      updateHud(true);
      animationFrame = window.requestAnimationFrame(loop);
    }

    function resumeGame() {
      if (!paused || destroyed) return;
      paused = false;
      running = true;
      lastTimestamp = 0;
      overlay.hidden = true;
      pauseButton.textContent = "暂停";
      fireButton.disabled = !(state === "wave" || state === "boss");
      updateHud(true);
      animationFrame = window.requestAnimationFrame(loop);
    }

    function pauseGame() {
      if (!running || paused || state === "won" || state === "lost") return;
      paused = true;
      running = false;
      fireHeld = false;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      setOverlay("挑战暂停", "稍作休息", "继续后会从当前波次恢复。", "继续挑战", true);
      pauseButton.textContent = "继续";
      fireButton.disabled = true;
      updateHud(true);
    }

    function addParticles(x, y, color, count) {
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x,
          y,
          velocityX: (Math.random() - 0.5) * 180,
          velocityY: (Math.random() - 0.5) * 180,
          life: 0.45 + Math.random() * 0.3,
          color
        });
      }
    }

    function spawnEnemy() {
      if (!negativeWords.length || waveSpawned >= waveTarget) return;
      const word = negativeWords[negativeIndex % negativeWords.length];
      negativeIndex += 1;
      const lane = waveSpawned % 5;
      const laneGap = (WORLD_WIDTH - 168) / 4;
      const x = 84 + lane * laneGap + (Math.random() - 0.5) * 42;
      enemies.push({
        id: `${word.id}-${wave}-${waveSpawned}`,
        word,
        x: clamp(x, 90, WORLD_WIDTH - 90),
        y: -38 - Math.random() * 40,
        width: 116,
        height: 46,
        health: wave === 1 ? 2 : 3,
        maxHealth: wave === 1 ? 2 : 3,
        speed: wave === 1 ? 38 : 50,
        velocityX: (waveSpawned % 2 ? -1 : 1) * (22 + Math.random() * 18),
        visibleDuration: 0,
        hasFullyEnteredViewport: false,
        isTargetable: false,
        flash: 0,
        resolved: false
      });
      waveSpawned += 1;
    }

    function spawnPickup() {
      if (!positiveWords.length || pickups.length) return;
      const word = positiveWords[positiveIndex % positiveWords.length];
      positiveIndex += 1;
      pickups.push({
        word,
        x: 120 + Math.random() * (WORLD_WIDTH - 240),
        y: -30,
        width: 104,
        height: 38,
        speed: 54
      });
    }

    function firePlayerBullet() {
      let target = null;
      if (state === "boss" && boss) target = boss;
      const targetableEnemies = enemies.filter((enemy) => enemy.isTargetable && !enemy.resolved);
      if (!target && targetableEnemies.length) {
        target = targetableEnemies.reduce((nearest, enemy) => {
          if (!nearest) return enemy;
          const currentDistance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          const nearestDistance = Math.hypot(nearest.x - player.x, nearest.y - player.y);
          return currentDistance < nearestDistance ? enemy : nearest;
        }, null);
      }
      const targetX = target ? target.x : player.x;
      const targetY = target ? target.y : -40;
      const deltaX = targetX - player.x;
      const deltaY = targetY - (player.y - 24);
      const magnitude = Math.max(1, Math.hypot(deltaX, deltaY));
      const speed = 520;
      bullets.push({
        x: player.x,
        y: player.y - 30,
        width: 8,
        height: 20,
        target,
        velocityX: (deltaX / magnitude) * speed,
        velocityY: (deltaY / magnitude) * speed
      });
      shotsFired += 1;
    }

    function tryFire() {
      if (!running || paused || (state !== "wave" && state !== "boss") || player.cooldown > 0) return false;
      firePlayerBullet();
      player.cooldown = 0.32;
      updateHud(true);
      return true;
    }

    function damagePlayer() {
      if (player.invulnerable > 0) return;
      if (player.shield > 0) {
        player.shield = 0;
        player.invulnerable = 0.7;
        addParticles(player.x, player.y, "#d8ad55", 10);
        return;
      }
      player.lives -= 1;
      player.invulnerable = 1.15;
      addParticles(player.x, player.y, "#b52f29", 14);
      if (player.lives <= 0) loseGame();
    }

    function finishEnemy(enemy) {
      if (enemy.resolved) return;
      enemy.resolved = true;
      waveResolved += 1;
      score += 100;
      addParticles(enemy.x, enemy.y, "#d8ad55", 12);
    }

    function updatePlayer(delta) {
      const movement = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      player.x = clamp(player.x + movement * 330 * delta, 34, WORLD_WIDTH - 34);
      player.invulnerable = Math.max(0, player.invulnerable - delta);
      player.cooldown = Math.max(0, player.cooldown - delta);
      if (fireHeld) tryFire();
    }

    function updateWave(delta) {
      spawnTimer -= delta;
      positiveTimer -= delta;
      if (spawnTimer <= 0 && waveSpawned < waveTarget) {
        spawnEnemy();
        spawnTimer = wave === 1 ? 1.65 : 1.35;
      }
      if (positiveTimer <= 0) {
        spawnPickup();
        positiveTimer = 7.5;
      }
      if (waveSpawned >= waveTarget && waveResolved >= waveTarget && enemies.length === 0) {
        state = "wave-clear";
        fireButton.disabled = true;
        stateTimer = 1.8;
        updateHud(true);
      }
    }

    function updateEnemies(delta) {
      enemies.forEach((enemy) => {
        enemy.flash = Math.max(0, enemy.flash - delta);
        enemy.x += enemy.velocityX * delta;
        enemy.y += enemy.speed * delta;
        enemy.hasFullyEnteredViewport = enemy.y - enemy.height / 2 >= 10;
        if (enemy.hasFullyEnteredViewport && !enemy.isTargetable) {
          enemy.visibleDuration += delta;
          enemy.isTargetable = enemy.visibleDuration >= 1.35;
        }
        if (enemy.x < 70 || enemy.x > WORLD_WIDTH - 70) enemy.velocityX *= -1;
        if (enemy.y > WORLD_HEIGHT - 92 && !enemy.resolved) {
          enemy.resolved = true;
          waveResolved += 1;
          damagePlayer();
        }
      });
      enemies = enemies.filter((enemy) => !enemy.resolved && enemy.y < WORLD_HEIGHT + 70);
    }

    function updateBoss(delta) {
      if (!boss) return;
      boss.flash = Math.max(0, boss.flash - delta);
      if (state === "boss-intro") {
        boss.y += (92 - boss.y) * Math.min(1, delta * 2.4);
        return;
      }
      boss.x += boss.velocityX * delta;
      if (boss.x < 135 || boss.x > WORLD_WIDTH - 135) boss.velocityX *= -1;
      boss.shotTimer -= delta;
      if (boss.shotTimer <= 0) {
        const count = boss.health < boss.maxHealth * 0.45 ? 3 : 2;
        for (let index = 0; index < count; index += 1) {
          const spread = (index - (count - 1) / 2) * 0.22;
          const deltaX = player.x - boss.x;
          const deltaY = player.y - boss.y;
          const angle = Math.atan2(deltaY, deltaX) + spread;
          enemyBullets.push({
            x: boss.x,
            y: boss.y + 44,
            width: 14,
            height: 14,
            velocityX: Math.cos(angle) * 135,
            velocityY: Math.sin(angle) * 135
          });
        }
        boss.shotTimer = boss.health < boss.maxHealth * 0.45 ? 1.5 : 1.95;
      }
    }

    function updateBullets(delta) {
      bullets.forEach((bullet) => {
        const target = bullet.target;
        const targetIsActive = target && !target.resolved
          && (target === boss ? state === "boss" && boss.health > 0 : target.health > 0);
        if (targetIsActive) {
          const deltaX = target.x - bullet.x;
          const deltaY = target.y - bullet.y;
          const magnitude = Math.max(1, Math.hypot(deltaX, deltaY));
          const steering = Math.min(1, delta * 5.4);
          bullet.velocityX += ((deltaX / magnitude) * 520 - bullet.velocityX) * steering;
          bullet.velocityY += ((deltaY / magnitude) * 520 - bullet.velocityY) * steering;
        }
        bullet.x += bullet.velocityX * delta;
        bullet.y += bullet.velocityY * delta;
      });
      enemyBullets.forEach((bullet) => {
        bullet.x += bullet.velocityX * delta;
        bullet.y += bullet.velocityY * delta;
      });

      bullets.forEach((bullet) => {
        if (bullet.resolved) return;
        const enemy = enemies.find((candidate) => candidate.isTargetable && !candidate.resolved && intersects(bullet, candidate));
        if (enemy) {
          bullet.resolved = true;
          enemy.health -= 1;
          enemy.flash = 0.14;
          if (enemy.health <= 0) finishEnemy(enemy);
          return;
        }
        if (state === "boss" && boss && intersects(bullet, boss)) {
          bullet.resolved = true;
          boss.health -= 3;
          boss.flash = 0.1;
          score += 8;
          if (boss.health <= 0) winGame();
        }
      });

      const playerBox = { x: player.x, y: player.y, width: 38, height: 38 };
      enemyBullets.forEach((bullet) => {
        if (!bullet.resolved && intersects(bullet, playerBox)) {
          bullet.resolved = true;
          damagePlayer();
        }
      });

      bullets = bullets.filter((bullet) => !bullet.resolved
        && bullet.x > -30 && bullet.x < WORLD_WIDTH + 30 && bullet.y > -40 && bullet.y < WORLD_HEIGHT + 40);
      enemyBullets = enemyBullets.filter((bullet) => !bullet.resolved
        && bullet.x > -40 && bullet.x < WORLD_WIDTH + 40 && bullet.y > -40 && bullet.y < WORLD_HEIGHT + 40);
    }

    function updatePickups(delta) {
      const playerBox = { x: player.x, y: player.y, width: 46, height: 46 };
      pickups.forEach((pickup) => {
        pickup.y += pickup.speed * delta;
        if (intersects(pickup, playerBox)) {
          pickup.resolved = true;
          player.shield = 1;
          score += 60;
          addParticles(pickup.x, pickup.y, "#66806a", 10);
        }
      });
      pickups = pickups.filter((pickup) => !pickup.resolved && pickup.y < WORLD_HEIGHT + 40);
    }

    function updateParticles(delta) {
      particles.forEach((particle) => {
        particle.x += particle.velocityX * delta;
        particle.y += particle.velocityY * delta;
        particle.life -= delta;
      });
      particles = particles.filter((particle) => particle.life > 0);
    }

    function update(delta) {
      elapsed += delta;
      if (state === "tutorial") {
        stateTimer -= delta;
        if (stateTimer <= 0) startWave(1);
      } else if (state === "wave-clear") {
        stateTimer -= delta;
        if (stateTimer <= 0) {
          if (wave === 1) startWave(2);
          else startBossIntro();
        }
      } else if (state === "boss-intro") {
        stateTimer -= delta;
        if (stateTimer <= 0) {
          state = "boss";
          fireButton.disabled = false;
        }
      }

      updatePlayer(delta);
      if (state === "wave") updateWave(delta);
      updateEnemies(delta);
      updateBoss(delta);
      updateBullets(delta);
      updatePickups(delta);
      updateParticles(delta);
      updateHud(false);
    }

    function winGame() {
      if (state === "won") return;
      state = "won";
      running = false;
      fireHeld = false;
      fireButton.disabled = true;
      boss.health = 0;
      addParticles(boss.x, boss.y, "#d8ad55", 36);
      updateHud(true);
      draw();
      if (!completionReported && typeof options.onComplete === "function") {
        completionReported = true;
        options.onComplete({ score, elapsed });
      }
    }

    function loseGame() {
      if (state === "lost") return;
      state = "lost";
      running = false;
      fireHeld = false;
      fireButton.disabled = true;
      updateHud(true);
      draw();
      setOverlay("挑战失败", "战机需要重新整备", "调整移动节奏，避开敌机攻击后再次挑战。", "重新挑战", true);
      pauseButton.disabled = true;
    }

    function drawBackground() {
      const gradient = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
      gradient.addColorStop(0, "#fffaf1");
      gradient.addColorStop(0.58, "#f7ead7");
      gradient.addColorStop(1, "#ead4b6");
      context.fillStyle = gradient;
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      context.strokeStyle = "rgba(159, 119, 70, 0.12)";
      context.lineWidth = 1;
      for (let x = 70; x < WORLD_WIDTH; x += 110) {
        context.beginPath();
        context.moveTo(x, 0);
        context.quadraticCurveTo(x + 24, WORLD_HEIGHT / 2, x - 10, WORLD_HEIGHT);
        context.stroke();
      }
      for (let index = 0; index < 24; index += 1) {
        const x = (index * 157 + 61) % WORLD_WIDTH;
        const y = (index * 83 + 34) % (WORLD_HEIGHT - 120);
        context.fillStyle = `rgba(181, 47, 41, ${0.05 + (index % 3) * 0.02})`;
        context.beginPath();
        context.arc(x, y, 2 + (index % 2), 0, Math.PI * 2);
        context.fill();
      }
    }

    function drawPlayer() {
      context.save();
      context.translate(player.x, player.y);
      if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) context.globalAlpha = 0.45;
      if (player.shield > 0) {
        context.strokeStyle = "rgba(102, 128, 106, 0.72)";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(0, 0, 37, 0, Math.PI * 2);
        context.stroke();
      }
      context.fillStyle = "rgba(215, 170, 81, 0.72)";
      context.beginPath();
      context.moveTo(-9, 25);
      context.lineTo(0, 45 + Math.sin(elapsed * 24) * 5);
      context.lineTo(9, 25);
      context.closePath();
      context.fill();
      context.fillStyle = "#8d2520";
      context.beginPath();
      context.moveTo(0, -30);
      context.lineTo(25, 22);
      context.lineTo(8, 17);
      context.lineTo(0, 28);
      context.lineTo(-8, 17);
      context.lineTo(-25, 22);
      context.closePath();
      context.fill();
      context.fillStyle = "#d8ad55";
      context.beginPath();
      context.arc(0, -7, 7, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    function drawEnemy(enemy) {
      context.save();
      context.translate(enemy.x, enemy.y);
      if (!enemy.isTargetable) context.globalAlpha = 0.76;
      if (enemy.flash > 0) context.globalAlpha = 0.58;
      context.fillStyle = "#7d2924";
      roundRect(context, -58, -23, 116, 46, 13);
      context.fill();
      context.fillStyle = "#a33a31";
      context.fillRect(-73, -8, 18, 16);
      context.fillRect(55, -8, 18, 16);
      context.fillStyle = "#f5d999";
      context.font = "700 20px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(enemy.word.text, 0, -2);
      const healthWidth = 72 * (enemy.health / enemy.maxHealth);
      context.fillStyle = "rgba(255,255,255,0.2)";
      context.fillRect(-36, 14, 72, 4);
      context.fillStyle = "#f0c66f";
      context.fillRect(-36, 14, healthWidth, 4);
      if (!enemy.isTargetable) {
        context.strokeStyle = "rgba(216, 173, 85, 0.82)";
        context.lineWidth = 2;
        context.setLineDash([5, 4]);
        roundRect(context, -63, -28, 126, 56, 15);
        context.stroke();
        context.setLineDash([]);
      }
      context.restore();
    }

    function drawBoss() {
      if (!boss) return;
      context.save();
      context.translate(boss.x, boss.y);
      if (boss.flash > 0) context.globalAlpha = 0.55;
      context.fillStyle = "rgba(109, 29, 26, 0.18)";
      context.beginPath();
      context.ellipse(0, 47, 118, 24, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#67201d";
      roundRect(context, -78, -48, 156, 96, 22);
      context.fill();
      context.fillStyle = "#8f2c26";
      roundRect(context, -48, -62, 96, 46, 14);
      context.fill();
      context.fillStyle = "#b64034";
      roundRect(context, -112, -20, 36, 60, 12);
      context.fill();
      roundRect(context, 76, -20, 36, 60, 12);
      context.fill();
      context.strokeStyle = "#d8ad55";
      context.lineWidth = 6;
      context.beginPath();
      context.moveTo(-34, -58);
      context.lineTo(-56, -86);
      context.moveTo(34, -58);
      context.lineTo(56, -86);
      context.stroke();
      context.fillStyle = "#f5d999";
      context.beginPath();
      context.arc(-20, -38, 7, 0, Math.PI * 2);
      context.arc(20, -38, 7, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#fff4d7";
      context.font = "700 16px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("秩序破坏者", 0, 3);
      context.fillText("违规机甲", 0, 24);
      context.restore();
    }

    function drawPickup(pickup) {
      context.save();
      context.translate(pickup.x, pickup.y);
      context.fillStyle = "rgba(102, 128, 106, 0.92)";
      roundRect(context, -52, -19, 104, 38, 19);
      context.fill();
      context.fillStyle = "#fff";
      context.font = "700 14px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(pickup.word.text, 0, 1);
      context.restore();
    }

    function drawBullets() {
      context.fillStyle = "#d8ad55";
      bullets.forEach((bullet) => {
        roundRect(context, bullet.x - 4, bullet.y - 10, 8, 20, 4);
        context.fill();
      });
      context.fillStyle = "#b52f29";
      enemyBullets.forEach((bullet) => {
        context.beginPath();
        context.arc(bullet.x, bullet.y, 7, 0, Math.PI * 2);
        context.fill();
      });
    }

    function drawParticles() {
      particles.forEach((particle) => {
        context.globalAlpha = clamp(particle.life / 0.75, 0, 1);
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
    }

    function drawStateMessage() {
      let lines = [];
      if (state === "tutorial") lines = [
        "左右移动：A / D 或方向键",
        "发射导弹：空格键或发射按钮",
        "看清负面行为后，再主动发射"
      ];
      if (state === "wave-clear") lines = [`第 ${wave} 波清除完成`];
      if (state === "boss-intro") lines = ["警报：秩序破坏者·违规机甲正在接近", "击败违规机甲，守护团队秩序"];
      if (!lines.length) return;
      const height = lines.length === 1 ? 64 : lines.length === 2 ? 88 : 116;
      context.fillStyle = "rgba(255, 250, 242, 0.9)";
      roundRect(context, WORLD_WIDTH / 2 - 230, WORLD_HEIGHT / 2 - height / 2, 460, height, 18);
      context.fill();
      context.fillStyle = "#84211d";
      context.font = lines.length === 1 ? "700 22px sans-serif" : "700 17px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      lines.forEach((line, index) => {
        const offset = (index - (lines.length - 1) / 2) * 28;
        context.fillText(line, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + offset);
      });
    }

    function draw() {
      if (!context || destroyed) return;
      context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      drawBackground();
      pickups.forEach(drawPickup);
      enemies.forEach(drawEnemy);
      drawBoss();
      drawBullets();
      drawPlayer();
      drawParticles();
      drawStateMessage();
    }

    function loop(timestamp) {
      if (destroyed || !running || paused) return;
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = Math.min(0.034, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;
      update(delta);
      draw();
      if (running && !paused) animationFrame = window.requestAnimationFrame(loop);
      else animationFrame = null;
    }

    function pointerToWorldX(event) {
      const rect = canvas.getBoundingClientRect();
      return clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * WORLD_WIDTH, 34, WORLD_WIDTH - 34);
    }

    function handlePointerDown(event) {
      if (!running || paused) return;
      event.preventDefault();
      pointerActive = true;
      player.x = pointerToWorldX(event);
      fireHeld = true;
      tryFire();
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!pointerActive || !running || paused) return;
      event.preventDefault();
      player.x += (pointerToWorldX(event) - player.x) * 0.72;
    }

    function handlePointerUp(event) {
      pointerActive = false;
      fireHeld = false;
      if (canvas.releasePointerCapture && canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    }

    function handleKeyDown(event) {
      if (!root.isConnected || !running || paused) return;
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", " "].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = true;
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = true;
      if (event.key === " ") {
        if (!fireHeld) tryFire();
        fireHeld = true;
      }
    }

    function handleKeyUp(event) {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = false;
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = false;
      if (event.key === " ") fireHeld = false;
    }

    function handleVisibility() {
      if (document.hidden && running && !paused) pauseGame();
    }

    function nudge(direction) {
      if (!running || paused) return;
      player.x = clamp(player.x + direction * 82, 34, WORLD_WIDTH - 34);
    }

    function handleFireStart(event) {
      if (!running || paused) return;
      event.preventDefault();
      fireHeld = true;
      tryFire();
      if (fireButton.setPointerCapture) fireButton.setPointerCapture(event.pointerId);
    }

    function handleFireEnd(event) {
      fireHeld = false;
      if (event && fireButton.releasePointerCapture && fireButton.hasPointerCapture && fireButton.hasPointerCapture(event.pointerId)) {
        fireButton.releasePointerCapture(event.pointerId);
      }
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      running = false;
      paused = false;
      fireHeld = false;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      fireButton.removeEventListener("pointerdown", handleFireStart);
      fireButton.removeEventListener("pointerup", handleFireEnd);
      fireButton.removeEventListener("pointercancel", handleFireEnd);
      primaryButton.removeEventListener("click", handlePrimary);
      pauseButton.removeEventListener("click", handlePauseButton);
      restartButton.removeEventListener("click", startGame);
      leftButton.removeEventListener("click", handleLeftButton);
      rightButton.removeEventListener("click", handleRightButton);
      bullets = [];
      enemies = [];
      enemyBullets = [];
      pickups = [];
      particles = [];
      boss = null;
      wrapper.dataset.rocketDestroyed = "true";
      if (activeInstance === api) activeInstance = null;
    }

    function handlePrimary() {
      if (paused) resumeGame();
      else startGame();
    }

    function handlePauseButton() {
      if (paused) resumeGame();
      else pauseGame();
    }

    function handleLeftButton() {
      nudge(-1);
    }

    function handleRightButton() {
      nudge(1);
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("visibilitychange", handleVisibility);
    canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
    canvas.addEventListener("pointermove", handlePointerMove, { passive: false });
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    fireButton.addEventListener("pointerdown", handleFireStart, { passive: false });
    fireButton.addEventListener("pointerup", handleFireEnd);
    fireButton.addEventListener("pointercancel", handleFireEnd);
    primaryButton.addEventListener("click", handlePrimary);
    pauseButton.addEventListener("click", handlePauseButton);
    restartButton.addEventListener("click", startGame);
    leftButton.addEventListener("click", handleLeftButton);
    rightButton.addEventListener("click", handleRightButton);

    resizeCanvas();
    fireButton.disabled = true;
    updateHud(true);

    const api = {
      destroy,
      restart: startGame,
      diagnostics() {
        return {
          state,
          running,
          paused,
          animationFrames: animationFrame ? 1 : 0,
          enemies: enemies.length,
          bullets: bullets.length,
          enemyBullets: enemyBullets.length,
          pickups: pickups.length,
          protectedEnemies: enemies.filter((enemy) => !enemy.isTargetable).length,
          targetableEnemies: enemies.filter((enemy) => enemy.isTargetable).length,
          shotsFired,
          bossHealth: boss ? Math.max(0, boss.health) : null,
          destroyed
        };
      }
    };
    activeInstance = api;
    return api;
  }

  window.CFXZRocketGame = {
    mount,
    diagnostics() {
      return activeInstance ? activeInstance.diagnostics() : {
        state: "idle",
        running: false,
        paused: false,
        animationFrames: 0,
        destroyed: true
      };
    }
  };
})();
