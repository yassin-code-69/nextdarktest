// --- GLOBAL VARIABLES ---
let courseMapping = {}; 
let teacherMapping = {}; 
let rawExcelData = []; 
let currentFilteredData = []; 
let teacherProfileDB = {}; // 👈 এটি নতুন যোগ করলাম

// 🔥 FIX: Local Routine File Connection
const ROUTINE_FILE_URL = "routine.xlsx"; 

/* ==================== 📝 EXAM ROUTINE VARIABLES 📝 ==================== */
let rawExamData = []; 
let currentMode = 'class'; // By default class mode

// তোমার নতুন মার্জ করা এক্সাম ফাইলের নাম
const EXAM_FILE_URL = "mid_exam_routine_cse_spring.xlsx";

const initialCourses = `CSE-1101: Introduction of Computer Science
CSE-1102: Analog Electronics
CSE-1103: Analog Electronics (Lab)
CSE-1104: Math-I (Differential Calculus & Coordinate Geometry)
CSE-1105: English I
CSE-1106: Business Organization
CSE-1201: Structural Programming Language
CSE-1202: Structural Programming Language Lab
CSE-1204: Digital Logic
CSE-1205: Digital Logic (Lab)
CSE-1203: Integral Calculus & Differential Equation
CSE-1206: English II
CSE-1301: Physics
CSE-1302: Physics (Lab)
CSE-1303: Electronic Device & Circuit
CSE-1304: Electronic Device & Circuit (Lab)
CSE-1305: Object Oriented Programming
CSE-1306: Object Oriented Programming (Lab)
CSE-1307: Government
CSE-2101: Programming Language (Java)
CSE-2102: Programming Language (Java) Lab
CSE-2103: Data Structure
CSE-2104: Data Structure (Lab)
CSE-2105: Discrete Mathematics
CSE-2106: Linear Algebra, Complex Variable
CSE-2201: Algorithm
CSE-2202: Algorithm (Lab)
CSE-2203: Microprocessor & Assembly Language
CSE-2204: Microprocessor & Assembly Language (Lab)
CSE-2205: Statistics & Probability
CSE-2301: Theory of Computation
CSE-2302: Data Communication
CSE-2303: Electrical Drives and Instrumentation
CSE-2304: Electrical Drives and Instrumentation (Lab)
CSE-2305: Web Programming
CSE-3101: Database System
CSE-3102: Database System (Lab)
CSE-3103: Operating System
CSE-3104: Operating System (Lab)
CSE-3105: Accounting
CSE-3106: VLSI Design
CSE-3201: Compiler Design
CSE-3202: Compiler Design (Lab)
CSE-3203: Digital System Design
CSE-3204: Digital System Design (Lab)
CSE-3205: Digital Electronics & Pulse Technique
CSE-3206: Software Engineering
CSE-3301: Pattern Recognition
CSE-3302: Pattern Recognition (Lab)
CSE-3303: Computer Network
CSE-3304: Computer Network (Lab)
CSE-3305: E-Commerce
CSE-3306: Numerical Method
CSE-4101: Project & Thesis I
CSE-4102: Artificial Intelligence
CSE-4103: Artificial Intelligence (Lab)
CSE-4104: Accounting & Introduction to Finance & International Trade
CSE-4105: Elective Major I
CSE-4201: Project & Thesis II
CSE-4202: Computer Graphics
CSE-4203: Computer Graphics (Lab)
CSE-4204: System Analysis & Design
CSE-4205: System Analysis & Design (Lab)
CSE-4301: Project & Thesis III
CSE-4302: Elective Major II (System Programming)
CSE-4303: Peripheral and Interfacing
CSE-4304: Computer Organization & Architecture`;

const initialTeachers = `AK: Ashraful Kabir
AKP: Akash Kumar Pal
ARK: Mohammad Arifin Rahman Khan
AS: Antor Sarkar
DZH: Dr. Zakir Hossain
FAN: Faria Afrin Niha
FH: Md. Fahad Hossain
IHS: Md. Ibrahim Hosen Sojib
KTT: Khandaker Tanha Tasnia
MH: Md. Mesbahuddin Hasib
MM: Mohammad Mamun
MMA: Mohammad Mamun
MN: Mahmud Naeem
NAN: Nurul Amin Nahid
PSC: Pabon Shaha Chowdhury
QJA: Quazi Jamil Azher
RAS: Reshma Ahmed Swarna
RK: Rokeya Khatun
RU: Md. Riaz Uddin
RUZ: Rifat Uz Zaman
SAM: Sarah Mohsin
SI: Md. Sadiq Iqbal
SJ: Sumaia Jahan
SM: Shishir Mallick
SSN: Siam Sadik Nayem
TH: Tanveer Hasan
UKP: Prof Dr. Uzzal Kumar Prodhan
US: Umme Salma`;

function normalizeKey(str) {
    if (!str) return "";
    return str.toString().toUpperCase().replace(/[\s-]/g, ''); 
}

let userPrefs = { compact: false, use12Hour: true, showRoom: true, showTeacher: true };

document.addEventListener('DOMContentLoaded', () => {
    loadUserPreferences();      // For Cash File 
});

window.onload = async () => {
    document.getElementById('courseMapData').value = localStorage.getItem('course_map') || initialCourses;
    document.getElementById('teacherMapData').value = localStorage.getItem('teacher_map') || initialTeachers;
    
    const savedTheme = localStorage.getItem('routine_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').innerText = savedTheme === 'dark' ? '☀️' : '🌙';
    
    const savedView = localStorage.getItem('routine_view') || 'list';
    updateToggleUI(savedView);
    
    loadPreferences();
    syncMappings();

    document.querySelectorAll('.search-bar input').forEach(input => {
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                searchRoutine();        
            }
        });
    });

    // 🌟 MODE SWITCHER 🌟
    const btnClass = document.getElementById('btn-class');
    const btnExam = document.getElementById('btn-exam');

    if (btnClass && btnExam) {
        btnClass.addEventListener('click', function() {
            currentMode = 'class';
            this.classList.add('active');
            btnExam.classList.remove('active');
            if (document.getElementById('section') && document.getElementById('section').parentElement) {
                document.getElementById('section').parentElement.style.display = 'block'; 
            }
            const primBtn = document.querySelector('.btn-primary');
            if(primBtn) primBtn.innerText = "🔍 FIND CLASS SCHEDULE";
            searchRoutine();
        });

        btnExam.addEventListener('click', function() {
            currentMode = 'exam';
            this.classList.add('active');
            btnClass.classList.remove('active');
            if (document.getElementById('section') && document.getElementById('section').parentElement) {
                document.getElementById('section').parentElement.style.display = 'none'; 
            }
            const primBtn = document.querySelector('.btn-primary');
            if(primBtn) primBtn.innerText = "📝 FIND EXAM SCHEDULE";
            searchRoutine();
        });
    }

    // 🔥 ডেটাবেস লোড
    await autoLoadRoutine();
    await autoLoadExamRoutine();
    await autoLoadTeacherProfiles(); // 👈 এই লাইনটি যোগ করুন

    // URL থেকে ডাটা রিড   ------------ For cash File 
    const urlParams = new URLSearchParams(window.location.search);
    const uDept = urlParams.get('dept');
    const uBatch = urlParams.get('batch');
    const uSec = urlParams.get('sec');
    const uTeacher = urlParams.get('teacher'); 
    
    if ((uDept && uBatch) || uTeacher) {
        if(document.getElementById('dept')) document.getElementById('dept').value = uDept || "";
        if(document.getElementById('batch')) document.getElementById('batch').value = uBatch || "";
        if(document.getElementById('section')) document.getElementById('section').value = uSec || "";
        if(document.getElementById('teacherInit')) document.getElementById('teacherInit').value = uTeacher || "";
        
        searchRoutine(); 
    }
    
    setInterval(() => {
        if (currentMode === 'class') {
            updateLiveStatus();
            updateLiveBanner();
        }
    }, 60000); 

    // 🔥 ডেটাবেস লোড হওয়ার পর লোডিং স্ক্রিন রিমুভ করা 🔥
    setTimeout(() => {
        const loader = document.getElementById('globalLoader');
        if(loader) loader.classList.add('hidden-loader');
    }, 800); // 0.5 সেকেন্ড এক্সট্রা ডিলে দিলাম যাতে এনিমেশনটা সুন্দর করে বোঝা যায়
};

function loadPreferences() {
    const saved = localStorage.getItem('routine_prefs');
    if (saved) userPrefs = JSON.parse(saved);
    document.getElementById('prefCompact').checked = userPrefs.compact;
    document.getElementById('pref12Hour').checked = userPrefs.use12Hour;
    document.getElementById('prefRoom').checked = userPrefs.showRoom;
    document.getElementById('prefTeacher').checked = userPrefs.showTeacher;
    applyPreferencesToBody();
}

function updatePreferences() {
    userPrefs.compact = document.getElementById('prefCompact').checked;
    userPrefs.use12Hour = document.getElementById('pref12Hour').checked;
    userPrefs.showRoom = document.getElementById('prefRoom').checked;
    userPrefs.showTeacher = document.getElementById('prefTeacher').checked;
    
    localStorage.setItem('routine_prefs', JSON.stringify(userPrefs));
    applyPreferencesToBody();
    
    const activeTab = document.querySelector('.day-tab.active');
    const activeDay = activeTab ? activeTab.innerText.split(' (')[0] : "All Days";
    if (currentMode === 'class' && currentFilteredData.length > 0) {
        renderRoutineForDay(activeDay);
        updateLiveBanner();
    }
}

function applyPreferencesToBody() {
    const body = document.body;
    userPrefs.compact ? body.classList.add('pref-compact') : body.classList.remove('pref-compact');
    !userPrefs.showRoom ? body.classList.add('pref-hide-rooms') : body.classList.remove('pref-hide-rooms');
    !userPrefs.showTeacher ? body.classList.add('pref-hide-teachers') : body.classList.remove('pref-hide-teachers');
}

async function autoLoadRoutine() {
    const statusDiv = document.getElementById('fileStatus');
    statusDiv.innerHTML = "⏳ Loading Databases...";
    try {
        const response = await fetch(ROUTINE_FILE_URL);
        if (!response.ok) throw new Error("Routine File not found in folder");
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {type: 'array'});
        rawExcelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});
        statusDiv.innerHTML = "✅ Class DB Connected!";
        statusDiv.style.color = "#10b981";
    } catch (error) {
        console.error(error);
    }
}

// 🌟 NEW: Single File Exam Loader 🌟
async function autoLoadExamRoutine() {
    const statusDiv = document.getElementById('fileStatus');
    try {
        const response = await fetch(EXAM_FILE_URL);
        if (!response.ok) return; 
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {type: 'array'});
        rawExamData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});
        
        if(statusDiv && rawExcelData.length > 0) {
            statusDiv.innerHTML = "✅ All Databases Ready!";
        }
    } catch (error) {
        console.error("Exam load error: ", error);
    }
}

// 🌟 LOAD TEACHER PROFILES FROM JSON 🌟
async function autoLoadTeacherProfiles() {
    try {
        const response = await fetch('teachers.json');
        if (response.ok) {
            teacherProfileDB = await response.json();
            console.log("✅ Teacher Profiles Loaded Successfully!");
        }
    } catch (error) {
        console.error("⚠️ Failed to load teacher profiles:", error);
    }
}

document.getElementById('themeToggle').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggle').innerText = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('routine_theme', newTheme);
};

function updateToggleUI(mode) {
    const btnList = document.getElementById('btnListView');
    const btnGrid = document.getElementById('btnGridView');
    if (mode === 'matrix') {
        btnGrid.classList.add('active');
        btnList.classList.remove('active');
    } else {
        btnList.classList.add('active');
        btnGrid.classList.remove('active');
    }
}

function switchViewMode(mode) {
    localStorage.setItem('routine_view', mode);
    updateToggleUI(mode);
    if (currentMode === 'class') {
        const activeTab = document.querySelector('.day-tab.active');
        const activeDay = activeTab ? activeTab.innerText.split(' (')[0] : "All Days";
        if (currentFilteredData.length > 0) renderRoutineForDay(activeDay);
    } else if (currentMode === 'exam') {
        searchExamRoutineSafe(); // Re-render exam view (List/Grid)
    }
}
document.getElementById('btnListView').onclick = () => switchViewMode('list');
document.getElementById('btnGridView').onclick = () => switchViewMode('matrix');

function syncMappings() {
    courseMapping = {}; teacherMapping = {};
    document.getElementById('courseMapData').value.split('\n').forEach(l => {
        const [k, ...vParts] = l.split(':'); 
        const v = vParts.join(':');
        if(k) courseMapping[normalizeKey(k)] = v?.trim() || "";
    });
    document.getElementById('teacherMapData').value.split('\n').forEach(l => {
        const [k, ...vParts] = l.split(':'); 
        const v = vParts.join(':');
        if(k) teacherMapping[normalizeKey(k)] = v?.trim() || "";
    });
}

function saveMappings() {
    localStorage.setItem('course_map', document.getElementById('courseMapData').value);
    localStorage.setItem('teacher_map', document.getElementById('teacherMapData').value);
    syncMappings();
    alert("Configurations Saved!");
    document.getElementById('mappingModal').classList.add('hidden');
    
    if (currentMode === 'class') {
        const activeTab = document.querySelector('.day-tab.active');
        if(activeTab && currentFilteredData.length > 0) {
            renderRoutineForDay(activeTab.innerText.split(' (')[0]);
            updateLiveBanner();
        }
    } else {
        searchRoutine();
    }
}

function toggleModal(id) { document.getElementById(id).classList.toggle('hidden'); }

document.getElementById('fileInput').onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    document.getElementById('fileStatus').innerText = `✅ ${file.name} Ready`;
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, {type: 'binary'});
        rawExcelData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1});
    };
};

function formatTime(rawTime) {
    if (!rawTime) return "";
    let clean = rawTime.toString().replace(/\./g, ":").replace(/\-/g, " - ").replace(/[a-zA-Z]/g, "").trim();
    if (userPrefs.use12Hour) {
        return clean.split(' - ').map(timePart => {
            let [h, m] = timePart.trim().split(':');
            h = parseInt(h);
            if (isNaN(h)) return timePart;
            let suffix = "AM";
            if (h >= 1 && h <= 7) { h += 12; } 
            if (h >= 12) { suffix = "PM"; if (h > 12) h -= 12; }
            return `${h}:${m || '00'} ${suffix}`;
        }).join(' - ');
    }
    return clean;
}

function getMinutesFromTime(timeStr) {
    if (!timeStr || timeStr === "TBA") return 9999;
    let cleanTime = timeStr.toString().replace(/\./g, ":").replace(/\-/g, " - ").replace(/[a-zA-Z]/g, "").trim();
    let startTime = cleanTime.split('-')[0].trim(); 
    let parts = startTime.split(':');
    let hour = parseInt(parts[0], 10);
    let minute = parseInt(parts[1], 10) || 0;
    if (isNaN(hour)) return 9999;
    if (hour >= 1 && hour <= 7) hour += 12; 
    return (hour * 60) + minute;
}

// ==================== 🌟 MASTER SEARCH SYSTEM 🌟 ====================
function searchRoutine() {
    if (currentMode === 'exam') {
        searchExamRoutineSafe();
        return;
    }

    const deptInput = document.getElementById('dept').value.trim().toUpperCase(); 
    const batch = document.getElementById('batch').value.trim();
    const section = document.getElementById('section').value.trim().toUpperCase();
    const teacherInput = document.getElementById('teacherInit') ? document.getElementById('teacherInit').value.trim().toUpperCase() : "";
    
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"];
    const strictTimePattern = /\d{1,2}[:.]\d{2}/;

    if (deptInput || teacherInput || batch) {
        const newUrl = `${window.location.pathname}?dept=${deptInput}&batch=${batch}&sec=${section}&teacher=${teacherInput}`;
        window.history.pushState({path: newUrl}, '', newUrl);
    }
    
    saveUserPreferences(deptInput, batch, section);   // for cash file 

    const showInlineError = (message) => {
        document.getElementById('routineList').innerHTML = `<div style='text-align:center; padding:30px; color:var(--subtext); font-size:24px; font-weight:600;'>${message}</div>`;
        document.getElementById('dayTabs').innerHTML = "";
        document.getElementById('routineTitle').innerText = "Notice";
        document.getElementById('classCount').innerText = "0 Classes";
        document.getElementById('currentDate').innerText = "";
        document.getElementById('resultSection').classList.remove('hidden');
        document.getElementById('liveStatusContainer').classList.add('hidden');
    };

    if(!rawExcelData.length) {
        showInlineError("⚠️ Please Wait for Database Sync or Upload File manually!");
        return;
    }

    if (teacherInput === "") {
        if (deptInput === "") {
            showInlineError("⚠️ Please enter a Department (e.g. CSE) or Teacher Initial!");
            return;
        }
        if (batch === "") {
            showInlineError("⚠️ Please enter your Batch (e.g. 69)!");
            return;
        }
    }

    currentFilteredData = [];
    let targetPrefixes = [deptInput];
    if (deptInput === "BBA") targetPrefixes = ["BUS", "ACT", "FIN", "MKT", "HRM", "0421"];
    else if (deptInput === "LAW") targetPrefixes = ["LLB"];
    else if (deptInput === "PHARM") targetPrefixes = ["PHA"];
    else if (deptInput === "MATH") targetPrefixes = ["MAT"];

    for(let i=0; i<rawExcelData.length; i++) {
        for(let j=0; j<rawExcelData[i].length; j++) {
            let cell = rawExcelData[i][j]?.toString() || "";
            let cellUpper = cell.toUpperCase();
            let cellNoSpace = cellUpper.replace(/\s+/g, ''); 

            let words = cellUpper.split(/[\s,()\-–]+/); 
            let extractedTeacherInit = cell.trim().split(/\s+/).pop(); 
            for(let w=words.length-1; w>=0; w--) {
                if (/^[A-Z]{2,4}$/.test(words[w]) && !targetPrefixes.includes(words[w])) {
                    extractedTeacherInit = words[w];
                    break;
                }
            }

            if (teacherInput !== "") {
                if (extractedTeacherInit !== teacherInput) continue;
            } else {
                let hasDept = targetPrefixes.some(prefix => cellNoSpace.includes(prefix));
                if (!hasDept) continue;

                let hasBatch = true;
                if (batch !== "") {
                    let batchRegex = new RegExp("(^|[^0-9])" + batch + "([^0-9]|$)");
                    hasBatch = batchRegex.test(cellUpper);
                }
                if (!hasBatch) continue;

                let hasSection = true;
                if (section !== "") {
                    let secRegex = new RegExp("(" + batch + "|\\(|\\)|SEC[-:]*)" + section + "(?![A-Z])", "i");
                    let standaloneRegex = new RegExp("(^|\\s)" + section + "(\\s|$)", "i");
                    hasSection = secRegex.test(cellNoSpace) || standaloneRegex.test(cellUpper);
                }
                if (!hasSection) continue;
            }

            let day = "";
            for(let x=i; x>=0; x--) {
                let d = rawExcelData[x].find(c => c && days.includes(c.toString().trim()));
                if(d) { day = d.trim(); break; }
            }

            let time = "TBA";
            for(let x=i; x>=0; x--) {
                let t = rawExcelData[x][j]?.toString() || "";
                if(strictTimePattern.test(t)) { 
                    time = t.toString().replace(/\./g, ":").replace(/\-/g, " - ").replace(/[a-zA-Z]/g, "").trim(); 
                    break; 
                }
            }

            let extractedCode = "N/A";
            let tempPrefixes = teacherInput !== "" ? ["CSE", "BUS", "ACT", "FIN", "MKT", "HRM", "LLB", "PHA", "MAT", "ENG", "ECO", "SOC", "EEE"] : targetPrefixes;
            let matchedPrefix = tempPrefixes.find(prefix => cellNoSpace.includes(prefix));
            
            if (matchedPrefix) {
                let regex = new RegExp(matchedPrefix + "[-\\s]?\\d+", "i");
                let matchCode = cellUpper.match(regex);
                if(matchCode) {
                    extractedCode = matchCode[0].replace(/\s+/, '-'); 
                    if(!extractedCode.includes('-')) extractedCode = extractedCode.replace(matchedPrefix, matchedPrefix + "-");
                } else {
                    extractedCode = matchedPrefix;
                }
            }

            let roomNo = rawExcelData[i][2]?.toString().split(' ')[0] || "N/A";

            currentFilteredData.push({
                day, time,
                room: roomNo,
                code: extractedCode,
                init: extractedTeacherInit
            });
        }
    }
    
    if (teacherInput !== "") {
        const fullTeacherName = teacherMapping[normalizeKey(teacherInput)] || teacherInput;
        document.getElementById('routineTitle').innerText = `👨‍🏫 Teacher: ${fullTeacherName}`;
    } else {
        document.getElementById('routineTitle').innerText = `Schedule: ${deptInput} ${batch}(${section})`;
    }
    
    renderTabs("All Days");
    updateLiveBanner(); 
}

/* ==================== 📝 EXAM ENGINE LOGIC (DAY BATCH FILTER + GRID VIEW) 📝 ==================== */
function searchExamRoutineSafe() {
    const batch = document.getElementById('batch').value.trim();
    const teacherInput = document.getElementById('teacherInit') ? document.getElementById('teacherInit').value.trim().toUpperCase() : "";
    const deptInput = document.getElementById('dept').value.trim().toUpperCase(); 
    const section = document.getElementById('section').value.trim().toUpperCase();

    if (deptInput || teacherInput || batch) {
        const newUrl = `${window.location.pathname}?dept=${deptInput}&batch=${batch}&sec=${section}&teacher=${teacherInput}`;
        window.history.pushState({path: newUrl}, '', newUrl);
    }
    saveUserPreferences(deptInput, batch, section); // for cash file 

    const showInlineError = (message) => {
        document.getElementById('routineList').innerHTML = `<div style='text-align:center; padding:30px; color:var(--subtext); font-size:24px; font-weight:600;'>${message}</div>`;
        document.getElementById('dayTabs').innerHTML = "";
        document.getElementById('routineTitle').innerText = "Notice";
        document.getElementById('classCount').innerText = "0 Exams";
        document.getElementById('currentDate').innerText = "";
        document.getElementById('resultSection').classList.remove('hidden');
        document.getElementById('liveStatusContainer').classList.add('hidden');
    };

    if (rawExamData.length === 0) {
        showInlineError("⚠️ Exam data not loaded! Please check if 'mid_exam_routine_cse_spring.xlsx' exists.");
        return;
    }

    if (teacherInput === "" && batch === "") {
        showInlineError("⚠️ Please enter a Batch (e.g. 69) or Teacher Initial!");
        return;
    }

    let examResults = [];
    let sheet = rawExamData;
    let currentDate = "TBA";
    let currentDay = "TBA";
    let daysList = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < sheet.length; i++) {
        let row = sheet[i];
        if (!row || row.length === 0) continue;
        let rowStr = row.join(" ").toLowerCase();

        // ১. ডেট ও দিন বের করা
        if (rowStr.includes("date:")) {
            let origRowStr = row.join(" ");
            let dateMatch = origRowStr.match(/\d{2}\.\d{2}\.\d{4}/);
            if (dateMatch) currentDate = dateMatch[0];
            let foundDay = daysList.find(d => origRowStr.includes(d));
            if (foundDay) currentDay = foundDay;
            continue;
        }

        // ২. হেডার রো (Course Code) বের করা
        if (rowStr.includes("course code")) {
            let headerRow = row;
            let timeRow = i > 0 ? sheet[i - 1] : [];

            let blockCols = [];
            for (let c = 0; c < headerRow.length; c++) {
                if (headerRow[c] && headerRow[c].toString().toLowerCase().includes("course code")) {
                    blockCols.push(c);
                }
            }

            // টাইম স্লট বের করা
            let blockTimes = {};
            blockCols.forEach(c => {
                // 🌟 EVENING BATCH FILTER 🌟 (কলামের ওপরের ৩ লাইনে চেক করবে Evening লেখা আছে কি না)
                let isEvening = false;
                for (let r = i - 1; r >= Math.max(0, i - 3); r--) {
                    let text = "";
                    for (let off = -3; off <= 3; off++) {
                        if (sheet[r] && sheet[r][c + off]) {
                            text += " " + sheet[r][c + off].toString().toLowerCase();
                        }
                    }
                    if (text.includes("evening")) {
                        isEvening = true;
                    }
                }

                if (isEvening) return; // যদি ইভিনিং হয়, তাহলে এই কলাম স্কিপ করবে!

                let timeSlot = "TBA";
                for (let offset = 0; offset >= -2; offset--) {
                    if (timeRow[c + offset]) {
                        let tStr = timeRow[c + offset].toString().trim();
                        if (tStr.match(/\d{1,2}:\d{2}/)) {
                            timeSlot = tStr;
                            break;
                        }
                    }
                }
                blockTimes[c] = timeSlot;
            });

            // ৩. কোর্সের রো গুলো পড়া
            let j = i + 1;
            while (j < sheet.length) {
                let subRow = sheet[j];
                if (!subRow) { j++; continue; }
                let subRowStr = subRow.join(" ").toLowerCase();
                
                // পরের ডেট বা পরের হেডারে গেলে থামা
                if (subRowStr.includes("date:") || subRowStr.includes("course code") || subRowStr.includes("mid term exam")) {
                    break; 
                }

                blockCols.forEach(c => {
                    if (!blockTimes[c]) return; // স্কিপ করা ইভিনিং কলামগুলোতে ঢুকবে না

                    let courseCode = subRow[c] ? subRow[c].toString().trim() : "";
                    let batchNo = subRow[c + 1] ? subRow[c + 1].toString().trim() : "";
                    let invigilators = subRow[c + 2] ? subRow[c + 2].toString().trim() : "";
                    let room = subRow[c + 3] ? subRow[c + 3].toString().trim() : "TBA";

                    if (courseCode && batchNo) {
                        let match = false;
                        if (teacherInput !== "") {
                            let tFullName = teacherMapping[normalizeKey(teacherInput)] || teacherInput;
                            if (invigilators.toLowerCase().includes(tFullName.toLowerCase()) || 
                                invigilators.toLowerCase().includes(teacherInput.toLowerCase())) {
                                match = true;
                            }
                        } else if (batch !== "") {
                            let batchRegex = new RegExp("(^|[^0-9])" + batch + "([^0-9]|$)");
                            if (batchRegex.test(batchNo)) {
                                match = true;
                            }
                        }
                        
                        if (match) {
                            examResults.push({
                                date: currentDate,
                                day: currentDay,
                                time: blockTimes[c],
                                code: courseCode,
                                batch: batchNo,
                                invigilators: invigilators,
                                room: room
                            });
                        }
                    }
                });
                j++;
            }
            i = j - 1; 
        }
    }

    renderExamListSafe(examResults, batch, teacherInput);
}
// list 
// 🌟 LIST VIEW FOR EXAMS (SAME AS NORMAL CLASS ROUTINE) 🌟
// 🌟 LIST VIEW FOR EXAMS (NO BATCH BADGE) 🌟
// 🌟 LIST VIEW FOR EXAMS (WITH INVIGILATOR TEXT) 🌟
function renderExamListSafe(results, batch, teacherInput) {
    const list = document.getElementById('routineList');
    list.innerHTML = "";
    
    document.getElementById('dayTabs').innerHTML = ""; 
    document.getElementById('liveStatusContainer').classList.add('hidden');
    document.getElementById('classCount').innerText = `${results.length} Exams Found`;
    document.getElementById('currentDate').innerText = "MidTerm Routine - Spring 2026";
    
    if (teacherInput !== "") {
        const fullTeacherName = teacherMapping[normalizeKey(teacherInput)] || teacherInput;
        document.getElementById('routineTitle').innerText = `👨‍🏫 Invigilation: ${fullTeacherName}`;
    } else {
        const deptInput = document.getElementById('dept').value.trim().toUpperCase(); 
        document.getElementById('routineTitle').innerText = `📝 Exam Schedule: ${deptInput} ${batch} (Day)`;
    }

    if (results.length === 0) {
        list.innerHTML = "<div style='text-align:center; padding:40px; color:var(--subtext)'>No Day exams found for the given criteria.</div>";
        document.getElementById('resultSection').classList.remove('hidden');
        return;
    }

    const viewMode = localStorage.getItem('routine_view') || 'list';
    if (viewMode === 'matrix') {
        renderExamMatrixSafe(results, batch, teacherInput);
        return;
    }

    results.sort((a, b) => {
        let d1 = a.date.split('.').reverse().join('');
        let d2 = b.date.split('.').reverse().join('');
        return d1.localeCompare(d2);
    });

    let groupedByDate = {};
    results.forEach(ex => {
        let key = `${ex.date} (${ex.day})`;
        if(!groupedByDate[key]) groupedByDate[key] = [];
        groupedByDate[key].push(ex);
    });

    let html = "";
    Object.keys(groupedByDate).forEach(dateKey => {
        html += `<div class="day-container"><div class="day-title">📅 ${dateKey}</div>`;
        
        groupedByDate[dateKey].sort((a, b) => getMinutesFromTime(a.time) - getMinutesFromTime(b.time));

        groupedByDate[dateKey].forEach(exam => {
            const courseName = courseMapping[normalizeKey(exam.code)] || "MidTerm Exam";
            
            // 🔥 ADDED "INVIGILATOR(S)" TEXT BACK 🔥
            html += `
                <div class="routine-card">
                    <div class="time-col">
                        <span class="time-display">🕒 ${formatTime(exam.time)}</span>
                        <span class="room-badge room-disp">Room ${exam.room}</span>
                    </div>
                    <div class="course-col">
                        <div class="course-code">${exam.code}</div>
                        <div class="course-name">${courseName}</div>
                    </div>
                    <div class="teacher-col teacher-disp" style="flex-direction: column; align-items: flex-end; justify-content: center;">
                        <span style="font-size:10px; font-weight:800; color:var(--subtext); text-transform:uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">👨‍🏫 Invigilator(s)</span>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="teacher-name" style="text-align: right; max-width: 160px; white-space: normal; line-height: 1.3;">${exam.invigilators}</span>
                            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="teacher-avatar">
                        </div>
                    </div>
                </div>`;
        });
        html += `</div>`;
    });
    
    list.innerHTML = html;
    document.getElementById('resultSection').classList.remove('hidden');
}


// 🌟 GRID/MATRIX VIEW FOR EXAMS (NO BATCH BADGE) 🌟
function renderExamMatrixSafe(results, batch, teacherInput) {
    const list = document.getElementById('routineList');
    list.innerHTML = "";

    let uniqueTimesRaw = [...new Set(results.map(d => d.time))];
    uniqueTimesRaw.sort((a, b) => getMinutesFromTime(a) - getMinutesFromTime(b));

    let uniqueDates = [...new Set(results.map(d => d.date))];
    uniqueDates.sort((a, b) => {
        let d1 = a.split('.').reverse().join('');
        let d2 = b.split('.').reverse().join('');
        return d1.localeCompare(d2);
    });

    let html = `<div class="adv-matrix-wrapper"><table class="adv-matrix-table"><thead><tr><th>DATE / TIME</th>`;
    uniqueTimesRaw.forEach(t => { html += `<th>${formatTime(t)}</th>`; });
    html += `</tr></thead><tbody>`;

    uniqueDates.forEach(date => {
        let examsOnDate = results.filter(r => r.date === date);
        let dayName = examsOnDate[0].day;
        html += `<tr><td class="day-label"><div style="font-size:15px; font-weight:800;">${date}</div><div style="font-size:13px; font-weight:600; color:var(--primary); margin-top: 4px;">${dayName}</div></td>`;
        
        uniqueTimesRaw.forEach(t => {
            let cls = examsOnDate.find(d => d.time === t);
            if (cls) {
                const courseName = courseMapping[normalizeKey(cls.code)] || "MidTerm Exam";
                
                // 🔥 BATCH BADGE REMOVED HERE TOO 🔥
                html += `<td>
                    <div class="adv-m-card" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 18px; min-width: 240px;">
                        
                        <div class="adv-m-title" style="text-align: center; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px;">
                            ${cls.code} 
                        </div>
                        
                        <div class="adv-m-name" style="text-align: center; font-size: 15px; font-weight: 600; line-height: 1.4; margin-top: 10px; color: var(--text);">
                            ${courseName}
                        </div>
                        
                        <div class="adv-m-footer" style="display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; width: 100%; border-top: 1px dashed var(--border); padding-top: 14px; margin-top: 14px;">
                            
                            <span class="adv-m-room" style="font-size: 13px; font-weight: 700; color: var(--accent); margin: 0; background: var(--bg); padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);">📍 Room: ${cls.room}</span>
                            
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 6px;">
                                <span style="font-size:10px; font-weight:800; color:var(--subtext); text-transform:uppercase; letter-spacing: 0.5px;">👨‍🏫 Invigilator(s)</span>
                                <span class="adv-m-teacher" style="font-size: 14px; text-align: center; white-space: normal; line-height: 1.4; max-width: 100%; color: var(--text); font-weight: 600;" title="${cls.invigilators}">${cls.invigilators}</span>
                            </div>
                            
                        </div>
                        
                    </div>
                </td>`;
            } else {
                html += `<td><div class="adv-m-empty">·</div></td>`;
            }
        });
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    list.innerHTML = html;
    document.getElementById('resultSection').classList.remove('hidden');
}

function updateLiveBanner() {
    const container = document.getElementById('liveStatusContainer');
    const details = document.getElementById('liveClassDetails');
    const headerTitle = document.querySelector('.live-status-header strong');
    const pulse = document.querySelector('.live-pulse');
    
    if (!currentFilteredData || currentFilteredData.length === 0) {
        if(container) container.classList.add('hidden');
        return;
    }

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[now.getDay()];
    
    const todayClasses = currentFilteredData.filter(d => d.day === todayName);
    todayClasses.sort((a, b) => getMinutesFromTime(a.time) - getMinutesFromTime(b.time));
    
    let ongoingClass = todayClasses.find(item => {
        let startMin = getMinutesFromTime(item.time);
        let endStr = item.time.split('-')[1];
        let endMin = endStr ? getMinutesFromTime(endStr) : startMin + 90;
        return (currentTotalMinutes >= startMin && currentTotalMinutes < endMin);
    });

    let nextClass = null;
    let upcomingDayName = "TODAY";

    if (!ongoingClass) {
        nextClass = todayClasses.find(item => getMinutesFromTime(item.time) > currentTotalMinutes);

        if (!nextClass) {
            for (let i = 1; i <= 6; i++) { 
                let nextDayIndex = (now.getDay() + i) % 7;
                let checkDayName = dayNames[nextDayIndex];
                let nextDayClasses = currentFilteredData.filter(d => d.day === checkDayName);

                if (nextDayClasses.length > 0) {
                    nextDayClasses.sort((a, b) => getMinutesFromTime(a.time) - getMinutesFromTime(b.time));
                    nextClass = nextDayClasses[0]; 
                    upcomingDayName = (i === 1) ? "TOMORROW" : checkDayName.toUpperCase();
                    break;
                }
            }
        }
    }

    if (ongoingClass) {
        container.classList.remove('hidden');
        container.style.background = 'linear-gradient(135deg, #ef4444, #f87171)'; 
        pulse.style.animation = 'pulse-white 2s infinite';
        headerTitle.innerText = "🔴 LIVE NOW";
        
        const cName = courseMapping[normalizeKey(ongoingClass.code)] || "University Course";
        const tName = teacherMapping[normalizeKey(ongoingClass.init)] || ongoingClass.init;
        
        details.innerHTML = `
            <h3>${ongoingClass.code}: ${cName}</h3>
            <p>
                <span class="room-disp" style="display:${userPrefs.showRoom?'inline':'none'}">📍 Room: ${ongoingClass.room}</span> 
                <span>🕒 ${formatTime(ongoingClass.time)}</span> 
                <span class="teacher-disp" style="display:${userPrefs.showTeacher?'inline':'none'}">👨‍🏫 ${tName}</span>
            </p>`;
            
    } else if (nextClass) {
        container.classList.remove('hidden');
        container.style.background = 'linear-gradient(135deg, var(--primary), #818cf8)'; 
        pulse.style.animation = 'none'; pulse.style.boxShadow = 'none';
        
        if (upcomingDayName === "TODAY") {
            headerTitle.innerText = "⏳ UPCOMING NEXT";
        } else {
            headerTitle.innerText = `⏳ UPCOMING (${upcomingDayName})`;
        }
        
        const cName = courseMapping[normalizeKey(nextClass.code)] || "University Course";
        const tName = teacherMapping[normalizeKey(nextClass.init)] || nextClass.init;
        
        const displayTime = upcomingDayName !== "TODAY" ? `${nextClass.day} ${formatTime(nextClass.time)}` : formatTime(nextClass.time);

        details.innerHTML = `
            <h3>${nextClass.code}: ${cName}</h3>
            <p>
                <span class="room-disp" style="display:${userPrefs.showRoom?'inline':'none'}">📍 Room: ${nextClass.room}</span> 
                <span>🕒 ${displayTime}</span> 
                <span class="teacher-disp" style="display:${userPrefs.showTeacher?'inline':'none'}">👨‍🏫 ${tName}</span>
            </p>`;
    } else {
        container.classList.add('hidden');
    }
}

function renderTabs(activeDay) {
    const tabsContainer = document.getElementById('dayTabs');
    if (!tabsContainer) return; 

    const dayOrder = ["All Days", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    tabsContainer.innerHTML = "";
    
    dayOrder.forEach(day => {
        let count = day === "All Days" ? currentFilteredData.length : currentFilteredData.filter(d => d.day === day).length;
        if (count > 0) {
            const btn = document.createElement('button');
            btn.className = `day-tab ${day === activeDay ? 'active' : ''}`;
            btn.innerText = day === "All Days" ? `All Days (${count})` : `${day} (${count})`;
            btn.onclick = () => {
                document.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderRoutineForDay(day);
            };
            tabsContainer.appendChild(btn);
        }
    });
    renderRoutineForDay(activeDay);
}

function renderRoutineForDay(day) {
    const list = document.getElementById('routineList');
    const batch = document.getElementById('batch').value.trim();
    const sec = document.getElementById('section').value.trim().toUpperCase();

    const dept = document.getElementById('dept').value.trim().toUpperCase();
    const viewMode = localStorage.getItem('routine_view') || 'list';
    
    const isAllDays = day === "All Days";
    const totalClasses = isAllDays ? currentFilteredData.length : currentFilteredData.filter(d => d.day === day).length;

    document.getElementById('classCount').innerText = `${totalClasses} Classes in Total`;

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').innerText = `📅 Today: ${new Date().toLocaleDateString('en-US', dateOptions)}`;

    if(totalClasses === 0) {
        list.innerHTML = "<div style='text-align:center; padding:40px; color:var(--subtext)'>No classes found. Check Dept/Batch/Section.</div>";
        document.getElementById('resultSection').classList.remove('hidden');
        return;
    }

    viewMode === 'matrix' ? renderAdvancedMatrix(day, batch, sec) : renderStandardList(day);
    document.getElementById('resultSection').classList.remove('hidden');
}

function renderStandardList(day) {
    const list = document.getElementById('routineList');
    list.innerHTML = "";
    const isAllDays = day === "All Days";
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
    const daysToRender = isAllDays ? ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] : [day];

    daysToRender.forEach(renderDay => {
        const dayClasses = currentFilteredData.filter(d => d.day === renderDay);
        if (dayClasses.length === 0) return;

        dayClasses.sort((a, b) => getMinutesFromTime(a.time) - getMinutesFromTime(b.time));
        let dayHTML = `<div class="day-container"><div class="day-title">📅 ${renderDay}</div>`;
        
        dayClasses.forEach(item => {
            let isLive = false;
            if (renderDay === todayName) {
                let startMin = getMinutesFromTime(item.time);
                let endStr = item.time.split('-')[1];
                let endMin = endStr ? getMinutesFromTime(endStr) : startMin + 90; 
                if (currentTotalMinutes >= startMin && currentTotalMinutes < endMin) { isLive = true; }
            }

            const courseName = courseMapping[normalizeKey(item.code)] || "";
            const teacherName = teacherMapping[normalizeKey(item.init)] || item.init;

            // সেফটি চেক: কোনো কারণে JSON বা ডেটাবেস লোড না হলেও সাইট ভাঙবে না
            let avatarImg = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
            if (typeof teacherProfileDB !== 'undefined' && teacherProfileDB[item.init] && teacherProfileDB[item.init].img) {
                avatarImg = teacherProfileDB[item.init].img;
            }

            dayHTML += `
                <div class="routine-card ${isLive ? 'live-now' : ''}">
                    <div class="time-col">
                        <span class="time-display">🕒 ${formatTime(item.time)}</span>
                        ${isLive ? `<span class="live-badge">🔴 LIVE NOW</span>` : `<span class="room-badge room-disp">Room ${item.room}</span>`}
                    </div>
                    <div class="course-col">
                        <div class="course-code">${item.code}</div>
                        <div class="course-name">${courseName}</div>
                    </div>
                    <div class="teacher-col teacher-disp">
                        <span class="teacher-name">${teacherName}</span>
                        <button class="teacher-avatar-btn" onclick="openTeacherProfile('${item.init}', '${teacherName}')" title="View Profile">
                            <img src="${avatarImg}" class="teacher-avatar">
                        </button>
                    </div>
                </div>`;
        });
        dayHTML += `</div>`;
        list.innerHTML += dayHTML;
    });
}

function renderAdvancedMatrix(day, batch, sec) {
    const list = document.getElementById('routineList');
    list.innerHTML = "";
    const isAllDays = day === "All Days";
    const daysToRender = isAllDays ? ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] : [day];

    let uniqueTimesRaw = [...new Set(currentFilteredData.map(d => d.time))];
    uniqueTimesRaw.sort((a, b) => getMinutesFromTime(a) - getMinutesFromTime(b));

    let html = `<div class="adv-matrix-wrapper"><table class="adv-matrix-table"><thead><tr><th>DAY / TIME</th>`;
    uniqueTimesRaw.forEach(t => { html += `<th>${formatTime(t)}</th>`; });
    html += `</tr></thead><tbody>`;

    daysToRender.forEach(renderDay => {
        html += `<tr><td class="day-label">${renderDay}</td>`;
        uniqueTimesRaw.forEach(t => {
            let cls = currentFilteredData.find(d => d.day === renderDay && d.time === t);
            if (cls) {
                const courseName = courseMapping[normalizeKey(cls.code)] || "University Course";
                html += `<td>
                    <div class="adv-m-card">
                        <div class="adv-m-title">${cls.code}</div>
                        <div class="adv-m-name">${courseName}</div>
                        <div class="adv-m-footer">
                            <span class="adv-m-room">📍 ${cls.room}</span>
                            <span class="adv-m-teacher">${cls.init}</span>
                        </div>
                    </div>
                </td>`;
            } else {
                html += `<td><div class="adv-m-empty">·</div></td>`;
            }
        });
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    list.innerHTML = html;
}

function updateLiveStatus() {
    const activeTab = document.querySelector('.day-tab.active');
    if(activeTab) {
        let activeDayText = activeTab.innerText;
        if (activeDayText.includes("All Days")) {
            renderRoutineForDay("All Days");
        } else {
            const activeDay = activeDayText.split(' (')[0];
            const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
            if(activeDay === todayName) renderRoutineForDay(activeDay);
        }
    }
}

function saveAsPDF() { window.print(); }

function captureSchedule() {
    const element = document.getElementById('resultSection');
    const btn = document.querySelector('.btn-capture');
    const originalText = btn.innerText;
    btn.innerText = "⏳ Saving HD...";
    
    element.classList.add('capture-mode');

    const mainContainer = document.querySelector('.container');
    let origMaxWidth = '';
    if(mainContainer) {
        origMaxWidth = mainContainer.style.maxWidth;
        mainContainer.style.maxWidth = 'none';
    }

    const matrixWrapper = document.querySelector('.adv-matrix-wrapper');
    let originalOverflow = '', originalWidth = '';
    if (matrixWrapper) {
        originalOverflow = matrixWrapper.style.overflowX;
        originalWidth = matrixWrapper.style.width;
        matrixWrapper.style.overflowX = 'visible';
        matrixWrapper.style.width = 'max-content';
    }

    setTimeout(() => {
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        htmlToImage.toPng(element, { quality: 1.0, pixelRatio: 3, backgroundColor: bgColor, style: { margin: '0' } })
        .then(function (dataUrl) {
            const link = document.createElement('a'); link.download = `Routine.png`; link.href = dataUrl; link.click();
            btn.innerText = originalText; element.classList.remove('capture-mode');
            if (matrixWrapper) { matrixWrapper.style.overflowX = originalOverflow; matrixWrapper.style.width = originalWidth; }
            if (mainContainer) mainContainer.style.maxWidth = origMaxWidth;
        })
        .catch(function () {
            alert("Image capture failed!"); btn.innerText = originalText; element.classList.remove('capture-mode');
            if (matrixWrapper) { matrixWrapper.style.overflowX = originalOverflow; matrixWrapper.style.width = originalWidth; }
            if (mainContainer) mainContainer.style.maxWidth = origMaxWidth;
        });
    }, 500); 
}

/* ==================== 💾 AUTO-SAVE SYSTEM (LOCAL STORAGE) 💾 ==================== */

function saveUserPreferences(dept, batch, section) {
    if (dept !== "" && batch !== "" && section !== "") {
        localStorage.setItem('routinePro_dept', dept);
        localStorage.setItem('routinePro_batch', batch);
        localStorage.setItem('routinePro_section', section);
    }
}

function loadUserPreferences() {
    const savedDept = localStorage.getItem('routinePro_dept');
    const savedBatch = localStorage.getItem('routinePro_batch');
    const savedSection = localStorage.getItem('routinePro_section');

    if (savedDept && savedBatch && savedSection) {
        if(document.getElementById('dept')) document.getElementById('dept').value = savedDept;
        if(document.getElementById('batch')) document.getElementById('batch').value = savedBatch;
        if(document.getElementById('section')) document.getElementById('section').value = savedSection;
    }
}

/* ==================== 🌟 TEACHER PROFILE MODAL LOGIC 🌟 ==================== */
/* ==================== 🌟 TEACHER PROFILE MODAL LOGIC 🌟 ==================== */
function openTeacherProfile(teacherInit, fullTeacherName) {
    const modal = document.getElementById('teacherProfileModal');
    if (!modal) return;

    // ডিফল্ট ডেটা (যদি JSON ফাইলে ওই টিচারের তথ্য না পাওয়া যায়)
    const defaultData = {
        name: fullTeacherName || teacherInit,
        designation: "Faculty Member, CSE",
        img: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        email: "Not Available",
        phone: "Not Available",
        room: "TBA"
    };

    // JSON ফাইল থেকে লোড হওয়া ডেটাবেস চেক করবে, না পেলে ডিফল্টটা দেখাবে
    const tData = teacherProfileDB[teacherInit] || defaultData;

    // মডালের ভেতরে ডেটা বসানো
    document.getElementById('modalTeacherImg').src = tData.img;
    document.getElementById('modalTeacherName').innerText = tData.name;
    document.getElementById('modalTeacherDesignation').innerText = tData.designation;
    document.getElementById('modalTeacherEmail').innerText = tData.email;
    document.getElementById('modalTeacherPhone').innerText = tData.phone;
    document.getElementById('modalTeacherRoom').innerText = tData.room;

    // বাটনগুলোর অ্যাকশন সেট করা (ডেটা না থাকলে অ্যালার্ট দেবে)
    document.getElementById('modalCallBtn').onclick = () => {
        if(tData.phone !== "Not Available") window.location.href = `tel:${tData.phone}`;
        else alert("Phone number not available for this teacher.");
    };
    
    document.getElementById('modalEmailBtn').onclick = () => {
        if(tData.email !== "Not Available") window.location.href = `mailto:${tData.email}`;
        else alert("Email not available for this teacher.");
    };

    // মডাল দেখানো এবং পেছনের স্ক্রল বন্ধ করা
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

// ... (মডাল ক্লোজ করার বাকি ফাংশনগুলো আগের মতোই থাকবে)

function closeTeacherProfile() {
    const modal = document.getElementById('teacherProfileModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // স্ক্রল আবার চালু করা
    }
}

// ইভেন্ট লিসেনার (যাতে ক্লিক করলে মডাল বন্ধ হয়)
document.addEventListener('click', function(e) {
    if (e.target.id === 'closeTeacherModal' || e.target.id === 'teacherProfileModal') {
        closeTeacherProfile();
    }
});