const canvas = document.getElementById("gameCanvas");
		const ctx = canvas.getContext("2d");

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		// Player properties
		let angle = 0;               
		let direction = 1;           
		let radius = 100;            
		const playerSize = 12;

		// Game state
		let obstacles = [];
		let robbers = [];
		let knights = [];
		let frame = 0;
		let gameOver = false;
		let score = 0;
		let highScore = 0;
		let menu = true;
		let difficulty = 0;

		// Animation state
		let animationId;

		function spawnObstacle() {
			const obsAngle = Math.random() * Math.PI * 2;
			obstacles.push({
				angle: obsAngle,
				distance: canvas.width / 2,
				size: 10
			});
		}

		function spawnRobber() {
			const robberAngle = Math.random() * Math.PI * 2;
			robbers.push({
				angle: robberAngle,
				distance: canvas.width / 2,
				size: 10
			});
		}

		function spawnKnight() {
			const knightAngle = Math.random() * Math.PI * 2;
			knights.push({
				angle: knightAngle,
				distance: canvas.width / 2,
				size: 10
			});
		}

		function update() {
			if (gameOver) return;

			frame++;

			if (difficulty == 0) { 
				if (frame % 50 === 0) spawnObstacle(); 
			} else if (difficulty == 1) { 
				if (frame % 100 === 0) spawnRobber(); 
				else if (frame % 25 === 0) spawnObstacle(); 
			} else if (difficulty == 2) { 
				if (frame % 250 === 0) spawnKnight();
				if (frame % 100 === 0) spawnRobber(); 
				if (frame % 15 === 0) spawnObstacle(); 
			}

			angle += direction * 0.04;
			obstacles.forEach(obs => obs.distance -= 2);
			robbers.forEach(rob => rob.distance -= 4);
			knights.forEach(knt => knt.distance -= 6);

			obstacles.forEach(obs => {
				const px = centerX + Math.cos(angle) * radius;
				const py = centerY + Math.sin(angle) * radius;
				const ox = centerX + Math.cos(obs.angle) * obs.distance;
				const oy = centerY + Math.sin(obs.angle) * obs.distance;

				const dx = px - ox;
				const dy = py - oy;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < playerSize + obs.size / 2) {
					gameOver = true;
					if (score > highScore) highScore = score;
				}
			});

			robbers.forEach(rob => {
				const px = centerX + Math.cos(angle) * radius;
				const py = centerY + Math.sin(angle) * radius;
				const ox = centerX + Math.cos(rob.angle) * rob.distance;
				const oy = centerY + Math.sin(rob.angle) * rob.distance;

				const dx = px - ox;
				const dy = py - oy;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < playerSize + rob.size / 2) {
					gameOver = true;
					if (score > highScore) highScore = score;
				}
			});

			knights.forEach(knt => {
				const px = centerX + Math.cos(angle) * radius;
				const py = centerY + Math.sin(angle) * radius;
				const ox = centerX + Math.cos(knt.angle) * knt.distance;
				const oy = centerY + Math.sin(knt.angle) * knt.distance;

				const dx = px - ox;
				const dy = py - oy;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < playerSize + knt.size / 2) {
					gameOver = true;
					if (score > highScore) highScore = score;
				}
			});

			obstacles = obstacles.filter(obs => obs.distance > 0);
			robbers = robbers.filter(rob => rob.distance > 0);
			knights = knights.filter(knt => knt.distance > 0);
			score = score + ((difficulty + 1) * 2);
		}

		function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			if (menu) {
				ctx.strokeStyle = '#000000';
				ctx.fillStyle = '#000000';
				ctx.textAlign = 'center';

				ctx.font = '50px Courier New, monospace';
				ctx.fillText('Orbit', canvas.width/2, 100);

				ctx.font = '20px Courier New, monospace';
				ctx.fillText('High Score: ' + highScore, canvas.width/2, 140);
				
				ctx.font = '30px Courier New, monospace';
				ctx.fillStyle = '#fcfbf3';
				ctx.fillRect(canvas.width/2 - 100, 200, 200, 50);
				ctx.strokeRect(canvas.width/2 - 100, 200, 200, 50);
				ctx.fillStyle = '#000000';
				ctx.fillText('Easy', canvas.width/2, 233);

				ctx.fillStyle = '#fcfbf3';
				ctx.fillRect(canvas.width/2 - 100, 300, 200, 50);
				ctx.strokeRect(canvas.width/2 - 100, 300, 200, 50);
				ctx.fillStyle = '#000000';
				ctx.fillText('Normal', canvas.width/2, 333);
				
				ctx.fillStyle = '#fcfbf3';
				ctx.fillRect(canvas.width/2 - 100, 400, 200, 50);
				ctx.strokeRect(canvas.width/2 - 100, 400, 200, 50);
				ctx.fillStyle = '#000000';
				ctx.fillText('Difficult', canvas.width/2, 433);
				return;
			}

			// Draw center
			ctx.beginPath();
			ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
			ctx.fillStyle = "black";
			ctx.fill();

			// Draw player
			const px = centerX + Math.cos(angle) * radius;
			const py = centerY + Math.sin(angle) * radius;
			ctx.beginPath();
			ctx.arc(px, py, playerSize, 0, Math.PI * 2);
			ctx.fillStyle = "#000000";
			ctx.fill();
			ctx.stroke();

			// Draw obstacles
			obstacles.forEach(obs => {
				const ox = centerX + Math.cos(obs.angle) * obs.distance;
				const oy = centerY + Math.sin(obs.angle) * obs.distance;
				ctx.beginPath();
				ctx.arc(ox, oy, obs.size, 0, Math.PI * 2);
				ctx.fillStyle = "#D09B3E";
				ctx.fill();
				ctx.stroke();
			});

			// Draw robbers
			robbers.forEach(rob => {
				const ox = centerX + Math.cos(rob.angle) * rob.distance;
				const oy = centerY + Math.sin(rob.angle) * rob.distance;
				ctx.beginPath();
				ctx.arc(ox, oy, rob.size, 0, Math.PI * 2);
				ctx.fillStyle = "#2A7771";
				ctx.fill();
				ctx.stroke();
			});

			// Draw Knights
			knights.forEach(knt => {
				const ox = centerX + Math.cos(knt.angle) * knt.distance;
				const oy = centerY + Math.sin(knt.angle) * knt.distance;
				ctx.beginPath();
				ctx.arc(ox, oy, knt.size, 0, Math.PI * 2);
				ctx.fillStyle = "#BB5127";
				ctx.fill();
				ctx.stroke();
			});
			
			if (gameOver) {
				ctx.textAlign = 'center';
				ctx.fillStyle = 'white';
				ctx.fillRect(canvas.width/2 - 150, 85, 300, 150);
				ctx.strokeRect(canvas.width/2 - 150, 85, 300, 150);

				ctx.fillStyle = "black";
				ctx.font = "35px Arial";
				ctx.fillText("Game Over", canvas.width / 2, 140);

				ctx.fillStyle = "black";
				ctx.font = "20px Arial";
				ctx.fillText("Score: " + score, canvas.width/2, 170);

				ctx.font = "15px Arial";
				ctx.fillStyle = 'white';
				ctx.fillRect(canvas.width/2 - 110, 190, 100, 30);
				ctx.strokeRect(canvas.width/2 - 110, 190, 100, 30);
				ctx.fillStyle = 'black';
				ctx.fillText("Play Again", canvas.width/2 - 60, 210);

				ctx.fillStyle = 'white';
				ctx.fillRect(canvas.width/2 + 10, 190, 100, 30);
				ctx.strokeRect(canvas.width/2 + 10, 190, 100, 30);
				ctx.fillStyle = 'black';
				ctx.fillText("Home", canvas.width/2 + 60, 210);

				return;
			}

			// Draw score
			ctx.fillStyle = "black";
			ctx.font = "20px Arial";
			ctx.fillText("Score: " + score, canvas.width/2, 30);
		}

		function gameLoop() {
			update();
			draw();
			animationId = requestAnimationFrame(gameLoop);
		}

		function restart() {
			cancelAnimationFrame(animationId); // stop old loop
			obstacles = [];
			robbers = [];
			knights = [];
			frame = 0;
			gameOver = false;
			score = 0;
			angle = 0;
			radius = 100;
			direction = 1;
			gameLoop(); // start fresh
		}

		document.addEventListener("keydown", (e) => {
			if (e.code === "Space") {
				direction *= -1; 
			}
			if (e.code === "Enter" && gameOver) {
				restart();
			}
		});

		document.addEventListener("mousedown", (e) => {
			if (menu) {
				if (e.clientX >= (window.innerWidth/2) - 100 && e.clientX <= (window.innerWidth/2) + 100) {
					if (e.clientY >= 250 && e.clientY <= 300) {
						menu = false;
						difficulty = 0;
						restart();
					}
				}

				if (e.clientX >= (window.innerWidth/2) - 100 && e.clientX <= (window.innerWidth/2) + 100) {
					if (e.clientY >= 350 && e.clientY <= 400) {
						menu = false;
						difficulty = 1;
						restart();
					}
				}

				if (e.clientX >= (window.innerWidth/2) - 100 && e.clientX <= (window.innerWidth/2) + 100) {
					if (e.clientY >= 450 && e.clientY <= 500) {
						menu = false;
						difficulty = 2;
						restart();
					}
				}
			}

			if (gameOver) {
				if (e.clientX >= window.innerWidth/2 - 110 && e.clientX <= window.innerWidth/2 - 10) {
					if (e.clientY >= 240 && e.clientY <= 270) {
						restart();
					}
				}
				else if (e.clientX >= window.innerWidth/2 + 10 && e.clientX <= window.innerWidth/2 + 110) {
					if (e.clientY >= 240 && e.clientY <= 270) {
						menu = true;
						draw();
					}
				}
			}
		});

		draw();