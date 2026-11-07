"use strict";

const MAX_STAGE = 6;
const MAX_GROWTH = 5000;
const MAX_UPGRADE_LEVEL = 35;

const PASSIVE_INTERVAL = 10000;
const SUN_INTERVAL = 30000;
const AUTO_CLICK_INTERVAL = 1000;

const SAVE_KEY = "littleSproutSave";
const SOUND_KEY = "littleSproutMuted";

const REBIRTH_REWARD = 25;
const SUN_PER_CLICK = 1;

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

// ============================================
// FLOWER COLLECTION
// ============================================

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

// ============================================
// HELPERS
// ============================================

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
    let stage = 1;

    for (const requirement of growthRequirements) {
        if (growth >= requirement) stage++;
    }

    return Math.min(stage, MAX_STAGE);
}

// ============================================
// GAME STATE
// ============================================

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

let gameOver = false;

let shopMessage = "Little improvements make a big difference. ♡";

// ============================================
// DOM ELEMENTS
// ============================================

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
const seedList = $("seed-list");

const restartButton = $("restart-button");
const rebirthButton = $("rebirth-button");
const rebirthInfo = $("rebirth-info");

const muteButton = $("mute-button");

// ============================================
// GAME COMPLETION SCREEN
// ============================================

// Create the completion screen automatically.
// This means you do not need to add extra HTML.

function createGameOverScreen() {
    let screen = $("game-over");

    if (screen) return screen;

    screen = document.createElement("div");
    screen.id = "game-over";
    screen.className = "game-over";
    screen.hidden = true;

    screen.innerHTML = `
        <div class="game-over-card">
            <div class="game-over-flowers">🌷 🌻 🌹 🌼</div>

            <p class="eyebrow">A GARDEN FULL OF LOVE</p>

            <h2>Garden complete! ♡</h2>

            <p>
                You've collected every flower and reached
                the highest level of every garden upgrade.
            </p>

            <p class="game-over-message">
                You've grown something beautiful!
            </p>

            <button
                type="button"
                class="game-over-restart"
                id="game-over-restart"
            >
                🌱 Start a new garden
            </button>
        </div>
    `;

    document.body.appendChild(screen);

    return screen;
}

const gameOverScreen = createGameOverScreen();
const gameOverRestartButton = $("game-over-restart");

// ============================================
// AUDIO
// ============================================

let audioContext = null;

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

    gain.gain.linearRampToValueAtTime(
        volume,
        startTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
}

function playNotes(notes) {
    if (soundsMuted) return;

    const context = initializeAudio();

    if (!context) return;

    // Mobile browsers can suspend audio until a user interaction.
    // Resume first, then schedule the notes.
    const scheduleNotes = () => {
        if (soundsMuted || !context) return;

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
    };

    if (context.state === "suspended") {
        context.resume()
            .then(scheduleNotes)
            .catch(error => {
                console.warn("Audio could not resume:", error);
            });

        return;
    }

    scheduleNotes();
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
        playPurchaseSound();
    }
}

// ============================================
// CURRENT FLOWER
// ============================================

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

function getPassiveGrowth() {
    return 1 + compostLevel + fertilizerLevel * 2;
}

function getRebirthReward() {
    return REBIRTH_REWARD * Math.pow(2, rebirthCount);
}

// ============================================
// GAME COMPLETION CHECK
// ============================================

function isGameComplete() {
    const allFlowersUnlocked = availablePlants.every(item =>
        unlockedPlants.includes(item.id)
    );

    const allUpgradesMaxed = [
        compostLevel,
        canLevel,
        catcherLevel,
        fertilizerLevel,
        autoClickerLevel
    ].every(level => level >= MAX_UPGRADE_LEVEL);

    return allFlowersUnlocked && allUpgradesMaxed;
}

function updateGameOver() {
    gameOver = isGameComplete();

    gameOverScreen.hidden = !gameOver;

    plantButton.disabled =
        gameOver || isFullyGrown(getCurrentFlower());

    waterButton.disabled =
        gameOver || isFullyGrown(getCurrentFlower());

    if (gameOver) {
        rebirthButton.disabled = true;

        buyCompostButton.disabled = true;
        buyCanButton.disabled = true;
        buyCatcherButton.disabled = true;
        buyFertilizerButton.disabled = true;
        buyAutoClickerButton.disabled = true;

        autoToggleButton.disabled = true;
    }
}

// ============================================
// SAVE GAME
// ============================================

function saveGame() {
    const gameData = {
        version: 2,
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

// ============================================
// RESET STATE
// ============================================

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

    gameOver = false;
}

// ============================================
// LOAD GAME
// ============================================

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
        // Compatibility with older single-flower saves.
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

    saveGame();
}

// ============================================
// GROWTH
// ============================================

function addGrowth(amount) {
    if (gameOver) return false;

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

    if (newStage > flower.stage) {
        const stagesReached = newStage - flower.stage;

        flower.stage = newStage;
        sunlight += stagesReached * 5;
    }
}

// ============================================
// WATERING
// ============================================

function waterPlant() {
    if (gameOver) return;

    const flower = getCurrentFlower();

    if (isFullyGrown(flower)) return;

    if (!addGrowth(getWaterAmount())) return;

    flower.waterCount++;
    sunlight += SUN_PER_CLICK;

    playGrowSound();

    updateGame();
    saveGame();
}

// ============================================
// CLICKING THE PLANT
// ============================================

function clickPlant() {
    if (gameOver) return;

    if (isFullyGrown(getCurrentFlower())) return;

    if (!addGrowth(1)) return;

    sunlight += SUN_PER_CLICK;

    playGrowSound();

    updateGame();
    saveGame();
}

// ============================================
// AUTOMATIC GROWTH
// ============================================

function passiveGrowth() {
    if (gameOver) return;
    if (isFullyGrown(getCurrentFlower())) return;

    if (!addGrowth(getPassiveGrowth())) return;

    updateGame();
    saveGame();
}

function passiveSunlight() {
    if (gameOver) return;
    if (catcherLevel <= 0) return;

    sunlight += catcherLevel;

    updateGame();
    saveGame();
}

// ============================================
// GARDEN HELPER
// ============================================

function autoClick() {
    if (gameOver) return;
    if (autoClickerLevel <= 0) return;
    if (!autoClickerEnabled) return;
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
    if (gameOver) return;
    if (autoClickerLevel <= 0) return;

    autoClickerEnabled = !autoClickerEnabled;

    shopMessage = autoClickerEnabled
        ? "Your garden helper is back to work! 🤖"
        : "Your garden helper is taking a little break. ♡";

    updateGame();
    saveGame();
}

// ============================================
// PLANT APPEARANCE
// ============================================

function updatePlantAppearance() {
    const flower = getCurrentFlower();
    const currentStage = flower.stage;

    plant.className = "plant";
    plant.classList.add(`stage-${currentStage}`);
    plant.classList.add(`flower-${selectedPlant}`);

    const selectedFlower = availablePlants.find(
        item => item.id === selectedPlant
    );

    plantName.textContent = selectedPlant === "sprout"
        ? "Your first sprout ♡"
        : `Your ${selectedFlower.name.toLowerCase()} ♡`;

    plantStage.textContent = stageNames[currentStage - 1];

    plantDescription.textContent =
        stageDescriptions[currentStage - 1];

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
}

// ============================================
// PROGRESS BAR
// ============================================

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

    progressText.textContent =
        `${flower.growth} / ${requirement}`;

    progressFill.style.width = `${percentage}%`;

    progressBar.setAttribute(
        "aria-valuenow",
        Math.round(percentage)
    );
}

// ============================================
// UPGRADE COSTS
// ============================================

function getCompostCost() {
    return 4 + compostLevel * 4;
}

function getCanCost() {
    return 6 + canLevel * 6;
}

function getCatcherCost() {
    return 10 + catcherLevel * 10;
}

function getFertilizerCost() {
    return 12 + fertilizerLevel * 12;
}

// ============================================
// BUY UPGRADES
// ============================================

function buyUpgrade(cost, level, callback, message) {
    if (gameOver) return;
    if (level >= MAX_UPGRADE_LEVEL) return;
    if (sunlight < cost) return;

    sunlight -= cost;
    callback();

    shopMessage = message;

    playPurchaseSound();

    updateGame();
    saveGame();
}

function buyCompost() {
    buyUpgrade(
        getCompostCost(),
        compostLevel,
        () => compostLevel++,
        "Your compost is making the garden richer! 🍂"
    );
}

function buyCan() {
    buyUpgrade(
        getCanCost(),
        canLevel,
        () => canLevel++,
        "Your new watering can is ready! 🫗"
    );
}

function buyCatcher() {
    buyUpgrade(
        getCatcherCost(),
        catcherLevel,
        () => catcherLevel++,
        "Your sun catcher is sparkling! 🌞"
    );
}

function buyFertilizer() {
    buyUpgrade(
        getFertilizerCost(),
        fertilizerLevel,
        () => fertilizerLevel++,
        "Your soil is getting richer! 🌱"
    );
}

function buyAutoClicker() {
    buyUpgrade(
        getAutoClickerCost(),
        autoClickerLevel,
        () => autoClickerLevel++,
        "Your little helper is growing the garden for you! 🤖"
    );
}

// ============================================
// SHOP DISPLAY
// ============================================

function updateShop() {
    shopSunlight.textContent = sunlight;

    compostDisplay.textContent = compostLevel;
    canDisplay.textContent = canLevel;
    catcherDisplay.textContent = catcherLevel;
    fertilizerDisplay.textContent = fertilizerLevel;
    autoClickerDisplay.textContent = autoClickerLevel;

    const upgrades = [
        [buyCompostButton, getCompostCost(), compostLevel],
        [buyCanButton, getCanCost(), canLevel],
        [buyCatcherButton, getCatcherCost(), catcherLevel],
        [buyFertilizerButton, getFertilizerCost(), fertilizerLevel],
        [buyAutoClickerButton, getAutoClickerCost(), autoClickerLevel]
    ];

    upgrades.forEach(([button, cost, level]) => {
        button.textContent = level >= MAX_UPGRADE_LEVEL
            ? "MAX LEVEL"
            : `☀️ ${cost}`;

        button.disabled =
            sunlight < cost || level >= MAX_UPGRADE_LEVEL || gameOver;
    });

    autoToggleButton.disabled =
        autoClickerLevel <= 0 || gameOver;

    autoToggleButton.textContent = autoClickerEnabled
        ? "Pause helper"
        : "Resume helper";

    autoToggleButton.setAttribute(
        "aria-pressed",
        String(autoClickerEnabled)
    );

    shopNote.textContent = shopMessage;
}

// ============================================
// FLOWER SELECTION
// ============================================

function selectFlower(id) {
    if (gameOver) return;
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

// ============================================
// COLLECTION DISPLAY
// ============================================

function renderCollection() {
    const collected = availablePlants.filter(
        item => unlockedPlants.includes(item.id)
    );

    collectionCount.textContent =
        `${collected.length} / ${availablePlants.length}`;

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
                    data-select="${item.id}"
                    ${selected || gameOver ? "disabled" : ""}
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
            </div>

            <button
                class="seed-button"
                data-seed="${item.id}"
                ${sunlight < item.cost || gameOver ? "disabled" : ""}
            >
                ☀️ ${item.cost}
            </button>
        </article>
    `).join("");
}

// ============================================
// BUY FLOWERS
// ============================================

function buySeed(id) {
    if (gameOver) return;

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
        `${flower.name} joined your garden! ${flower.emoji}`;

    playFlowerSound();

    updateGame();
    saveGame();
}

// ============================================
// REBIRTH
// ============================================

function updateRebirth() {
    const canRebirth = hasCompletedFlower();

    rebirthDisplay.textContent = rebirthCount;

    rebirthButton.disabled = !canRebirth || gameOver;

    rebirthButton.textContent = canRebirth
        ? `✨ Rebirth (+${getRebirthReward()} ☀️)`
        : "✨ Rebirth";

    rebirthInfo.textContent = gameOver
        ? "Your garden is complete! ♡"
        : "Grow any one flower completely to unlock rebirth.";
}

function rebirthGarden() {
    if (gameOver) return;
    if (!hasCompletedFlower()) return;

    // Calculate the reward before increasing the rebirth count.
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

// ============================================
// FULL RESTART
// ============================================

function restartGame(skipConfirmation = false) {
    if (!skipConfirmation) {
        const confirmed = confirm(
            "Are you sure you want to restart your garden?\n\n" +
            "All growth, sunlight, upgrades, collected flowers, and rebirths will be permanently lost."
        );

        if (!confirmed) return;
    }

    resetState();

    shopMessage = "Little improvements make a big difference. ♡";

    playResetSound();

    updateGame();
    saveGame();
}

// ============================================
// UPDATE GAME
// ============================================

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

    // Check completion after all game displays are refreshed.
    updateGameOver();

    // Refresh displays that depend on the completion state.
    updateShop();
    updateRebirth();
    renderCollection();
}

// ============================================
// EVENT LISTENERS
// ============================================

waterButton.addEventListener("click", waterPlant);
plantButton.addEventListener("click", clickPlant);

buyCompostButton.addEventListener("click", buyCompost);
buyCanButton.addEventListener("click", buyCan);
buyCatcherButton.addEventListener("click", buyCatcher);
buyFertilizerButton.addEventListener("click", buyFertilizer);
buyAutoClickerButton.addEventListener("click", buyAutoClicker);

autoToggleButton.addEventListener("click", toggleAutoClicker);

restartButton.addEventListener("click", () => restartGame());

rebirthButton.addEventListener("click", rebirthGarden);

muteButton.addEventListener("click", toggleMute);

gameOverRestartButton.addEventListener("click", () => {
    restartGame(true);
});

plantCollection.addEventListener("click", event => {
    const button = event.target.closest("[data-select]");

    if (!button) return;

    selectFlower(button.dataset.select);
});

seedList.addEventListener("click", event => {
    const button = event.target.closest("[data-seed]");

    if (!button) return;

    buySeed(button.dataset.seed);
});

// ============================================
// REFRESH AND SAVE PROTECTION
// ============================================

let timersStarted = false;

function startGameTimers() {
    if (timersStarted) return;

    timersStarted = true;

    window.setInterval(passiveGrowth, PASSIVE_INTERVAL);
    window.setInterval(passiveSunlight, SUN_INTERVAL);
    window.setInterval(autoClick, AUTO_CLICK_INTERVAL);

    // Backup save.
    window.setInterval(saveGame, 5000);
}

// Save when the page is hidden or refreshed.
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        saveGame();
    }
});

window.addEventListener("pagehide", saveGame);
window.addEventListener("beforeunload", saveGame);

// Initialize audio from a real user interaction.
// This is especially important for mobile browsers.
document.addEventListener("pointerdown", () => {
    if (soundsMuted) return;

    const context = initializeAudio();

    if (context && context.state === "suspended") {
        context.resume().catch(() => { });
    }
}, { once: true });

// ============================================
// START GAME
// ============================================

function initializeGame() {
    loadGame();

    updateMuteButton();

    updateGame();

    saveGame();

    startGameTimers();
}

initializeGame();