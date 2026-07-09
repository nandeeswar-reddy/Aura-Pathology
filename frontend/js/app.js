// ====================================================================
// AURA Pathology Analytics Platform — Frontend Application Logic
// SPA Routing | Auth | Inference | Plotly | GSAP | Particles
// ====================================================================

// ── STATE ──
let currentUser = null;
let currentToken = sessionStorage.getItem("aura_token") || null;
let activeReportData = null;

// ── ICONS ──
function initIcons() {
    if (window.lucide) window.lucide.createIcons();
}

// ====================================================================
// PARTICLE SYSTEM — Floating medical dots on canvas
// ====================================================================
const particleCanvas = document.getElementById("particles-canvas");
const pCtx = particleCanvas ? particleCanvas.getContext("2d") : null;
let particles = [];

function initParticles() {
    if (!pCtx) return;
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1
        });
    }
    animateParticles();
}

function resizeCanvas() {
    if (!particleCanvas) return;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

let isParticlesPaused = false;

function animateParticles() {
    if (!pCtx) return;
    
    requestAnimationFrame(animateParticles);
    
    if (isParticlesPaused) return;

    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = particleCanvas.width;
        if (p.x > particleCanvas.width) p.x = 0;
        if (p.y < 0) p.y = particleCanvas.height;
        if (p.y > particleCanvas.height) p.y = 0;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(255, 168, 0, ${p.opacity})`;
        pCtx.fill();
    });
    // Draw connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 14400) { // 120^2 = 14400
                const dist = Math.sqrt(distSq); // Only calculate root if within range to save CPU
                pCtx.beginPath();
                pCtx.moveTo(particles[i].x, particles[i].y);
                pCtx.lineTo(particles[j].x, particles[j].y);
                pCtx.strokeStyle = `rgba(255, 168, 0, ${0.04 * (1 - dist / 120)})`;
                pCtx.lineWidth = 0.5;
                pCtx.stroke();
            }
        }
    }
    }

// ====================================================================
// PARALLAX MOUSE EFFECT — Orbs follow cursor subtly
// ====================================================================
function initParallax() {
    // Cache the DOM query OUTSIDE the event listener to fix severe performance drop on mouse movement
    const orbs = document.querySelectorAll(".parallax-orb");
    
    document.addEventListener("mousemove", (e) => {
        // Use requestAnimationFrame to throttle mousemove rendering
        requestAnimationFrame(() => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            orbs.forEach((orb, i) => {
                const factor = (i + 1) * 12;
                orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
            });
        });
    }, { passive: true }); // Make listener passive for smoother scrolling
}

// ====================================================================
// SCROLL REVEAL — IntersectionObserver for .reveal elements
// ====================================================================
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

// ====================================================================
// HEADER SCROLL EFFECT
// ====================================================================
function initHeaderScroll() {
    const header = document.getElementById("app-header");
    if (!header) return;
    window.addEventListener("scroll", () => {
        if (window.scrollY > 30) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });
}

// ====================================================================
// ROUTING
// ====================================================================
const PRIVATE_ROUTES = ["#dashboard", "#scan", "#history", "#report", "#profile"];
const PUBLIC_ONLY_ROUTES = ["#login", "#signup"];

function getRouteInfo() {
    const hash = window.location.hash || "#home";
    const parts = hash.split("?");
    const route = parts[0];
    const params = {};
    if (parts[1]) {
        parts[1].split("&").forEach(p => {
            const pair = p.split("=");
            params[pair[0]] = decodeURIComponent(pair[1] || "");
        });
    }
    return { route, params };
}

function handleRouting() {
    const { route, params } = getRouteInfo();
    
    // Auth guards
    if (PRIVATE_ROUTES.includes(route) && !currentToken) {
        window.location.hash = "#login";
        return;
    }
    if (PUBLIC_ONLY_ROUTES.includes(route) && currentToken) {
        window.location.hash = "#dashboard";
        return;
    }
    
    // Hide all views
    document.querySelectorAll(".page-view").forEach(v => {
        v.style.display = "none";
        v.classList.remove("visible");
    });
    
    // Deactivate nav links
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    
    // Show target view
    const viewId = `view-${route.replace("#", "")}`;
    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = "block";
        // GSAP animation
        if (window.gsap) {
            gsap.fromTo(target, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", onComplete: () => { target.classList.add("visible"); } });
        } else {
            target.classList.add("visible");
        }
    } else {
        const home = document.getElementById("view-home");
        if (home) {
            home.style.display = "block";
            home.classList.add("visible");
        }
    }
    
    // Highlight nav
    const activeLink = document.querySelector(`.nav-link[href="${route}"]`);
    if (activeLink) activeLink.classList.add("active");
    
    // Close mobile nav
    const mobileNav = document.getElementById("mobile-nav");
    if (mobileNav) mobileNav.classList.remove("open");
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Route-specific initializers
    if (route === "#dashboard") fetchDashboardData();
    else if (route === "#history") fetchHistoryLogs();
    else if (route === "#report") {
        if (params.id) fetchReportDetails(params.id);
        else window.location.hash = "#history";
    }
    else if (route === "#profile") fetchProfileStats();
    
    // ── Auth Grid Animation Control ──
    // Pause all auth page animations when not on login/signup to save GPU.
    // Resume them when navigating back to those pages.
    const isAuthPage = (route === "#login" || route === "#signup");
    const loginGridBg = document.getElementById("login-grid-bg");
    const signupGridBg = document.getElementById("signup-grid-bg");
    
    if (isAuthPage) {
        // Resume particles
        isParticlesPaused = false;
        if (particleCanvas) particleCanvas.style.opacity = '1';
    } else {
        // Pause particles to save GPU when on dashboard/history
        isParticlesPaused = true;
        if (particleCanvas) particleCanvas.style.opacity = '0';
    }
    
    // Re-render icons for dynamically added elements
    setTimeout(initIcons, 50);
    // Re-observe reveal elements
    setTimeout(initScrollReveal, 100);
}

window.addEventListener("hashchange", handleRouting);

// ====================================================================
// INITIALIZATION
// ====================================================================
window.addEventListener("DOMContentLoaded", () => {
    initIcons();
    initParticles();
    initParallax();
    initScrollReveal();
    initHeaderScroll();
    initDropzone();
    initPipelineHover();
    
    checkAuthState().then(() => {
        handleRouting();
    });
});

// Mobile menu
document.getElementById("mobile-menu-btn").addEventListener("click", () => {
    const nav = document.getElementById("mobile-nav");
    nav.classList.toggle("open");
});

// ====================================================================
// AUTHENTICATION
// ====================================================================
async function checkAuthState() {
    if (!currentToken) {
        showGuestState();
        return;
    }
    try {
        const res = await fetch("/profile", {
            headers: { "Authorization": `Bearer ${currentToken}` }
        });
        if (res.ok) {
            currentUser = await res.json();
            showUserState();
        } else {
            logoutSession();
        }
    } catch (e) {
        console.error("Auth check failed:", e);
        showGuestState();
    }
}

function showUserState() {
    document.getElementById("nav-guest-btns").style.display = "none";
    document.getElementById("nav-user-btns").style.display = "flex";
    
    const mobileGuest = document.getElementById("mobile-guest-btns");
    const mobileUser = document.getElementById("mobile-user-btns");
    if (mobileGuest) mobileGuest.style.display = "none";
    if (mobileUser) mobileUser.style.display = "flex";
    
    if (currentUser) {
        const initials = currentUser.full_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
        const avatarEl = document.getElementById("user-avatar-initials");
        if (avatarEl) avatarEl.innerText = initials;
        const profInit = document.getElementById("prof-initials");
        if (profInit) profInit.innerText = initials;
    }
    
    // Update home CTA to go to scan
    const ctaBtn = document.getElementById("home-cta-btn");
    if (ctaBtn) ctaBtn.href = "#scan";
}

function showGuestState() {
    document.getElementById("nav-guest-btns").style.display = "flex";
    document.getElementById("nav-user-btns").style.display = "none";
    
    const mobileGuest = document.getElementById("mobile-guest-btns");
    const mobileUser = document.getElementById("mobile-user-btns");
    if (mobileGuest) mobileGuest.style.display = "flex";
    if (mobileUser) mobileUser.style.display = "none";
    
    currentUser = null;
    currentToken = null;
    sessionStorage.removeItem("aura_token");
    
    // Reset home CTA to login
    const ctaBtn = document.getElementById("home-cta-btn");
    if (ctaBtn) ctaBtn.href = "#login";
}

function logoutSession() {
    if (currentToken) {
        fetch("/logout", { method: "POST", headers: { "Authorization": `Bearer ${currentToken}` } }).catch(() => {});
    }
    showGuestState();
    window.location.hash = "#home";
}

// Logout buttons
document.getElementById("btn-logout").addEventListener("click", (e) => { e.preventDefault(); logoutSession(); });
const mobileLogout = document.getElementById("mobile-btn-logout");
if (mobileLogout) mobileLogout.addEventListener("click", logoutSession);
const profileLogout = document.getElementById("btn-profile-logout");
if (profileLogout) profileLogout.addEventListener("click", logoutSession);

// ====================================================================
// LOGIN FORM
// ====================================================================
document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorMsg = document.getElementById("login-error-msg");
    errorMsg.classList.remove("show");
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    
    try {
        const res = await fetch("/login", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
            currentToken = data.token;
            sessionStorage.setItem("aura_token", currentToken);
            await checkAuthState();
            window.location.hash = "#dashboard";
        } else {
            errorMsg.innerText = data.detail || "Authentication failed.";
            errorMsg.classList.add("show");
        }
    } catch (err) {
        errorMsg.innerText = "Network connection failed.";
        errorMsg.classList.add("show");
    }
});

// ====================================================================
// SIGNUP FORM
// ====================================================================
document.getElementById("form-signup").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm-password").value;
    const institution = document.getElementById("signup-institution").value;
    const country = document.getElementById("signup-country").value;
    const role = document.getElementById("signup-role").value;
    const errorMsg = document.getElementById("signup-error-msg");
    errorMsg.classList.remove("show");
    
    if (password !== confirm) {
        errorMsg.innerText = "Passwords do not match.";
        errorMsg.classList.add("show");
        return;
    }
    
    const formData = new FormData();
    formData.append("full_name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("institution", institution);
    formData.append("country", country);
    formData.append("role", role);
    
    try {
        const res = await fetch("/signup", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
            currentToken = data.token;
            sessionStorage.setItem("aura_token", currentToken);
            await checkAuthState();
            window.location.hash = "#dashboard";
        } else {
            errorMsg.innerText = data.detail || "Registration failed.";
            errorMsg.classList.add("show");
        }
    } catch (err) {
        errorMsg.innerText = "Network connection failed.";
        errorMsg.classList.add("show");
    }
});

// ====================================================================
// DASHBOARD
// ====================================================================
async function fetchDashboardData() {
    if (!currentToken) return;
    try {
        const profileRes = await fetch("/profile", { headers: { "Authorization": `Bearer ${currentToken}` } });
        if (profileRes.ok) {
            const data = await profileRes.json();
            currentUser = data;
            const dashName = document.getElementById("dash-username");
            if (dashName) dashName.innerText = data.full_name;
            const totalEl = document.getElementById("stat-total-scans");
            if (totalEl) totalEl.innerText = data.statistics.total_scans;
            const successEl = document.getElementById("stat-success-scans");
            if (successEl) successEl.innerText = data.statistics.total_scans;
            const avgEl = document.getElementById("stat-avg-confidence");
            if (avgEl) avgEl.innerText = `${data.statistics.average_confidence}%`;
        }
        
        // Activity feed
        const histRes = await fetch("/history", { headers: { "Authorization": `Bearer ${currentToken}` } });
        if (histRes.ok) {
            const logs = await histRes.json();
            const container = document.getElementById("dashboard-activity-container");
            if (!container) return;
            container.innerHTML = "";
            
            if (logs.length === 0) {
                container.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--text-dim);font-size:0.85rem;">No recent pathology scans.</div>`;
                return;
            }
            
            logs.slice(0, 6).forEach(log => {
                const isCancer = log.prediction.includes("Cancer");
                const riskClass = log.risk_level === "High Risk" ? "risk-high" : log.risk_level === "Moderate Risk" ? "risk-moderate" : "risk-low";
                
                const item = document.createElement("div");
                item.className = "activity-item";
                item.innerHTML = `
                    <div class="activity-meta">
                        <span class="activity-id">SCAN #${log.id}</span>
                        <span class="activity-prediction">${log.prediction} <span class="risk-badge ${riskClass}">${log.risk_level}</span></span>
                    </div>
                    <div class="activity-right">
                        <span class="activity-date">${log.date}</span>
                        <a href="#report?id=${log.id}" style="font-size:0.72rem;color:var(--cyan);">View &rarr;</a>
                    </div>
                `;
                container.appendChild(item);
            });
        }
    } catch (e) {
        console.error("Dashboard fetch failed:", e);
    }
}

// ====================================================================
// PROFILE
// ====================================================================
async function fetchProfileStats() {
    if (!currentToken) return;
    try {
        const res = await fetch("/profile", { headers: { "Authorization": `Bearer ${currentToken}` } });
        if (res.ok) {
            const data = await res.json();
            const profName = document.getElementById("prof-name");
            if (profName) profName.innerText = data.full_name;
            const profEmail = document.getElementById("prof-email");
            if (profEmail) profEmail.innerText = data.email;
            const profInst = document.getElementById("prof-institution");
            if (profInst) profInst.innerText = data.institution;
            const profCountry = document.getElementById("prof-country");
            if (profCountry) profCountry.innerText = data.country;
            const profDate = document.getElementById("prof-date");
            if (profDate) profDate.innerText = (data.created_at || "").split(" ")[0];
            const profRole = document.getElementById("prof-role-badge");
            if (profRole) profRole.innerText = data.role;
        }
    } catch (err) {
        console.error("Profile fetch error:", err);
    }
}

// ====================================================================
// SCAN IMAGE — Drag & Drop + Execution
// ====================================================================
let selectedScanFile = null;

function initDropzone() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("scan-file-input");
    if (!dropzone || !fileInput) return;
    
    dropzone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) handleSelectedFile(e.target.files[0]);
    });
    
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragover"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) handleSelectedFile(e.dataTransfer.files[0]);
    });
    
    const clearBtn = document.getElementById("btn-clear-scan");
    if (clearBtn) clearBtn.addEventListener("click", (e) => { e.stopPropagation(); resetUploadState(); });
    
    const triggerBtn = document.getElementById("btn-trigger-scan");
    if (triggerBtn) triggerBtn.addEventListener("click", executeScan);
    
    const resetBtn = document.getElementById("btn-new-scan-reset");
    if (resetBtn) resetBtn.addEventListener("click", () => { resetUploadState(); showScanEmptyState(); });
}

function handleSelectedFile(file) {
    selectedScanFile = file;
    const nameEl = document.getElementById("preview-filename");
    if (nameEl) nameEl.innerText = file.name;
    const sizeEl = document.getElementById("preview-filesize");
    if (sizeEl) sizeEl.innerText = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    const previewCard = document.getElementById("scan-file-preview-card");
    if (previewCard) previewCard.classList.add("show");
    const dropzone = document.getElementById("dropzone");
    if (dropzone) dropzone.style.display = "none";
    initIcons();
}

function resetUploadState() {
    selectedScanFile = null;
    const fileInput = document.getElementById("scan-file-input");
    if (fileInput) fileInput.value = "";
    const previewCard = document.getElementById("scan-file-preview-card");
    if (previewCard) previewCard.classList.remove("show");
    const dropzone = document.getElementById("dropzone");
    if (dropzone) dropzone.style.display = "flex";
    const notesEl = document.getElementById("scan-notes");
    if (notesEl) notesEl.value = "";
}

async function executeScan() {
    if (!selectedScanFile) {
        alert("Please select a histopathology image file first.");
        return;
    }
    
    const notes = (document.getElementById("scan-notes") || {}).value || "";
    
    // Show loading, hide others
    showEl("scan-loading-state"); hideEl("scan-empty-state"); hideEl("scan-result-card");
    
    const formData = new FormData();
    formData.append("file", selectedScanFile);
    formData.append("notes", notes);
    
    try {
        const res = await fetch("/scan", {
            method: "POST",
            headers: { "Authorization": `Bearer ${currentToken}` },
            body: formData
        });
        if (res.ok) {
            const data = await res.json();
            displayScanResult(data);
        } else {
            const err = await res.json();
            alert(err.detail || "Error performing scan.");
            showScanEmptyState();
        }
    } catch (e) {
        alert("Connection error executing inference pipeline.");
        showScanEmptyState();
    }
}

function showScanEmptyState() {
    hideEl("scan-loading-state"); hideEl("scan-result-card"); showEl("scan-empty-state");
}

function displayScanResult(data) {
    hideEl("scan-loading-state"); hideEl("scan-empty-state");
    const card = document.getElementById("scan-result-card");
    if (card) card.style.display = "block";
    
    setImgSrc("result-original-img", data.original_image);
    setImgSrc("result-gradcam-img", data.gradcam_image);
    
    const diagBadge = document.getElementById("result-diagnosis-badge");
    if (diagBadge) {
        diagBadge.innerText = data.prediction;
        diagBadge.style.color = data.prediction.includes("Cancer") ? "var(--danger)" : "var(--success)";
    }
    
    setTextContent("result-confidence", `${data.confidence}%`);
    
    const riskEl = document.getElementById("result-risk-level");
    if (riskEl) {
        riskEl.innerText = data.risk_level;
        riskEl.style.color = data.risk_level === "High Risk" ? "var(--danger)" : data.risk_level === "Moderate Risk" ? "var(--warning)" : "var(--success)";
    }
    
    setTextContent("result-speed", `${data.inference_time}s`);
    setTextContent("result-version", data.model_version);
    setTextContent("result-dataset", (data.dataset || "").split(" ")[0]);
    
    drawProbabilityChart("result-probability-chart", data.probabilities);
    
    // Opacity slider
    const slider = document.getElementById("gradcam-opacity-slider");
    const camImg = document.getElementById("result-gradcam-img");
    if (slider && camImg) {
        slider.value = 70;
        camImg.style.opacity = "0.7";
        slider.oninput = (e) => { camImg.style.opacity = `${e.target.value / 100}`; };
    }
    
    // PDF button → report page
    const pdfBtn = document.getElementById("btn-download-scan-pdf");
    if (pdfBtn) pdfBtn.onclick = () => { window.location.hash = `#report?id=${data.id}`; };
    
    initIcons();
}

// ====================================================================
// PLOTLY CHART
// ====================================================================
function drawProbabilityChart(elementId, probabilities, isPrint = false) {
    const el = document.getElementById(elementId);
    if (!el || !probabilities) return;
    
    const labels = Object.keys(probabilities).map(l => l.replace(" (Cancer)", "").replace("Benign ", "B. "));
    const values = Object.values(probabilities);
    
    const trace = {
        x: values,
        y: labels,
        type: "bar",
        orientation: "h",
        marker: {
            color: Object.keys(probabilities).map(l => l.includes("Benign") ? (isPrint ? "#1d3bd1" : "#4466ff") : (isPrint ? "#d97706" : "#FFA800")),
            line: { width: 0 }
        }
    };
    
    const layout = {
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        xaxis: {
            gridcolor: isPrint ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.03)",
            zeroline: false,
            tickformat: ".0%",
            tickfont: { color: isPrint ? "#444444" : "#9CA3AF", size: 9 },
            range: [0, 1.05]
        },
        yaxis: {
            tickfont: { color: isPrint ? "#111111" : "#E4E4E7", size: 9 },
            automargin: true
        },
        margin: { l: 10, r: 10, t: 5, b: 5 },
        height: 150,
        bargap: 0.3
    };
    
    Plotly.newPlot(elementId, [trace], layout, { displayModeBar: false, responsive: true });
}

// ====================================================================
// HISTORY
// ====================================================================
let allHistoryLogs = [];

async function fetchHistoryLogs() {
    if (!currentToken) return;
    try {
        const res = await fetch("/history", { headers: { "Authorization": `Bearer ${currentToken}` } });
        if (res.ok) {
            allHistoryLogs = await res.json();
            renderHistoryTable(allHistoryLogs);
        }
    } catch (e) {
        console.error("History fetch error:", e);
    }
}

function renderHistoryTable(logs) {
    const tbody = document.getElementById("history-table-body");
    const emptyEl = document.getElementById("history-empty");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    if (logs.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
    }
    if (emptyEl) emptyEl.style.display = "none";
    
    logs.forEach(log => {
        const riskClass = log.risk_level === "High Risk" ? "risk-high" : log.risk_level === "Moderate Risk" ? "risk-moderate" : "risk-low";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="table-id">#${log.id}</td>
            <td class="table-date">${log.date}</td>
            <td class="table-prediction">${log.prediction}</td>
            <td class="table-confidence">${log.confidence}%</td>
            <td><span class="risk-badge ${riskClass}">${log.risk_level}</span></td>
            <td style="text-align:right;">
                <div class="table-actions">
                    <a href="#report?id=${log.id}" class="table-action-btn"><i data-lucide="eye" style="width:12px;height:12px;"></i> Open</a>
                    <button onclick="triggerDeleteReport(${log.id})" class="table-action-btn delete-btn"><i data-lucide="trash-2" style="width:12px;height:12px;"></i> Del</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    initIcons();
}

// Filters
const searchInput = document.getElementById("history-search");
const filterClass = document.getElementById("history-filter-class");
const filterRisk = document.getElementById("history-filter-risk");

function applyHistoryFilters() {
    const q = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const c = filterClass ? filterClass.value : "";
    const r = filterRisk ? filterRisk.value : "";
    
    const filtered = allHistoryLogs.filter(log => {
        const matchQ = log.prediction.toLowerCase().includes(q) || String(log.id).includes(q);
        const matchC = c === "" || log.prediction.includes(c);
        const matchR = r === "" || log.risk_level === r;
        return matchQ && matchC && matchR;
    });
    renderHistoryTable(filtered);
}

if (searchInput) searchInput.addEventListener("input", applyHistoryFilters);
if (filterClass) filterClass.addEventListener("change", applyHistoryFilters);
if (filterRisk) filterRisk.addEventListener("change", applyHistoryFilters);

async function triggerDeleteReport(id) {
    if (!confirm("Permanently delete this diagnostic report?")) return;
    try {
        const res = await fetch(`/report/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${currentToken}` } });
        if (res.ok) {
            allHistoryLogs = allHistoryLogs.filter(l => l.id !== id);
            renderHistoryTable(allHistoryLogs);
        } else {
            alert("Failed to delete report.");
        }
    } catch (e) {
        alert("Connection error.");
    }
}

// ====================================================================
// REPORT DETAILS
// ====================================================================
async function fetchReportDetails(id) {
    try {
        const res = await fetch(`/report/${id}`, { headers: { "Authorization": `Bearer ${currentToken}` } });
        if (res.ok) {
            const data = await res.json();
            renderReportView(data);
        } else {
            alert("Unable to fetch report.");
            window.location.hash = "#history";
        }
    } catch (e) {
        console.error("Report fetch error:", e);
    }
}

function renderReportView(data) {
    activeReportData = data; // Save globally for print mode re-rendering
    setTextContent("rep-id", data.id);
    setTextContent("rep-date", data.date);
    setImgSrc("rep-orig-img", data.original_image_path);
    setImgSrc("rep-cam-img", data.gradcam_image_path);
    
    const classEl = document.getElementById("rep-class");
    if (classEl) {
        classEl.innerText = data.prediction;
        classEl.style.color = data.prediction.includes("Cancer") ? "var(--danger)" : "var(--success)";
    }
    
    setTextContent("rep-confidence", `${data.confidence}%`);
    
    const riskEl = document.getElementById("rep-risk");
    if (riskEl) {
        riskEl.innerText = data.risk_level;
        riskEl.style.color = data.risk_level === "High Risk" ? "var(--danger)" : data.risk_level === "Moderate Risk" ? "var(--warning)" : "var(--success)";
    }
    
    setTextContent("rep-latency", `${data.inference_time}s`);
    
    const notesEl = document.getElementById("rep-notes");
    if (notesEl) notesEl.innerText = (data.notes && data.notes.trim()) ? data.notes : "No clinical annotations added.";
    
    drawProbabilityChart("rep-probability-chart", data.probabilities);
    
    const deleteBtn = document.getElementById("btn-delete-rep");
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (confirm("Delete this report permanently?")) {
                try {
                    const res = await fetch(`/report/${data.id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${currentToken}` } });
                    if (res.ok) { alert("Report deleted."); window.location.hash = "#history"; }
                } catch (e) { alert("Failed."); }
            }
        };
    }
    
    const printBtn = document.getElementById("btn-download-rep-pdf");
    if (printBtn) {
        printBtn.onclick = () => {
            // Draw chart in print mode before printing
            drawProbabilityChart("rep-probability-chart", data.probabilities, true);
            
            // Allow a small delay for Plotly to render the changes to the SVG
            setTimeout(() => {
                window.print();
                // Revert to dark mode after printing starts
                drawProbabilityChart("rep-probability-chart", data.probabilities, false);
            }, 200);
        };
    }
    
    initIcons();
}

// ====================================================================
// PIPELINE HOVER ANIMATION (Architecture page)
// ====================================================================
function initPipelineHover() {
    document.querySelectorAll(".pipeline-node").forEach(node => {
        node.style.cursor = "pointer";
        node.addEventListener("mouseenter", () => {
            if (window.gsap) {
                const rect = node.querySelector("rect");
                const circle = node.querySelector("circle");
                if (rect) gsap.to(rect, { attr: { "stroke-width": 3 }, duration: 0.2 });
                if (circle) gsap.to(circle, { attr: { "stroke-width": 3 }, duration: 0.2 });
            }
        });
        node.addEventListener("mouseleave", () => {
            if (window.gsap) {
                const rect = node.querySelector("rect");
                const circle = node.querySelector("circle");
                if (rect) gsap.to(rect, { attr: { "stroke-width": 1.5 }, duration: 0.2 });
                if (circle) gsap.to(circle, { attr: { "stroke-width": 1.5 }, duration: 0.2 });
            }
        });
    });
}

// ====================================================================
// CONTACT FORM
// ====================================================================
const contactForm = document.getElementById("form-contact");
if (contactForm) {
    contactForm.addEventListener("submit", () => {
        const successMsg = document.getElementById("contact-success-msg");
        const submitBtn = contactForm.querySelector("button[type='submit']");
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Sending Message...";
        }
        
        // Browser submits the form naturally to the hidden iframe.
        // We show the success feedback and clear the form after 1.5 seconds.
        setTimeout(() => {
            if (successMsg) {
                successMsg.innerText = "Message sent successfully! Please check nandeswar72@gmail.com for a FormSubmit confirmation email if this is your first time.";
                successMsg.classList.add("show");
            }
            contactForm.reset();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Inquiry";
            }
            setTimeout(() => { if (successMsg) successMsg.classList.remove("show"); }, 5000);
        }, 1500);
    });
}

// ====================================================================
// UTILITY HELPERS
// ====================================================================
function showEl(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = "flex";
        el.classList.add("show");
    }
}

function hideEl(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = "none";
        el.classList.remove("show");
    }
}

function setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function setImgSrc(id, src) {
    const el = document.getElementById(id);
    if (el) el.src = src;
}

// ── PRINT EVENT LISTENERS FOR MEDICAL GRADE REPORTING ──
window.addEventListener("beforeprint", () => {
    if (window.location.hash.startsWith("#report") && activeReportData) {
        drawProbabilityChart("rep-probability-chart", activeReportData.probabilities, true);
    }
});

window.addEventListener("afterprint", () => {
    if (window.location.hash.startsWith("#report") && activeReportData) {
        drawProbabilityChart("rep-probability-chart", activeReportData.probabilities, false);
    }
});
