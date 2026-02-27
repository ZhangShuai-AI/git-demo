const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const enemiesEl = document.getElementById("enemies");
const restartBtn = document.getElementById("restartBtn");

const keys = new Set();
const obstacles = [];
const bullets = [];
const enemyBullets = [];
let enemies = [];

const WORLD = {
  width: canvas.width,
  height: canvas.height,
  enemyTotal: 8,
  gameOver: false,
  win: false,
  score: 0,
};

const player = {
  x: 70,
  y: WORLD.height - 80,
  size: 34,
  speed: 3.2,
  dirX: 0,
  dirY: -1,
  lives: 3,
  cooldown: 0,
};

function reset() {
  WORLD.gameOver = false;
  WORLD.win = false;
  WORLD.score = 0;

  player.x = 70;
  player.y = WORLD.height - 80;
  player.dirX = 0;
  player.dirY = -1;
  player.lives = 3;
  player.cooldown = 0;

  bullets.length = 0;
  enemyBullets.length = 0;
  enemies = createEnemies(WORLD.enemyTotal);

  obstacles.length = 0;
  for (let i = 0; i < 12; i++) {
    obstacles.push({
      x: 130 + (i % 6) * 120,
      y: 120 + Math.floor(i / 6) * 220,
      width: 56,
      height: 56,
    });
  }
  updateHud();
}

function createEnemies(count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({
      x: 120 + (i % 4) * 180,
      y: 40 + Math.floor(i / 4) * 90,
      size: 32,
      speed: 1.4,
      dirX: Math.random() > 0.5 ? 1 : -1,
      dirY: 0,
      moveTimer: 45 + Math.random() * 80,
      fireTimer: 40 + Math.random() * 110,
    });
  }
  return result;
}

function updateHud() {
  scoreEl.textContent = `得分：${WORLD.score}`;
  livesEl.textContent = `生命：${player.lives}`;
  enemiesEl.textContent = `敌军：${enemies.length}`;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

function canMoveTo(x, y, size) {
  const next = { x, y, width: size, height: size };
  if (x < 0 || y < 0 || x + size > WORLD.width || y + size > WORLD.height) {
    return false;
  }
  return !obstacles.some((obs) => rectsOverlap(next, obs));
}

function movePlayer() {
  if (WORLD.gameOver) return;
  let dx = 0;
  let dy = 0;

  if (keys.has("w")) {
    dy -= player.speed;
    player.dirX = 0;
    player.dirY = -1;
  }
  if (keys.has("s")) {
    dy += player.speed;
    player.dirX = 0;
    player.dirY = 1;
  }
  if (keys.has("a")) {
    dx -= player.speed;
    player.dirX = -1;
    player.dirY = 0;
  }
  if (keys.has("d")) {
    dx += player.speed;
    player.dirX = 1;
    player.dirY = 0;
  }

  if (dx !== 0 && canMoveTo(player.x + dx, player.y, player.size)) {
    player.x += dx;
  }
  if (dy !== 0 && canMoveTo(player.x, player.y + dy, player.size)) {
    player.y += dy;
  }

  if (player.cooldown > 0) {
    player.cooldown -= 1;
  }
}

function spawnBullet(tank, arr, speed, isEnemy = false) {
  const bulletSize = 7;
  const centerX = tank.x + tank.size / 2 - bulletSize / 2;
  const centerY = tank.y + tank.size / 2 - bulletSize / 2;
  arr.push({
    x: centerX,
    y: centerY,
    size: bulletSize,
    vx: tank.dirX * speed,
    vy: tank.dirY * speed,
    fromEnemy: isEnemy,
  });
}

function shootPlayer() {
  if (WORLD.gameOver || player.cooldown > 0) return;
  spawnBullet(player, bullets, 5.8, false);
  player.cooldown = 18;
}

function moveEnemies() {
  enemies.forEach((enemy) => {
    enemy.moveTimer -= 1;
    enemy.fireTimer -= 1;

    if (enemy.moveTimer <= 0) {
      enemy.moveTimer = 40 + Math.random() * 90;
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      [enemy.dirX, enemy.dirY] = dirs[(Math.random() * dirs.length) | 0];
    }

    const nx = enemy.x + enemy.dirX * enemy.speed;
    const ny = enemy.y + enemy.dirY * enemy.speed;
    if (canMoveTo(nx, ny, enemy.size)) {
      enemy.x = nx;
      enemy.y = ny;
    } else {
      enemy.dirX *= -1;
      enemy.dirY *= -1;
    }

    if (enemy.fireTimer <= 0) {
      enemy.fireTimer = 50 + Math.random() * 120;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX > absY) {
        enemy.dirX = dx > 0 ? 1 : -1;
        enemy.dirY = 0;
      } else {
        enemy.dirY = dy > 0 ? 1 : -1;
        enemy.dirX = 0;
      }
      spawnBullet(enemy, enemyBullets, 4.2, true);
    }
  });
}

function moveBullets() {
  const update = (arr) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      const bullet = arr[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      const rect = { x: bullet.x, y: bullet.y, width: bullet.size, height: bullet.size };
      const hitWall = bullet.x < 0 || bullet.y < 0 || bullet.x > WORLD.width || bullet.y > WORLD.height;
      const hitObstacle = obstacles.some((obs) => rectsOverlap(rect, obs));
      if (hitWall || hitObstacle) {
        arr.splice(i, 1);
      }
    }
  };
  update(bullets);
  update(enemyBullets);
}

function collisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const bRect = { x: b.x, y: b.y, width: b.size, height: b.size };
    const enemyIndex = enemies.findIndex((enemy) =>
      rectsOverlap(bRect, { x: enemy.x, y: enemy.y, width: enemy.size, height: enemy.size })
    );
    if (enemyIndex >= 0) {
      bullets.splice(i, 1);
      enemies.splice(enemyIndex, 1);
      WORLD.score += 100;
      updateHud();
      continue;
    }
  }

  const playerRect = { x: player.x, y: player.y, width: player.size, height: player.size };
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (rectsOverlap({ x: b.x, y: b.y, width: b.size, height: b.size }, playerRect)) {
      enemyBullets.splice(i, 1);
      player.lives -= 1;
      updateHud();
      if (player.lives <= 0) {
        WORLD.gameOver = true;
      }
    }
  }

  if (enemies.length === 0) {
    WORLD.gameOver = true;
    WORLD.win = true;
  }
}

function drawTank(tank, color) {
  ctx.fillStyle = color;
  ctx.fillRect(tank.x, tank.y, tank.size, tank.size);

  ctx.fillStyle = "#0d1117";
  const centerX = tank.x + tank.size / 2;
  const centerY = tank.y + tank.size / 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, tank.size * 0.24, 0, Math.PI * 2);
  ctx.fill();

  const barrelLen = tank.size * 0.5;
  const bx = centerX + tank.dirX * barrelLen;
  const by = centerY + tank.dirY * barrelLen;
  ctx.strokeStyle = "#d2a8ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(bx, by);
  ctx.stroke();
}

function render() {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#396b39";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#8b949e";
  obstacles.forEach((obs) => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));

  drawTank(player, "#58a6ff");
  enemies.forEach((enemy) => drawTank(enemy, "#f85149"));

  ctx.fillStyle = "#ffd33d";
  bullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size));

  ctx.fillStyle = "#ff7b72";
  enemyBullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size));

  if (WORLD.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 54px sans-serif";
    ctx.fillText(WORLD.win ? "胜利！" : "游戏结束", WORLD.width / 2, WORLD.height / 2 - 16);
    ctx.font = "24px sans-serif";
    ctx.fillText("点击“重新开始”再来一局", WORLD.width / 2, WORLD.height / 2 + 28);
  }
}

function loop() {
  movePlayer();
  moveEnemies();
  moveBullets();
  collisions();
  render();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (["w", "a", "s", "d", "j"].includes(key)) {
    e.preventDefault();
  }
  if (["w", "a", "s", "d"].includes(key)) {
    keys.add(key);
  }
  if (key === "j") {
    shootPlayer();
  }
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

restartBtn.addEventListener("click", reset);

reset();
loop();
