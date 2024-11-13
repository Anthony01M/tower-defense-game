const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

let enemies = [];
let defenses = [];
let bullets = [];
let wave = 0;
let enemySpeed = 2;
let coins = 100;
let lives = 3;
let selectedBlock = null;
let selectedDefense = null;
const blockSize = 50;
const maxTowerLevel = 5;

const waypoints = [
    { x: 0, y: 200 },
    { x: 150, y: 200 },
    { x: 150, y: 100 },
    { x: 450, y: 100 },
    { x: 450, y: 300 },
    { x: 600, y: 300 }
];

function generatePath(waypoints) {
    const path = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy)) / blockSize;
        for (let j = 0; j <= steps; j++) {
            const x = start.x + (dx / steps) * j;
            const y = start.y + (dy / steps) * j;
            path.push({ x, y });
        }
    }
    return path;
}

const path = generatePath(waypoints);

const blocks = [];
for (let y = 0; y < canvas.height; y += blockSize) {
    for (let x = 0; x < canvas.width; x += blockSize) {
        const isPath = path.some(p => Math.abs(p.x - x) < blockSize / 2 && Math.abs(p.y - y) < blockSize / 2);
        blocks.push({ x, y, occupied: false, isPath });
    }
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const block = blocks.find(block => 
        x > block.x && x < block.x + blockSize && 
        y > block.y && y < block.y + blockSize
    );
    if (block && !block.occupied && !block.isPath) {
        selectedBlock = block;
        openModal();
    } else if (block && block.occupied) {
        selectedDefense = defenses.find(defense => defense.x === block.x + blockSize / 2 && defense.y === block.y + blockSize / 2);
        openTowerModal();
    }
});

function openModal() {
    document.getElementById('defenseModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('defenseModal').style.display = 'none';
}

function openTowerModal() {
    document.getElementById('towerInfo').innerText = `Type: ${selectedDefense.type}, Level: ${selectedDefense.level}`;
    document.getElementById('upgradeButton').innerText = `Upgrade (${selectedDefense.upgradeCost} coins)`;
    document.getElementById('towerModal').style.display = 'flex';
}

function closeTowerModal() {
    document.getElementById('towerModal').style.display = 'none';
}

function placeDefense(type) {
    let cost;
    switch (type) {
        case 'fast':
            cost = 30;
            break;
        case 'strong':
            cost = 50;
            break;
        default:
            cost = 20;
    }
    if (selectedBlock && coins >= cost) {
        let defense;
        switch (type) {
            case 'fast':
                defense = { x: selectedBlock.x + blockSize / 2, y: selectedBlock.y + blockSize / 2, range: 100, damage: 1, rate: 500, lastShot: 0, type: 'fast', level: 1, upgradeCost: 30 };
                break;
            case 'strong':
                defense = { x: selectedBlock.x + blockSize / 2, y: selectedBlock.y + blockSize / 2, range: 100, damage: 3, rate: 1500, lastShot: 0, type: 'strong', level: 1, upgradeCost: 50 };
                break;
            default:
                defense = { x: selectedBlock.x + blockSize / 2, y: selectedBlock.y + blockSize / 2, range: 100, damage: 1, rate: 1000, lastShot: 0, type: 'basic', level: 1, upgradeCost: 20 };
        }
        defenses.push(defense);
        selectedBlock.occupied = true;
        coins -= cost;
        document.getElementById('coins').innerText = coins;
        closeModal();
    }
}

function upgradeDefense() {
    if (selectedDefense && coins >= selectedDefense.upgradeCost && selectedDefense.level < maxTowerLevel) {
        selectedDefense.level++;
        selectedDefense.damage += 1;
        selectedDefense.range += 10;
        selectedDefense.rate -= 100;
        coins -= selectedDefense.upgradeCost;
        selectedDefense.upgradeCost += 10;
        document.getElementById('coins').innerText = coins;
        closeTowerModal();
    }
}

function removeDefense() {
    if (selectedDefense) {
        const index = defenses.indexOf(selectedDefense);
        if (index > -1) {
            defenses.splice(index, 1);
            const block = blocks.find(block => block.x === selectedDefense.x - blockSize / 2 && block.y === selectedDefense.y - blockSize / 2);
            block.occupied = false;
            selectedDefense = null;
            closeTowerModal();
        }
    }
}

function spawnEnemy() {
    enemies.push({ x: path[0].x, y: path[0].y, pathIndex: 0, speed: enemySpeed, health: 3 + wave });
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    blocks.forEach(block => {
        ctx.fillStyle = block.isPath ? '#f5deb3' : '#32cd32';
        ctx.fillRect(block.x, block.y, blockSize, blockSize);
        ctx.strokeStyle = block.occupied ? 'gray' : 'lightgray';
        ctx.strokeRect(block.x, block.y, blockSize, blockSize);
    });

    enemies.forEach((enemy, index) => {
        const target = path[enemy.pathIndex + 1];
        if (target) {
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < enemy.speed) {
                enemy.x = target.x;
                enemy.y = target.y;
                enemy.pathIndex++;
            } else {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        } else {
            enemies.splice(index, 1);
            lives--;
            document.getElementById('lives').innerText = lives;
            if (lives <= 0) {
                alert('Game Over');
                window.location.reload();
            }
        }
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x, enemy.y, 20, 20);
    });

    defenses.forEach(defense => {
        ctx.fillStyle = defense.type === 'fast' ? 'orange' : defense.type === 'strong' ? 'purple' : 'blue';
        ctx.fillRect(defense.x - 10, defense.y - 10, 20, 20);
        ctx.fillStyle = 'white';
        ctx.fillText(`L${defense.level}`, defense.x - 8, defense.y + 4);

        const now = Date.now();
        if (now - defense.lastShot > defense.rate) {
            enemies.forEach(enemy => {
                const dx = enemy.x - defense.x;
                const dy = enemy.y - defense.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < defense.range) {
                    bullets.push({ x: defense.x, y: defense.y, target: enemy, speed: 5, damage: defense.damage });
                    defense.lastShot = now;
                }
            });
        }
    });

    bullets.forEach((bullet, index) => {
        const dx = bullet.target.x - bullet.x;
        const dy = bullet.target.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bullet.speed) {
            bullet.target.health -= bullet.damage;
            if (bullet.target.health <= 0) {
                enemies = enemies.filter(e => e !== bullet.target);
                coins += 10;
                document.getElementById('coins').innerText = coins;
            }
            bullets.splice(index, 1);
        } else {
            bullet.x += (dx / distance) * bullet.speed;
            bullet.y += (dy / distance) * bullet.speed;
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    requestAnimationFrame(update);
}

function startWave() {
    wave++;
    enemySpeed += 0.05;
    document.getElementById('wave').innerText = wave;
    for (let i = 0; i < wave * 5; i++) {
        setTimeout(spawnEnemy, i * 500);
    }
}

setInterval(startWave, 10000);
update();