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
    lastGeneratorUpdate: ''
};

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
    'He+energy': {
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

function initGame() {
    loadGame();
    setupClickerButtons();
    setupFusionChamber();
    setupSaveButtons();
    updateInventory();
    updateUI();
    updateBlueprints();
    updateGeneratorDisplay();
    startGenerators();
    startAutoSave();
}

function setupClickerButtons() {
    const clickerButtons = document.querySelectorAll('.clicker-btn');
    clickerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const particle = button.dataset.particle;
            gameState.inventory[particle]++;
            updateInventory();
            updateBlueprints();
            updateUI();
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
            gameState.inventory[particleType]--;
            gameState.fusionChamber.push(particleType);
            updateFusionChamber();
            updateInventory();
            updateBlueprints();
            updateUI();
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

function cancelFusion() {
    gameState.fusionChamber.forEach(particle => {
        gameState.inventory[particle]++;
    });
    gameState.fusionChamber = [];
    updateFusionChamber();
    updateInventory();
    updateBlueprints();
    updateUI();
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
    const particle = gameState.fusionChamber[index];
    gameState.inventory[particle]++;
    gameState.fusionChamber.splice(index, 1);
    updateFusionChamber();
    updateInventory();
    updateBlueprints();
    updateUI();
}

function performFusion() {
    if (gameState.fusionChamber.length === 0) return;

    const chamberCounts = {};
    gameState.fusionChamber.forEach(particle => {
        chamberCounts[particle] = (chamberCounts[particle] || 0) + 1;
    });

    let validFusion = null;
    Object.entries(fusionRecipes).forEach(([name, recipe]) => {
        const recipeParticles = Object.keys(recipe.recipe);
        const chamberParticles = Object.keys(chamberCounts);
        
        if (recipeParticles.length === chamberParticles.length) {
            let isValidRecipe = true;
            
            recipeParticles.forEach(particle => {
                if (chamberCounts[particle] !== recipe.recipe[particle]) {
                    isValidRecipe = false;
                }
            });
            
            chamberParticles.forEach(particle => {
                if (!recipe.recipe[particle]) {
                    isValidRecipe = false;
                }
            });
            
            if (isValidRecipe) {
                validFusion = { name, recipe };
            }
        }
    });

    if (validFusion) {
        Object.entries(validFusion.recipe.result).forEach(([particle, amount]) => {
            gameState.inventory[particle] += amount;
            if (particle === 'energy' && !gameState.energyUnlocked) {
                gameState.energyUnlocked = true;
                document.getElementById('shop-section').style.display = 'block';
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

    updateFusionChamber();
    updateInventory();
    updateBlueprints();
    updateUI();
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

function updateBlueprints() {
    const blueprintsGrid = document.getElementById('blueprints');
    blueprintsGrid.innerHTML = '';

    Object.entries(fusionRecipes).forEach(([blueprintName, recipe]) => {
        if (!gameState.manufacturedItems.includes(blueprintName)) {
            return;
        }

        const blueprintItem = document.createElement('div');
        blueprintItem.className = 'blueprint-item';
        
        let canCraft = true;
        Object.entries(recipe.recipe).forEach(([particle, needed]) => {
            if (gameState.inventory[particle] < needed) {
                canCraft = false;
            }
        });
        
        if (!canCraft) {
            blueprintItem.classList.add('unavailable');
        }
        
        blueprintItem.innerHTML = `
            <div class="blueprint-name">${getParticleDisplayName(blueprintName)}</div>
            <div class="blueprint-recipe">
                ${Object.entries(recipe.recipe).map(([particle, count]) => 
                    `${count}× ${getParticleDisplayName(particle)}`
                ).join(' + ')}
            </div>
            <div class="blueprint-result">
                → ${Object.entries(recipe.result).map(([particle, count]) => 
                    `${count}× ${getParticleDisplayName(particle)}`
                ).join(' + ')}
            </div>
            ${recipe.cost > 0 ? `<div class="fusion-cost">Cost: ${recipe.cost} Energy</div>` : ''}
        `;

        blueprintItem.addEventListener('click', () => {
            useBlueprint(blueprintName);
        });

        blueprintsGrid.appendChild(blueprintItem);
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

        showMessage(`${getParticleDisplayName(blueprintName)} fused!`, 'success');
        updateInventory();
        updateBlueprints();
        updateUI();
    } else {
        showMessage('Not enough materials for this blueprint!', 'error');
    }
}

function updateShop() {
    if (!gameState.energyUnlocked) return;

    const shopGrid = document.getElementById('shop');
    shopGrid.innerHTML = '';

    Object.entries(generatorBaseCosts).forEach(([particle, baseCost]) => {
        const purchased = gameState.purchaseCount[particle];
        const cost = Math.floor(baseCost * Math.pow(1.05, purchased));
        const canAfford = gameState.inventory.energy >= cost;

        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        shopItem.innerHTML = `
            <div class="shop-item-name">${getParticleDisplayName(particle)} Generator</div>
            <div class="shop-item-cost ${canAfford ? 'affordable' : 'expensive'}">Cost: ${cost} Energy</div>
            <button class="shop-btn" ${!canAfford ? 'disabled' : ''} onclick="buyGenerator('${particle}')">
                ${canAfford ? 'Buy' : 'Not enough energy'}
            </button>
        `;
        shopGrid.appendChild(shopItem);
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

        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        shopItem.innerHTML = `
            <div class="shop-item-name">${getParticleDisplayName(particle)} Generator</div>
            <div class="shop-item-cost ${canCombine ? 'affordable' : 'expensive'}">Cost: ${combinationText}</div>
            <button class="shop-btn" ${!canCombine ? 'disabled' : ''} onclick="combineGenerators('${particle}')">
                ${canCombine ? 'Combine' : 'Not enough Generators'}
            </button>
        `;
        shopGrid.appendChild(shopItem);
    });
}

function buyGenerator(particle) {
    const baseCost = generatorBaseCosts[particle];
    const purchased = gameState.purchaseCount[particle];
    const cost = Math.floor(baseCost * Math.pow(1.05, purchased));

    if (gameState.inventory.energy >= cost) {
        gameState.inventory.energy -= cost;
        gameState.generators[particle]++;
        gameState.purchaseCount[particle]++;
        updateShop();
        updateGeneratorDisplay();
        updateUI();
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
        updateGeneratorDisplay();
        updateUI();
    }
}

function startGenerators() {
    setInterval(() => {
        Object.entries(gameState.generators).forEach(([particle, count]) => {
            if (count > 0) {
                gameState.inventory[particle] += count;
            }
        });
        updateInventory();
        updateBlueprints();
        updateUI();
    }, 1000);
}

function startAutoSave() {
    setInterval(() => {
        saveGame();
    }, 60000);
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
        if (saveData) {
            const loadedState = JSON.parse(saveData);

            if (loadedState.inventory && loadedState.generators) {
                gameState = { ...gameState, ...loadedState };
            }

            if (gameState.energyUnlocked) {
                document.getElementById('shop-section').style.display = 'block';
            }

            showSaveStatus('Game loaded!', 'success');
        } else {
            showSaveStatus('No saved game found.', 'info');
        }
    } catch (error) {
        console.error('Load error:', error);
        showSaveStatus('Loading failed!', 'error');
    }
}

function loadGameDialog() {
    if (confirm('Do you want to load the saved game? Current progress will be lost!')) {
        loadGame();
        updateInventory();
        updateUI();
        updateBlueprints();
        updateGeneratorDisplay();
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
            lastSave: Date.now()
        };

        document.getElementById('shop-section').style.display = 'none';
        updateInventory();
        updateUI();
        updateBlueprints();
        updateGeneratorDisplay();
        showSaveStatus('New Game Started!', 'success');
    }
}


function showSaveStatus(message, type) {
    const statusElement = document.getElementById('save-status');
    statusElement.textContent = message;
    statusElement.style.color = type === 'success' ? '#38a169' : '#e53e3e';
    
    setTimeout(() => {
        statusElement.textContent = '';
    }, 3000);
}

function updateUI() {
    document.getElementById('energy-count').textContent = `Energy: ${gameState.inventory.energy}`;
    
    if (gameState.energyUnlocked && document.getElementById('shop-section').style.display !== 'none') {
        if (gameState.lastEnergyUpdate !== gameState.inventory.energy || 
            gameState.lastGeneratorUpdate !== JSON.stringify(gameState.generators)) {
            updateShop();
            gameState.lastEnergyUpdate = gameState.inventory.energy;
            gameState.lastGeneratorUpdate = JSON.stringify(gameState.generators);
        }
    }
}

function getParticleDisplayName(particle) {
    const displayNames = {
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
        'He+energy': 'Helium + Energy'
    };
    return displayNames[particle] || particle;
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    const fusionSection = document.querySelector('.fusion-section');
    fusionSection.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

document.addEventListener('DOMContentLoaded', initGame);
