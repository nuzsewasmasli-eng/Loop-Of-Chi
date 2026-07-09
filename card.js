const rarities = {

    common: 0,
    rare: 40,
    epic: 0,
    legendary: 30,
    mythic: 0,
    secret: 30
};

const cardPool = {
    common: [
        { id: "atk_up_1", label: "+2 DMG", target: "player", type: "stack" }
    ],
    rare: [
        { id: "atk_up_2", label: "+4 DMG", target: "player", type: "stack" },
        { id: "enemy_hp_up", label: "Enemy HP +50%, EXP +40%", target: "enemy", type: "stack" },
        { id: "burn_shot", label: "Burn Shot +10%", target: "player", type: "stack" },
        { id: "poison_shot", label: "Poison Shot +8%", target: "player", type: "stack" },
        { id: "fire_rate_up", label: "Fire Rate +5%", target: "player", type: "stack" }
    ],
    epic: [
        { id: "atk_up_3", label: "+7 DMG", target: "player", type: "stack" },
        { id: "double_shot", label: "Double Shot", target: "player", type: "once"}
    ],
    legendary: [
        { id: "atk_up_legend", label: "+12 DMG", target: "player", type: "stack" },
    ],
    mythic: [
        { id: "adrenaline_rush", label: "Adrenaline Rush", target: "player", type: "once"},
        { id: "slow_down", label: "Speed slow -20", target: "enemy", type: "once" }
    ],
    secret: [
        // { id: "explosive_round", label: "Explosive Rounds", target: "player", type: "once" },
        { id: "AI_Accuration", label: "Accuration buffed, bigger bullet", target: "player", type: "once" }
    ]

};

function rollRarity() {
    const roll = Math.random() * 100;
    let acc = 0;

    for (const r in rarities) {
        acc += rarities[r];
        if (roll <= acc) return r;
    }
}

function rollCard(rarity) {
  let pool = cardPool[rarity];

  if (ownedOnceCardsRef) {
    pool = pool.filter(card => {
      if (card.type !== "once") return true;
      return !ownedOnceCardsRef.has(card.id);
    });
  }

  if (pool.length === 0) return null;

  return pool[Math.floor(Math.random() * pool.length)];
}

let ownedOnceCardsRef = null;

export function setOwnedOnceCards(ref) {
  ownedOnceCardsRef = ref;
}

export function rollThreeCards() {
    const cards = [];

    while (cards.length < 3) {
        const rarity = rollRarity();
        const card = rollCard(rarity);

        if (!card) continue;

        cards.push({
            ...card,
            rarity
        });
    }

    return cards;
}
