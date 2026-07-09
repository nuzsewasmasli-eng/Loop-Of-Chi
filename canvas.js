const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let lastTime = 0;
let isGamePaused = false;

function resetGameTimers() {
    lastTime = performance.now();
    enemyTimer = 0;
}

export const spawnConfig = {
    level: "Easy",

    configs: {
        Easy: { rate: 3000, max: 4 },
        Normal: { rate: 1500, max: 4 },
        Hard: { rate: 1000, max: 4 }
    },

    get() {
        return this.configs[this.level];
    },

    setLevel(lv) {
        this.level = lv;
        syncSpawnRate();
    }
};

export function setGamePaused(state) {
    isGamePaused = state;
}

export function syncSpawnRate() {
    const cfg = spawnConfig.get();
    if (!cfg) {

        return;
    }
    enemyRespawnTime = spawnConfig.get().rate;
}

let enemyHpMultiplier = 1;
let enemyExpMultiplier = 1;

let enemyRespawnTime = 2000;
let enemyTimer = 0;

const wall = {
    y: 530,
    height: 20,
    hp: 1000,
    maxHp: 1000
};

function resizeCanvas() {
    canvas.width = 400;
    canvas.height = 680;
}

function renderWall(ctx) {

    ctx.fillStyle = "#ff0000ff";
    ctx.fillRect(0, wall.y, canvas.width, wall.height);

    ctx.fillStyle = "#ff0000ff";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
        `WALL HP: ${Math.floor(wall.hp)} / ${wall.maxHp}`,
        canvas.width / 2,
        wall.y + 33
    );
}

export function spawnEnemy(delta) {
    enemyTimer += delta;

    const cfg = spawnConfig.get();

    if (enemyTimer < cfg.rate) return;

    enemyTimer = 0;

    if (enemies.length >= cfg.max) return;

    let e;

    if (spawnConfig.level === "Easy") {

        e = createNormalEnemy();

    } else if (spawnConfig.level === "Normal") {

        const roll = Math.random();
        e = roll < 0.75
            ? createNormalEnemy()
            : createFastEnemy();

    } else if (spawnConfig.level === "Hard") {

        const roll = Math.random();

        if (roll < 0.6) {
            e = createNormalEnemy();
        } else if (roll < 0.85) {
            e = createFastEnemy();
        } else {
            e = createHeavyEnemy();
        }

    }

    const pos = getRandomSpawnPoint();
    e.x = pos.x;
    e.y = pos.y;

    enemies.push(e);
}

function gameLoop(time) {
    if (isGamePaused) {
        lastTime = time; 
        requestAnimationFrame(gameLoop);
        return
    }
    const deltaTime = time - lastTime;
    lastTime = time;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isGameRunning) {
        updatePlayer(deltaTime);
    }
    if (isGameRunning) {
        renderWall(ctx);
        for (const enemy of enemies) {
            renderEnemy(ctx, enemy);
        }
        spawnEnemy(deltaTime);
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            updateEnemy(enemy, deltaTime, wall.y);
            if (enemy.isDead) {
                enemies.splice(i, 1);
            }
            renderEnemy(ctx, enemy);
            checkAdrenalineRush();
        }
        if (wall.hp <= 0) {
            showGameOver();
            return;
        }
        renderStats(ctx);
        renderPlayer(ctx);
        renderBullets(ctx);
        renderExplosions(ctx);
        renderDamageTexts(ctx);
    }

    requestAnimationFrame(gameLoop);
}

function getRandomSpawnPoint() {
    const { w, h } = getCanvasSize();
    const margin = 20;

    return {
        x: margin + Math.random() * (w - margin * 2),
        y: -margin
    };
}

export function scaleSpawnByLevel() {
  const lvl = getPlayerLevel();
  const cfg = spawnConfig.configs[spawnConfig.level];

  let baseRate, baseMax;

  if (spawnConfig.level === "Easy") {
    baseRate = 3000;
    baseMax = 4;

    const rateSteps = Math.floor(lvl / 5);
    const maxSteps  = Math.floor(lvl / 7);

    cfg.rate = Math.max(100, baseRate - rateSteps * 100);
    cfg.max  = baseMax + maxSteps;
  }

  if (spawnConfig.level === "Normal") {
    baseRate = 1500;
    baseMax = 4;

    const rateSteps = Math.floor(lvl / 7);
    const maxSteps  = Math.floor(lvl / 10);

    cfg.rate = Math.max(100, baseRate - rateSteps * 100);
    cfg.max  = baseMax + maxSteps;
  }

  if (spawnConfig.level === "Hard") {
    baseRate = 1000;
    baseMax = 4;

    const rateSteps = Math.floor(lvl / 12);
    const maxSteps  = Math.floor(lvl / 15);

    cfg.rate = Math.max(100, baseRate - rateSteps * 100);
    cfg.max  = baseMax + maxSteps;
  }

  enemyRespawnTime = cfg.rate;

  console.log(
    `[SCALING] ${spawnConfig.level} | Level ${lvl} | rate=${cfg.rate} | max=${cfg.max}`
  );
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
import {
    updatePlayer,
    renderPlayer,
    renderBullets,
    renderStats,
    renderExplosions,
    renderDamageTexts,
    getPlayerLevel
} from './player.js';

import { isGameRunning, showGameOver } from './ui.js';

import {
    enemies,
    createNormalEnemy,
    createFastEnemy,
    createHeavyEnemy,
    renderEnemy,
    updateEnemy,
    setWall,
    checkAdrenalineRush
} from "./enemy.js";

setWall(wall);

export {
    renderWall,
    resetGameTimers,
    enemyExpMultiplier,
    enemyHpMultiplier
};

export function resetLastTime() {
    lastTime = performance.now();
}

export function getLastTime() {
    return lastTime;
}

function getCanvasSize() {
    return {
        w: canvas.clientWidth || canvas.width,
        h: canvas.clientHeight || canvas.height
    };
}

requestAnimationFrame(gameLoop);