// Game resources
let growth = 0;
let sunlight = 0;
let waterCount = 0;
let stage = 1;

const growthPerWater = 5;
const growthRequirements = [50, 100, 200, 350, 500];

// HTML elements
const growthDisplay = document.getElementById("growth");
const sunlightDisplay = document.getElementById("sunlight");
const totalGrowthDisplay = document.getElementById("total-growth");
const waterCountDisplay = document.getElementById("water-count");
const stageCountDisplay = document.getElementById("stage-count");

const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

const plantStage = document.getElementById("plant-stage");
const plantDescription = document.getElementById("plant-description");
const plantButton = document.getElementById("plant-button");
const waterButton = document.getElementById("water-button");

// Water the plant
function waterPlant() {
    growth += growthPerWater;
    waterCount++;

    updateGame();
}

// Click the plant
function clickPlant() {
    growth += 1;
    updateGame();
}

// Update game interface
function updateGame() {
    checkGrowthStage();

    growthDisplay.textContent = growth;
    sunlightDisplay.textContent = sunlight;
    totalGrowthDisplay.textContent = growth;
    waterCountDisplay.textContent = waterCount;
    stageCountDisplay.textContent = stage;

    updateProgress();
}

// Check if plant can grow to next stage
function checkGrowthStage() {
    const requirement = growthRequirements[stage - 1];

    if (requirement && growth >= requirement) {
        stage++;
        plantStage.textContent = getStageName();
        plantDescription.textContent = getStageDescription();

        // Visual plant growth
        const plant = document.getElementById("plant");
        plant.style.transform = `scale(${1 + (stage - 1) * 0.12})`;

        // Reward
        sunlight += 2;
    }
}

// Plant stage names
function getStageName() {
    const stages = [
        "A tiny beginning",
        "Growing little by little",
        "Looking leafy!",
        "A beautiful young plant",
        "A flourishing plant",
        "A garden favorite"
    ];

    return stages[Math.min(stage - 1, stages.length - 1)];
}

function getStageDescription() {
    const descriptions = [
        "A little sprout is starting to grow.",
        "Look at those lovely leaves!",
        "Your plant is getting stronger.",
        "Your little plant is thriving.",
        "Look how far your plant has come!",
        "You've grown something beautiful."
    ];

    return descriptions[Math.min(stage - 1, descriptions.length - 1)];
}

// Progress bar
function updateProgress() {
    const requirement = growthRequirements[stage - 1];

    if (!requirement) {
        progressText.textContent = "Fully grown!";
        progressFill.style.width = "100%";
        return;
    }

    const previousRequirement = stage === 1
        ? 0
        : growthRequirements[stage - 2];

    const currentGrowth = growth - previousRequirement;
    const stageGrowth = requirement - previousRequirement;

    const percentage = Math.min(
        (currentGrowth / stageGrowth) * 100,
        100
    );

    progressText.textContent = `${growth} / ${requirement}`;
    progressFill.style.width = `${percentage}%`;
}

// Event listeners
waterButton.addEventListener("click", waterPlant);
plantButton.addEventListener("click", clickPlant);

// Initial game setup
updateGame();