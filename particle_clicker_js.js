let gameState = {
    inventory: {
        'up-quark': 0,
        'down-quark': 0,
        'electron': 0,
        'proton': 0,
        'neutron': 0,
        '1H': 0,
        '2H': 0,
        '3H': 0,
        'He': 0,
        'energy': 0
    },
    generators: {
        'up-quark': 0,
        'down-quark': 0,
        'electron': 0,
        'proton': 0,
        'neutron': 0,
        '1H': 0,
        '2H': 0,
        '3H': 0,
        'He': 0,
        'energy': 0
    },
    purchaseCount: {
        'up-quark': 0,
        'down-quark': 0,
        'electron': 0
    },
    fusionChamber: [],
    discoveredBlueprints: [],
    manufacturedItems: [],
    energyUnlocked: false,
    fusionFailures: 0,
    lastSave: Date.now(),
    lastEnergyUpdate: 0,
    lastGeneratorUpdate: '',
    energyUpgrades: [],
    energyMultiplier: 1
};

let lastInventoryState = {};
let lastGeneratorState = {};
let lastBlueprintState = {};


const fusionRecipes = {
    'proton': {
        recipe: { 'up-quark': 2, 'down-quark': 1 },
        result: { 'proton': 1 },
        cost: 0
    },
    'neutron': {
        recipe: { 'up-quark': 1, 'down-quark': 2 },
        result: { 'neutron': 1 },
        cost: 0
    },
    '1H': {
        recipe: { 'proton': 1, 'electron': 1 },
        result: { '1H': 1 },
        cost: 0
    },
    '2H': {
        recipe: { 'proton': 1, 'neutron': 1, 'electron': 1 },
        result: { '2H': 1 },
        cost: 0
    },
    '3H': {
        recipe: { 'proton': 1, 'neutron': 2, 'electron': 1 },
        result: { '3H': 1 },
        cost: 0
    },
    'He+neutron+energy': {
        recipe: { '2H': 1, '3H': 1 },
        result: { 'He': 1, 'neutron': 1, 'energy': 1 },
        cost: 0
    }
};

const generatorBaseCosts = {
    'up-quark': 5,
    'down-quark': 5,
    'electron': 5
};

const generatorCombinations = {
    'proton': { 'up-quark': 2, 'down-quark': 1 },
    'neutron': { 'up-quark': 1, 'down-quark': 2 },
    '1H': { 'proton': 1, 'electron': 1 },
    '2H': { 'proton': 1, 'neutron': 1, 'electron': 1 },
    '3H': { 'proton': 1, 'neutron': 2, 'electron': 1 },
    'He': { '2H': 1, '3H': 1 }
};

const energyUpgradesList = [
    { name: "Rutherford Scattering", multiplier: 2, cost: 100, description: "Energy Generators are twice as efficient" },
    { name: "Fermi's Golden Rule", multiplier: 2, cost: 1000, description: "Energy Generators are twice as efficient" },
    { name: "Bohr Model", multiplier: 2, cost: 10000, description: "Energy Generators are twice as efficient" },
    { name: "Dirac Equation", multiplier: 2, cost: 100000, description: "Energy Generators are twice as efficient" },
    { name: "Pauli Principle", multiplier: 2, cost: 1000000, description: "Energy Generators are twice as efficient" },
    { name: "Feynman Diagrams", multiplier: 2, cost: 10000000, description: "Energy Generators are twice as efficient" },
    { name: "Gell-Mann's Quarks", multiplier: 2, cost: 100000000, description: "Energy Generators are twice as efficient" },
    { name: "Higgs Boson", multiplier: 2, cost: 1000000000, description: "Energy Generators are twice as efficient" }
];

const particleDisplayNames = {
    'up-quark': 'Up Quark',
    'down-quark': 'Down Quark',
    'electron': 'Electron',
    'proton': 'Proton',
    'neutron': 'Neutron',
    '1H': 'Hydrogen-1',
    '2H': 'Deuterium',
    '3H': 'Tritium',
    'He': 'Helium',
    'energy': 'Energy',
    'He+neutron+energy': 'Helium + Neutron + Energy'
};


function getParticleDisplayName(particle) {
    return particleDisplayNames[particle] || particle;
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    const fusionSection = document.querySelector('.fusion-section');
    fusionSection.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 2000);
}

function showSaveStatus(message, type) {
    const statusElement = document.getElementById('save-status');
    statusElement.textContent = message;
    statusElement.style.color = type === 'success' ? '#38a169' : '#e53e3e';
    
    setTimeout(() => {
        statusElement.textContent = '';
    }, 3000);
}

function hasInventoryChanged() {
    const currentState = JSON.stringify(gameState.inventory);
    if (currentState !== lastInventoryState) {
        lastInventoryState = currentState;
        return true;
    }
    return false;
}

function hasGeneratorChanged() {
    const currentState = JSON.stringify(gameState.generators);
    if (currentState !== lastGeneratorState) {
        lastGeneratorState = currentState;
        return true;
    }
    return false;
}

function hasBlueprintStateChanged() {
    const currentState = JSON.stringify({
        inventory: gameState.inventory,
        discovered: gameState.discoveredBlueprints
    });
    if (currentState !== lastBlueprintState) {
        lastBlueprintState = currentState;
        return true;
    }
    return false;
}

function updateGameState() {
    let needsUIUpdate = false;

    if (hasInventoryChanged()) {
        updateInventory();
        needsUIUpdate = true;
    }

    if (hasGeneratorChanged()) {
        updateGeneratorDisplay();
        needsUIUpdate = true;
    }

    if (hasBlueprintStateChanged()) {
        updateBlueprints();
        needsUIUpdate = true;
    }

    if (needsUIUpdate) {
        updateUI();
    }
}

function batchUpdate(updateFunction) {
    requestAnimationFrame(() => {
        updateFunction();
        updateGameState();
    });
}

function updateInventory() {
    const inventoryGrid = document.getElementById('inventory');
    inventoryGrid.innerHTML = '';

    Object.entries(gameState.inventory).forEach(([particle, count]) => {
        if (count > 0) {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.draggable = true;
            item.innerHTML = `
                <div class="item-name">${getParticleDisplayName(particle)}</div>
                <div class="item-count">${count}</div>
            `;

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', particle);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });

            inventoryGrid.appendChild(item);
        }
    });
}

function updateGeneratorDisplay() {
    const generatorGrid = document.getElementById('generators-display');
    generatorGrid.innerHTML = '';

    Object.entries(gameState.generators).forEach(([particle, count]) => {
        if (count > 0) {
            const item = document.createElement('div');
            item.className = 'generator-item';
            item.innerHTML = `
                <div class="generator-name">${getParticleDisplayName(particle)}</div>
                <div class="generator-count">${count}</div>
            `;
            generatorGrid.appendChild(item);
        }
    });
}

function startGenerators() {
    setInterval(() => {
        let inventoryChanged = false;
        
        Object.entries(gameState.generators).forEach(([particle, count]) => {
            if (count > 0) {
                let gain = count;
                if (particle === 'energy') {
                    gain *= gameState.energyMultiplier;
                }
                gameState.inventory[particle] += gain;
                inventoryChanged = true;
            }
        });
        
        if (inventoryChanged) {
            batchUpdate(() => {
                document.getElementById('energy-count').textContent = `Energy: ${gameState.inventory.energy}`;
                
                const now = Date.now();
                if (now - (gameState.lastShopUpdate || 0) > 2000) {
                    updateShop();
                    gameState.lastShopUpdate = now;
                }
            });
        }
    }, 1000);
}

function buyGenerator(particle) {
    const baseCost = generatorBaseCosts[particle];
    const purchased = gameState.purchaseCount[particle];
    const cost = Math.floor(baseCost * Math.pow(1.05, purchased));

    if (gameState.inventory.energy >= cost) {
        batchUpdate(() => {
            gameState.inventory.energy -= cost;
            gameState.generators[particle]++;
            gameState.purchaseCount[particle]++;
            updateShop();
        });
    }
}

function combineGenerators(particle) {
    const combination = generatorCombinations[particle];
    let canCombine = true;

    Object.entries(combination).forEach(([requiredParticle, count]) => {
        if (gameState.generators[requiredParticle] < count) {
            canCombine = false;
        }
    });

    if (canCombine) {
        batchUpdate(() => {
            Object.entries(combination).forEach(([requiredParticle, count]) => {
                gameState.generators[requiredParticle] -= count;
            });

            if (particle === 'He') {
                gameState.generators['He']++;
                gameState.generators['neutron']++;
                gameState.generators['energy']++;
            } else {
                gameState.generators[particle]++;
            }
            updateShop();
        });
    }
}

function updateFusionChamber() {
    const dropZone = document.getElementById('drop-zone');
    const fusionBtn = document.getElementById('fusion-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    if (gameState.fusionChamber.length === 0) {
        dropZone.innerHTML = '<p>Drag particles here to fuse them</p>';
        fusionBtn.disabled = true;
        cancelBtn.disabled = true;
    } else {
        dropZone.innerHTML = '';
        gameState.fusionChamber.forEach((particle, index) => {
            const fusionItem = document.createElement('div');
            fusionItem.className = 'fusion-item';
            fusionItem.innerHTML = `
                ${getParticleDisplayName(particle)}
                <button class="remove-btn" onclick="removeFusionItem(${index})">×</button>
            `;
            dropZone.appendChild(fusionItem);
        });
        fusionBtn.disabled = false;
        cancelBtn.disabled = false;
    }
}

function removeFusionItem(index) {
    batchUpdate(() => {
        const particle = gameState.fusionChamber[index];
        gameState.inventory[particle]++;
        gameState.fusionChamber.splice(index, 1);
        updateFusionChamber();
    });
}

function cancelFusion() {
    batchUpdate(() => {
        gameState.fusionChamber.forEach(particle => {
            gameState.inventory[particle]++;
        });
        gameState.fusionChamber = [];
        updateFusionChamber();
    });
}

function particlesMatch(required, actual) {
    const requiredEntries = Object.entries(required);
    const actualEntries = Object.entries(actual);

    if (requiredEntries.length !== actualEntries.length) return false;

    return requiredEntries.every(([particle, count]) => actual[particle] === count);
}

function performFusion() {
    if (gameState.fusionChamber.length === 0) return;

    const chamberCounts = {};
    gameState.fusionChamber.forEach(particle => {
        chamberCounts[particle] = (chamberCounts[particle] || 0) + 1;
    });

    let validFusion = null;
    Object.entries(fusionRecipes).forEach(([name, recipe]) => {
        if (particlesMatch(recipe.recipe, chamberCounts)) {
            validFusion = { name, recipe };
        }
    });

    if (validFusion) {
        Object.entries(validFusion.recipe.result).forEach(([particle, amount]) => {
            gameState.inventory[particle] += amount;

            if (particle === 'energy' && !gameState.energyUnlocked) {
                gameState.energyUnlocked = true;
                document.getElementById('shop-section').style.display = 'block';
                document.getElementById('energy-upgrades-section').style.display = 'block';
                showMessage('Energy unlocked! Generator shop is now available!', 'success');
            }
        });

        if (!gameState.discoveredBlueprints.includes(validFusion.name)) {
            gameState.discoveredBlueprints.push(validFusion.name);
            updateBlueprints();
        }

        if (!gameState.manufacturedItems.includes(validFusion.name)) {
            gameState.manufacturedItems.push(validFusion.name);
        }

        gameState.fusionChamber = [];
        gameState.fusionFailures = 0;
        showMessage(`${getParticleDisplayName(validFusion.name)} successfully fused!`, 'success');
    } else {
        gameState.fusionChamber = [];
        gameState.fusionFailures++;

        if (gameState.fusionFailures >= 5) {
            showFusionHint();
            gameState.fusionFailures = 0;
        }

        showMessage('Fusion failed! Materials lost.', 'error');
    }

    batchUpdate(() => {
        updateFusionChamber();
    });
}

function showFusionHint() {
    const unmanufacturedItems = Object.keys(fusionRecipes).filter(item => 
        !gameState.manufacturedItems.includes(item)
    );
    
    const craftableItems = unmanufacturedItems.filter(item => {
        const recipe = fusionRecipes[item];
        return canCraftOrObtain(recipe.recipe);
    });
    
    if (craftableItems.length > 0) {
        const randomItem = craftableItems[Math.floor(Math.random() * craftableItems.length)];
        const recipe = fusionRecipes[randomItem];
        const ingredientsList = Object.entries(recipe.recipe).map(([particle, count]) => 
            `${count}× ${getParticleDisplayName(particle)}`
        ).join(' + ');
        
        showMessage(`💡 Hint: Try to fuse ${ingredientsList}!`, 'hint');
    } else if (unmanufacturedItems.length > 0) {
        const randomItem = unmanufacturedItems[Math.floor(Math.random() * unmanufacturedItems.length)];
        const recipe = fusionRecipes[randomItem];
        const ingredientsList = Object.entries(recipe.recipe).map(([particle, count]) => 
            `${count}× ${getParticleDisplayName(particle)}`
        ).join(' + ');
        
        showMessage(`💡 Hint: Try to fuse ${ingredientsList}!`, 'hint');
    }
}

function canCraftOrObtain(requiredMaterials) {
    return Object.entries(requiredMaterials).every(([particle, needed]) => {
        if (gameState.inventory[particle] >= needed) {
            return true;
        }
        
        if (gameState.generators[particle] > 0) {
            return true;
        }

        if (['electron', 'up-quark', 'down-quark'].includes(particle)) {
            return true;
        }
        
        return canCraftViaBlueprints(particle, needed - gameState.inventory[particle]);
    });
}

function canCraftViaBlueprints(targetParticle, neededAmount) {
    for (const [blueprintName, recipe] of Object.entries(fusionRecipes)) {
        if (!gameState.manufacturedItems.includes(blueprintName)) {
            continue;
        }
        
        if (recipe.result[targetParticle] && recipe.result[targetParticle] > 0) {
            const canMakeBlueprint = Object.entries(recipe.recipe).every(([particle, count]) => {
                return gameState.inventory[particle] >= count || gameState.generators[particle] > 0;
            });
            
            if (canMakeBlueprint) {
                return true;
            }
        }
    }
    
    return false;
}

function canCraftFromInventoryOnly(requiredMaterials) {
    return Object.entries(requiredMaterials).every(([particle, needed]) => {
        return gameState.inventory[particle] >= needed;
    });
}

function updateBlueprints() {
    const blueprintsGrid = document.getElementById('blueprints');
    
    const existingItems = blueprintsGrid.querySelectorAll('.blueprint-item');
    existingItems.forEach(item => {
        const blueprintName = item.dataset.blueprint;
        const recipe = fusionRecipes[blueprintName];
        const canCraft = canCraftFromInventoryOnly(recipe.recipe);
        
        if (canCraft) {
            item.classList.remove('unavailable');
        } else {
            item.classList.add('unavailable');
        }
    });
    
    if (gameState.discoveredBlueprints.length !== gameState.lastBlueprintCount) {
        gameState.lastBlueprintCount = gameState.discoveredBlueprints.length;
        rebuildBlueprints();
    }
}

function rebuildBlueprints() {
    const blueprintsGrid = document.getElementById('blueprints');
    const blueprintData = [];
    
    Object.entries(fusionRecipes).forEach(([blueprintName, recipe]) => {
        if (!gameState.discoveredBlueprints.includes(blueprintName)) {
            return;
        }

        const canCraft = canCraftFromInventoryOnly(recipe.recipe);
        
        blueprintData.push({
            name: blueprintName,
            recipe: recipe,
            canCraft: canCraft
        });
    });

    blueprintsGrid.innerHTML = blueprintData.map(blueprint => `
        <div class="blueprint-item ${!blueprint.canCraft ? 'unavailable' : ''}" 
             data-blueprint="${blueprint.name}">
            <div class="blueprint-recipe">
                ${Object.entries(blueprint.recipe.recipe).map(([particle, count]) => 
                    `${count}× ${getParticleDisplayName(particle)}`
                ).join(' + ')}
            </div>
            <div class="blueprint-result">
                → ${Object.entries(blueprint.recipe.result).map(([particle, count]) => 
                    `${count}× ${getParticleDisplayName(particle)}`
                ).join(' + ')}
            </div>
            ${blueprint.recipe.cost > 0 ? `<div class="fusion-cost">Cost: ${blueprint.recipe.cost} Energy</div>` : ''}
        </div>
    `).join('');
    
    // Add event listeners
    blueprintsGrid.querySelectorAll('.blueprint-item').forEach(item => {
        const blueprintName = item.dataset.blueprint;
        item.addEventListener('click', () => {
            useBlueprint(blueprintName);
        });
    });
}

function useBlueprint(blueprintName) {
    const recipe = fusionRecipes[blueprintName];
    let canCraft = true;

    Object.entries(recipe.recipe).forEach(([particle, needed]) => {
        if (gameState.inventory[particle] < needed) {
            canCraft = false;
        }
    });

    if (canCraft) {
        Object.entries(recipe.recipe).forEach(([particle, needed]) => {
            gameState.inventory[particle] -= needed;
        });
        
        Object.entries(recipe.result).forEach(([particle, amount]) => {
            gameState.inventory[particle] += amount;
            if (particle === 'energy' && !gameState.energyUnlocked) {
                gameState.energyUnlocked = true;
                document.getElementById('shop-section').style.display = 'block';
                showMessage('Energy unlocked! Generator shop is now available!', 'success');
            }
        });

        if (!gameState.discoveredBlueprints.includes(blueprintName)) {
            gameState.discoveredBlueprints.push(blueprintName);
        }

        if (!gameState.manufacturedItems.includes(blueprintName)) {
            gameState.manufacturedItems.push(blueprintName);
        }

        batchUpdate(() => {
            showMessage(`${getParticleDisplayName(blueprintName)} fused!`, 'success');
        });
    } else {
        showMessage('Not enough materials for this blueprint!', 'error');
    }
}

function updateShop() {
    if (!gameState.energyUnlocked) return;

    const shopGrid = document.getElementById('shop');
    const currentShopState = {
        energy: gameState.inventory.energy,
        generators: {...gameState.generators},
        purchaseCount: {...gameState.purchaseCount}
    };
    
    if (JSON.stringify(currentShopState) === JSON.stringify(gameState.lastShopState)) {
        return;
    }
    
    gameState.lastShopState = currentShopState;
    
    const shopData = [];

    Object.entries(generatorBaseCosts).forEach(([particle, baseCost]) => {
        const purchased = gameState.purchaseCount[particle];
        const cost = Math.floor(baseCost * Math.pow(1.05, purchased));
        const canAfford = gameState.inventory.energy >= cost;

        shopData.push({
            type: 'generator',
            particle: particle,
            cost: cost,
            canAfford: canAfford
        });
    });

    Object.entries(generatorCombinations).forEach(([particle, combination]) => {
        let canCombine = true;
        let combinationText = '';

        Object.entries(combination).forEach(([requiredParticle, count]) => {
            if (gameState.generators[requiredParticle] < count) {
                canCombine = false;
            }
            combinationText += `${count}× ${getParticleDisplayName(requiredParticle)} Gen + `;
        });
        combinationText = combinationText.slice(0, -3);

        shopData.push({
            type: 'combination',
            particle: particle,
            combinationText: combinationText,
            canCombine: canCombine
        });
    });

    const newHTML = shopData.map(item => {
        if (item.type === 'generator') {
            return `
                <div class="shop-item">
                    <div class="shop-item-name">${getParticleDisplayName(item.particle)} Generator</div>
                    <div class="shop-item-cost ${item.canAfford ? 'affordable' : 'expensive'}">Cost: ${item.cost} Energy</div>
                    <button class="shop-btn" ${!item.canAfford ? 'disabled' : ''} 
                            onclick="buyGenerator('${item.particle}')">
                        ${item.canAfford ? 'Buy' : 'Not enough energy'}
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="shop-item">
                    <div class="shop-item-name">${getParticleDisplayName(item.particle)} Generator</div>
                    <div class="shop-item-cost ${item.canCombine ? 'affordable' : 'expensive'}">Cost: ${item.combinationText}</div>
                    <button class="shop-btn" ${!item.canCombine ? 'disabled' : ''} 
                            onclick="combineGenerators('${item.particle}')">
                        ${item.canCombine ? 'Combine' : 'Not enough Generators'}
                    </button>
                </div>
            `;
        }
    }).join('');

    if (shopGrid.innerHTML !== newHTML) {
        shopGrid.innerHTML = newHTML;
    }
}

function updateEnergyUpgrades() {
    if (!gameState.energyUnlocked) return;

    document.getElementById('energy-upgrades-section').style.display = 'block';

    const upgradesGrid = document.getElementById('energy-upgrades-grid');
    upgradesGrid.innerHTML = '';

    energyUpgradesList.forEach((upgrade, index) => {
        if (gameState.energyUpgrades.includes(upgrade.name)) return;

        const canAfford = gameState.inventory.energy >= upgrade.cost;

        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `
            <div class="shop-item-name">${upgrade.name}</div>
            <div class="shop-item-cost ${canAfford ? 'affordable' : 'expensive'}">
                Cost: ${upgrade.cost.toLocaleString()} Energy
            </div>
            <button class="shop-btn" ${!canAfford ? 'disabled' : ''} 
                onclick="buyEnergyUpgrade(${index})">
                Buy
            </button>
        `;

        upgradesGrid.appendChild(item);
    });
}

function buyEnergyUpgrade(index) {
    const upgrade = energyUpgradesList[index];
    if (gameState.energyUpgrades.includes(upgrade.name)) return;
    if (gameState.inventory.energy < upgrade.cost) return;

    gameState.inventory.energy -= upgrade.cost;
    gameState.energyUpgrades.push(upgrade.name);
    gameState.energyMultiplier *= upgrade.multiplier;

    batchUpdate(() => {
        showMessage(`${upgrade.name} purchased! Energy generators are twice as efficient.`, 'success');
        updateEnergyUpgrades();
        updateOwnedUpgrades();
    });
}

function updateOwnedUpgrades() {
    const section = document.getElementById('owned-upgrades-section');
    const grid = document.getElementById('owned-upgrades-grid');

    if (!gameState.energyUnlocked || gameState.energyUpgrades.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = '';

    gameState.energyUpgrades.forEach(name => {
        const upgrade = energyUpgradesList.find(u => u.name === name);
        if (!upgrade) return;

        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `
            <div class="shop-item-name">${upgrade.name}</div>
            <div class="shop-item-description">${upgrade.description}</div>
        `;
        grid.appendChild(item);
    });
}

function updateUI() {
    const energyElement = document.getElementById('energy-count');
    const newEnergyText = `Energy: ${gameState.inventory.energy}`;
    
    if (energyElement.textContent !== newEnergyText) {
        energyElement.textContent = newEnergyText;
    }
    
    if (gameState.energyUnlocked) {
        const now = Date.now();
        const timeSinceLastShopUpdate = now - (gameState.lastShopUpdate || 0);
        
        if (timeSinceLastShopUpdate > 2000) {
            updateShop();
            gameState.lastShopUpdate = now;
        }
    }
    
    if (Date.now() - (gameState.lastUpgradeCheck || 0) > 5000) {
        updateEnergyUpgrades();
        gameState.lastUpgradeCheck = Date.now();
    }
}

function saveGame() {
    try {
        gameState.lastSave = Date.now();
        const saveData = JSON.stringify(gameState);
        localStorage.setItem('particleClickerSave', saveData);
        showSaveStatus('Game saved!', 'success');
    } catch (error) {
        console.error('Save error:', error);
        showSaveStatus('Save failed!', 'error');
    }
}

function loadGame() {
    try {
        const saveData = localStorage.getItem('particleClickerSave');

        if (!saveData) {
            showSaveStatus('No saved game found.', 'info');
            return;
        }

        const loadedState = JSON.parse(saveData);

        if (!loadedState.inventory || !loadedState.generators) {
            showSaveStatus('Save data corrupted.', 'error');
            return;
        }

        gameState = {
            ...gameState,
            ...loadedState
        };

        if (!gameState.purchaseCount) gameState.purchaseCount = { 'up-quark': 0, 'down-quark': 0, 'electron': 0 };
        if (!gameState.energyUpgrades) gameState.energyUpgrades = [];
        if (typeof gameState.energyMultiplier !== 'number') gameState.energyMultiplier = 1;
        if (!gameState.fusionChamber) gameState.fusionChamber = [];
        if (!gameState.manufacturedItems) gameState.manufacturedItems = [];
        if (!gameState.discoveredBlueprints) gameState.discoveredBlueprints = [];

        if (gameState.energyUnlocked) {
            document.getElementById('shop-section').style.display = 'block';
            document.getElementById('energy-upgrades-section').style.display = 'block';
        }

        updateInventory();
        updateGeneratorDisplay();
        updateBlueprints();
        rebuildBlueprints();
        updateEnergyUpgrades();
        updateOwnedUpgrades();
        updateUI();

        showSaveStatus('Game loaded!', 'success');
    } catch (error) {
        console.error('Load error:', error);
        showSaveStatus('Loading failed!', 'error');
    }
}

function loadGameDialog() {
    if (confirm('Do you want to load the saved game? Current progress will be lost!')) {
        loadGame();
    }
}

function newGame() {
    if (confirm('Do you want to start a new game? All progress will be lost!')) {
        gameState = {
            inventory: {
                'up-quark': 0,
                'down-quark': 0,
                'electron': 0,
                'proton': 0,
                'neutron': 0,
                '1H': 0,
                '2H': 0,
                '3H': 0,
                'He': 0,
                'energy': 0
            },
            generators: {
                'up-quark': 0,
                'down-quark': 0,
                'electron': 0,
                'proton': 0,
                'neutron': 0,
                '1H': 0,
                '2H': 0,
                '3H': 0,
                'He': 0,
                'energy': 0
            },
            purchaseCount: {
                'up-quark': 0,
                'down-quark': 0,
                'electron': 0
            },
            fusionChamber: [],
            discoveredBlueprints: [],
            manufacturedItems: [],
            energyUnlocked: false,
            fusionFailures: 0,
            energyUpgrades: [],
            energyMultiplier: 1,
            lastSave: Date.now()
        };

        document.getElementById('shop-section').style.display = 'none';
        document.getElementById('energy-upgrades-section').style.display = 'none';
        document.getElementById('owned-upgrades-section').style.display = 'none';

        updateInventory();
        updateUI();
        updateBlueprints();
        updateGeneratorDisplay();
        updateEnergyUpgrades();
        updateOwnedUpgrades();
    }
}

function startAutoSave() {
    setInterval(() => {
        saveGame();
    }, 60000);
}

function initGame() {
    loadGame();
    setupClickerButtons();
    setupFusionChamber();
    setupSaveButtons();
    updateInventory();
    updateBlueprints();
    updateGeneratorDisplay();
    startGenerators();
    updateOwnedUpgrades(); 
    updateUI();
    startAutoSave();
    lastInventoryState = JSON.stringify(gameState.inventory);
    lastGeneratorState = JSON.stringify(gameState.generators);
}

function setupClickerButtons() {
    const clickerButtons = document.querySelectorAll('.clicker-btn');
    clickerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const particle = button.dataset.particle;
            batchUpdate(() => {
                gameState.inventory[particle]++;
            });
        });
    });
}

function setupFusionChamber() {
    const dropZone = document.getElementById('drop-zone');
    const fusionBtn = document.getElementById('fusion-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const particleType = e.dataTransfer.getData('text/plain');
        if (gameState.inventory[particleType] > 0) {
            batchUpdate(() => {
                gameState.inventory[particleType]--;
                gameState.fusionChamber.push(particleType);
                updateFusionChamber();
            });
        }
    });

    fusionBtn.addEventListener('click', performFusion);
    cancelBtn.addEventListener('click', cancelFusion);
}

function setupSaveButtons() {
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('load-btn').addEventListener('click', loadGameDialog);
    document.getElementById('new-game-btn').addEventListener('click', newGame);
}

document.addEventListener('DOMContentLoaded', initGame);
