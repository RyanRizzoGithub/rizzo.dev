const root = document.documentElement;
let canvas, ctx, barWidth, spacing, totalBars, bars, maxHeight, baseY, stdDev;
let mouseX = null;
let hovering = false;
let defaultMeanX;
let darkMode = true;
let sidebarOpen = false;
let overlayDeployed = false;
let sidebarCollapsed = true;
let currentColor = 4;


function initGraph() {
    canvas = document.getElementById("graph");
    if (!canvas) return;

    ctx = canvas.getContext("2d");
    barWidth = 6;
    spacing = 2;
    totalBars = Math.floor(canvas.width / (barWidth + spacing));
    bars = new Array(totalBars).fill(0);
    maxHeight = 40;
    baseY = canvas.height - 30;
    stdDev = 80;
    defaultMeanX = canvas.width * 0.5;

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
    });

    canvas.addEventListener("mouseenter", () => {
        hovering = true;
    });

    animate();
}

function toggleSidebar() {
    let sidebar = document.getElementById("sidebar-container");
    let content = document.getElementById("content");
    if (sidebarOpen) {
        sidebar.style.setProperty("margin-left", "-250px");
        content.style.setProperty("margin-left", "0px");
        content.style.setProperty("width", "100vw");
        sidebarOpen = false;
        if (overlayDeployed) {
            content.style.setProperty("margin-left", "0px");
            overlayDeployed = false;
        }
       
    } else {
        sidebar.style.setProperty("margin-left", "0");
        content.style.setProperty("margin-left", "250px");
        content.style.setProperty("width", "calc(100vw - 250px)");
        sidebarOpen = true;
        if (window.innerWidth < 800) {
            content.style.setProperty("margin-left", "100vw");
            overlayDeployed = true;
        }
    }
}

function load() {
    replaceContent('home.html');
    checkWidth();
}

function checkWidth() {
    if (window.innerWidth > 800) {
        sidebarCollapsed = false;
        toggleSidebar();
    }
}

window.onresize = function() {
    if (window.innerWidth < 800 & sidebarOpen) {
        toggleSidebar();
        sidebarCollapsed = true;
    }
    if (window.innerWidth >= 800 & sidebarCollapsed) {
        toggleSidebar();
        sidebarCollapsed = false;
        overlay = document.getElementById("content-overlay");
        overlay.style.setProperty('left', '100vw');
        overlayDeployed = false;
    }
};

/* ---------- Color functions ------------------------ */
function colorToggle() {
    let colors = ['#ed6363', '#e89656', '#caad39', '#2eba4a', '#3c92cb', '#9871ed'];
    currentColor++;
    if (currentColor == 6) currentColor = 0;
    root.style.setProperty("--accent-color", colors[currentColor]);
}

function getCurrentColor() {
    let colors = ['#ed6363', '#e89656', '#caad39', '#2eba4a', '#3c92cb', '#9871ed'];
    return colors[currentColor];
}

function lightDarkToggle() {
    if (darkMode) {
        darkMode = false;
        root.style.setProperty("--primary-text-color", '#181818');
        root.style.setProperty("--secondary-text-color", '#2C2C2C');
        root.style.setProperty("--tertiary-text-color", '#575757');
        root.style.setProperty("--background-color", '#fffdf8');
        root.style.setProperty("--overlay-color", 'rgba(0, 0, 0, 0.04)');
        
        const moon = document.getElementById('sunmoon');
        moon.classList.remove('fa-sun-o');
        moon.classList.add('fa-moon-o');

        const logo = document.getElementById('logo');
        logo.src = 'images/logo-black.png';
        
    }
    else {
        darkMode = true;
        root.style.setProperty("--primary-text-color", '#fbfbfb');
        root.style.setProperty("--secondary-text-color", '#cccccc');
        root.style.setProperty("--tertiary-text-color", '#a6a5a5');
        root.style.setProperty("--background-color", '#28292f');
        root.style.setProperty("--overlay-color", 'rgba(0, 0, 0, 0.1)');

        const sun = document.getElementById('sunmoon');
        sun.classList.remove('fa-moon-o');
        sun.classList.add('fa-sun-o');

        const logo = document.getElementById('logo');
        logo.src = 'images/logo-white.png';
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

/* ------------ Graph functions ---------------- */
function gaussian(x, mean, stdDev) {
    const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
    return Math.exp(exponent);
}
function drawBars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var currentMeanX = mouseX != null ? mouseX : defaultMeanX;

    for (let i = 0; i < totalBars; i++) {
        const x = i * (barWidth + spacing);
        const barCenter = x + barWidth / 2;
        const intensity = gaussian(barCenter, currentMeanX, stdDev);
        bars[i] = intensity * maxHeight + 10;

        const height = bars[i];
        const y = baseY - height;

        ctx.fillStyle = getCurrentColor();
        ctx.fillRect(x, y, barWidth/3, height);
        ctx.fillStyle = darkMode ? '#CCCCCC' : '#2C2C2C';
        ctx.fillRect(x, y + height, barWidth/3, 10);
    }
}
function animate() {
    if (!canvas) return;
    drawBars();
    requestAnimationFrame(animate);
}

/* ------------ Modified replaceContent ---------------- */
function replaceContent(address, scrollTargetId = null, offset = 0) {
    console.log(address);
    fetch(address) 
        .then(response => response.text())
        .then(htmlContent => {
            document.getElementById('content').innerHTML = htmlContent;
            
            if (address === 'home.html') {
                initGraph();
            }

            // Scroll to the target element with offset if provided
            if (scrollTargetId) {
                const target = document.getElementById(scrollTargetId);
                if (target) {
                    const elementPosition = target.getBoundingClientRect().top + window.scrollY;
                    const offsetPosition = elementPosition - 100;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            }
            if (window.innerWidth < 800 & sidebarOpen) {
                toggleSidebar();
            }
        })

        


        .catch(error => {
            console.error('Error loading external content:', error);
        });
}


function setScroll(scrollY) {
    window.scrollTo(0, scrollY);
}

/* ------------ Init on first load ---------------- */
document.addEventListener("DOMContentLoaded", initGraph);


