// ============================================================================
// ARM TRACKER - MLB Pitching Benchmarks (Enhanced with ECDF)
// ============================================================================

// MLB Pitching Benchmarks Data - Full distribution arrays
const percentileData = {
  ff_avg_speed: [],
  ff_avg_spin: [],
  ff_avg_break_x: [],
  ff_avg_break_z: [],
  ff_avg_break_z_induced: [],
  sl_avg_speed: [],
  sl_avg_spin: [],
  sl_avg_break_x: [],
  sl_avg_break_z: [],
  sl_avg_break_z_induced: [],
  fs_avg_speed: [],
  fs_avg_spin: [],
  fs_avg_break_x: [],
  fs_avg_break_z: [],
  fs_avg_break_z_induced: []
};

// NOTE: Populate these arrays with your full MLB dataset for more accurate percentiles
// Leave empty to use the P10/P50/P90 interpolation fallback method

const benchmarks = {
  // 4-Seam Fastball metrics
  ff_avg_speed: { p10: 91.3, p50: 93.8, p90: 96.6, name: "Velocity", unit: " mph" },
  ff_avg_spin: { p10: 2150, p50: 2304, p90: 2481, name: "Spin Rate", unit: " rpm" },
  ff_avg_break_x: { p10: -8.5, p50: -6.1, p90: -3.8, name: "Horizontal Break", unit: '"' },
  ff_avg_break_z: { p10: -16.8, p50: -14.5, p90: -12.3, name: "Vertical Break", unit: '"' },
  ff_avg_break_z_induced: { p10: 13.6, p50: 16.0, p90: 18.1, name: "Induced Vertical Break", unit: '"' },
  
  // Slider metrics
  sl_avg_speed: { p10: 82.0, p50: 85.5, p90: 88.9, name: "Velocity", unit: " mph" },
  sl_avg_spin: { p10: 2300, p50: 2550, p90: 2800, name: "Spin Rate", unit: " rpm" },
  sl_avg_break_x: { p10: -0.5, p50: 3.5, p90: 6.8, name: "Horizontal Break", unit: '"' },
  sl_avg_break_z: { p10: -35.5, p50: -33.0, p90: -30.2, name: "Vertical Break", unit: '"' },
  sl_avg_break_z_induced: { p10: 1.8, p50: 4.0, p90: 6.5, name: "Induced Vertical Break", unit: '"' },
  
  // Splitter metrics
  fs_avg_speed: { p10: 82.5, p50: 85.0, p90: 87.8, name: "Velocity", unit: " mph" },
  fs_avg_spin: { p10: 1100, p50: 1400, p90: 1700, name: "Spin Rate", unit: " rpm" },
  fs_avg_break_x: { p10: -12.5, p50: -9.8, p90: -7.2, name: "Horizontal Break", unit: '"' },
  fs_avg_break_z: { p10: -35.0, p50: -32.5, p90: -29.8, name: "Vertical Break", unit: '"' },
  fs_avg_break_z_induced: { p10: 1.5, p50: 3.5, p90: 5.8, name: "Induced Vertical Break", unit: '"' }
};

// Pitch type labels
const pitchLabels = { 
  ff: "4-Seam Fastball", 
  sl: "Slider", 
  fs: "Splitter"
};

// Generate metric input fields
function generateMetricInputs() {
  const metricsContainer = document.getElementById('metrics-container');
  
  Object.keys(benchmarks).forEach(key => {
    const pitch = key.split('_')[0];
    
    // Create section header if it doesn't exist
    if (!document.getElementById('section-' + pitch)) {
      const section = document.createElement('div');
      section.className = 'pitch-section-title fade-up';
      section.id = 'section-' + pitch;
      section.textContent = pitchLabels[pitch] || pitch.toUpperCase();
      metricsContainer.appendChild(section);
    }
    
    // Create input field
    const div = document.createElement('div');
    div.className = 'metric-input fade-up';
    div.innerHTML = `
      <label class="metric-label">${benchmarks[key].name}</label>
      <input type="number" step="0.1" class="form-control" id="${key}" placeholder="Enter ${benchmarks[key].name}">
    `;
    metricsContainer.appendChild(div);
  });
}

// ECDF-based percentile calculation (more accurate)
function percentileFromArray(value, arr) {
  if (!arr || arr.length === 0 || value === null || value === undefined || value === "") {
    return null;
  }
  
  // Copy and sort ascending
  const vals = arr.slice().sort((a, b) => a - b);
  const n = vals.length;
  
  // Count values less than and equal to input value
  let less = 0, equal = 0;
  for (let i = 0; i < n; i++) {
    const v = vals[i];
    if (v < value) less++;
    else if (v === value) equal++;
    else if (v > value) break;
  }
  
  // ECDF formula: (less + 0.5 * equal) / n
  const frac = (less + 0.5 * equal) / n;
  const pct = frac * 100;
  return Number(pct.toFixed(1));
}

// Fallback: Calculate percentile using P10/P50/P90 interpolation
function calculatePercentileInterpolated(value, bench) {
  const val = parseFloat(value);
  if (isNaN(val)) return null;
  
  if (val <= bench.p10) {
    return 10 * (val / bench.p10);
  }
  if (val <= bench.p50) {
    return 10 + 40 * ((val - bench.p10) / (bench.p50 - bench.p10));
  }
  if (val <= bench.p90) {
    return 50 + 40 * ((val - bench.p50) / (bench.p90 - bench.p50));
  }
  return Math.min(100, 90 + 10 * ((val - bench.p90) / (bench.p90 - bench.p50)));
}

// Main percentile calculation (uses ECDF if data available, falls back to interpolation)
function calculatePercentile(value, key) {
  const val = parseFloat(value);
  if (isNaN(val)) return null;
  
  // Try ECDF method first if we have full distribution data
  const arr = percentileData[key];
  if (arr && arr.length > 0) {
    return percentileFromArray(val, arr);
  }
  
  // Fallback to interpolation method
  return calculatePercentileInterpolated(val, benchmarks[key]);
}

// Main calculation function
function calculatePercentiles() {
  const results = {};
  let totalPercentile = 0;
  let count = 0;

  Object.keys(benchmarks).forEach(key => {
    const input = document.getElementById(key);
    if (input && input.value !== '') {
      const percentile = calculatePercentile(input.value, key);
      if (percentile !== null) {
        results[key] = { 
          value: parseFloat(input.value), 
          percentile: Math.round(percentile), 
          benchmarks: benchmarks[key] 
        };
        totalPercentile += percentile;
        count++;
      }
    }
  });

  if (count === 0) { 
    alert('Please enter at least one metric'); 
    return; 
  }

  const overallPercentile = Math.round(totalPercentile / count);
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('results-container').style.display = 'block';
  document.getElementById('overall-percentile').textContent = overallPercentile + 'th';

  document.getElementById('individual-results').innerHTML = Object.keys(results).map(key => {
    const pitch = key.split('_')[0];
    const pitchName = pitchLabels[pitch];
    const metricName = results[key].benchmarks.name;
    
    return `
    <div class="metric-result fade-up">
      <div>
        <div class="metric-name">${pitchName} - ${metricName}</div>
        <div class="metric-value">Your value: ${results[key].value}${results[key].benchmarks.unit}</div>
      </div>
      <div class="text-end">
        <div class="percentile-value">${results[key].percentile}th</div>
        <div style="font-size:0.75rem; color:#5a6c7d;">percentile</div>
      </div>
    </div>
  `}).join('');

  // Trigger fade-up animations for results
  if (typeof triggerFadeUp === 'function') {
    triggerFadeUp();
  }
}

// ============================================================================
// CONTACT FORM - Email Handler
// ============================================================================

function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('nameInput').value;
      const email = document.getElementById('emailInput').value;
      const message = document.getElementById('messageTextarea').value;
      
      const subject = encodeURIComponent('Contact from ' + name);
      const body = encodeURIComponent('From: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message);
      
      window.location.href = 'mailto:robert.passmore-waugh@mail.mcgill.ca?subject=' + subject + '&body=' + body;
    });
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Arm Tracker if on that page
  if (document.getElementById('metrics-container')) {
    generateMetricInputs();
  }
  
  // Initialize contact form
  initContactForm();
});