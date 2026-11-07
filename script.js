"use strict";

const MAX_STAGE = 6;
const MAX_GROWTH = 5000;
const MAX_UPGRADE_LEVEL = 35;

const PASSIVE_INTERVAL = 10000;
const SUN_INTERVAL = 30000;
const AUTO_CLICK_INTERVAL = 1000;
const SAVE_INTERVAL = 5000;

const SAVE_KEY = "littleSproutSave";
const SOUND_KEY = "littleSproutMuted";

const REBIRTH_REWARD = 25;
const SUN_PER_CLICK = 1;
const COLLECTION_BONUS = 5;

const growthRequirements = [500, 1200, 2200, 3500, 5000];

const stageNames = [
    "A tiny beginning",
    "Growing little by little",
    "Looking leafy!",
    "A beautiful young plant",
    "A flourishing plant",
    "A garden favorite"
];

const stageDescriptions = [
    "A little sprout is starting to grow.",
    "Look at those lovely leaves!",
    "Your plant is getting stronger.",
    "Your little plant is thriving.",
    "Look how far your plant has come!",
    "You've grown something beautiful."
];

/* ============================================
   FLOWER COLLECTION
============================================ */

const availablePlants = [
    {
        id: "sprout",
        name: "Little Sprout",
        emoji: "🌱",
        description: "Your very first plant.",
        cost: 0
    },
    {
        id: "tulip",
        name: "Tulip",
        emoji: "🌷",
        description: "A lovely spring flower.",
        cost: 100
    },
    {
        id: "lavender",
        name: "Lavender",
        emoji: "🪻",
        description: "A peaceful garden favorite.",
        cost: 250
    },
    {
        id: "sunflower",
        name: "Sunflower",
        emoji: "🌻",
        description: "A little sunshine in your garden.",
        cost: 500
    },
    {
        id: "rose",
        name: "Rose",
        emoji: "🌹",
        description: "A timeless garden beauty.",
        cost: 1000
    },
    {
        id: "hibiscus",
        name: "Hibiscus",
        emoji: "🏵️",
        description: "A bright tropical flower.",
        cost: 2000
    }
];

/* ============================================
   HELPERS
============================================ */

const $ = id => document.getElementById(id);

function safeNumber(value, maximum = Number.MAX_SAFE_INTEGER) {
    const number = Number(value);

    if (!Number.isFinite(number)) return 0;

    return Math.min(maximum, Math.max(0, Math.floor(number)));
}

function createFlowerProgress() {
    return {
        growth: 0,
        waterCount: 0,
        stage: 1
    };
}

function calculateStage(growth) {
    const stage = growthRequirements.filter(
        requirement => growth >= requirement
    ).length + 1;

    return Math.min(stage, MAX_STAGE);
}

/* ============================================
   GAME STATE
============================================ */

let flowerProgress = {
    sprout: createFlowerProgress()
};

let selectedPlant = "sprout";

let sunlight = 0;

let compostLevel = 0;
let canLevel = 0;
let catcherLevel = 0;
let fertilizerLevel = 0;
let autoClickerLevel = 0;

let autoClickerEnabled = true;

let unlockedPlants = ["sprout"];

let rebirthCount = 0;

let shopMessage = "Little improvements make a big difference. ♡";

/* ============================================
   DOM ELEMENTS
============================================ */

const growthDisplay = $("growth");
const sunlightDisplay = $("sunlight");
const rebirthDisplay = $("rebirth-count");

const totalGrowthDisplay = $("total-growth");
const waterCountDisplay = $("water-count");
const stageCountDisplay = $("stage-count");

const progressText = $("progress-text");
const progressFill = $("progress-fill");
const progressBar = $("progress-bar");

const plantStage = $("plant-stage");
const plantDescription = $("plant-description");
const plantName = $("plant-name");

const plant = $("plant");
const plantButton = $("plant-button");

const waterButton = $("water-button");
const waterLabel = $("water-label");
const waterAmount = $("water-amount");

const passiveInfo = $("passive-info");

const shopSunlight = $("shop-sunlight");
const shopNote = $("shop-note");

const compostDisplay = $("compost-level");
const canDisplay = $("can-level");
const catcherDisplay = $("catcher-level");
const fertilizerDisplay = $("fertilizer-level");
const autoClickerDisplay = $("auto-clicker-level");

const buyCompostButton = $("buy-compost");
const buyCanButton = $("buy-can");
const buyCatcherButton = $("buy-catcher");
const buyFertilizerButton = $("buy-fertilizer");
const buyAutoClickerButton = $("buy-auto-clicker");

const autoToggleButton = $("auto-toggle");

const plantCollection = $("plant-collection");
const collectionCount = $("collection-count");
const collectionBonusDisplay = $("collection-bonus");
const seedList = $("seed-list");

const restartButton = $("restart-button");
const rebirthButton = $("rebirth-button");
const rebirthInfo = $("rebirth-info");

const muteButton = $("mute-button");

/* ============================================
   AUDIO
============================================ */

let audioContext = null;
let audioUnlockPromise = null;

let soundsMuted = (() => {
    try {
        return localStorage.getItem(SOUND_KEY) === "true";
    } catch {
        return false;
    }
})();

function initializeAudio() {
    if (soundsMuted) return null;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    return audioContext;
}

function unlockAudio() {
    if (soundsMuted) return;

    const context = initializeAudio();

    if (!context || context.state === "running") return;
    if (audioUnlockPromise) return;

    audioUnlockPromise = context.resume()
        .catch(() => {
       
        })
        .finally(() => {
            audioUnlockPromise = null;
        });
}

function playTone(
    context,
    frequency,
    startTime,
    duration,
    volume,
    type = "sine"
) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
}

function scheduleNotes(context, notes) {
    if (soundsMuted || context.state !== "running") return;

    const now = context.currentTime;

    notes.forEach(([frequency, delay, duration, volume]) => {
        playTone(
            context,
            frequency,
            now + delay,
            duration,
            volume
        );
    });
}

function playNotes(notes) {
    if (soundsMuted) return;

    const context = initializeAudio();

    if (!context) return;

    if (context.state === "running") {
        scheduleNotes(context, notes);
        return;
    }

    context.resume()
        .then(() => scheduleNotes(context, notes))
        .catch(() => {
            // Do not queue sounds for a later interaction.
        });
}

function playGrowSound() {
    playNotes([
        [523.25, 0, 0.22, 0.055],
        [659.25, 0.07, 0.25, 0.045],
        [783.99, 0.14, 0.35, 0.035]
    ]);
}

function playPurchaseSound() {
    playNotes([
        [587.33, 0, 0.18, 0.045],
        [783.99, 0.09, 0.25, 0.05]
    ]);
}

function playFlowerSound() {
    playNotes([
        [523.25, 0, 0.3, 0.045],
        [659.25, 0.12, 0.3, 0.05],
        [783.99, 0.24, 0.35, 0.05],
        [1046.5, 0.36, 0.45, 0.04]
    ]);
}

function playResetSound() {
    playNotes([
        [783.99, 0, 0.25, 0.045],
        [659.25, 0.13, 0.25, 0.04],
        [523.25, 0.26, 0.4, 0.045]
    ]);
}

function updateMuteButton() {
    muteButton.textContent = soundsMuted
        ? "🔇 Sound off"
        : "🔊 Sound on";

    muteButton.setAttribute(
        "aria-label",
        soundsMuted ? "Unmute sounds" : "Mute sounds"
    );

    muteButton.setAttribute("aria-pressed", String(soundsMuted));
}

function toggleMute() {
    soundsMuted = !soundsMuted;

    try {
        localStorage.setItem(SOUND_KEY, String(soundsMuted));
    } catch (error) {
        console.error("Could not save sound setting:", error);
    }

    updateMuteButton();

    if (!soundsMuted) {
        unlockAudio();
    }
}

// Unlock audio through a real user interaction.
document.addEventListener("pointerdown", unlockAudio, true);

/* ============================================
   CURRENT FLOWER
============================================ */

function getCurrentFlower() {
    return flowerProgress[selectedPlant];
}

function isFullyGrown(flower) {
    return flower.growth >= MAX_GROWTH;
}

function hasCompletedFlower() {
    return unlockedPlants.some(id => {
        const flower = flowerProgress[id];

        return flower && isFullyGrown(flower);
    });
}

function getWaterAmount() {
    return 5 + canLevel * 5;
}

function getCollectionBonus() {
    return Math.max(0, unlockedPlants.length - 1) * COLLECTION_BONUS;
}

function getPassiveGrowth() {
    return 1 + compostLevel + fertilizerLevel * 2 + getCollectionBonus();
}

function getRebirthReward() {
    return REBIRTH_REWARD * Math.pow(2, rebirthCount);
}

/* ============================================
   SAVE GAME
============================================ */

function saveGame() {
    const gameData = {
        version: 3,
        sunlight,
        compostLevel,
        canLevel,
        catcherLevel,
        fertilizerLevel,
        autoClickerLevel,
        autoClickerEnabled,
        unlockedPlants,
        selectedPlant,
        flowerProgress,
        rebirthCount
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameData));
        return true;
    } catch (error) {
        console.error("Could not save game:", error);
        return false;
    }
}

/* ============================================
   RESET STATE
============================================ */

function resetState() {
    sunlight = 0;

    compostLevel = 0;
    canLevel = 0;
    catcherLevel = 0;
    fertilizerLevel = 0;
    autoClickerLevel = 0;

    autoClickerEnabled = true;
    rebirthCount = 0;

    unlockedPlants = ["sprout"];
    selectedPlant = "sprout";

    flowerProgress = {
        sprout: createFlowerProgress()
    };
}

/* ============================================
   LOAD GAME
============================================ */

function loadGame() {
    let data;

    try {
        const savedData = localStorage.getItem(SAVE_KEY);

        if (!savedData) return;

        data = JSON.parse(savedData);

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new Error("Invalid save data.");
        }
    } catch (error) {
        console.error("Could not load saved game:", error);

        resetState();
        saveGame();

        return;
    }

    sunlight = safeNumber(data.sunlight);

    compostLevel = safeNumber(data.compostLevel, MAX_UPGRADE_LEVEL);
    canLevel = safeNumber(data.canLevel, MAX_UPGRADE_LEVEL);
    catcherLevel = safeNumber(data.catcherLevel, MAX_UPGRADE_LEVEL);
    fertilizerLevel = safeNumber(data.fertilizerLevel, MAX_UPGRADE_LEVEL);
    autoClickerLevel = safeNumber(data.autoClickerLevel, MAX_UPGRADE_LEVEL);

    autoClickerEnabled =
        typeof data.autoClickerEnabled === "boolean"
            ? data.autoClickerEnabled
            : true;

    rebirthCount = safeNumber(data.rebirthCount);

    const savedUnlocked = Array.isArray(data.unlockedPlants)
        ? data.unlockedPlants.filter(id =>
            availablePlants.some(item => item.id === id)
        )
        : ["sprout"];

    unlockedPlants = [...new Set(savedUnlocked)];

    if (!unlockedPlants.includes("sprout")) {
        unlockedPlants.unshift("sprout");
    }

    flowerProgress = {
        sprout: createFlowerProgress()
    };

    if (data.flowerProgress && typeof data.flowerProgress === "object") {
        unlockedPlants.forEach(id => {
            const saved = data.flowerProgress[id];

            if (!saved || typeof saved !== "object") {
                flowerProgress[id] = createFlowerProgress();
                return;
            }

            const growth = safeNumber(saved.growth, MAX_GROWTH);

            flowerProgress[id] = {
                growth,
                waterCount: safeNumber(saved.waterCount),
                stage: calculateStage(growth)
            };
        });
    } else if (data.growth !== undefined) {
        // Support older single-flower saves.
        const growth = safeNumber(data.growth, MAX_GROWTH);

        flowerProgress.sprout = {
            growth,
            waterCount: safeNumber(data.waterCount),
            stage: calculateStage(growth)
        };
    }

    selectedPlant = unlockedPlants.includes(data.selectedPlant)
        ? data.selectedPlant
        : "sprout";

    if (!flowerProgress[selectedPlant]) {
        flowerProgress[selectedPlant] = createFlowerProgress();
    }

    // Preserve the existing save format.
    saveGame();
}

/* ============================================
   GROWTH
============================================ */

function addGrowth(amount) {
    const flower = getCurrentFlower();

    if (!flower || isFullyGrown(flower)) return false;

    const previousGrowth = flower.growth;

    flower.growth = Math.min(
        MAX_GROWTH,
        flower.growth + amount
    );

    return flower.growth !== previousGrowth;
}

function checkGrowthStage() {
    const flower = getCurrentFlower();

    const newStage = calculateStage(flower.growth);

    if (newStage <= flower.stage) return;

    const stagesReached = newStage - flower.stage;

    flower.stage = newStage;
    sunlight += stagesReached * 5;
}

/* ============================================
   WATERING AND PLANT CLICKING
============================================ */

function waterPlant() {
    const flower = getCurrentFlower();

    if (isFullyGrown(flower)) return;
    if (!addGrowth(getWaterAmount())) return;

    flower.waterCount++;
    sunlight += SUN_PER_CLICK;

    playGrowSound();

    updateGame();
    saveGame();
}

function clickPlant() {
    if (isFullyGrown(getCurrentFlower())) return;
    if (!addGrowth(1)) return;

    sunlight += SUN_PER_CLICK;

    playGrowSound();

    updateGame();
    saveGame();
}

/* ============================================
   AUTOMATIC GROWTH
============================================ */

function passiveGrowth() {
    if (isFullyGrown(getCurrentFlower())) return;
    if (!addGrowth(getPassiveGrowth())) return;

    updateGame();
    saveGame();
}

function passiveSunlight() {
    if (catcherLevel <= 0) return;

    sunlight += catcherLevel;

    updateGame();
    saveGame();
}

/* ============================================
   GARDEN HELPER
============================================ */

function autoClick() {
    if (autoClickerLevel <= 0 || !autoClickerEnabled) return;
    if (isFullyGrown(getCurrentFlower())) return;

    if (!addGrowth(autoClickerLevel)) return;

    sunlight += SUN_PER_CLICK * autoClickerLevel;

    updateGame();
    saveGame();
}

function getAutoClickerCost() {
    return 20 + autoClickerLevel * 20;
}

function toggleAutoClicker() {
    if (autoClickerLevel <= 0) return;

    autoClickerEnabled = !autoClickerEnabled;

    shopMessage = autoClickerEnabled
        ? "Your garden helper is back to work!"
        : "Your garden helper is taking a little break.";

    updateGame();
    saveGame();
}

/* ============================================
   PLANT APPEARANCE
============================================ */

function updatePlantAppearance() {
    const flower = getCurrentFlower();
    const currentStage = flower.stage;

    const selectedFlower = availablePlants.find(
        item => item.id === selectedPlant
    );

    plant.className = `plant stage-${currentStage} flower-${selectedPlant}`;

    plantName.textContent = selectedPlant === "sprout"
        ? "Your first sprout ♡"
        : `Your ${selectedFlower.name.toLowerCase()} ♡`;

    plantStage.textContent = stageNames[currentStage - 1];
    plantDescription.textContent = stageDescriptions[currentStage - 1];

    if (isFullyGrown(flower)) {
        waterLabel.textContent = "Your plant is fully grown!";
        waterAmount.textContent = "";

        passiveInfo.textContent =
            "Your little plant has reached its full potential.";
    } else {
        waterLabel.textContent = "💧 Water your plant";
        waterAmount.textContent = `+${getWaterAmount()} growth`;

        passiveInfo.textContent =
            `Your garden grows +${getPassiveGrowth()} every 10 seconds!`;
    }

    plantButton.disabled = isFullyGrown(flower);
    waterButton.disabled = isFullyGrown(flower);
}

/* ============================================
   PROGRESS BAR
============================================ */

function updateProgress() {
    const flower = getCurrentFlower();

    if (isFullyGrown(flower)) {
        progressText.textContent = "Fully grown!";
        progressFill.style.width = "100%";
        progressBar.setAttribute("aria-valuenow", 100);

        return;
    }

    const requirement = growthRequirements[flower.stage - 1];

    const previousRequirement = flower.stage === 1
        ? 0
        : growthRequirements[flower.stage - 2];

    const currentGrowth = flower.growth - previousRequirement;
    const stageGrowth = requirement - previousRequirement;

    const percentage = Math.min(
        100,
        (currentGrowth / stageGrowth) * 100
    );

    progressText.textContent = `${flower.growth} / ${requirement}`;
    progressFill.style.width = `${percentage}%`;

    progressBar.setAttribute(
        "aria-valuenow",
        Math.round(percentage)
    );
}

/* ============================================
   UPGRADE CONFIGURATION
============================================ */

const upgrades = {
    compost: {
        get level() {
            return compostLevel;
        },
        get cost() {
            return 4 + compostLevel * 4;
        },
        display: compostDisplay,
        button: buyCompostButton,
        purchase: () => compostLevel++,
        message: "Your compost is making the garden richer! 🍂"
    },

    can: {
        get level() {
            return canLevel;
        },
        get cost() {
            return 6 + canLevel * 6;
        },
        display: canDisplay,
        button: buyCanButton,
        purchase: () => canLevel++,
        message: "Your new watering can is ready! 🫗"
    },

    catcher: {
        get level() {
            return catcherLevel;
        },
        get cost() {
            return 10 + catcherLevel * 10;
        },
        display: catcherDisplay,
        button: buyCatcherButton,
        purchase: () => catcherLevel++,
        message: "Your sun catcher is sparkling! 🌞"
    },

    fertilizer: {
        get level() {
            return fertilizerLevel;
        },
        get cost() {
            return 12 + fertilizerLevel * 12;
        },
        display: fertilizerDisplay,
        button: buyFertilizerButton,
        purchase: () => fertilizerLevel++,
        message: "Your soil is getting richer! 🌱"
    },

    autoClicker: {
        get level() {
            return autoClickerLevel;
        },
        get cost() {
            return getAutoClickerCost();
        },
        display: autoClickerDisplay,
        button: buyAutoClickerButton,
        purchase: () => autoClickerLevel++,
        message: "Your little helper is growing the garden for you!"
    }
};

/* ============================================
   BUY UPGRADES
============================================ */

function buyUpgrade(upgrade) {
    if (upgrade.level >= MAX_UPGRADE_LEVEL) return;
    if (sunlight < upgrade.cost) return;

    sunlight -= upgrade.cost;

    upgrade.purchase();

    shopMessage = upgrade.message;

    playPurchaseSound();

    updateGame();
    saveGame();
}

function updateShop() {
    shopSunlight.textContent = sunlight;

    Object.values(upgrades).forEach(upgrade => {
        upgrade.display.textContent = upgrade.level;

        upgrade.button.textContent =
            upgrade.level >= MAX_UPGRADE_LEVEL
                ? "MAX LEVEL"
                : `☀️ ${upgrade.cost}`;

        upgrade.button.disabled =
            sunlight < upgrade.cost ||
            upgrade.level >= MAX_UPGRADE_LEVEL;
    });

    autoToggleButton.disabled = autoClickerLevel <= 0;

    autoToggleButton.textContent = autoClickerEnabled
        ? "Pause helper"
        : "Resume helper";

    autoToggleButton.setAttribute(
        "aria-pressed",
        String(autoClickerEnabled)
    );

    shopNote.textContent = shopMessage;
}

/* ============================================
   FLOWER SELECTION
============================================ */

function selectFlower(id) {
    if (!unlockedPlants.includes(id)) return;
    if (selectedPlant === id) return;

    if (!flowerProgress[id]) {
        flowerProgress[id] = createFlowerProgress();
    }

    selectedPlant = id;

    playPurchaseSound();

    updateGame();
    saveGame();
}

/* ============================================
   COLLECTION DISPLAY
============================================ */

function renderCollection() {
    const collected = availablePlants.filter(
        item => unlockedPlants.includes(item.id)
    );

    collectionCount.textContent =
        `${collected.length} / ${availablePlants.length}`;

    collectionBonusDisplay.textContent =
        `🌱 Collection bonus: +${getCollectionBonus()} automatic growth every 10 seconds.`;

    plantCollection.innerHTML = collected.map(item => {
        const selected = selectedPlant === item.id;

        const flower = flowerProgress[item.id] ||
            createFlowerProgress();

        return `
            <article class="collection-card">
                <div class="collection-emoji">${item.emoji}</div>
                <h3>${item.name}</h3>
                <p>Stage ${flower.stage} · ${flower.growth} growth</p>

                <button
                    class="select-flower"
                    type="button"
                    data-select="${item.id}"
                    ${selected ? "disabled" : ""}
                >
                    ${selected ? "Selected ✓" : "Select flower"}
                </button>
            </article>
        `;
    }).join("");

    const locked = availablePlants.filter(
        item => !unlockedPlants.includes(item.id)
    );

    if (locked.length === 0) {
        seedList.innerHTML = `
            <p class="collection-complete">
                You've collected every flower! Your garden is beautiful. ♡
            </p>
        `;

        return;
    }

    seedList.innerHTML = locked.map(item => `
        <article class="seed-card">
            <div class="seed-emoji">${item.emoji}</div>

            <div class="seed-details">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <p>Unlocks +5 automatic growth every 10 seconds.</p>
            </div>

            <button
                class="seed-button"
                type="button"
                data-seed="${item.id}"
                ${sunlight < item.cost ? "disabled" : ""}
            >
                ☀️ ${item.cost}
            </button>
        </article>
    `).join("");
}

/* ============================================
   BUY FLOWERS
============================================ */

function buySeed(id) {
    const flower = availablePlants.find(
        item => item.id === id
    );

    if (!flower) return;
    if (unlockedPlants.includes(id)) return;
    if (sunlight < flower.cost) return;

    sunlight -= flower.cost;

    unlockedPlants.push(id);

    flowerProgress[id] = createFlowerProgress();

    selectedPlant = id;

    shopMessage =
        `${flower.name} joined your garden! Your collection bonus increased by +5 growth. ${flower.emoji}`;

    playFlowerSound();

    updateGame();
    saveGame();
}

/* ============================================
   REBIRTH
============================================ */

function updateRebirth() {
    const canRebirth = hasCompletedFlower();

    rebirthDisplay.textContent = rebirthCount;

    rebirthButton.disabled = !canRebirth;

    rebirthButton.textContent = canRebirth
        ? `✨ Rebirth (+${getRebirthReward()} ☀️)`
        : "✨ Rebirth";

    rebirthInfo.textContent =
        "Grow any one flower completely to unlock rebirth.";
}

function rebirthGarden() {
    if (!hasCompletedFlower()) return;

    const reward = getRebirthReward();

    rebirthCount++;
    sunlight = reward;

    compostLevel = 0;
    canLevel = 0;
    catcherLevel = 0;
    fertilizerLevel = 0;
    autoClickerLevel = 0;

    autoClickerEnabled = true;

    unlockedPlants = ["sprout"];
    selectedPlant = "sprout";

    flowerProgress = {
        sprout: createFlowerProgress()
    };

    shopMessage =
        `A fresh beginning! You received ${sunlight} Sunlight. ✨`;

    playResetSound();

    updateGame();
    saveGame();
}

/* ============================================
   FULL RESTART
============================================ */

function restartGame() {
    resetState();

    shopMessage = "Little improvements make a big difference. ♡";

    playResetSound();

    updateGame();
    saveGame();
}

/* ============================================
   UPDATE GAME
============================================ */

function updateGame() {
    checkGrowthStage();

    const flower = getCurrentFlower();

    growthDisplay.textContent = flower.growth;
    sunlightDisplay.textContent = sunlight;

    totalGrowthDisplay.textContent = flower.growth;
    waterCountDisplay.textContent = flower.waterCount;
    stageCountDisplay.textContent = flower.stage;

    updatePlantAppearance();
    updateProgress();
    updateShop();
    renderCollection();
    updateRebirth();
}

/* ============================================
   EVENT LISTENERS
============================================ */

// Plant interactions
waterButton.addEventListener("click", waterPlant);
plantButton.addEventListener("click", clickPlant);

// Upgrades
buyCompostButton.addEventListener("click", () => buyUpgrade(upgrades.compost));
buyCanButton.addEventListener("click", () => buyUpgrade(upgrades.can));
buyCatcherButton.addEventListener("click", () => buyUpgrade(upgrades.catcher));
buyFertilizerButton.addEventListener("click", () => buyUpgrade(upgrades.fertilizer));
buyAutoClickerButton.addEventListener("click", () => buyUpgrade(upgrades.autoClicker));

// Garden helper
autoToggleButton.addEventListener("click", toggleAutoClicker);

// Game controls
restartButton.addEventListener("click", restartGame);
rebirthButton.addEventListener("click", rebirthGarden);

// Sound
muteButton.addEventListener("click", toggleMute);

// Flower selection
plantCollection.addEventListener("click", event => {
    const button = event.target.closest("[data-select]");

    if (!button) return;

    selectFlower(button.dataset.select);
});

// Flower purchases
seedList.addEventListener("click", event => {
    const button = event.target.closest("[data-seed]");

    if (!button) return;

    buySeed(button.dataset.seed);
});

/* ============================================
   TIMERS AND SAVE PROTECTION
============================================ */

let timersStarted = false;

function startGameTimers() {
    if (timersStarted) return;

    timersStarted = true;

    window.setInterval(passiveGrowth, PASSIVE_INTERVAL);
    window.setInterval(passiveSunlight, SUN_INTERVAL);
    window.setInterval(autoClick, AUTO_CLICK_INTERVAL);

    window.setInterval(saveGame, SAVE_INTERVAL);
}

// Save when the page is hidden.
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        saveGame();
    }
});

// Save when leaving or refreshing the page.
window.addEventListener("pagehide", saveGame);
window.addEventListener("beforeunload", saveGame);

/* ============================================
   INITIALIZE GAME
============================================ */

function initializeGame() {
    loadGame();

    updateMuteButton();
    updateGame();

    saveGame();

    startGameTimers();
}

initializeGame();