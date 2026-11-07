const MAX_STAGE = 6;
const MAX_GROWTH = 500;
const growthPerWater = 5;
const PASSIVE_INTERVAL = 10000;
const SAVE_KEY = "littleSproutSave";

const growthRequirements = [50, 100, 200, 350, 500];

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


// =================================
// GAME STATE
// =================================

let growth = 0;
let sunlight = 0;
let waterCount = 0;
let stage = 1;

let compostLevel = 0;
let canLevel = 0;


// =================================
// HTML ELEMENTS
// =================================

const $ = id => document.getElementById(id);

const growthDisplay = $("growth");
const sunlightDisplay = $("sunlight");

const totalGrowthDisplay = $("total-growth");
const waterCountDisplay = $("water-count");
const stageCountDisplay = $("stage-count");

const progressText = $("progress-text");
const progressFill = $("progress-fill");
const progressBar = $("progress-bar");

const plantStage = $("plant-stage");
const plantDescription = $("plant-description");
const plant = $("plant");

const plantButton = $("plant-button");
const waterButton = $("water-button");
const waterAmount = $("water-amount");

const passiveInfo = $("passive-info");

const shopSunlight = $("shop-sunlight");
const compostDisplay = $("compost-level");
const canDisplay = $("can-level");

const buyCompostButton = $("buy-compost");
const buyCanButton = $("buy-can");
const shopNote = $("shop-note");


// =================================
// GAME HELPERS
// =================================

function isFullyGrown() {
    return growth >= MAX_GROWTH;
}

function getWaterAmount() {
    return growthPerWater + (canLevel * 5);
}

function getPassiveGrowth() {
    return 1 + compostLevel;
}

function clampGrowth(amount) {
    growth = Math.min(MAX_GROWTH, growth + amount);
}


// =================================
// WATERING
// =================================

function waterPlant() {
    if (isFullyGrown()) return;

    clampGrowth(getWaterAmount());
    waterCount++;

    updateGame();
    saveGame();
}


// =================================
// CLICKING THE PLANT
// =================================

function clickPlant() {
    if (isFullyGrown()) return;

    clampGrowth(1);

    updateGame();
    saveGame();
}


// =================================
// PASSIVE GROWTH
// =================================

function passiveGrowth() {
    if (isFullyGrown()) return;

    clampGrowth(getPassiveGrowth());

    updateGame();
    saveGame();
}


// =================================
// GROWTH STAGES
// =================================

function checkGrowthStage() {
    while (
        stage < MAX_STAGE &&
        growth >= growthRequirements[stage - 1]
    ) {
        stage++;
        sunlight += 2;
    }
}


function updatePlantAppearance() {
    const currentStage = Math.min(stage, MAX_STAGE);

    plant.className = "plant";
    plant.classList.add(`stage-${currentStage}`);

    plantStage.textContent =
        stageNames[currentStage - 1];

    plantDescription.textContent =
        stageDescriptions[currentStage - 1];

    if (isFullyGrown()) {
        waterButton.disabled = true;
        waterButton.innerHTML =
            "Your plant is fully grown!";

        passiveInfo.textContent =
            "Your little plant has reached its full potential. ♡";
    } else {
        waterButton.disabled = false;

        waterButton.innerHTML =
            `💧 Water your plant <span id="water-amount">+${getWaterAmount()} growth</span>`;

        passiveInfo.textContent =
            `⟢ Your garden grows +${getPassiveGrowth()} every 10 seconds!`;
    }
}


// =================================
// PROGRESS BAR
// =================================

function updateProgress() {
    if (isFullyGrown()) {
        progressText.textContent = "Fully grown!";
        progressFill.style.width = "100%";
        progressBar.setAttribute("aria-valuenow", 100);
        return;
    }

    const requirement = growthRequirements[stage - 1];

    const previousRequirement =
        stage === 1 ? 0 : growthRequirements[stage - 2];

    const currentGrowth = growth - previousRequirement;
    const stageGrowth = requirement - previousRequirement;

    const percentage = Math.min(
        (currentGrowth / stageGrowth) * 100,
        100
    );

    progressText.textContent = `${growth} / ${requirement}`;
    progressFill.style.width = `${percentage}%`;

    progressBar.setAttribute(
        "aria-valuenow",
        Math.round(percentage)
    );
}


// =================================
// UPGRADE SHOP
// =================================

function getCompostCost() {
    return 4 + (compostLevel * 4);
}

function getCanCost() {
    return 6 + (canLevel * 6);
}


function buyCompost() {
    const cost = getCompostCost();

    if (isFullyGrown() || sunlight < cost) return;

    sunlight -= cost;
    compostLevel++;

    updateGame();
    saveGame();

    shopNote.textContent =
        "Your compost is making the garden richer! 🍂";
}


function buyCan() {
    const cost = getCanCost();

    if (isFullyGrown() || sunlight < cost) return;

    sunlight -= cost;
    canLevel++;

    updateGame();
    saveGame();

    shopNote.textContent =
        "Your new watering can is ready! 🫗";
}


function updateShop() {
    shopSunlight.textContent = sunlight;

    compostDisplay.textContent = compostLevel;
    canDisplay.textContent = canLevel;

    buyCompostButton.textContent =
        `☀️ ${getCompostCost()}`;

    buyCanButton.textContent =
        `☀️ ${getCanCost()}`;

    buyCompostButton.disabled =
        isFullyGrown() || sunlight < getCompostCost();

    buyCanButton.disabled =
        isFullyGrown() || sunlight < getCanCost();
}


// =================================
// UPDATE GAME INTERFACE
// =================================

function updateGame() {
    checkGrowthStage();

    growthDisplay.textContent = growth;
    sunlightDisplay.textContent = sunlight;

    totalGrowthDisplay.textContent = growth;
    waterCountDisplay.textContent = waterCount;
    stageCountDisplay.textContent = stage;

    // Update watering amount
    waterAmount.textContent =
        `+${getWaterAmount()} growth`;

    updatePlantAppearance();
    updateProgress();
    updateShop();
}


// =================================
// SAVE GAME
// =================================

function saveGame() {
    const gameData = {
        growth,
        sunlight,
        waterCount,
        stage,
        compostLevel,
        canLevel
    };

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(gameData)
    );
}


// =================================
// LOAD GAME
// =================================

function loadGame() {
    try {
        const savedData = localStorage.getItem(SAVE_KEY);

        if (!savedData) return;

        const data = JSON.parse(savedData);

        growth = Math.min(
            MAX_GROWTH,
            Math.max(0, Number(data.growth) || 0)
        );

        sunlight = Math.max(0, Number(data.sunlight) || 0);
        waterCount = Math.max(0, Number(data.waterCount) || 0);

        compostLevel = Math.max(
            0,
            Math.floor(Number(data.compostLevel) || 0)
        );

        canLevel = Math.max(
            0,
            Math.floor(Number(data.canLevel) || 0)
        );

        // Recalculate stage from growth
        stage = 1;

        while (
            stage < MAX_STAGE &&
            growth >= growthRequirements[stage - 1]
        ) {
            stage++;
        }

    } catch (error) {
        console.error("Could not load saved game:", error);
    }
}


// =================================
// EVENT LISTENERS
// =================================

waterButton.addEventListener("click", waterPlant);
plantButton.addEventListener("click", clickPlant);

buyCompostButton.addEventListener("click", buyCompost);
buyCanButton.addEventListener("click", buyCan);


// =================================
// START GAME
// =================================

loadGame();
updateGame();

setInterval(passiveGrowth, PASSIVE_INTERVAL);

// Save progress periodically
setInterval(saveGame, 5000);

// Save when leaving the page
window.addEventListener("beforeunload", saveGame);