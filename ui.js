const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startBtn = document.getElementById("startBtn");
const startLevel = document.getElementById("startLevel");
const restartBtn = document.getElementById("restartBtn");
const gameCanvas = document.getElementById("gameCanvas");
const ownedOnceCards = new Set();

let isGameRunning = false;

startBtn.disabled = true;

startLevel.addEventListener("change", () => {
  startBtn.disabled = startLevel.value === "";
});

startBtn.addEventListener("click", () => {
  const lv = startLevel.value.trim();
  if (!lv) return;

  startScreen.classList.remove("active");
  gameCanvas.style.display = "block";

  spawnConfig.setLevel(lv);
  startGame(lv);
});

function showGameOver() {
  isGameRunning = false;
  setOwnedOnceCards(ownedOnceCards);
  gameOverScreen.classList.add("active");
  document.getElementById("gameCanvas").style.display = "none";
}

restartBtn.addEventListener("click", () => {
  gameOverScreen.classList.remove("active");
  startScreen.classList.add("active");
});

export { isGameRunning, showGameOver };

function startGame(level) {

  resetGameTimers();
  isGameRunning = true;

  resetLastTime();   
  resetEnemyTimer();   
}

function applyCardEffect(card) {
  if (card.type === "once") {
    ownedOnceCards.add(card.id);
    setOwnedOnceCards(ownedOnceCards);
  }
  switch (card.id) {
    case "explosive_round": playerEffects.explosive = true; break;
    case "double_shot": playerEffects.doubleShot = true; break;
    case "burn_shot": playerEffects.burnChance += 0.1; break;
    case "atk_up_1": player.damage += 2; break;
    case "atk_up_2": player.damage += 4; break;
    case "atk_up_3": player.damage += 7; break;
    case "atk_up_legend": player.damage += 12; break;
    case "enemy_hp_up":
      increaseEnemyHpMultiplier(0.5);
      increaseEnemyExpMultiplier(0.4);
      break;
    case "slow_down": multiplyEnemySpeedMultiplier(0.8); break;
    case "adrenaline_rush": playerEffects.adrenalineRush = true; break;
    case "AI_Accuration": playerEffects.secretAim = true; break;
    case "poison_shot": playerEffects.poisonChance = Math.min(playerEffects.poisonChance + 0.08, 0.4); break;
    case "fire_rate_up": playerEffects.fireRateBonus = Math.min(playerEffects.fireRateBonus + 0.05, 0.2); break;
  }
}

function showCardSelection(cards) {
  const overlay = document.createElement("div");
  overlay.id = "cardOverlay";
  overlay.innerHTML = `
    <div class="card-container">
      ${cards.map((c, i) => `
        <button class="card ${c.rarity}" data-index="${i}">
          <b>${c.rarity.toUpperCase()}</b><br>
          ${c.label}
        </button>
      `).join("")}
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.classList.add("fadeIn");  
  overlay.addEventListener("click", (e) => {
    if (!e.target.classList.contains("card")) return;
    const idx = e.target.dataset.index;
    const chosen = cards[idx];
    applyCardEffect(chosen);
    overlay.remove();
    setGamePaused(false);
  });
}

window.addEventListener("player-level-up", (e) => {
  setGamePaused(true);
  const cards = rollThreeCards();
  showCardSelection(cards);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "p") {
    setGamePaused(true);
  }
  if (e.key === "o") {
    setGamePaused(false);

  }
});

import {
  playerEffects,
  player 
} from "./player.js";

import {
  resetGameTimers,
  resetLastTime,
  spawnConfig,
  setGamePaused
} from "./canvas.js";

import {
  resetEnemyTimer,
  increaseEnemyHpMultiplier,
  increaseEnemyExpMultiplier,
  multiplyEnemySpeedMultiplier
} from "./enemy.js";

import {
  rollThreeCards,
  setOwnedOnceCards
} from "./card.js";