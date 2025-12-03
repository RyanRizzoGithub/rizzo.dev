const root = document.documentElement;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();

let animatingCorrect    = false;
let animatingIncorrect  = false;
let animatingLocation   = false;

let grid            = new Array(7);
let key             = new Array(7);
let found           = new Array(7);
let selected        = new Array(7);
let words           = new Array(7);
let clues           = new Array(7);
let path            = new Array(7);
let hints           = new Array(7);
let hover           = new Array(7);
let backtracker     = new Array(7);
let finishedPuzzles = new Array(7);

let prevX           = 0;
let prevY           = 0;
let startTime       = null; 
let timerInterval   = null; 
let puzzleFile      = null;

let currentPuzzle   = "01-car-manufacturers1.txt";
let currentWord     = "";
let previousWord    = "";
let currentPath     = "";
let currentSequence = "";
let currentHintStr  = "";

let mouseHold       = false;
let wrongLocation   = false;
let gameOver        = false;
let selectionClick  = false;
let countdownActive = false;
let timerActive     = false;  
let paused          = false;
let hovering        = false;
let puzzleSelecting = true;
let loading         = true;

let headRoom        = 55;
let currentHintNum  = 1;
let currentPuzzleX  = 0;
let currentPuzzleY  = 0;
let wordCount       = 0;
let wordsFound      = 0;
let selectionAmt    = 0;
let offset          = 0;
let zoom            = 0;
let countdown       = 0; 
let elapsedTime     = 0; 

let help = ["Hints for each word you must find can be found here using the left & right buttons",
            "Drag your mouse from beginning to end to select a potential word",
            "Each puzzle contains exactly 7 words to find, all space will be consumed.",
            "It is possible to find a word which is correct but also mislocated",
            "You can find the category name below where it currently says Instructions",
            "A timer will start once a level opens, use it to race your friends",
            "Use the pause & play buttons in order to start & stop the game anytime"];

let hoverColors = ["#c73336","#c25b23","#c27418","#c7a13f","#729657","#36856f","#455e72"];
let colors   = ["#f94144","#f3722c","#f8961e","#f9c74f","#90be6d","#43aa8b","#577590"];
let puzzles1 = ["Car-Manufacturers-01.txt", "Sports-01.txt" , "Foods-01.txt", "Bugs-01.txt", "Countries-01.txt"];
let puzzles2 = ["Vegetables-01.txt", "Drinks-01.txt", "Music-Genres-01.txt", "Animals-01.txt", "Fruits-01.txt"];
let puzzles3 = ["US-States-01.txt", "Cartoon-Characters-01.txt", "US-Cities-01.txt", "Sports-02.txt", "Bugs-02.txt"];
let puzzles4 = ["Foods-02.txt", "Cartoon-Characters-02.txt", "Car-Manufacturers-02.txt", "Countries-02.txt", "Fruits-02.txt"];
let puzzles5 = ["Drinks-02.txt", "Sports-03.txt", "Vegetables-02.txt", "Music-Genres-02.txt", "Animals-02.txt"];
let puzzles6 = ["Cartoon-Characters-03.txt", "Animals-03.txt", "Foods-03.txt", "Car-Manufacturers-03.txt", "Fruits-03.txt"];
let puzzles7 = ["Vegetables-03.txt", "Bugs-03.txt", "Countries-03.txt", "Drinks-03.txt", "Music-Genres-03.txt"];
let puzzles  = [puzzles1, puzzles2, puzzles3, puzzles4, puzzles5, puzzles6, puzzles7];

// Puplulated the finished puzzles grid
for (let i=0; i<7; i++) {
    let puzzleRow = new Array(5);
    for (let j=0; j < 5; j++) {
        puzzleRow[j] = false;
    }
    finishedPuzzles[i] = puzzleRow;
}

/** -------------------------- PUPULATE GRID ---------------------------------
 * Loads a puzzle from a text file and initializes all game structures.  
 * Populates the grid, key mapping, word list, and hints from the file format.  
 * Updates the current hint display and renders the puzzle on the canvas.  
 */
function populateGrid(file) {
    // Try to open the file containing the puzzle data
    fetch(file)
        .then((res) => res.text())
        .then((text) => {

        // Iterate over each line of the file
        let lines = text.split('\n');
        for (let i=0; i < grid.length; i++) {
            
            // Create empty rows for our game structures
            let gridRow = new Array(5);
            let foundRow = new Array(5);
            let selectedRow = new Array(5);
            let keyRow = new Array(5);
            let pathRow = new Array(5);
            let backtrackRow = new Array(5);
            let hoverRow = new Array(5);

            // Initialie each element in the row
            for (let j=0; j < gridRow.length; j++) {
                gridRow[j] = lines[i].split(' ')[j];
                foundRow[j] = 0;
                selectedRow[j] = false;
                keyRow[j] = lines[15 + i].split(' ')[j];
                pathRow[j] = null;
                backtrackRow[j] = 0;
                hoverRow[j] = false;
            }

            // Insert the newly created row into the game structure
            grid[i] = gridRow;
            found[i] = foundRow;
            selected[i] = selectedRow;
            key[i] = keyRow;
            path[i] = pathRow;
            backtracker[i] = backtrackRow;
            hover[i] = hoverRow;
        }

        // Add each word to find into the words array
        for (let i=0; i<7; i++) {
            words[i] = lines[8 + i];
        }

        // Add each word hint to the hints array
        for (let i=0; i<7; i++) {
            hints[i] = lines[22 + i];
        }

        // Determine the quantity of words, then put each word into an array
        wordCount = lines[7];

        // Setup the currently displayed hint (apply an instruction set when level selecting)
        currentHintNum = 1;
        let hintBubble = document.getElementById("hints");
        let hintLocated = false;
        if (!puzzleSelecting) {
            for (let i=0; i<found.length; i++) {
                for (let j=0; j<found[i].length; j++) {
                    if (found[i][j] == currentHintNum) hintLocated = true;
                }
            }
        }
        if (puzzleSelecting) { currentHintStr = help[0]; }
        else { currentHintStr = hints[0]; }
        hintBubble.innerHTML = "<p id='hint-p' style='width: 200px;'>" + currentHintStr + "</p>";
        puzzleFile = file;
        draw();
        loading = false;
    })
    .catch((e) => console.error(e));
}


/** ---------------------------- DRAW -----------------------------------
 * Renders the entire game state to the canvas, including the title,  
 * current status, timer, word paths, and puzzle grid.  
 * Handles different states such as puzzle selection, active play,  
 * pause, and game completion overlays.  
 */
function draw() {
    if (!canvas) return;

    // Setup canvas scaling
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw game title
    ctx.font = "40px Courier New, monospace";
    ctx.fillStyle = 'black';
    ctx.fillText("Word Worms", rect.width / 2, 40);

    // Draw status line (current word / feedback)
    ctx.font = "25px Courier New, monospace";
    let statusText = "[ " + currentWord + " ]";
    if (animatingCorrect) {
        statusText = previousWord + " Found!";
    } else if (animatingIncorrect) {
        statusText = "Incorrect!";
    } else if (animatingLocation) {
        statusText = "Wrong Location!";
    }
    ctx.fillText(statusText, rect.width / 2, 70);

    // Display elapsed timer
    ctx.font = "20px Courier New, monospace";
    let minutes = Math.floor(elapsedTime / 60);
    let seconds = elapsedTime % 60;
    let timeStr = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    ctx.fillText("Time: " + timeStr, rect.width / 2, 95);

    // Draw selection + found paths
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (selected[i][j]) {
                drawPath(i, j, 'grey');
            }
            if (found[i][j] > 0) {
                drawPath(i, j, colors[found[i][j] - 1]);
            }
        }
    }

    // Cache category element once
    const categoryElem = !puzzleSelecting ? document.getElementById("category") : null;
    if (categoryElem) {
        categoryElem.innerHTML = currentPuzzle.slice(0, -4).replaceAll('-', ' ');
    } else {document.getElementById("category").innerHTML = "Instructions"; }

    // Precompute constants
    const halfWidth = rect.width / 2;
    const baseY = 55 + headRoom;

    // Draw all tiles
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            const x = halfWidth + ((j - 2) * 50);
            const y = (50 * i) + baseY - headRoom;

            ctx.beginPath();
            ctx.roundRect(x - 20 + offset - zoom / 2, y + headRoom - zoom / 2, 40 + zoom, 40 + zoom, 8);

            if (puzzleSelecting) {
                if (hover[i][j]) ctx.fillStyle = hoverColors[i];
                else ctx.fillStyle = colors[i];
                ctx.stroke();
                ctx.fill();
                ctx.fillStyle = 'white';
                if (puzzles[i][j] != null) {
                    ctx.fillText(
                        finishedPuzzles[i][j] ? "✔" : (j + (grid[i].length * i)) + 1,
                        x + offset,
                        y + 20 + headRoom
                    );
                }
            } else if (selected[i][j]) {
                ctx.fillStyle = 'grey';
                ctx.stroke();
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.fillText(grid[i][j], x + offset, y + 20 + headRoom);
            } else if (found[i][j] > 0) {
                ctx.fillStyle = colors[found[i][j] - 1];
                ctx.stroke();
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.fillText(grid[i][j], x + offset, y + 20 + headRoom);
            } else if (hover[i][j]) {
                ctx.fillStyle = '#D3D3D3';
                ctx.stroke();
                ctx.fill();
                ctx.fillStyle = 'black';
                ctx.fillText(grid[i][j], x + offset, y + 20 + headRoom);
            } else {
                ctx.fillStyle = 'white';
                ctx.stroke();
                ctx.fill();
                ctx.fillStyle = 'black';
                ctx.fillText(grid[i][j], x + offset, y + 20 + headRoom);
            }
        }
    }

    // Overlay states
    if (paused || gameOver) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(halfWidth - 125, 55 + headRoom, 250, 350, 8);
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = 'black';
        if (paused) {
            ctx.fillText('Paused', halfWidth, 275);
        } else {
            ctx.fillText('Level Completed!', halfWidth, 275);
            ctx.fillText('Finished in ' + timeStr, halfWidth, 295);
        }
    }
}


/** -------------------------- DRAW PATH ---------------------------------
 * Draws the connecting path between a grid cell and its predecessor  
 * based on the stored direction in the path array.  
 * Uses rounded rectangles to visually link adjacent tiles,  
 * filling them with the specified color on the canvas.  
 */
function drawPath(i, j, color) {
        // Determine where the current node lead from
        let dir = path[i][j] && path[i][j].split(' ')[1];
        if (!dir || dir === 'S') return;

        // Make sure the connector path will be filled in with the corresponding color
        ctx.fillStyle = color;
        ctx.beginPath();

        // Calculate the row and column of the current node
        let x = (rect.width / 2) + ((j - 2) * 50);
        let y = (50 * i);

        // Calculate the row and column of the previous node
        switch (dir) {
            case 'U': ctx.roundRect(x - 15 + offset, y + 30 + headRoom, 30, 40, 8); break;
            case 'D': ctx.roundRect(x - 15 + offset, y + 80 + headRoom, 30, 40, 8); break;
            case 'L': ctx.roundRect(x + 10 + offset, y + 60 + headRoom, 40, 30, 8); break;
            case 'R': ctx.roundRect(x - 40 + offset, y + 60 + headRoom, 40, 30, 8); break;
        }

        // Draw the path on the canvas
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = 'none';
}


/** -------------------------- CHECK WORD ---------------------------------
 * Validates the currently selected word against the puzzle’s word bank.  
 * Updates the grid, hint display, and game state if the word is correct,  
 * or triggers animations for incorrect selections or wrong locations.  
 * Returns a boolean indicating whether a valid word was found.  
 */
function checkWord() {
    let foundWord = false;
    wrongLocation = false; // reset each check

    const targetWord = words[currentPath[0] - 1];

    // Check length and dictionary match
    if (currentWord === targetWord && currentPath.length === targetWord.length) {
        // Scan the grid for a placement of this word
        let placedCorrectly = false;

        for (let i = 0; i < key.length; i++) {
            for (let j = 0; j < key[i].length; j++) {
                if (key[i][j] == currentPath[0]) {
                    // If the word is in the correct location, mark it
                    if (currentPath.split('').every(ch => ch === currentPath[0])) {
                        found[i][j] = currentPath[0];
                        foundWord = true;
                        placedCorrectly = true;

                        if (currentHintNum == key[i][j]) {
                            document.getElementById("hint-p").style.textDecoration = "line-through";
                        }
                    }
                }
            }
        }

        // Word exists, but no correct placement was marked
        if (!placedCorrectly) {
            wrongLocation = true;
        }
    }

    // Handle animations and scoring
    if (foundWord) {
        wordsFound++;
        if (wordsFound == wordCount) {
            gameOver = true;
            stopTimer();
            finishedPuzzles[currentPuzzleY][currentPuzzleX] = true;
        } else {
            animateCorrect();
        }
    } else if (wrongLocation) {
        animateLocation();
    } else if (!selectionClick) {
        animateIncorrect();
    }

    selectionClick = false;
    return foundWord;
}


/** ------------------------ SELECT LETTER -------------------------------
 * Handles a user click on the puzzle grid or puzzle selector.  
 * Updates the selected letter, current path, and backtracking state,  
 * or starts a new puzzle if in puzzle selection mode.  
 * Determines movement direction and triggers a redraw of the grid.  
 * Returns true if the selection moved to a new cell, false otherwise.
 */
function selectLetter(xPos, yPos) {
    // Move the origin of out coordinates to the screen center
    let x = xPos - (window.innerWidth / 2);
    let y = yPos - (55 + headRoom); 

    // Calculate the column
    let column = Math.floor((x + 120) / 48);

    // Calculate the row
    let row = Math.floor(y / 50);

    // If the user is just hovering and not clicking update the hover grid
    if (hovering) {
        if (row >= 0 && row <= 6 && column >= 0 && column <= 4) {
            hover.forEach(row => row.fill(false));
            hover[row][column] = true;
        }
        return;
    }

    // If we are in puzzle selector mode, change the logic to handle puzzle selection
    if (puzzleSelecting) {
        // Save the row and column of the puzzle we are currently playing
        currentPuzzleX = column;
        currentPuzzleY = row;

        // Use the mouse click location to determine the puzzle selected and start the game
        populateGrid("puzzles/" + puzzles[row][column]);
        let hintBubble = document.getElementById("hints");
        currentPuzzle = puzzles[currentPuzzleY][currentPuzzleX];
        currentHintStr = hints[0];
        hintBubble.innerHTML = "<p id='hint-p' style='width: 200px;'>" + currentHintStr + "</p>";
        puzzleSelecting = false;
        selectionClick = true;
        startTimer();
        return;
    }

    
    // Check if the selected node is already completed
    if (found[row][column]) { clearSelection(); return; }

    // Check if the selected node was selected previously
    let revisit = false;
    if (selected[row][column]) {
        let max = backtracker[row][column];
        for (let i=0; i < backtracker.length; i++) {
            for (let j=0; j<backtracker[i].length; j++) {
                if (backtracker[i][j] > max) {
                    selected[i][j] = false;
                    path[i][j] = null;
                    backtracker[i][j] = 0;
                    currentPath = currentPath.slice(0, -2);
                }
            }
        }
        revisit = true;
        currentWord = "";
        for (let k=1; k<max; k++) {
            for (let i=0; i<backtracker.length; i++) {
                for (let j=0; j<backtracker[i].length; j++) {
                    if (backtracker[i][j] == k) {
                        currentWord += grid[i][j];
                    }
                }
            }
        }
    }

    // Determine if we are at start (nothing selected) and what direction we have gone
    if (!revisit) {
        let start = true;
        for (let i=0; i<selected.length; i++) {
            for (let j=0; j<selected[i].length; j++) {
                if (selected[i][j]) { start = false;}
            }
        }

        let direction = null;
        // Check if previous cell was below
        if (prevX == column && prevY > row) { direction = "D"; }

        // Check if previous cell was above
        else if (prevX == column && prevY < row) { direction = "U"; }

        // Check if previous cell was left
        else if (prevX < column && prevY == row) { direction = 'R'; }

        // Check if previous cell was right
        else if (prevX > column && prevY == row) { direction = "L"; }
        
        // Else, we are at the starting position
        else { direction = "S"; }

        path[row][column] = '0 ' + direction;
    }
    

    selectionAmt = selectionAmt + 1;
    backtracker[row][column] = selectionAmt;
    selected[row][column] = true;
    draw();


    // Check if we have moved locatings since the last call to select letter
    if (prevX != column || prevY != row) {
        prevX = column;
        prevY = row;
        return true;
    }

    // Return false if we have not moved
    return false;
}


/** ------------------------ CLEAR SELECTION -------------------------------
 * Resets all currently selected letters and related game state.  
 * Clears the selection array, backtracker, current path, and word variables.  
 * Resets previous selection coordinates and counters.  
 * Clears the canvas and redraws the grid to reflect the cleared selection.
 */
function clearSelection() {
    // Iterate over each node in selected and set them all to false
    for (let i=0; i < selected.length; i++) {
        let selectedRow = new Array(5);
        for (let j=0; j < selectedRow.length; j++) {
            selectedRow[j] = false;
        }
        selected[i] = selectedRow;
    }

    // Reset our game variables
    selectionAmt = 0;
    currentPath = '';
    currentSequence = '';
    currentWord = '';
    prevX = null;
    prevY = null;

    // Clear the backtracker
    for (let i=0; i < backtracker.length; i++) {
        for (let j=0; j<backtracker[i].length; j++) {
            backtracker[i][j] = 0;
        }
    }
    
    // Clear the canvas and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw();
}


/** ------------------------ ANIMATE CORRECT -------------------------------
 * Triggers the “correct word” animation sequence for the game.
 * Animates visual feedback for a correctly found word and redraws the grid.
 * Sets the animatingCorrect flag during the animation and resets it afterward.
 */
function correctHelper(x) { zoom = zoom + (x/10); draw();}
function animateCorrect() {
    animatingCorrect = true;

    // Perform small animation steps forward
    for (let i = 0; i < 50; i++) { setTimeout(correctHelper, 5, 1); }

    // Perform small animation steps backward
    for (let i = 0; i < 50; i++) { setTimeout(correctHelper, 5, -1); }

    // Continuously redraw the canvas during animation
    for (let i = 0; i < 100; i++) { setTimeout(draw(), 5); }

    // Reset animation flag after the animation duration
    setTimeout(() => {
        animatingCorrect = false;
        draw(); // Final redraw to show updated state
    }, 200 * 5);
}


/** ------------------------ ANIMATE INCORRECT -------------------------------
 * Triggers the “incorrect word” animation sequence for the game.
 * Animates visual feedback when the user selects an invalid word.
 * Sets the animatingIncorrect flag during the animation and resets it afterward.
 */
function incorrectHelper(x) { offset = offset + x; draw(); }
function animateIncorrect() {
    animatingIncorrect = true;

    // Small shake/animation steps forward
    for (let i = 0; i < 10; i++) { setTimeout(incorrectHelper, 5, 1); }

    // Larger shake/animation steps backward
    for (let i = 0; i < 20; i++) { setTimeout(incorrectHelper, 5, -1); }

    // Final small forward steps
    for (let i = 0; i < 10; i++) { setTimeout(incorrectHelper, 5, 1); }

    // Reset animation flag after duration and redraw the grid
    setTimeout(() => {
        animatingIncorrect = false;
        draw(); // Redraw to show the final state
    }, 200 * 5);
}


/** ------------------------ ANIMATE LOCATION -------------------------------
 * Triggers the “wrong location” animation sequence for the game.
 * Animates visual feedback when the user selects the correct word but in the wrong location.
 * Sets the animatingLocation flag during the animation and resets it afterward.
 */
function locationHelper(x) { offset = offset + x; draw(); }
function animateLocation() {
    animatingLocation = true; // Flag that a wrong-location animation is active

    // Small animation steps forward
    for (let i = 0; i < 10; i++) { setTimeout(locationHelper, 5, 1); }

    // Larger animation steps backward
    for (let i = 0; i < 20; i++) { setTimeout(locationHelper, 5, -1); }

    // Final small forward steps
    for (let i = 0; i < 10; i++) { setTimeout(locationHelper, 5, 1); }

    // Reset animation flag after duration and redraw the grid
    setTimeout(() => {
        animatingLocation = false;
        draw(); // Redraw to show final state
    }, 200 * 5);
}


/** ------------------------ CYCLE HINTS -------------------------------
 * Cycles through the puzzle hints in either direction (left or right).  
 * Updates the current hint number and displays the corresponding hint.  
 * Marks hints as completed (line-through) if the word has already been found.  
 * Handles both puzzle selection mode and active gameplay mode.
 */
function cycleHints(right) {
    let hintBubble = document.getElementById("hints");

    // If the right button was clicked, increase currentHintNum
    if (right) {
        currentHintNum = currentHintNum + 1;
        if (currentHintNum > wordCount) { currentHintNum = 1; }
    }

    // If the left button was clicked, decrease currentHintNum
    else {
        currentHintNum = currentHintNum - 1;
        if (currentHintNum < 1) { currentHintNum = wordCount; }
    }

    // Check if the currently displayed hint is solved
    let hintLocated = false;
    for (let i=0; i<found.length; i++) {
        for (let j=0; j<found[i].length; j++) {
            if (found[i][j] == currentHintNum) hintLocated = true;
        }
    }

    // Select the current hint and display accordingly
    if (puzzleSelecting) { currentHintStr = help[currentHintNum-1]; }
    else { currentHintStr = hints[currentHintNum-1]; }
    if (hintLocated) { hintBubble.innerHTML = "<p id='hint-p' style='width: 200px; text-decoration: line-through;'>" + currentHintStr + "</p>"; }
    else { hintBubble.innerHTML = "<p id='hint-p' style='width: 200px;'>" + currentHintStr + "</p>"; }
}


/** ------------------------ START TIMER -------------------------------
 * Starts the game timer if it is not already active.
 * Updates the elapsed time every second and triggers a redraw of the grid.
 * Pauses the timer when the game is paused, keeping the elapsed time accurate.
 * Sets up a repeating interval to continuously track and display time.
 */
function startTimer() {
    if (!timerActive) {
        // Initialize start time adjusted by any previously elapsed time
        startTime = Date.now() - elapsedTime * 1000;
        timerActive = true;

        // Update elapsed time and redraw every second
        timerInterval = setInterval(() => {
            if (paused) {
                // Adjust startTime during pause
                startTime = startTime + 1000;
            }
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            draw();
        }, 1000);
    }
}


/** ------------------------ STOP TIMER -------------------------------
 * Stops the game timer if it is currently active.
 * Clears the interval updating the elapsed time.
 * Marks the timer as inactive to prevent further updates.
 */
function stopTimer() {
    if (timerActive) {
        // Stop the repeating timer
        clearInterval(timerInterval); 
        // Mark timer as inactive
        timerActive = false;          
    }
}


/** ------------------------ RESET TIMER -------------------------------
 * Resets the game timer to zero and stops it if active.
 * Clears any running timer interval to prevent further updates.
 * Resets the elapsed time counter and redraws the grid.
 */
function resetTimer() {
    // Ensure timer is stopped
    stopTimer();   
    // Reset elapsed time
    elapsedTime = 0; 
    draw();  
}


/** ------------------------ PAUSE -------------------------------
 * Pauses the game if it is currently in play (not in puzzle selection mode).
 * Sets the paused flag, stops the timer, and refreshes the grid display.
 * Prevents the player from interacting with the game until resumed.
 */
function pause() {
    if (!puzzleSelecting) {
        // Mark the game as paused
        paused = true;  
        // Stop the timer to halt elapsed time updates
        stopTimer();    
        draw();
    }
}


/** -------------------------- PLAY ---------------------------------
 * Resumes the game if it is currently paused and not in puzzle selection mode.
 * Clears the paused flag, restarts the timer, and redraws the grid.
 * Allows the player to continue interacting with the game.
 */
function play() {
    if (!puzzleSelecting) {
        // Unmark the game as paused
        paused = false;  
        // Restart the timer
        startTimer();    
        draw();
    }
}


/** ---------------------- RESET GAME --------------------------------
 * Resets the current puzzle to its initial state.
 * Reloads the puzzle grid, clears found words, and resets game flags.
 * Resets and restarts the timer, allowing the player to start fresh.
 */
function resetGame() {
    if (!puzzleSelecting) {
        // Reload the current puzzle
        populateGrid(puzzleFile); 
        // Reset found word count
        wordsFound = 0;       
        // Clear game-over state    
        gameOver = false;   
        // Ensure game is not paused      
        paused = false;  
        // Reset the elapsed timer         
        resetTimer();   
        // Start the timer again          
        startTimer();             
    }
}


/** --------------------- PUZZLE SELECTOR ------------------------------
 * Switches the game into puzzle selection mode.
 * Clears the current category display and resets the game state.
 * Resets the timer and redraws the grid to show the puzzle selector view.
 * Allows the player to choose a new puzzle before starting gameplay.
 */
function puzzleSelector() {
    let category = document.getElementById("category");
    category.innerHTML = "";
    // Reset the current game state first while puzzleSelecting is still false
    resetGame();

    // Now switch into puzzle selection mode
    puzzleSelecting = true;

    // Reset timer & redraw selector view
    resetTimer();
    draw();
}


/** ----------------------- EVENT MOUSE MOVE ------------------------------
 * Handles mouse movement over the canvas while the mouse button is held down.
 * Selects letters dynamically as the cursor moves over valid grid cells.
 * Updates the current word and path if a new node is entered.
 * Clears the selection if the cursor moves outside the playable area.
 */
canvas.addEventListener("mousemove", (e) => {
    if (!loading) {
        // Check if the mouse is being held down
        if (mouseHold && !loading) {
            
            // Make sure user mouse is inside the canvas horizontally
            let clickX = e.clientX - (window.innerWidth / 2);
            if (e.clientX - (window.innerWidth / 2) >= -120 && e.clientX - (window.innerWidth / 2) <= 120) {

                // Make sure user mouse is inside the canvas vertically
                if (e.clientY >= 55 + headRoom && e.clientY < 405 + headRoom) {
                    let x = e.clientX - (window.innerWidth / 2);
                    let y = e.clientY - (55 + headRoom);

                    // Calculate the column
                    let column = Math.floor((x + 120) / 48);

                    // Calculate the row
                    let row = Math.floor(y / 50);

                    // Check if we have moved to a different node
                    if (column != prevX || row != prevY) {
                        selectLetter(e.clientX, e.clientY);

                        if (!puzzleSelecting) {
                            let letter = grid[prevY][prevX];
                            currentWord = currentWord + letter;
                            currentPath = currentPath + key[prevY][prevX];
                            draw();
                        }
                    }
                // Clear selection if user moves to the side of the canvas
                } else { mouseHold = false; clearSelection(); }
            // Clear selection if user moves above or below the canvas
            } else { mouseHold = false; clearSelection(); }
        } else {
            hovering = true;
            selectLetter(e.clientX, e.clientY);
            draw();
            hovering = false;
            hover.forEach(row => row.fill(false));
        }
    }
});


/** ----------------------- EVENT MOUSE DOWN ------------------------------
 * Handles mouse button press on the canvas.
 * Activates letter selection when the user clicks inside the grid area.
 * Begins tracking the selected word and path immediately.
 * Updates the canvas display if the game is not in puzzle selection mode.
 */
canvas.addEventListener("mousedown", (e) => { 
    if (!loading) {
        let clickX = e.clientX - (window.innerWidth / 2);
        if (e.clientY > 110 && e.clientY < 455 && clickX > -120 && clickX < 120) {
            // Set mouseHold to true while user has mouse clicked inside the canvas
            mouseHold = true; 
            
            // Add the very first selected letter immediately
            selectLetter(e.clientX, e.clientY);

            if (!puzzleSelecting) {
                currentWord = grid[prevY][prevX];
                currentPath = key[prevY][prevX];
                draw();
            }
        }
    }
});

/** ----------------------- EVENT MOUSE UP ------------------------------
 * Handles mouse button release on the canvas.
 * Checks if the selected letters form a valid word and triggers appropriate feedback.
 * Clears the current selection and path if the word is invalid.
 * Updates the game state and resets mouse tracking after the selection is completed.
 */
canvas.addEventListener("mouseup", (e) => { 
    if (!loading) {
        let clickX = e.clientX - (window.innerWidth / 2);
        if (e.clientY > 110 && e.clientY < 455 && clickX > -120 && clickX < 120) {
            if (!puzzleSelecting) {
                // Check if the users selection is a valid word
                let wordFound = checkWord();
                if (!wordFound) { 
                    for (let i=0; i < selected.length; i++) {
                        for (let j=0; j < selected[i].length; j++) {
                            if (selected[i][j]) {
                                path[i][j] = null;
                            }
                        }
                    }
                }
            } else {
                puzzleSelecting = false;
            }

            // Clear the users selected characters
            previousWord = currentWord;
            clearSelection();

            // Set mousehold back to false
            mouseHold = false; 
        }
    }
});
