const root = document.documentElement;
const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");
const barWidth = 6;
const spacing = 2;
const totalBars = Math.floor(canvas.width / (barWidth + spacing));
const bars = new Array(totalBars).fill(0);
const maxHeight = 40;
const baseY = canvas.height - 30;
const stdDev = 80;

let mouseX = null;
let hovering = false;

var defaultMeanX = canvas.width * 0.5; 
var darkMode = true;
var currentColor = 5;

function red() { 
    root.style.setProperty("--accent-color", '#ed6363');
    if (darkMode) root.style.setProperty("--background-color",'#28292f'); 
    else root.style.setProperty("--background-color", '#f8fbff'); 
    currentColor = 0;
    return root.style.getPropertyValue("--accent-color");
}
function orange() { 
    root.style.setProperty("--accent-color", '#e89656'); 
    if (darkMode) root.style.setProperty("--background-color",'#28292f'); 
    else root.style.setProperty("--background-color", '#f8fbff');
    currentColor = 1;
    return root.style.getPropertyValue("--accent-color");
}
function yellow() { 
    root.style.setProperty("--accent-color", '#caad39'); 
    if (darkMode) root.style.setProperty("--background-color",'#28292f'); 
    else root.style.setProperty("--background-color", '#f8fbff');
    currentColor = 2;
    return root.style.getPropertyValue("--accent-color");
}
function green() { 
    root.style.setProperty("--accent-color", '#2eba4a'); 
    if (darkMode) root.style.setProperty("--background-color", '#28292f'); 
    else root.style.setProperty("--background-color", '#f8fbff');
    currentColor = 3;
    return root.style.getPropertyValue("--accent-color");
}
function blue() { 
    root.style.setProperty("--accent-color", '#3c92cb');
    if (darkMode) root.style.setProperty("--background-color",'#28292f')
    else root.style.setProperty("--background-color", '#f8fbff'); 
    currentColor = 4;
    return root.style.getPropertyValue("--accent-color");
}
function purple() {
    root.style.setProperty("--accent-color", '#9871ed');
    if (darkMode) root.style.setProperty("--background-color",'#28292f');
    else root.style.setProperty("--background-color", '#f8fbff');
    currentColor = 5;
    return root.style.getPropertyValue("--accent-color");
}
function lightDarkToggle() {
    if (darkMode) {
        darkMode = false;
        root.style.setProperty("--primary-text-color", '#181818');
        root.style.setProperty("--secondary-text-color", '#2C2C2C');
        root.style.setProperty("--tertiary-text-color", '#575757');
        root.style.setProperty("--border", '1px solid rgba(0, 0, 0, 0.3)')
        
        const moon = document.getElementById('sunMoon');
        moon.classList.remove('fa-moon-o');
        moon.classList.add('fa-sun-o');

        const logo = document.getElementById('logo');
        logo.src = 'images/logo-black.png'
        
    }
    else {
        darkMode = true;
        root.style.setProperty("--primary-text-color", '#fbfbfb');
        root.style.setProperty("--secondary-text-color", '#cccccc');
        root.style.setProperty("--tertiary-text-color", '#a6a5a5');
        root.style.setProperty("--border", '1px solid rgba(204, 204, 204, 0.3)')

        const sun = document.getElementById('sunMoon');
        sun.classList.remove('fa-sun-o');
        sun.classList.add('fa-moon-o');

        const logo = document.getElementById('logo');
        logo.src = 'images/logo-white.png'
    }
    var color_functions = [red, orange, yellow, green, blue, purple];
    color_functions[currentColor]();
}

function sunMoonToggle(x) {
    x.classList.toggle("fa-sun-o");
}

function link(address) {
    window.location.href = address;
}

/* ------------ Functions related to the interactive bell curve graphic ---------------- */
function gaussian(x, mean, stdDev) {
    const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
    return Math.exp(exponent);
}

function drawBars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var currentMeanX = defaultMeanX;
    if (mouseX != null) { 
        currentMeanX = mouseX;
        defaultMeanX = currentMeanX;
    }

    for (let i = 0; i < totalBars; i++) {
        const x = i * (barWidth + spacing);
        const barCenter = x + barWidth / 2;
        const intensity = gaussian(barCenter, currentMeanX, stdDev);
        bars[i] = intensity * maxHeight + 10;

        const height = bars[i];
        const y = baseY - height;

        var color_functions = [red, orange, yellow, green, blue, purple];
        ctx.fillStyle = color_functions[currentColor]();
        ctx.fillRect(x, y, barWidth/3, height);
        if (darkMode) ctx.fillStyle = '#CCCCCC';
        else ctx.fillStyle = '#2C2C2C'
        ctx.fillRect(x, y + height, barWidth/3, 10)
    }
}

function animate() {
    drawBars();
    requestAnimationFrame(animate);
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});

canvas.addEventListener("mouseenter", () => {
    hovering = true;
});

canvas.addEventListener("mouseleave", () => {
    hovering = false;
    mouseX = null;
});

animate();

function replaceContent(address) {
    fetch(address) 
        .then(response => response.text())
        .then(htmlContent => {
            document.getElementById('content').innerHTML = htmlContent;
        })
        .catch(error => {
            console.error('Error loading external content:', error);
        });
}
/* ------------------------------------------------- */
