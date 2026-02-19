import * as THREE from 'three';

// ─── Game State ───
let gameState = {
  board: Array(9).fill(null),
  players: [
    { name: 'Player 1', symbol: 'X' },
    { name: 'Player 2', symbol: 'O' },
  ],
  currentPlayerIndex: 0,
  active: false,
  winner: null,
};

const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

// ─── Leaderboard ───
function getScores() {
  try { return JSON.parse(localStorage.getItem('xoxo-scores') || '[]'); }
  catch { return []; }
}
function saveScore(name, wins, draws) {
  const scores = getScores();
  const existing = scores.find(s => s.name === name);
  if (existing) {
    existing.wins += wins;
    existing.draws += draws;
    existing.games += 1;
  } else {
    scores.push({ name, wins, draws, games: 1 });
  }
  scores.sort((a, b) => b.wins - a.wins || b.draws - a.draws);
  localStorage.setItem('xoxo-scores', JSON.stringify(scores));
}

// ─── Three.js Setup ───
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Fixed camera: slightly tilted top-down for 3D feel, but stable for clicking
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 8.5, 4.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// NO OrbitControls — fixed camera for reliable clicking

// Lights
scene.add(new THREE.AmbientLight(0x606080, 0.8));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.position.set(3, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 20;
scene.add(dirLight);

(() => {
  const l1 = new THREE.PointLight(0xff6b6b, 0.4, 20);
  l1.position.set(-4, 6, -4);
  scene.add(l1);
  const l2 = new THREE.PointLight(0x4ecdc4, 0.4, 20);
  l2.position.set(4, 6, 4);
  scene.add(l2);
})();

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.35;
ground.receiveShadow = true;
scene.add(ground);

// ─── Board ───
const boardGroup = new THREE.Group();
scene.add(boardGroup);

// Simple grid: 3x3 cells, each cellSize wide, with a gap between them.
// Cell centers are at: -step, 0, +step  (for both X and Z)
const cellSize = 1.8;
const gap = 0.14;
const step = cellSize + gap; // distance between cell centers

// Cell center positions along one axis: [-step, 0, +step]
const cellCenters = [-step, 0, step];

// Total board extent
const boardExtent = step * 2 + cellSize; // from left edge of cell 0 to right edge of cell 2

// Board base
const baseMesh = new THREE.Mesh(
  new THREE.BoxGeometry(boardExtent + 0.4, 0.18, boardExtent + 0.4),
  new THREE.MeshStandardMaterial({ color: 0x16162a, roughness: 0.4, metalness: 0.3 })
);
baseMesh.position.y = -0.26;
baseMesh.receiveShadow = true;
boardGroup.add(baseMesh);

// Grid lines — placed exactly halfway between adjacent cell centers
// That's at x/z = -step/2 and +step/2
const lineMat = new THREE.MeshStandardMaterial({
  color: 0x555588, roughness: 0.4, metalness: 0.5,
  emissive: 0x222244, emissiveIntensity: 0.3
});
const linePositions = [-step / 2, step / 2];

for (const x of linePositions) {
  const vLine = new THREE.Mesh(new THREE.BoxGeometry(gap, 0.2, boardExtent), lineMat);
  vLine.position.set(x, -0.06, 0);
  vLine.castShadow = true;
  boardGroup.add(vLine);
}
for (const z of linePositions) {
  const hLine = new THREE.Mesh(new THREE.BoxGeometry(boardExtent, 0.2, gap), lineMat);
  hLine.position.set(0, -0.06, z);
  hLine.castShadow = true;
  boardGroup.add(hLine);
}

// Cell tiles (for hover highlight and click detection)
const cellMeshes = [];

for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(cellSize, 0.06, cellSize),
      new THREE.MeshStandardMaterial({
        color: 0x1e1e38, roughness: 0.6, metalness: 0.2,
        transparent: true, opacity: 0.0
      })
    );
    mesh.position.set(cellCenters[col], -0.14, cellCenters[row]);
    mesh.receiveShadow = true;
    mesh.userData.cellIndex = row * 3 + col;
    boardGroup.add(mesh);
    cellMeshes.push(mesh);
  }
}

// ─── Piece Creation ───
const piecesGroup = new THREE.Group();
scene.add(piecesGroup);

const xMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.25, metalness: 0.6, emissive: 0xff6b6b, emissiveIntensity: 0.1 });
const oMat = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, roughness: 0.25, metalness: 0.6, emissive: 0x4ecdc4, emissiveIntensity: 0.1 });

function getCellPosition(index) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return new THREE.Vector3(cellCenters[col], 0.15, cellCenters[row]);
}

function createX(position) {
  const group = new THREE.Group();
  const barGeo = new THREE.BoxGeometry(0.14, 0.3, 1.2);

  const bar1 = new THREE.Mesh(barGeo, xMat);
  bar1.rotation.y = Math.PI / 4;
  bar1.castShadow = true;
  group.add(bar1);

  const bar2 = new THREE.Mesh(barGeo, xMat);
  bar2.rotation.y = -Math.PI / 4;
  bar2.castShadow = true;
  group.add(bar2);

  group.position.copy(position);
  group.scale.set(0, 0, 0);
  piecesGroup.add(group);
  animateIn(group);
  return group;
}

function createO(position) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.1, 20, 40),
    oMat
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(position);
  mesh.position.y = 0.15;
  mesh.castShadow = true;
  mesh.scale.set(0, 0, 0);
  piecesGroup.add(mesh);
  animateIn(mesh);
  return mesh;
}

// ─── Animations ───
const animations = [];

function animateIn(obj) {
  animations.push({
    obj, prop: 'scale',
    from: 0, to: 1,
    duration: 0.35,
    elapsed: 0,
    easing: easeOutBack,
  });
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Win line
let winLineMesh = null;

function drawWinLine(combo) {
  const p1 = getCellPosition(combo[0]);
  const p2 = getCellPosition(combo[2]);
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mid.y = 0.35;
  const length = p1.distanceTo(p2) + 0.6;
  const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 0.6, roughness: 0.2
  });
  winLineMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, length), mat);
  winLineMesh.position.copy(mid);
  winLineMesh.rotation.y = angle;
  winLineMesh.scale.set(1, 1, 0);
  winLineMesh.castShadow = true;
  scene.add(winLineMesh);

  animations.push({
    obj: winLineMesh, prop: 'scaleZ',
    from: 0, to: 1,
    duration: 0.45,
    elapsed: 0,
    easing: easeOutCubic,
  });
}

// ─── Game Logic ───
function checkWinner() {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
      return { symbol: gameState.board[a], combo };
    }
  }
  return null;
}

function isDraw() {
  return gameState.board.every(cell => cell !== null);
}

function updateTurnIndicator() {
  const el = document.getElementById('turn-indicator');
  if (!gameState.active) { el.innerHTML = ''; return; }
  const p = gameState.players[gameState.currentPlayerIndex];
  const color = p.symbol === 'X' ? '#ff6b6b' : '#4ecdc4';
  el.innerHTML = `<span style="color:${color}">${escapeHtml(p.name)}</span>'s turn (${p.symbol})`;
}

function handleCellClick(index) {
  if (!gameState.active || gameState.board[index] !== null) return;

  const player = gameState.players[gameState.currentPlayerIndex];
  gameState.board[index] = player.symbol;

  const pos = getCellPosition(index);
  if (player.symbol === 'X') createX(pos);
  else createO(pos);

  const result = checkWinner();
  if (result) {
    gameState.active = false;
    gameState.winner = player;
    drawWinLine(result.combo);
    setTimeout(() => showWinner(player.name + ' wins!', player.name + ' got three in a row.'), 1000);
    const loser = gameState.players[1 - gameState.currentPlayerIndex];
    saveScore(player.name, 1, 0);
    saveScore(loser.name, 0, 0);
    return;
  }

  if (isDraw()) {
    gameState.active = false;
    setTimeout(() => showWinner("It's a draw!", 'No one wins this round.'), 500);
    saveScore(gameState.players[0].name, 0, 1);
    saveScore(gameState.players[1].name, 0, 1);
    return;
  }

  gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;
  updateTurnIndicator();
}

function resetBoard() {
  gameState.board = Array(9).fill(null);
  gameState.currentPlayerIndex = 0;
  gameState.active = false;
  gameState.winner = null;

  while (piecesGroup.children.length) {
    const child = piecesGroup.children[0];
    piecesGroup.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.children) child.children.forEach(c => { if (c.geometry) c.geometry.dispose(); });
  }

  if (winLineMesh) {
    scene.remove(winLineMesh);
    winLineMesh.geometry.dispose();
    winLineMesh.material.dispose();
    winLineMesh = null;
  }

  // Reset cell materials
  cellMeshes.forEach(m => {
    m.material.opacity = 0.0;
    m.material.color.setHex(0x1e1e38);
  });

  animations.length = 0;
  updateTurnIndicator();
  document.getElementById('btn-reset').disabled = true;
}

// ─── Raycasting ───
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredCell = -1;

function getCanvasMousePos(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  getCanvasMousePos(event);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(cellMeshes);
  if (hits.length > 0) {
    handleCellClick(hits[0].object.userData.cellIndex);
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  getCanvasMousePos(event);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(cellMeshes);

  // Reset previous hover
  if (hoveredCell >= 0) {
    const prev = cellMeshes[hoveredCell];
    if (gameState.board[hoveredCell] === null) {
      prev.material.opacity = 0.0;
    }
  }

  if (hits.length > 0 && gameState.active) {
    const idx = hits[0].object.userData.cellIndex;
    if (gameState.board[idx] === null) {
      hoveredCell = idx;
      const mesh = cellMeshes[idx];
      const p = gameState.players[gameState.currentPlayerIndex];
      mesh.material.color.setHex(p.symbol === 'X' ? 0x3a2020 : 0x203a35);
      mesh.material.opacity = 0.7;
      renderer.domElement.style.cursor = 'pointer';
    } else {
      hoveredCell = -1;
      renderer.domElement.style.cursor = 'default';
    }
  } else {
    hoveredCell = -1;
    renderer.domElement.style.cursor = 'default';
  }
});

renderer.domElement.addEventListener('pointerleave', () => {
  if (hoveredCell >= 0) {
    cellMeshes[hoveredCell].material.opacity = 0.0;
    hoveredCell = -1;
  }
  renderer.domElement.style.cursor = 'default';
});

// ─── UI Handlers ───
const startModal = document.getElementById('start-modal');
const coinOverlay = document.getElementById('coin-overlay');
const winnerOverlay = document.getElementById('winner-overlay');
const leaderboardModal = document.getElementById('leaderboard-modal');

let selectedSymbol = 'X';
document.querySelectorAll('.symbol-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.symbol-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedSymbol = btn.dataset.symbol;
  });
});

document.getElementById('btn-start').addEventListener('click', () => {
  startModal.classList.add('active');
  document.getElementById('player1-name').focus();
});

document.getElementById('cancel-start').addEventListener('click', () => {
  startModal.classList.remove('active');
});

document.getElementById('confirm-start').addEventListener('click', () => {
  const p1Name = document.getElementById('player1-name').value.trim() || 'Player 1';
  const p2Name = document.getElementById('player2-name').value.trim() || 'Player 2';
  const p1Symbol = selectedSymbol;
  const p2Symbol = p1Symbol === 'X' ? 'O' : 'X';

  gameState.players[0] = { name: p1Name, symbol: p1Symbol };
  gameState.players[1] = { name: p2Name, symbol: p2Symbol };

  startModal.classList.remove('active');
  resetBoard();
  startCoinFlip();
});

function startCoinFlip() {
  const coin = document.getElementById('coin');
  const result = document.getElementById('coin-result');
  coinOverlay.classList.add('active');
  result.classList.remove('visible');
  result.textContent = '';

  coin.querySelector('.front').textContent = gameState.players[0].symbol;
  coin.querySelector('.back').textContent = gameState.players[1].symbol;

  const winnerIdx = Math.random() < 0.5 ? 0 : 1;
  const finalRotation = winnerIdx === 0 ? 1800 : 1980;
  coin.style.setProperty('--final-rotation', finalRotation + 'deg');

  coin.classList.remove('flipping');
  void coin.offsetWidth;
  coin.classList.add('flipping');

  setTimeout(() => {
    gameState.currentPlayerIndex = winnerIdx;
    gameState.active = true;
    result.textContent = `${gameState.players[winnerIdx].name} goes first!`;
    result.classList.add('visible');
    document.getElementById('btn-reset').disabled = false;
    updateTurnIndicator();

    setTimeout(() => {
      coinOverlay.classList.remove('active');
      coin.classList.remove('flipping');
    }, 1400);
  }, 1900);
}

document.getElementById('btn-reset').addEventListener('click', () => {
  resetBoard();
  startCoinFlip();
});

function showWinner(title, sub) {
  document.getElementById('winner-text').textContent = title;
  document.getElementById('winner-sub').textContent = sub;
  winnerOverlay.classList.add('active');
  updateTurnIndicator();
}

document.getElementById('btn-play-again').addEventListener('click', () => {
  winnerOverlay.classList.remove('active');
  resetBoard();
  startCoinFlip();
});

document.getElementById('btn-close-winner').addEventListener('click', () => {
  winnerOverlay.classList.remove('active');
  resetBoard();
});

// Leaderboard
document.getElementById('btn-leaderboard').addEventListener('click', () => {
  renderLeaderboard();
  leaderboardModal.classList.add('active');
});

document.getElementById('btn-close-lb').addEventListener('click', () => {
  leaderboardModal.classList.remove('active');
});

document.getElementById('btn-clear-scores').addEventListener('click', () => {
  localStorage.removeItem('xoxo-scores');
  renderLeaderboard();
});

function renderLeaderboard() {
  const scores = getScores();
  const el = document.getElementById('leaderboard-content');
  if (scores.length === 0) {
    el.innerHTML = '<div class="no-scores">No games played yet.</div>';
    return;
  }
  let html = `<table class="leaderboard-table">
    <thead><tr><th>#</th><th>Player</th><th>Wins</th><th>Draws</th><th>Games</th></tr></thead><tbody>`;
  scores.forEach((s, i) => {
    html += `<tr><td>${i + 1}</td><td>${escapeHtml(s.name)}</td><td>${s.wins}</td><td>${s.draws}</td><td>${s.games}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Particles ───
const particleCount = 150;
const particleGeo = new THREE.BufferGeometry();
const pPositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  pPositions[i * 3] = (Math.random() - 0.5) * 24;
  pPositions[i * 3 + 1] = Math.random() * 12;
  pPositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
scene.add(new THREE.Points(particleGeo, new THREE.PointsMaterial({
  color: 0x444466, size: 0.05, transparent: true, opacity: 0.5
})));

// ─── Render Loop ───
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  // Animations
  for (let i = animations.length - 1; i >= 0; i--) {
    const anim = animations[i];
    anim.elapsed += delta;
    const t = Math.min(anim.elapsed / anim.duration, 1);
    const val = anim.from + (anim.to - anim.from) * anim.easing(t);

    if (anim.prop === 'scale') {
      anim.obj.scale.set(val, val, val);
    } else if (anim.prop === 'scaleZ') {
      anim.obj.scale.z = val;
    }

    if (t >= 1) animations.splice(i, 1);
  }

  // Particle drift
  const posArr = particleGeo.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    posArr[i * 3 + 1] += delta * 0.06;
    if (posArr[i * 3 + 1] > 12) posArr[i * 3 + 1] = 0;
  }
  particleGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// ─── Resize ───
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
