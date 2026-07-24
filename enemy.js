import { player, addDamageText, playerEffects } from "./player.js";

const enemies = [];

const ADRENALINE_LINE_Y = 390;

let enemyHpMultiplier = 1;
let enemyExpMultiplier = 1;
let enemySpeedMultiplier = 1;

function increaseEnemyHpMultiplier(val) {
    enemyHpMultiplier += val;
}

function increaseEnemyExpMultiplier(val) {
    enemyExpMultiplier += val;
}

function multiplyEnemySpeedMultiplier(val) {
    enemySpeedMultiplier *= val;
}

let enemyTimer = 0;

let wallRef = null;

function setWall(wall) {
    wallRef = wall;
}

function createNormalEnemy() {
    return {
        type: "normal",
        radius: 16,
        hp: 80 * (0.75 + player.damage * 0.02) * enemyHpMultiplier,
        speed: 50 * enemySpeedMultiplier,          
        attack: 10,
        attackSpeed: 1.0,
        attackCooldown: 0,
        exp: 25 * enemyExpMultiplier,
        isBurning: false,
        burnTime: 0,
        burnDamage: 0,
        isPoisoned: false,
        poisonDuration: 0,
        poisonDamage: 0,
        reservedDamage: 0,
        expGranted: false
    };
}

function createFastEnemy() {
    return {
        type: "fast",
        radius: 16,
        hp: 45 * (0.75 + player.damage * 0.02) * enemyHpMultiplier,
        speed: 100 * enemySpeedMultiplier,          
        attack: 0.8,
        attackSpeed: 0.5,
        attackCooldown: 0,
        exp: 35 * enemyExpMultiplier,
        isBurning: false,
        burnTime: 0,
        burnDamage: 0,
        isPoisoned: false,
        poisonDuration: 0,
        poisonDamage: 0,
        reservedDamage: 0,
        expGranted: false
    }
}

function createHeavyEnemy() {
    return {
        type: "heavy",
        radius: 16,
        hp: 200 * (0.75 + player.damage * 0.05) * enemyHpMultiplier,
        speed: 20 * enemySpeedMultiplier,          
        attack: 25,
        attackSpeed: 2.0,
        attackCooldown: 0,
        exp: 60 * enemyExpMultiplier,
        isBurning: false,
        burnTime: 0,
        burnDamage: 0,
        isPoisoned: false,
        poisonDuration: 0,
        poisonDamage: 0,
        reservedDamage: 0,
        expGranted: false
    }
}

function updateEnemy(enemy, deltaTime, wallY) {
    if (enemy.isDying) {
        enemy.deathTimer -= deltaTime;
        if (enemy.deathTimer <= 0) {
            enemy.isDead = true;
        }
        return;
    }
    if (enemy.isBurning) {
        enemy.burnTime -= deltaTime;
        const burnDmg = enemy.burnDamage * (deltaTime / 1000);
        enemy.hp -= burnDmg;
        if (!enemy.burnTickTimer) enemy.burnTickTimer = 0;
        enemy.burnTickTimer += deltaTime;
        if (enemy.burnTickTimer >= 200) {
            enemy.burnTickTimer = 0;
            addDamageText(
                enemy.x,
                enemy.y - enemy.radius - 10,
                burnDmg.toFixed(1),
                "burn"
            );
        }

        if (enemy.burnTime <= 0) {
            enemy.isBurning = false;
            enemy.burnTickTimer = 0;
        }
    }

    if (enemy.isPoisoned) {
        enemy.poisonDuration -= deltaTime;
        const poisonDmg = enemy.poisonDamage * (deltaTime / 1000);
        enemy.hp -= poisonDmg;
        if (!enemy.poisonTickTimer) enemy.poisonTickTimer = 0;
        enemy.poisonTickTimer += deltaTime;
        if (enemy.poisonTickTimer >= 200) {
            enemy.poisonTickTimer = 0;
            addDamageText(
                enemy.x,
                enemy.y - enemy.radius - 10,
                poisonDmg.toFixed(1),
                "poison"
            );
        }

        if (enemy.poisonDuration <= 0) {
            enemy.isPoisoned = false;
            enemy.poisonTickTimer = 0;
        }
    }

    if (!enemy.isOnWall) {
        enemy.y += enemy.speed * (deltaTime / 1000);
    }

    const bottom = enemy.y + enemy.radius;

    if (bottom >= wallY) {
        enemy.y = wallY - enemy.radius;
        enemy.isOnWall = true;

        enemy.attackCooldown -= deltaTime;

        if (enemy.attackCooldown <= 0 && wallRef) {
            wallRef.hp -= enemy.attack;

            enemy.attackCooldown = enemy.attackSpeed * 1000;
        }
    } else {
        enemy.isOnWall = false;
    }
}

function renderEnemy(ctx, enemy) {
    let bodyColor, outlineColor, coreColor;
    let glowColor = "#ffffff";  // Default white glow

    let alpha = 1;
    let trembleX = 0;
    let trembleY = 0;

    if (enemy.isDying) {
        alpha = enemy.deathTimer / 300;
        const shake = 2; 
        trembleX = (Math.random() - 0.5) * shake;
        trembleY = (Math.random() - 0.5) * shake;
    }

    // Determine glow color based on status
    if (enemy.isBurning && enemy.isPoisoned) {
        // Alternate warna setiap frame
        glowColor = Math.floor(Date.now() / 300) % 2 === 0 ? "#ff8800" : "#00ff00";
    } else if (enemy.isBurning) {
        glowColor = "#ff8800";  // Orange
    } else if (enemy.isPoisoned) {
        glowColor = "#00ff00";  // Green
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(trembleX, trembleY);

    // Render glow
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = alpha * 0.3;  // Glow transparency
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Render body dengan full opacity
    ctx.globalAlpha = alpha;

    if (enemy.type === "heavy") {
        bodyColor = "#ff4b4b";
        outlineColor = "#7a0000";
        coreColor = "#ffd2d2";
    }
    else if (enemy.type === "normal") {
        bodyColor = "#ffd93b";
        outlineColor = "#a67c00";
        coreColor = "#fff2b2";
    }
    else if (enemy.type === "fast") {
        bodyColor = "#4bff6a";
        outlineColor = "#007a2a";
        coreColor = "#baffc7";
    }

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3.7;
    ctx.strokeStyle = outlineColor;
    ctx.stroke();

    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(enemy.x - 4, enemy.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore(); 
}

function checkAdrenalineRush() {
    if (!playerEffects.adrenalineRush) return;

    const danger = enemies.some(e => e.y >= ADRENALINE_LINE_Y);

    if (danger && !playerEffects.adrenalineActive) {
        playerEffects.adrenalineActive = true;

        player.shootRate *= 0.7;  
        player.damage *= 1.1;     

    }

    if (!danger && playerEffects.adrenalineActive) {
        playerEffects.adrenalineActive = false;

        player.shootRate /= 0.7;
        player.damage /= 1.1;

    }
}

export function resetEnemyTimer() {
    enemyTimer = 0;
}

export {
    enemies,
    createNormalEnemy,
    createFastEnemy,
    createHeavyEnemy,
    renderEnemy,
    updateEnemy,
    setWall,

    enemySpeedMultiplier,
    enemyExpMultiplier,
    enemyHpMultiplier,

    increaseEnemyHpMultiplier,
    increaseEnemyExpMultiplier,
    multiplyEnemySpeedMultiplier,

    checkAdrenalineRush,
};