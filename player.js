const stats = {
    level: 1,
    exp: 0,
    expToNext: 100
};

const player = {
    x: 180,
    y: 600,
    width: 32,
    height: 32,
    radius: 16,
    angle: -Math.PI / 2,
    shootCooldown: 0,
    shootRate: 620,
    damage: 20
};

const playerEffects = {
    explosive: false,
    doubleShot: false,
    burnChance: 0,
    get burnDamage() {
        return (20 + player.damage) * 1.4;
    },
    burnDuration: 1200,
    explosiveRadius: 60,
    get explosiveDamage() {
        return 20 + (player.damage / 2);
    },
    adrenalineRush: false,
    adrenalineActive: false,
    secretAim: false,
    poisonChance: 0,
    poisonDuration: 1.3 * 1000,  // 1.3 detik dalam ms (konsisten dengan burnDuration)
    get poisonDamage() {
        return (20 + player.damage) * 1.4;
    },
    fireRateBonus: 0,
}

const bullets = [];
const explosions = [];
const damageTexts = [];

import { enemies } from "./enemy.js";
import { scaleSpawnByLevel } from "./canvas.js";

//=====AI=====

function updatePlayer(deltaTime) {
    player.shootCooldown -= deltaTime;
    const target = findNearestEnemy();

    if (target) {
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const aim = getVerticalLeadAim(
            px,
            py,
            target,
            300
        );
        const dx = aim.x - px;
        const dy = aim.y - py;

        player.angle = Math.atan2(dy, dx);
        if (player.shootCooldown <= 0) {
            shootAtAngle(player.angle);
            player.shootCooldown = player.shootRate * (1 - playerEffects.fireRateBonus);
        }
    }

    function updateExplosions(deltaTime) {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const ex = explosions[i];
            ex.life -= deltaTime;
            ex.visualRadius += (ex.maxVisualRadius / 600) * deltaTime;
            if (!ex.hasDealtDamage) {
                applyExplosionDamage(ex);
                ex.hasDealtDamage = true;
            }
            if (ex.life <= 0) {
                explosions.splice(i, 1);
            }
        }
    }

    updateBullets(deltaTime);
    updateExplosions(deltaTime);

    for (let i = damageTexts.length - 1; i >= 0; i--) {
        const t = damageTexts[i];
        t.y += t.vy * deltaTime;
        t.life -= deltaTime;
        if (t.life <= 0) {
            damageTexts.splice(i, 1);
        }
    }
}

function findNearestEnemy() {
    if (enemies.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
        if (enemy.isDying || enemy.isDead || enemy.hp <= 0) continue;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    }

    return nearest;
}

function getVerticalLeadAim(px, py, enemy, bulletSpeed) {
    const ex = enemy.x;
    const ey = enemy.y;
    const dx = ex - px;
    const dy = ey - py;
    const enemyVy = enemy.isOnWall ? 0 : enemy.speed;

    let aimOffset;
    let time;

    if (playerEffects.secretAim) {
        time = Math.sqrt(dx * dx + dy * dy) / bulletSpeed;
        for (let i = 0; i < 3; i++) {
            const predictedY = ey + enemyVy * time;
            const predictedDist = Math.sqrt(dx * dx + (predictedY - py) * (predictedY - py));
            time = predictedDist / bulletSpeed;
        }
        aimOffset = 0;
        return {
            x: ex,
            y: ey + enemyVy * time + aimOffset
        };
    } else {
        time = Math.abs(dx) / (bulletSpeed - enemyVy);
        aimOffset = -enemy.radius * 0.6;
    }
    return {
        x: ex,
        y: ey + enemyVy * time + aimOffset
    };
}

//=====end of AI=====

function addDamageText(x, y, value, type = "normal") {
    damageTexts.push({
        x,
        y,
        value,
        life: 600,
        vy: -0.03,
        type
    });
}

function renderPlayer(ctx) {
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    const radius = player.width / 1.44;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(player.angle);

    ctx.fillStyle = '#27a8ff';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#8a8a8a';
    ctx.stroke();

    ctx.fillStyle = '#8a8a8a';
    const gunLength = 29;
    const gunWidth = 30;

    ctx.fillRect(radius - 2, -gunWidth / 2, gunLength, gunWidth);

    ctx.restore();
}

function renderExplosions(ctx) {
    for (const ex of explosions) {
        ctx.save();

        ctx.globalAlpha = ex.life / 300;

        ctx.strokeStyle = "#ff9f1c";
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.visualRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

function renderDamageTexts(ctx) {
    ctx.font = "14px Arial";
    ctx.textAlign = "center";

    for (const t of damageTexts) {
        ctx.globalAlpha = t.life / 500;

        if (t.type === "burn") {
            ctx.fillStyle = "orange";
        } else if (t.type === "poison") {
            ctx.fillStyle = "#00ff00";  // Hijau
        } else {
            ctx.fillStyle = "#ffffff";
        }

        ctx.fillText(t.value, t.x, t.y);
    }

    ctx.globalAlpha = 1;
}

function shootAtAngle(angle) {
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;

    const radius = player.width / 1.44;
    const gunLength = 29;
    const barrelOffset = radius - 2 + gunLength;

    const startX = cx + Math.cos(angle) * barrelOffset;
    const startY = cy + Math.sin(angle) * barrelOffset;

    const bulletRadius = playerEffects.secretAim ? 7 : 5;

    const shootOne = () => {
        const dmgMultiplier = playerEffects.doubleShot ? 0.55 : 1;
        const dmg = player.damage * dmgMultiplier;

        const target = findNearestEnemy();
        let isLethal = false;

        if (target) {
            const effectiveHp = target.hp - target.reservedDamage;
            if (effectiveHp - dmg <= 0) {
                target.hp -= dmg;
                isLethal = true;
                if (!target.expGranted) {
                    target.expGranted = true;
                    const gainedExp = Math.round(target.exp + (1 + stats.level * 0.04));
                    stats.exp += gainedExp;
                    if (stats.exp >= stats.expToNext) levelUp();
                }
            }
            target.reservedDamage += dmg;
        }

        bullets.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
            radius: bulletRadius,
            explosive: playerEffects.explosive,
            damage: dmg,
            isLethal,
            trail: [{ x: startX, y: startY }]
        });
    };

    if (!playerEffects.doubleShot) {
        shootOne();
    } else {
        shootOne();
        setTimeout(() => {
            shootOne();
        }, 150);
    }
}

function createExplosion(x, y) {
    explosions.push({
        x,
        y,

        visualRadius: 5,
        damageRadius: playerEffects.explosiveRadius,

        maxVisualRadius: playerEffects.explosiveRadius,
        damage: playerEffects.explosiveDamage,
        life: 400,
        hasDealtDamage: false
    });
}

function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        b.x += b.vx * (deltaTime / 1000);
        b.y += b.vy * (deltaTime / 1000);
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 12) {  // Keep last 8 positions
            b.trail.shift();
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.isDead) continue;
            const dx = b.x - e.x;
            const dy = b.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < b.radius + e.radius) {
                if (b.explosive) createExplosion(e.x, e.y);

                e.reservedDamage -= b.damage;
                bullets.splice(i, 1);

                if (!b.isLethal) {
                    e.hp -= b.damage;

                    if (Math.random() < playerEffects.burnChance) {
                        e.isBurning = true;
                        e.burnTime = playerEffects.burnDuration;
                        e.burnDamage = playerEffects.burnDamage;
                    }
                    if (Math.random() < playerEffects.poisonChance) {
                        e.isPoisoned = true;
                        e.poisonDuration = (e.poisonDuration || 0) + playerEffects.poisonDuration;
                        e.poisonDamage = playerEffects.poisonDamage;
                    }

                    if (e.hp <= 0 && !e.expGranted) {
                        e.expGranted = true;
                        const gainedExp = Math.round(e.exp + (1 + stats.level * 0.04));
                        stats.exp += gainedExp;
                        if (stats.exp >= stats.expToNext) levelUp();
                    }
                }

                addDamageText(e.x, e.y, Math.floor(b.damage), "normal");

                // ← Bullet MANAPUN yang collide saat hp<=0, dialah trigger visual hilang
                if (e.hp <= 0 && !e.isDying) {
                    e.isDying = true;
                    e.deathTimer = 300;
                }

                break;
            }
        }
    }
}

function renderBullets(ctx) {
    for (const b of bullets) {
        // Render bullet trail
        for (let i = 0; i < b.trail.length - 1.5; i++) {
            const alpha = (i / b.trail.length) * 0.6;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = b.radius * 1.5;
            ctx.beginPath();
            ctx.moveTo(b.trail[i].x, b.trail[i].y);
            ctx.lineTo(b.trail[i + 1].x, b.trail[i + 1].y);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffffff";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function applyExplosionDamage(explosion) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        const dx = e.x - explosion.x;
        const dy = e.y - explosion.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= explosion.damageRadius) {
            e.hp -= explosion.damage;

            if (e.hp <= 0) {
                e.isDying = true;
                e.deathTimer = 300;
            }
        }
    }
}

function renderStats(ctx) {
    document.getElementById('expValue').textContent = `${stats.exp} / ${stats.expToNext}`;
    document.getElementById('burnValue').textContent = `${(playerEffects.burnChance * 100).toFixed(0)}%`;
    document.getElementById('poisonValue').textContent = `${(playerEffects.poisonChance * 100).toFixed(0)}%`;

    const adrenalineContainer = document.getElementById('adrenalineContainer');
    const adrenalineValue = document.getElementById('adrenalineValue');

    if (!playerEffects.adrenalineRush) {
        adrenalineValue.textContent = 'NOPE';
        adrenalineContainer.classList.remove('active');
    } else if (playerEffects.adrenalineActive) {
        adrenalineValue.textContent = 'ON';
        adrenalineContainer.classList.add('active');
    } else {
        adrenalineValue.textContent = 'READY';
        adrenalineContainer.classList.remove('active');
    }
}

function levelUp() {
    stats.level++;
    stats.exp = 0;
    stats.expToNext = Math.floor(stats.expToNext * 1.25);

    scaleSpawnByLevel();

    window.dispatchEvent(new CustomEvent("player-level-up", {
        detail: { level: stats.level }
    }));
}

export function getPlayerLevel() {
    return stats.level;
}

export {
    player,
    updatePlayer,
    renderPlayer,
    renderBullets,
    renderStats,
    playerEffects,
    renderExplosions,
    renderDamageTexts,
    addDamageText
};