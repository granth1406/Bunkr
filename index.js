let attendanceData = [];

const chartCtx = document.getElementById('attendanceChart').getContext('2d');
let attendanceChart = new Chart(chartCtx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Attendance %',
      backgroundColor: '#0d6efd',
      borderColor: '#0d6efd',
      borderWidth: 1,
      data: []
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true }},
    scales: { y: { beginAtZero: true, max: 100 }}
  }
});

function saveToLocalStorage() {
  localStorage.setItem('attendance', JSON.stringify(attendanceData));
}

function syncAttendance() {
  const total = parseInt(document.getElementById("totalClasses").value);
  const attended = parseInt(document.getElementById("attendedClasses").value);
  const subject = document.getElementById("subject").value;
  if (!isNaN(total) && !isNaN(attended) && subject.trim() !== "" && total > 0) {
    const percentage = Math.min(Math.round((attended / total) * 100), 100);
    const entryIndex = attendanceData.findIndex(item => item.subject === subject);
    if(entryIndex >= 0) attendanceData[entryIndex] = { subject, total, attended, percentage };
    else attendanceData.push({ subject, total, attended, percentage });

    document.getElementById("progressBar").style.width = percentage + "%";
    document.getElementById("progressBar").innerText = percentage + "%";
    document.getElementById("totalPercentage").innerText = percentage + "%";

    let safeBunks = Math.floor(((attended - (0.75 * total)) / 0.25));
    document.getElementById("safeBunk").innerText = safeBunks > 0 ? `${safeBunks} Classes` : "0 Classes";

    const labelIndex = attendanceChart.data.labels.indexOf(subject);
    if (labelIndex >= 0) {
      attendanceChart.data.datasets[0].data[labelIndex] = percentage;
    } else {
      attendanceChart.data.labels.push(subject);
      attendanceChart.data.datasets[0].data.push(percentage);
    }
    attendanceChart.update();
    updateRemoveDropdown();
    saveToLocalStorage();
    showAlerts();
  }
}

function removeSubject() {
  const selected = document.getElementById("removeSubjectDropdown").value;
  if (!selected) return;
  attendanceData = attendanceData.filter(item => item.subject !== selected);
  const idx = attendanceChart.data.labels.indexOf(selected);
  if (idx !== -1) {
    attendanceChart.data.labels.splice(idx, 1);
    attendanceChart.data.datasets[0].data.splice(idx, 1);
    attendanceChart.update();
    updateRemoveDropdown();
    saveToLocalStorage();
    showAlerts();
  }
}

function updateRemoveDropdown() {
  const dropdown = document.getElementById("removeSubjectDropdown");
  dropdown.innerHTML = "";
  attendanceData.forEach(item => {
    let opt = document.createElement("option");
    opt.value = opt.innerText = item.subject;
    dropdown.appendChild(opt);
  });
}

function setTheme(theme) {
  document.body.classList.remove('dark-mode', 'neon-mode');
  if (theme === 'dark') document.body.classList.add('dark-mode');
  else if (theme === 'neon') document.body.classList.add('neon-mode');
  
  import('./background3d.js').then(module => {
      if (window.currentBackground) {
          window.currentBackground.cleanup();
      }
      window.currentBackground = module.default;
      window.currentBackground.updateTheme(theme);
  });
  
  localStorage.setItem('theme', theme);
}

function showAlerts() {
  const alertsOn = document.getElementById("toggleAlerts").checked;
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.innerHTML = "";
  if (!alertsOn) return;
  attendanceData.forEach(item => {
    if (item.percentage < 75) {
      const div = document.createElement("div");
      div.className = "card p-3 mb-3";
      div.innerHTML = `<h5>⚠️ Low Attendance in ${item.subject}</h5>
        <p>You're at ${item.percentage}%. Attend more classes to stay above 75%.</p>`;
      alertContainer.appendChild(div);
    }
  });
}

window.onload = () => {
  const theme = localStorage.getItem('theme') || 'light';
  setTheme(theme);
  const saved = localStorage.getItem("attendance");
  if (saved) {
    attendanceData = JSON.parse(saved);
    attendanceData.forEach(item => {
      attendanceChart.data.labels.push(item.subject);
      attendanceChart.data.datasets[0].data.push(item.percentage);
    });
    attendanceChart.update();
    updateRemoveDropdown();

    const last = attendanceData[attendanceData.length - 1];
    document.getElementById("totalPercentage").innerText = last.percentage + "%";
    let safeBunks = Math.floor(((last.attended - (0.75 * last.total)) / 0.25));
    document.getElementById("safeBunk").innerText = safeBunks > 0 ? `${safeBunks} Classes` : "0 Classes";
  }
  showAlerts();
};

document.getElementById('calcBunk').addEventListener('click', () => {
  const requiredPercent = parseFloat(document.getElementById('requiredPercent').value) / 100;
  const totalSemClasses = parseInt(document.getElementById('totalSemClasses').value);
  const classesSoFar = parseInt(document.getElementById('classesSoFar').value);
  const attendedSoFar = parseInt(document.getElementById('attendedSoFar').value);
  
  if (isNaN(requiredPercent)) {
    alert('Please enter required attendance percentage!');
    return;
  }
  
  if (isNaN(totalSemClasses) || isNaN(classesSoFar) || isNaN(attendedSoFar)) {
    alert('Please enter valid numbers for all fields!');
    return;
  }
  
  if (classesSoFar > totalSemClasses) {
    alert('Classes conducted so far cannot be greater than total semester classes!');
    return;
  }
  
  if (attendedSoFar > classesSoFar) {
    alert('Attended classes cannot be greater than classes conducted!');
    return;
  }
  
  const currentPercent = (attendedSoFar / classesSoFar) * 100;
  
  const remainingClasses = totalSemClasses - classesSoFar;
  
  const totalRequired = Math.ceil(totalSemClasses * requiredPercent);
  const stillNeed = Math.max(0, totalRequired - attendedSoFar);
  
  let bunkable = 0;
  if (stillNeed <= remainingClasses) {
    bunkable = remainingClasses - stillNeed;
  }
  
  const finalAttended = attendedSoFar + stillNeed;
  const finalPercent = (finalAttended / totalSemClasses) * 100;
  
  const safeBunkLimit = Math.floor(((attendedSoFar - (0.75 * classesSoFar)) / 0.25));
  
  document.getElementById('currentPercent').textContent = currentPercent.toFixed(1);
  document.getElementById('bunkNum').textContent = bunkable;
  document.getElementById('safeBunkLimit').textContent = safeBunkLimit > 0 ? safeBunkLimit : 0;
  document.getElementById('finalPercent').textContent = finalPercent.toFixed(1);
  
  const progressBar = document.getElementById('bunkProgressBar');
  progressBar.style.width = currentPercent + '%';
  progressBar.textContent = currentPercent.toFixed(1) + '%';
  
  if (currentPercent >= 75) {
    progressBar.classList.remove('bg-warning', 'bg-danger');
    progressBar.classList.add('bg-success');
  } else if (currentPercent >= 50) {
    progressBar.classList.remove('bg-success', 'bg-danger');
    progressBar.classList.add('bg-warning');
  } else {
    progressBar.classList.remove('bg-success', 'bg-warning');
    progressBar.classList.add('bg-danger');
  }
  
  document.getElementById('bunkResult').style.display = 'block';
});

const sections = document.querySelectorAll('.section');
const links = document.querySelectorAll('.navbar-nav .nav-link');

links.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.getAttribute('data-target');
    sections.forEach(section => {
      section.classList.remove('active', 'fade-in');
      if (section.id === target) {
        section.classList.add('active', 'fade-in');
        
        if (target !== 'about' && window.about3D) {
            window.about3D.cleanup();
            window.about3D = null;
        }
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
    const screenPaint = document.querySelector('.screen-paint');
    const paintScreen = screenPaint.querySelector("#paint-screen");
    const popup = screenPaint.querySelector('#popup');
    const input = screenPaint.querySelector('#color-input');
    
    screenPaint.querySelectorAll("button[data-color]").forEach(button => {
        button.addEventListener("click", () => {
            const color = button.getAttribute("data-color");
            paintScreen.style.backgroundColor = color;
        });
    });

    screenPaint.querySelector("#add-btn").addEventListener("click", () => {
        popup.style.display = 'flex';
    });

    function closeModal() {
        popup.style.display = 'none';
        input.value = '';
    }

    function submitColor() {
        const color = input.value;
        if (color) {
            paintScreen.style.backgroundColor = color;
            closeModal();
        }
    }

    popup.addEventListener("click", (e) => {
        if (e.target == popup) closeModal();
    });

    screenPaint.querySelector(".modal button:nth-child(1)").addEventListener("click", submitColor);
    screenPaint.querySelector(".modal button:nth-child(2)").addEventListener("click", closeModal);
});

class ScheduleManager {
    constructor() {
        this.schedule = JSON.parse(localStorage.getItem('classSchedule')) || [];
        this.canvas = document.getElementById('scheduleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', 
            '#96CEB4', '#FFEEAD', '#D4A5A5'
        ];
        
        this.initializeEvents();
        this.render();
    }

    initializeEvents() {
        document.getElementById('scheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addScheduleEntry();
        });

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    addScheduleEntry() {
        const entry = {
            id: Date.now(),
            day: document.getElementById('daySelect').value,
            subject: document.getElementById('subjectInput').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value
        };

        this.schedule.push(entry);
        this.saveSchedule();
        this.render();
        document.getElementById('scheduleForm').reset();
    }

    deleteEntry(id) {
        this.schedule = this.schedule.filter(entry => entry.id !== id);
        this.saveSchedule();
        this.render();
    }

    saveSchedule() {
        localStorage.setItem('classSchedule', JSON.stringify(this.schedule));
    }

    resizeCanvas() {
        // Set canvas width based on container width
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = 350; // Match the CSS max-height
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.drawSchedule();
        this.updateTable();
    }

    drawGrid() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        // Adjust hours to 9 AM - 4 PM
        const hours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
        
        this.ctx.font = '12px Inter';
        this.ctx.fillStyle = '#666';
        
        const timeWidth = 50;
        const dayHeight = 30;
        const cellWidth = (this.canvas.width - timeWidth) / 5;
        const cellHeight = (this.canvas.height - dayHeight) / hours.length;

        // Draw hours
        hours.forEach((hour, i) => {
            const y = dayHeight + i * cellHeight;
            this.ctx.fillText(hour, 5, y + 15);
            this.ctx.beginPath();
            this.ctx.moveTo(timeWidth, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.strokeStyle = '#eee';
            this.ctx.stroke();
        });

        // Draw days
        days.forEach((day, i) => {
            const x = timeWidth + i * cellWidth;
            this.ctx.fillText(day, x + 5, 20);
            this.ctx.beginPath();
            this.ctx.moveTo(x, dayHeight);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.strokeStyle = '#eee';
            this.ctx.stroke();
        });
    }

    drawSchedule() {
        const timeWidth = 50;
        const dayHeight = 30;
        const cellWidth = (this.canvas.width - timeWidth) / 5;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        this.schedule.forEach((entry, index) => {
            const dayIndex = days.indexOf(entry.day);
            const [startHour, startMinute] = entry.startTime.split(':').map(Number);
            const [endHour, endMinute] = entry.endTime.split(':').map(Number);

            const x = timeWidth + dayIndex * cellWidth;
            const y = dayHeight + ((startHour - 9) + startMinute/60) * ((this.canvas.height - dayHeight) / 7);
            const height = ((endHour - startHour) + (endMinute - startMinute)/60) * ((this.canvas.height - dayHeight) / 7);

            this.ctx.fillStyle = this.colors[index % this.colors.length];
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillRect(x + 2, y, cellWidth - 4, height);
            this.ctx.globalAlpha = 1;

            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Inter';
            this.ctx.fillText(entry.subject, x + 5, y + 15);
        });
    }

    updateTable() {
        const tbody = document.querySelector('#scheduleTable tbody');
        tbody.innerHTML = this.schedule.map(entry => `
            <tr>
                <td>${entry.day}</td>
                <td>${entry.subject}</td>
                <td>${entry.startTime}</td>
                <td>${entry.endTime}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="scheduleManager.deleteEntry(${entry.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

const scheduleManager = new ScheduleManager();

function initWeeklyProgress() {
    const ctx = document.getElementById('weeklyProgressChart').getContext('2d');
    const data = getWeeklyData();

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
                label: 'Attendance',
                data: data,
                borderColor: getComputedStyle(document.body).getPropertyValue('--primary'),
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateStreak() {
    const streak = calculateStreak();
    const streakElement = document.getElementById('streakCount');
    streakElement.textContent = streak;
    
    if (streak > 5) {
        streakElement.classList.add('text-success');
    }
}

function exportAttendance() {
    const data = getAllAttendanceData();
    const csv = convertToCSV(data);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_report.csv';
    a.click();
}

function showStats() {
    const stats = calculateStats();
    
    const modal = new bootstrap.Modal(document.getElementById('statsModal'));
    document.getElementById('statsContent').innerHTML = `
        <div class="row">
            <div class="col-6">
                <h6>Average Attendance</h6>
                <p class="h4">${stats.average}%</p>
            </div>
            <div class="col-6">
                <h6>Best Subject</h6>
                <p class="h4">${stats.bestSubject}</p>
            </div>
        </div>
    `;
    modal.show();
}

document.addEventListener('DOMContentLoaded', () => {
    initWeeklyProgress();
    updateStreak();
    import('./background3d.js').then(module => {
        window.currentBackground = module.default;
    });
});

window.addEventListener('beforeunload', () => {
    if (window.about3D) {
        window.about3D.cleanup();
    }
    if (window.currentBackground) {
        window.currentBackground.cleanup();
    }
});
