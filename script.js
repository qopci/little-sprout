const MAX_STAGE = 6;
const MAX_GROWTH = 5000;
const MAX_UPGRADE_LEVEL = 35;

const PASSIVE_INTERVAL = 10000;
const SUN_INTERVAL = 30000;
const AUTO_CLICK_INTERVAL = 1000;

const SAVE_KEY = "littleSproutSave";
const REBIRTH_REWARD = 25;
const SUN_PER_CLICK = 1;
const SOUND_KEY = "littleSproutMuted";

const growthRequirements = [
    500, 1200, 2200, 3500, 5000
];

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
// AUDIO SYSTEM
// ============================================

let audioContext = null;

let soundsMuted = (() => {
    try {
        return localStorage.getItem(SOUND_KEY) === "true";
    } catch {
        return false;
    }
})();

const muteButton = document.getElementById("mute-button");

function initializeAudio() {
    if (soundsMuted) return null;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
    }

    return audioContext;
}

function playTone(frequency, startTime, duration, volume, type = "sine") {
    const context = initializeAudio();

    if (!context || soundsMuted) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );

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

// Cozy, gentle plant-growing sound.

function playGrowSound() {
    const context = initializeAudio();
    if (!context) return;

    const now = context.currentTime;

    playTone(523.25, now, 0.22, 0.055);
    playTone(659.25, now + 0.07, 0.25, 0.045);
    playTone(783.99, now + 0.14, 0.35, 0.035);
}

// Soft purchase confirmation.

function playPurchaseSound() {
    const context = initializeAudio();
    if (!context) return;

    const now = context.currentTime;

    playTone(587.33, now, 0.18, 0.045);
    playTone(783.99, now + 0.09, 0.25, 0.05);
}

// A brighter sound when a new flower is unlocked.

function playFlowerSound() {
    const context = initializeAudio();
    if (!context) return;

    const now = context.currentTime;

    playTone(523.25, now, 0.3, 0.045);
    playTone(659.25, now + 0.12, 0.3, 0.05);
    playTone(783.99, now + 0.24, 0.35, 0.05);
    playTone(1046.5, now + 0.36, 0.45, 0.04);
}

// A gentle little chime when switching between flowers.

function playSelectFlowerSound() {
    const context = initializeAudio();
    if (!context) return;

    const now = context.currentTime;

    playTone(659.25, now, 0.18, 0.035);
    playTone(783.99, now + 0.08, 0.24, 0.03);
}

// Shared sound for restart and rebirth.

function playResetSound() {
    const context = initializeAudio();
    if (!context) return;

    const now = context.currentTime;

    playTone(783.99, now, 0.25, 0.045);
    playTone(659.25, now + 0.13, 0.25, 0.04);
    playTone(523.25, now + 0.26, 0.4, 0.045);
}

// Mute button.

function updateMuteButton() {
    if (!muteButton) return;

    muteButton.textContent = soundsMuted
        ? "🔇 Sound off"
        : "🔊 Sound on";

    muteButton.setAttribute(
        "aria-label",
        soundsMuted ? "Unmute sounds" : "Mute sounds"
    );

    muteButton.setAttribute(
        "aria-pressed",
        String(soundsMuted)
    );
}

function toggleMute() {
    soundsMuted = !soundsMuted;

    try {
        localStorage.setItem(
            SOUND_KEY,
            String(soundsMuted)
        );
    } catch (error) {
        console.error("Could not save sound setting:", error);
    }

    if (!soundsMuted) {
        initializeAudio();
        playPurchaseSound();
    }

    updateMuteButton();
}

// ============================================
// GAME STATE
// ============================================

function createFlowerProgress() {
    return {
        growth: 0,
        waterCount: 0,
        stage: 1
    };
}

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

// ============================================
// HTML ELEMENTS
// ============================================

const $ = id => document.getElementById(id);

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

// ============================================
// CURRENT FLOWER HELPERS
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
    return 5 + (canLevel * 5);
}

function getPassiveGrowth() {
    return 1 + compostLevel + (fertilizerLevel * 2);
}

function getStartingSunlight() {
    return rebirthCount * REBIRTH_REWARD;
}

// ============================================
// GROWTH HELPERS
// ============================================

function addGrowth(amount) {
    const flower = getCurrentFlower();

    if (!flower || isFullyGrown(flower)) {
        return false;
    }

    const oldGrowth = flower.growth;

    flower.growth = Math.min(
        MAX_GROWTH,
        flower.growth + amount
    );

    return flower.growth !== oldGrowth;
}

// ============================================
// WATERING
// ============================================

function waterPlant() {
    if (isFullyGrown(getCurrentFlower())) return;

    const flower = getCurrentFlower();

    const changed = addGrowth(getWaterAmount());

    if (!changed) return;

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
    if (isFullyGrown(getCurrentFlower())) return;

    const changed = addGrowth(1);

    if (!changed) return;

    sunlight += SUN_PER_CLICK;

    playGrowSound();

    updateGame();
    saveGame();
}

// ============================================
// PASSIVE GROWTH
// ============================================

function passiveGrowth() {
    if (isFullyGrown(getCurrentFlower())) return;

    const changed = addGrowth(getPassiveGrowth());

    if (!changed) return;

    updateGame();
    saveGame();
}

// ============================================
// PASSIVE SUNLIGHT
// ============================================

function passiveSunlight() {
    if (catcherLevel <= 0) return;

    sunlight += catcherLevel;

    updateGame();
    saveGame();
}

// ============================================
// AUTO CLICKER
// ============================================

function autoClick() {
    if (autoClickerLevel <= 0) return;
    if (!autoClickerEnabled) return;
    if (isFullyGrown(getCurrentFlower())) return;

    const changed = addGrowth(autoClickerLevel);

    if (!changed) return;

    sunlight += SUN_PER_CLICK * autoClickerLevel;

    // Automatic growth stays silent.

    updateGame();
    saveGame();
}

function getAutoClickerCost() {
    return 20 + autoClickerLevel * 20;
}

function toggleAutoClicker() {
    if (autoClickerLevel <= 0) return;

    autoClickerEnabled = !autoClickerEnabled;

    shopNote.textContent = autoClickerEnabled
        ? "Your garden helper is back to work!"
        : "Your garden helper is taking a little break. ♡";

    updateGame();
    saveGame();
}

// ============================================
// GROWTH STAGES AND REWARDS
// ============================================

function calculateStage(growth) {
    let calculatedStage = 1;

    for (const requirement of growthRequirements) {
        if (growth >= requirement) {
            calculatedStage++;
        }
    }

    return Math.min(calculatedStage, MAX_STAGE);
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

    plantName.textContent =
        selectedPlant === "sprout"
            ? "Your first sprout ♡"
            : `Your ${selectedFlower.name.toLowerCase()} ♡`;

    plantStage.textContent = stageNames[currentStage - 1];

    plantDescription.textContent =
        stageDescriptions[currentStage - 1];

    if (isFullyGrown(flower)) {
        waterButton.disabled = true;

        waterLabel.textContent =
            "Your plant is fully grown!";

        waterAmount.textContent = "";

        passiveInfo.textContent =
            "Your little plant has reached its full potential.";

    } else {
        waterButton.disabled = false;

        waterLabel.textContent =
            "💧 Water your plant";

        waterAmount.textContent =
            `+${getWaterAmount()} growth`;

        passiveInfo.textContent =
            `⟢ Your garden grows +${getPassiveGrowth()} every 10 seconds!`;
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

    const requirement =
        growthRequirements[flower.stage - 1];

    const previousRequirement =
        flower.stage === 1
            ? 0
            : growthRequirements[flower.stage - 2];

    const currentGrowth =
        flower.growth - previousRequirement;

    const stageGrowth =
        requirement - previousRequirement;

    const percentage = Math.min(
        (currentGrowth / stageGrowth) * 100,
        100
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
// BUY UPGRADE HELPER
// ============================================

function buyUpgrade(cost, level, callback, message) {
    if (level >= MAX_UPGRADE_LEVEL) return;
    if (sunlight < cost) return;

    sunlight -= cost;

    callback();

    shopNote.textContent = message;

    playPurchaseSound();

    updateGame();
    saveGame();
}

// ============================================
// BUY UPGRADES
// ============================================

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
// UPDATE SHOP
// ============================================

function updateShop() {
    shopSunlight.textContent = sunlight;

    compostDisplay.textContent = compostLevel;
    canDisplay.textContent = canLevel;
    catcherDisplay.textContent = catcherLevel;
    fertilizerDisplay.textContent = fertilizerLevel;
    autoClickerDisplay.textContent = autoClickerLevel;

    buyCompostButton.textContent =
        compostLevel >= MAX_UPGRADE_LEVEL
            ? "MAX LEVEL"
            : `☀️ ${getCompostCost()}`;

    buyCanButton.textContent =
        canLevel >= MAX_UPGRADE_LEVEL
            ? "MAX LEVEL"
            : `☀️ ${getCanCost()}`;

    buyCatcherButton.textContent =
        catcherLevel >= MAX_UPGRADE_LEVEL
            ? "MAX LEVEL"
            : `☀️ ${getCatcherCost()}`;

    buyFertilizerButton.textContent =
        fertilizerLevel >= MAX_UPGRADE_LEVEL
            ? "MAX LEVEL"
            : `☀️ ${getFertilizerCost()}`;

    buyCompostButton.disabled =
        sunlight < getCompostCost() ||
        compostLevel >= MAX_UPGRADE_LEVEL;

    buyCanButton.disabled =
        sunlight < getCanCost() ||
        canLevel >= MAX_UPGRADE_LEVEL;

    buyCatcherButton.disabled =
        sunlight < getCatcherCost() ||
        catcherLevel >= MAX_UPGRADE_LEVEL;

    buyFertilizerButton.disabled =
        sunlight < getFertilizerCost() ||
        fertilizerLevel >= MAX_UPGRADE_LEVEL;

    buyAutoClickerButton.textContent =
        autoClickerLevel >= MAX_UPGRADE_LEVEL
            ? "MAX LEVEL"
            : `☀️ ${getAutoClickerCost()}`;

    buyAutoClickerButton.disabled =
        sunlight < getAutoClickerCost() ||
        autoClickerLevel >= MAX_UPGRADE_LEVEL;

    autoToggleButton.disabled = autoClickerLevel <= 0;

    autoToggleButton.textContent =
        autoClickerEnabled
            ? "Pause helper"
            : "Resume helper";

    autoToggleButton.setAttribute(
        "aria-pressed",
        String(autoClickerEnabled)
    );
}

// ============================================
// FLOWER SELECTION
// ============================================

function selectFlower(id) {
    if (!unlockedPlants.includes(id)) return;
    if (selectedPlant === id) return;

    if (!flowerProgress[id]) {
        flowerProgress[id] = createFlowerProgress();
    }

    selectedPlant = id;

    playSelectFlowerSound();

    updateGame();
    saveGame();
}

// ============================================
// FLOWER COLLECTION DISPLAY
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
            </div>

            <button
                class="seed-button"
                data-seed="${item.id}"
                ${sunlight < item.cost ? "disabled" : ""}
            >
                ☀️ ${item.cost}
            </button>
        </article>
    `).join("");
}

// ============================================
// BUY NEW FLOWERS
// ============================================

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

    shopNote.textContent =
        `${flower.name} joined your garden! ${flower.emoji}`;

    playFlowerSound();

    updateGame();
    saveGame();
}

// ============================================
// REBIRTH SYSTEM
// ============================================

function updateRebirth() {
    const canRebirth = hasCompletedFlower();

    rebirthDisplay.textContent = rebirthCount;

    rebirthButton.disabled = !canRebirth;

    rebirthButton.textContent = canRebirth
        ? `✨ Rebirth (+${REBIRTH_REWARD * (rebirthCount + 1)} ☀️)`
        : "✨ Rebirth";

    rebirthInfo.textContent =
        "Grow any one flower completely to unlock rebirth. Each rebirth gives you 25 more starting sunlight!";
}

function rebirthGarden() {
    if (!hasCompletedFlower()) return;

    rebirthCount++;

    sunlight = getStartingSunlight();

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

    shopNote.textContent =
        `A fresh beginning! You received ${sunlight} starting Sunlight. ✨`;

    playResetSound();

    updateGame();
    saveGame();
}

// ============================================
// UPDATE GAME INTERFACE
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
}

// ============================================
// SAVE GAME
// ============================================

function saveGame() {
    const gameData = {
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
        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(gameData)
        );
    } catch (error) {
        console.error("Could not save game:", error);
    }
}

// ============================================
// LOAD GAME
// ============================================

function loadGame() {
    try {
        const savedData = localStorage.getItem(SAVE_KEY);

        if (!savedData) return;

        const data = JSON.parse(savedData);

        if (!data || typeof data !== "object") return;

        function safeNumber(value) {
            const number = Number(value);

            return Number.isFinite(number)
                ? Math.max(0, Math.floor(number))
                : 0;
        }

        sunlight = safeNumber(data.sunlight);

        compostLevel = Math.min(
            MAX_UPGRADE_LEVEL,
            safeNumber(data.compostLevel)
        );

        canLevel = Math.min(
            MAX_UPGRADE_LEVEL,
            safeNumber(data.canLevel)
        );

        catcherLevel = Math.min(
            MAX_UPGRADE_LEVEL,
            safeNumber(data.catcherLevel)
        );

        fertilizerLevel = Math.min(
            MAX_UPGRADE_LEVEL,
            safeNumber(data.fertilizerLevel)
        );

        autoClickerLevel = Math.min(
            MAX_UPGRADE_LEVEL,
            safeNumber(data.autoClickerLevel)
        );

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

        if (
            data.flowerProgress &&
            typeof data.flowerProgress === "object"
        ) {
            unlockedPlants.forEach(id => {
                const saved = data.flowerProgress[id];

                if (!saved || typeof saved !== "object") {
                    flowerProgress[id] = createFlowerProgress();
                    return;
                }

                const savedGrowth = Math.min(
                    MAX_GROWTH,
                    safeNumber(saved.growth)
                );

                flowerProgress[id] = {
                    growth: savedGrowth,
                    waterCount: safeNumber(saved.waterCount),
                    stage: calculateStage(savedGrowth)
                };
            });

        } else if (typeof data.growth !== "undefined") {

            const savedGrowth = Math.min(
                MAX_GROWTH,
                safeNumber(data.growth)
            );

            flowerProgress.sprout = {
                growth: savedGrowth,
                waterCount: safeNumber(data.waterCount),
                stage: calculateStage(savedGrowth)
            };
        }

        selectedPlant = unlockedPlants.includes(data.selectedPlant)
            ? data.selectedPlant
            : "sprout";

        if (!flowerProgress[selectedPlant]) {
            flowerProgress[selectedPlant] = createFlowerProgress();
        }

    } catch (error) {
        console.error("Could not load saved game:", error);

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
}

// ============================================
// FULL RESTART
// ============================================

function restartGame() {
    const confirmed = confirm(
        "Are you sure you want to restart your garden?\n\n" +
        "All growth, sunlight, upgrades, collected flowers, and rebirths will be permanently lost."
    );

    if (!confirmed) return;

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

    shopNote.textContent =
        "Little improvements make a big difference. ♡";

    playResetSound();

    updateGame();
    saveGame();
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

restartButton.addEventListener("click", restartGame);
rebirthButton.addEventListener("click", rebirthGarden);

if (muteButton) {
    muteButton.addEventListener("click", toggleMute);
}

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

document.addEventListener("pointerdown", () => {
    if (!soundsMuted) {
        initializeAudio();
    }
}, { once: true });

// ============================================
// START GAME
// ============================================

updateMuteButton();

loadGame();

updateGame();

setInterval(passiveGrowth, PASSIVE_INTERVAL);
setInterval(passiveSunlight, SUN_INTERVAL);
setInterval(autoClick, AUTO_CLICK_INTERVAL);

setInterval(saveGame, 5000);

window.addEventListener("beforeunload", saveGame);