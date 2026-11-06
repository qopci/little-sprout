// Game resources

let growth = 0;
let sunlight = 0;
let waterCount = 0;
let stage = 1;

const growthPerWater = 5;

const growthRequirements = [
    50,
    100,
    200,
    350,
    500
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

const MAX_STAGE = 6;


/* =================================
   HTML ELEMENTS
================================= */

const growthDisplay = document.getElementById("growth");
const sunlightDisplay = document.getElementById("sunlight");

const totalGrowthDisplay =
    document.getElementById("total-growth");

const waterCountDisplay =
    document.getElementById("water-count");

const stageCountDisplay =
    document.getElementById("stage-count");

const progressText =
    document.getElementById("progress-text");

const progressFill =
    document.getElementById("progress-fill");

const progressBar =
    document.getElementById("progress-bar");

const plantStage =
    document.getElementById("plant-stage");

const plantDescription =
    document.getElementById("plant-description");

const plant =
    document.getElementById("plant");

const plantButton =
    document.getElementById("plant-button");

const waterButton =
    document.getElementById("water-button");


/* =================================
   GAME ACTIONS
================================= */

// Check if plant is fully grown

function isFullyGrown() {
    return stage >= MAX_STAGE;
}

// Water the plant

function waterPlant() {
    if (isFullyGrown()) return;

    growth += growthPerWater;
    waterCount++;

    updateGame();
}

// Click the plant

function clickPlant() {
    if (isFullyGrown()) return;

    growth += 1;

    updateGame();
}


/* =================================
   GROWTH SYSTEM
================================= */

// Check for new growth stages

function checkGrowthStage() {
    while (
        !isFullyGrown() &&
        growth >= growthRequirements[stage - 1]
    ) {
        stage++;

        // Reward sunlight
        sunlight += 2;

        // Update plant appearance
        updatePlantAppearance();
    }
}

// Update plant appearance

function updatePlantAppearance() {
    const currentStage = Math.min(stage, MAX_STAGE);

    plant.className = "plant";
    plant.classList.add(`stage-${currentStage}`);

    plantStage.textContent =
        stageNames[currentStage - 1];

    plantDescription.textContent =
        stageDescriptions[currentStage - 1];

    // Update watering button when fully grown
    if (isFullyGrown()) {
        waterButton.innerHTML =
            "Your plant is fully grown!";

        waterButton.disabled = true;
    }
}


/* =================================
   PROGRESS BAR
================================= */

function updateProgress() {

    // Fully grown plant
    if (isFullyGrown()) {
        progressText.textContent = "Fully grown!";

        progressFill.style.width = "100%";

        progressBar.setAttribute(
            "aria-valuenow",
            100
        );

        return;
    }

    const requirement =
        growthRequirements[stage - 1];

    const previousRequirement =
        stage === 1
            ? 0
            : growthRequirements[stage - 2];

    const currentGrowth =
        growth - previousRequirement;

    const stageGrowth =
        requirement - previousRequirement;

    const percentage = Math.min(
        (currentGrowth / stageGrowth) * 100,
        100
    );

    progressText.textContent =
        `${growth} / ${requirement}`;

    progressFill.style.width =
        `${percentage}%`;

    progressBar.setAttribute(
        "aria-valuenow",
        Math.round(percentage)
    );
}


/* =================================
   UPDATE GAME INTERFACE
================================= */

function updateGame() {

    checkGrowthStage();

    // Resource counters
    growthDisplay.textContent = growth;
    sunlightDisplay.textContent = sunlight;

    // Garden statistics
    totalGrowthDisplay.textContent = growth;
    waterCountDisplay.textContent = waterCount;
    stageCountDisplay.textContent = stage;

    // Progress bar
    updateProgress();
}


/* =================================
   EVENT LISTENERS
================================= */

waterButton.addEventListener("click", waterPlant);

plantButton.addEventListener("click", clickPlant);


/* =================================
   INITIALIZE GAME
================================= */

updatePlantAppearance();
updateGame();