const canvas = document.getElementById("hexagonCanvas");
const ctx = canvas.getContext("2d");
const root = document.documentElement;

// Board layout
const ARROWS = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']);
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 80;
const tileWidth = 4;           
const tileHeight = 4;         

// Game state
let grid = [];            
let tiles = [];         
let keysPressed = {};    
let score = 0;
let animating = false;
let inputConsumed = false;
let darkMode = false;
let paused = false;
let helpMode = false;
let gameover = false;
let comboTimer = null;
let fontColor = 'black';
let fillColor = 'white';
const COMBO_WINDOW = 60;  
const ANIM_SPEED = 0.5;      

// A color pallete consiting of the colors out game tiles will be
const colors = [
  'hsl(0  ,100%,69%)','hsl(0  ,100%,69%)','hsl( 30,100%,69%)',
  'hsl(60 ,100%,69%)','hsl(100,100%,69%)','hsl(150, 50%,49%)',
  'hsl(190,100%,69%)','hsl(230,100%,69%)','hsl(260, 98%,74%)',
  'hsl(290,100%,69%)','hsl(320, 98%,75%)','hsl( 46, 21%,43%)',
  'hsl(0  ,100%,85%)','hsl(0  , 54%,55%)','hsl( 30, 94%,80%)',
  'hsl(60 ,100%,80%)','hsl(100,100%,81%)','hsl(150,100%,81%)',
  'hsl(190,100%,83%)','hsl(230,100%,84%)','hsl(260,100%,86%)',
  'hsl(290,100%,83%)','hsl(320,100%,84%)','hsl( 47, 33%,73%)'
];

/**
 * clamp(v, a, b)
 * --------------------------------------------------------------
 * Restricts a number `v` between a minimum `a` and maximum `b`.
 * Useful to keep indexes within valid ranges.
 * Returns the clamped number.
 */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }


/**
 * gridToPixel(row, col)
 * --------------------------------------------------------------
 * Converts a grid coordinate (row, col) into pixel coordinates.
 * Uses odd-r offset hex layout (odd rows shifted).
 * Returns {x, y} pixel position for drawing.
 */
function gridToPixel(row, col) {
    // Check if this is we are on an offset row
    const offset = (row % 2 === 1);
    // Calculate the horizontal pixel location
    const px = centerX + ((col - (tileWidth - 1) / 2) * (radius * 1.9)) + (offset ? radius * 0.95 : 0);
    // Calculate the vertical pixel location
    const py = centerY + ((row - (tileHeight - 1) / 2) * (radius * 1.7));
    return { x: px, y: py };
}


/**
 * makeTile(value, row, col)
 * --------------------------------------------------------------
 * Creates a new tile object at a given grid cell.
 * Initializes position, value, and animation state.
 * Adds it to both the grid and the tile list.
 */
function makeTile(value, row, col) {
    // Calculate the pixel coridnates of our tile
    const p = gridToPixel(row, col);
    // Create a new tile object with these coordinates
    const tile = {
        value, row, col,
        x: p.x, y: p.y,
        targetRow: row, targetCol: col,
        moving: false, willRemove: false
    };
    // Add this new tile to the grid
    grid[row][col] = tile;
    tiles.push(tile);
    return tile;
}


/**
 * clearGrid()
 * --------------------------------------------------------------
 * Resets the game grid to all null cells.
 * Used during initialization and restart.
 */
function clearGrid() {
    // Clear the grid
    grid = Array.from({ length: tileHeight }, () => Array(tileWidth).fill(null));
}


/**
 * getTileAt(r, c)
 * --------------------------------------------------------------
 * Safely retrieves the tile at grid cell (r, c).
 * Returns null if out of bounds or empty.
 */
function getTileAt(r, c) {
    if (r < 0 || r >= tileHeight || c < 0 || c >= tileWidth) return null;
    return grid[r][c];
}


/**
 * drawHexagon(x, y, r, value, strokeOnly)
 * --------------------------------------------------------------
 * Draws a single hex tile at (x, y) with radius r.
 * If strokeOnly is true, draws an empty hex cell.
 * Otherwise fills with color and draws tile value.
 */
function drawHexagon(x, y, r, value, strokeOnly = false) {
    // Adjustment for centering
    x = x-40; 

    // Draw the hexagon border
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Check is we are onlt drawing the border of the hexagon
    if (strokeOnly) {
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = fontColor;
        ctx.stroke();
        return;
    }

    // Determine the color of this hexagon
    const colorIndex = Math.round(Math.log2(value || 1));
    ctx.fillStyle = colors[clamp(colorIndex, 0, colors.length - 1)];
    ctx.fill();

    // Border the hexagon
    ctx.lineWidth = 2;
    ctx.strokeStyle = fontColor;
    ctx.stroke();

    // If this is not an empty hexagon, draw the value of its associated tile
    if (value > 0) {
        ctx.fillStyle = 'black';
        ctx.font = `${Math.round(radius * 0.5)}px Courier New, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, x, y);
    }
}


/**
 * draw()
 * --------------------------------------------------------------
 * Master rendering function for the entire game.
 * Handles game states: game over, help screen, or active play.
 * Draws background cells, tiles, title, and score.
 */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the game over popup
    if (gameover) {
        const boxWidth = 300, boxHeight = 200;
        const x = canvas.width / 2 - boxWidth / 2;
        const y = canvas.height / 2 - boxHeight / 2;
        ctx.fillStyle = "#fff"; ctx.fillRect(x, y, boxWidth, boxHeight);
        ctx.strokeStyle = "#333"; ctx.lineWidth = 4; ctx.strokeRect(x, y, boxWidth, boxHeight);
        ctx.fillStyle = "#000"; ctx.font = "bold 30px Courier New, monospace"; ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, y + 50);
        ctx.font = "20px Courier New, monospace"; ctx.fillText("Score: " + score, canvas.width / 2, y + 100);
        ctx.font = "16px Courier New, monospace";
        ctx.fillText("Use the restart button", canvas.width / 2, y + 140);
        ctx.fillText("below to restart", canvas.width / 2, y + 160);
        ctx.fillStyle = fontColor;
        ctx.font = `${Math.round(radius * 0.75)}px Courier New, monospace`;
        ctx.fillText("Hexabine", canvas.width/2, 50);
        return;
    }

    // Draw the instructions popup
    if(helpMode){
        let headroom = 50;
        ctx.strokeStyle = fontColor;
        ctx.beginPath();
        ctx.rect((canvas.width/2) - 350, headroom, 700, 700);
        ctx.stroke();
        ctx.font="50px bold Courier New, monospace";
        ctx.fillText("Hexabine", canvas.width/2, 100 + headroom);
        ctx.fillStyle=fontColor;
        ctx.font="normal 36px Courier New, monospace";
        ctx.textAlign="center";
        ctx.fillText("How to Play",canvas.width/2,180 + headroom);
        ctx.font="30px Courier New, monospace";
        ctx.fillText("Combine tiles by moving them",canvas.width/2,250 + headroom);
        ctx.fillText("Use Arrow Keys for movement:",canvas.width/2,290 + headroom);
        ctx.fillText("↖ UL   ↑ UR   ↙ DL   ↓ DR",canvas.width/2,350 + headroom);
        ctx.fillText("← L        → R",canvas.width/2,390 + headroom);
        ctx.fillText("Merge tiles of the same value",canvas.width/2,450 + headroom);
        ctx.fillText("Reach the highest number you can!",canvas.width/2,490 + headroom);
        ctx.font="24px Courier New, monospace";
        ctx.fillText("Click Help again to resume",canvas.width/2,560 + headroom);
        ctx.fillText("or Restart to start a new game",canvas.width/2,590 + headroom);
        return;
    }

    // Draw the empty tiles
    for (let r = 0; r < tileHeight; r++) {
        for (let c = 0; c < tileWidth; c++) {
            const p = gridToPixel(r, c);
            drawHexagon(p.x, p.y, radius, 0, true);
        }
    }

    // Sort the tiles to aid animation
    const sortedTiles = [...tiles].sort((a, b) => {
        if (a.merging && !b.merging) return 1; 
        if (!a.merging && b.merging) return -1;
        return a.value - b.value;      
    });

    // Draw each of the hexagons
    for (const t of sortedTiles) {
        drawHexagon(t.x, t.y, radius, t.value);
    }

    // Draw the game title and current score
    ctx.fillStyle = fontColor;
    ctx.font = `${Math.round(radius * 0.75)}px Courier New, monospace`;
    ctx.fillText("Hexabine", canvas.width/2, 50);
    ctx.font = `${Math.round(radius * 0.5)}px Courier New, monospace`;
    ctx.fillText("Score: " + score, canvas.width/2, 750);
}


/**
 * spawnPiece()
 * --------------------------------------------------------------
 * Randomly selects an empty grid cell and spawns a new tile (2 or 4).
 * 65% chance for value 2, 35% chance for value 4.
 * Returns true if a tile was successfully placed, false if grid is full.
 */
function spawnPiece() {
    // Create an array to store all empty grid cells (where a new tile can be placed)
    const empties = [];

    // Scan the entire grid row by row, column by column
    for (let r = 0; r < tileHeight; r++) {
        for (let c = 0; c < tileWidth; c++) {
            // If this cell is empty (no tile object), mark it as available
            if (!grid[r][c]) empties.push([r, c]);
        }
    }

    // If no empty cells are found, the board is full → cannot spawn
    if (empties.length === 0) return false;

    // Pick a random index from the list of available cells
    const idx = Math.floor(Math.random() * empties.length);

    // Extract row and column coordinates of that random empty cell
    const [r, c] = empties[idx];

    // Randomly decide the value of the new tile (65% chance for 2, 35% chance for 4)
    const value = Math.random() < 0.65 ? 2 : 4;

    // Place a new tile object at the chosen position
    makeTile(value, r, c);

    // Return true to indicate that a tile was successfully spawned
    return true;
}


/**
 * animate()
 * --------------------------------------------------------------
 * Handles smooth movement of tiles toward their target positions.
 * Iterates through all tiles, adjusting positions until settled.
 * Removes merged tiles and triggers new piece spawns.
 * Uses requestAnimationFrame for smooth animation.
 */
function animate() {
    // Set flag to track when a piece is still being animated
    let anyMoving = false;

    // Iterate through each of the tiles
    for (let i = tiles.length - 1; i >= 0; i--) {
        // Determine the pixel coordinates
        const t = tiles[i];
        const targetP = gridToPixel(t.targetRow, t.targetCol);
        const dx = targetP.x - t.x;
        const dy = targetP.y - t.y;

        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            // Move the piece forward one animation set
            t.x += dx * ANIM_SPEED;
            t.y += dy * ANIM_SPEED;
            t.moving = true;
            anyMoving = true;

        } else {
            // Snap the piece into position
            t.x = targetP.x;
            t.y = targetP.y;
            t.moving = false;

            // Remove merged tile
            if (t.willRemove) {
                tiles.splice(i, 1);
            } else {
                grid[t.targetRow][t.targetCol] = t;
                t.row = t.targetRow;
                t.col = t.targetCol;
            }
        }
    }

    // Redraw the canvas
    draw();
    if (anyMoving) {
        requestAnimationFrame(animate);
    } else {
        animating = false;
        inputConsumed = false;
        spawnPiece();
        if (noMovesAvailable()) { gameOver(); }
        draw();
    }
}


/**
 * neighborForDir(row, col, dir)
 * --------------------------------------------------------------
 * Given a cell and direction, returns the neighbor coordinates.
 * Supports 6 directions: L, R, UL, UR, DL, DR.
 * Uses odd-r offset logic for hex grid.
 */
function neighborForDir(row, col, dir) {
    const even = (row % 2 === 0);
    if (dir === 'L') return { r: row, c: col - 1 };
    if (dir === 'R') return { r: row, c: col + 1 };
    if (dir === 'UL') return { r: row - 1, c: even ? col - 1 : col };
    if (dir === 'UR') return { r: row - 1, c: even ? col : col + 1 };
    if (dir === 'DL') return { r: row + 1, c: even ? col - 1 : col };
    if (dir === 'DR') return { r: row + 1, c: even ? col : col + 1 };
    return { r: row, c: col };
}


/**
 * shiftLeft()
 * --------------------------------------------------------------
 * Attempts to slide all tiles left, merging equal values.
 * Updates tile targets and marks merged tiles for removal.
 * Returns true if movement/merge happened, false otherwise.
 */
function shiftLeft() {
    // Ignore input if animation is ongoing
    if (animating) return false; 
    let moved = false;

    // Track which cells have already merged this turn
    const merged = Array.from({ length: tileHeight }, () => Array(tileWidth).fill(false));

    for (let r = 0; r < tileHeight; r++) {
        for (let c = 1; c < tileWidth; c++) {
            let tile = grid[r][c];
            if (!tile) continue;
            let currR = r, currC = c;

            while (true) {
                // Calculate the eft neighbor
                const nr = currR, nc = currC - 1;

                // Check out of bounds 
                if (nc < 0) break; 

                const neighbor = grid[nr][nc];
                if (!neighbor) {
                    // Slide tile into empty cell
                    grid[nr][nc] = tile;
                    grid[currR][currC] = null;
                    tile.targetRow = nr;
                    tile.targetCol = nc;
                    tile.row = nr; tile.col = nc;
                    tile.moving = true;

                    // Continue sliding further left
                    currC = nc; 
                    moved = true;
                    continue;
                }

                // If neighbor has same value and hasn’t merged yet → merge
                if (neighbor.value === tile.value && !merged[nr][nc]) {
                    // Double neighbor
                    neighbor.value *= 2;
                    score += neighbor.value;

                    // Mark merge used
                    merged[nr][nc] = true; 

                    // Remove current tile
                    grid[currR][currC] = null;
                    tile.targetRow = nr;
                    tile.targetCol = nc;

                    // Mark for deletion after animation
                    tile.willRemove = true;
                    tile.moving = true;
                    moved = true;
                }
                // stop once a collision happens
                break; 
            }
        }
    }

    // If at least one tile moved, start animation
    if (moved) {
        animating = true;
        inputConsumed = true;
        requestAnimationFrame(animate);
    }
    return moved;
}


/**
 * shiftRight()
 * --------------------------------------------------------------
 * Same as shiftLeft but moves tiles to the right.
 * Resolves merges and updates grid references.
 */
function shiftRight() {
    // Ignore input if animation is ongoing
    if (animating) return false; 
    let moved = false;

    // Track which cells have already merged this turn
    const merged = Array.from({ length: tileHeight }, () => Array(tileWidth).fill(false));

    for (let r = 0; r < tileHeight; r++) {
        for (let c = tileWidth - 2; c >= 0; c--) {
            let tile = grid[r][c];
            if (!tile) continue;
            let currR = r, currC = c;

            while (true) {
                // Calculate the right neighbor
                const nr = currR, nc = currC + 1;

                // Check out of bounds
                if (nc >= tileWidth) break; 

                const neighbor = grid[nr][nc];
                if (!neighbor) {
                    // Slide tile into empty cell
                    grid[nr][nc] = tile;
                    grid[currR][currC] = null;
                    tile.targetRow = nr;
                    tile.targetCol = nc;
                    tile.row = nr; tile.col = nc;
                    tile.moving = true;

                    // Continue sliding further right
                    currC = nc; 
                    moved = true;
                    continue;
                }

                // If neighbor has same value and hasn’t merged yet → merge
                if (neighbor.value === tile.value && !merged[nr][nc]) {
                    // Double neighbor
                    neighbor.value *= 2;
                    score += neighbor.value;

                    // Mark merge used
                    merged[nr][nc] = true; 

                    // Remove current tile
                    grid[currR][currC] = null;
                    tile.targetRow = nr;
                    tile.targetCol = nc;

                    // Mark for deletion after animation
                    tile.willRemove = true;
                    tile.moving = true;
                    moved = true;
                }
                // stop once a collision happens
                break; 
            }
        }
    }

    // If at least one tile moved, start animation
    if (moved) {
        animating = true;
        inputConsumed = true;
        requestAnimationFrame(animate);
    }
    return moved;
}


/**
 * shiftDirectional(dir)
 * --------------------------------------------------------------
 * Generalized version of shifting for diagonal moves.
 * dir ∈ {UL, UR, DL, DR}.
 * Uses neighborForDir() to determine movement path.
 */
function shiftUpLeft() { return shiftDirectional('UL'); }
function shiftUpRight() { return shiftDirectional('UR'); }
function shiftDownLeft() { return shiftDirectional('DL'); }
function shiftDownRight() { return shiftDirectional('DR'); }
function shiftDirectional(dir) {
    // Ignore input if animation is ongoing
    if (animating) return false;
    let moved = false;

    // Track which cells have already merged this turn
    const merged = Array.from({ length: tileHeight }, () => Array(tileWidth).fill(false));

    // Choose iteration order depending on direction
    const startRow = (dir === 'DL' || dir === 'DR') ? tileHeight - 2 : 1;
    const endRow   = (dir === 'DL' || dir === 'DR') ? -1 : tileHeight;
    const stepRow  = (dir === 'DL' || dir === 'DR') ? -1 : 1;

    for (let r = startRow; r !== endRow; r += stepRow) {
        for (let c = 0; c < tileWidth; c++) {
            let tile = grid[r][c];
            if (!tile) continue;
            let currR = r, currC = c;

            while (true) {
                // Find the neighboring cell in the given direction
                const n = neighborForDir(currR, currC, dir);
                const nr = n.r, nc = n.c;

                // Stop if out of bounds
                if (nr < 0 || nr >= tileHeight || nc < 0 || nc >= tileWidth) break;

                const neighbor = grid[nr][nc];
                if (!neighbor) {
                    // Slide tile into empty neighbor
                    grid[nr][nc] = tile;
                    grid[currR][currC] = null;
                    tile.targetRow = nr; tile.targetCol = nc;
                    tile.row = nr; tile.col = nc;
                    tile.moving = true;

                    // Continue sliding further in this direction
                    currR = nr; currC = nc;
                    moved = true;
                    continue;
                }

                // If neighbor has same value and hasn’t merged yet → merge
                if (neighbor.value === tile.value && !merged[nr][nc]) {
                    // Double neighbor
                    neighbor.value *= 2;
                    score += neighbor.value;

                    // Mark merge used
                    merged[nr][nc] = true;

                    // Remove current tile
                    grid[currR][currC] = null;
                    tile.targetRow = nr; tile.targetCol = nc;

                    // Mark for deletion after animation
                    tile.willRemove = true;
                    tile.moving = true;
                    moved = true;
                }
                // stop once a collision happens
                break;
            }
        }
    }

    // If at least one tile moved, start animation
    if (moved) {
        animating = true;
        inputConsumed = true;
        requestAnimationFrame(animate);
    }
    return moved;
}


/**
 * noMovesAvailable()
 * --------------------------------------------------------------
 * Checks if the game is over:
 * No empty cells left.
 * No adjacent merges available.
 * Returns true if stuck, false otherwise.
 */
function noMovesAvailable() {
    // Check if there are any empty cells
    for (let r = 0; r < tileHeight; r++) {
        for (let c = 0; c < tileWidth; c++) {
            if (!grid[r][c]) return false;
        }
    }

    // Check if any tiles are able to merge into another
    const dirs = ['L', 'R', 'UL', 'UR', 'DL', 'DR'];
    for (let r = 0; r < tileHeight; r++) {
        for (let c = 0; c < tileWidth; c++) {
            const tile = grid[r][c];
            if (!tile) continue;
            for (const d of dirs) {
                const n = neighborForDir(r, c, d);
                const neighbor = getTileAt(n.r, n.c);
                if (neighbor && neighbor.value === tile.value) return false;
            }
        }
    }
    return true;
}

/**
 * gameOver()
 * --------------------------------------------------------------
 * Sets the gameover flag and redraws.
 * Called when no moves are left.
 */
function gameOver() {
    gameover = true;
    draw();
}

/**
 * help()
 * --------------------------------------------------------------
 * Toggles the help screen overlay.
 * Re-renders immediately with updated mode.
 */
function help() {
    helpMode = !helpMode;
    draw();
}

/**
 * toggleDark()
 * --------------------------------------------------------------
 * Switches between light and dark mode.
 * Updates background, font, and button styles.
 */
function toggleDark() {
    // Setup refences to page elements
    let body = document.getElementById('body');
    let buttons = [document.getElementById('restart'), document.getElementById('help'), document.getElementById('toggle')];

    // Check if we are switching to light mode
    if (!darkMode) {
        // Change the font color and background colors
        fillColor = 'black'; fontColor = 'white';
        body.style.setProperty('background-color', 'black');
        root.style.setProperty("--overlay-color", 'rgb(255, 255, 255, 0.3)');
        buttons.forEach(b => b.style.setProperty('border', '2px solid white'));
        buttons.forEach(b => b.style.setProperty('color', 'white'));
        buttons[2].innerHTML = 'Light Mode';

    // Otherwise we are switching to dark mode
    } else {
        // Change the font color and background colors
        fillColor = 'white'; fontColor = 'black';
        body.style.setProperty('background-color', 'white');
        root.style.setProperty("--overlay-color", 'rgb(0, 0, 0, 0.2)');
        buttons.forEach(b => b.style.setProperty('border', '2px solid black'));
        buttons.forEach(b => b.style.setProperty('color', 'black'));
        buttons[2].innerHTML = 'Dark Mode';
    }
    // Toggle the dark mode flag
    darkMode = !darkMode;
    draw();
}

/**
 * getIntent()
 * --------------------------------------------------------------
 * Interprets arrow key combinations into hex directions.
 * Returns a direction string (L, R, UL, UR, DL, DR) or ''.
 */
function getIntent() {
    // Check which arrow keys are currently pressed
    const L = !!keysPressed['ArrowLeft'];
    const R = !!keysPressed['ArrowRight'];
    const U = !!keysPressed['ArrowUp'];
    const D = !!keysPressed['ArrowDown'];

    // Handle diagonal combos first
    if (L && U) return 'UL';   // Up-left
    if (R && U) return 'UR';   // Up-right
    if (L && D) return 'DL';   // Down-left
    if (R && D) return 'DR';   // Down-right

    // Handle single directions
    if (L) return 'L';
    if (R) return 'R';

    // If no valid intent, return empty string
    return '';
}


/**
 * Keydown Listener
 * --------------------------------------------------------------
 * Collects pressed keys and waits briefly (COMBO_WINDOW ms)
 * to detect 2-key diagonal inputs. Then executes moves.
 */
document.addEventListener('keydown', (e) => {
    // Ignore keys that aren’t part of the arrow/control set
    if (!ARROWS.has(e.key)) return;

    // Prevent default browser actions (e.g., scrolling)
    e.preventDefault();

    // Mark this key as currently pressed
    keysPressed[e.key] = true;

    // If an input has already been processed this turn, ignore new ones
    if (inputConsumed) return;

    // Reset combo timer if it’s running (for multi-key combos)
    if (comboTimer) clearTimeout(comboTimer);

    // Start/restart a short window for detecting multi-key input
    comboTimer = setTimeout(() => {
        // Determine intended move direction from keys pressed
        const intent = getIntent();
        if (!intent) return;

        // Execute corresponding move
        if (intent === 'L') shiftLeft();
        else if (intent === 'R') shiftRight();
        else if (intent === 'UL') shiftUpLeft();
        else if (intent === 'UR') shiftUpRight();
        else if (intent === 'DL') shiftDownLeft();
        else if (intent === 'DR') shiftDownRight();

        // Mark input as consumed until animation finishes
        inputConsumed = true;
    }, COMBO_WINDOW);
});


/**
 * Keyup Listener
 * --------------------------------------------------------------
 * Removes released key from active keys.
 * Clears timers and resets input lock if no keys are held.
 */
document.addEventListener('keyup', (e) => {
   // Ignore keys that aren’t part of the arrow set
    if (!ARROWS.has(e.key)) return;

    // Remove this key from the currently pressed keys
    delete keysPressed[e.key];

    // If no arrow keys are still pressed, reset input state
    if (Object.keys(keysPressed).length === 0) {
        // Allow new input since all keys were released
        inputConsumed = false;

        // Clear any pending combo timer
        if (comboTimer) {
            clearTimeout(comboTimer);
            comboTimer = null;
        }
    }
});


/**
 * init()
 * --------------------------------------------------------------
 * Resets game state and starts a new session.
 * Clears grid, resets score, spawns two tiles.
 */
function init() {
   // Reset score to zero at the start of a new game
    score = 0;

    // Clear the grid of all tiles
    clearGrid();
    tiles = [];
    gameover = false;

    // Spawn two starting tiles
    spawnPiece();
    spawnPiece();

    // Draw the initial board state
    draw();

}

init();
