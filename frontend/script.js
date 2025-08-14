const API_BASE = "http://127.0.0.1:8000";
let chart;
let allCompanies = [];

// Company display names mapping
const companyNames = {
    'TCS': 'Tata Consultancy Services',
    'INFY': 'Infosys Limited',
    'RELIANCE': 'Reliance Industries',
    'HDFCBANK': 'HDFC Bank',
    'ICICIBANK': 'ICICI Bank',
    'SBI': 'State Bank of India',
    'ITC': 'ITC Limited',
    'BHARTIARTL': 'Bharti Airtel',
    'LT': 'Larsen & Toubro',
    'BAJFINANCE': 'Bajaj Finance'
};

function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(1) + 'B';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + 'M';
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toString();
}

function showState(state) {
    const states = ['empty-state', 'loading-state', 'chart-wrapper'];
    states.forEach(s => {
        document.getElementById(s).style.display = s === state ? 'flex' : 'none';
    });
    if (state === 'chart-wrapper') {
        document.getElementById('chart-wrapper').style.display = 'block';
    }
}

function drawChart(symbol, dates, prices) {
    const ctx = document.getElementById("stockChart").getContext("2d");
    if (chart) {
        chart.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: dates,
            datasets: [{
                label: `${companyNames[symbol] || symbol} Price (₹)`,
                data: prices,
                borderColor: '#667eea',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#667eea',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 16,
                        weight: '700'
                    },
                    callbacks: {
                        title: function(context) {
                            return new Date(context[0].label).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            });
                        },
                        label: function(context) {
                            return `₹${context.parsed.y.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)',
                        drawBorder: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

async function loadCompanies() {
    try {
        const res = await fetch(`${API_BASE}/companies`);
        const companies = await res.json();
        allCompanies = companies;
        renderCompanies(companies);
    } catch (error) {
        console.error('Error loading companies:', error);
        document.getElementById('company-list').innerHTML = 
            '<li style="color: #ef4444; text-align: center; padding: 20px;">Failed to load companies</li>';
    }
}

function renderCompanies(companies) {
    const list = document.getElementById("company-list");
    list.innerHTML = "";
    
    companies.forEach(symbol => {
        const li = document.createElement("li");
        li.className = "company-item";
        li.dataset.symbol = symbol;
        
        li.innerHTML = `
            <div class="company-name">${companyNames[symbol] || symbol}</div>
            <div class="company-symbol">${symbol}</div>
        `;
        
        li.addEventListener("click", () => {
            document.querySelectorAll('.company-item').forEach(item => {
                item.classList.remove('active');
            });
            li.classList.add('active');
            fetchStock(symbol);
        });
        
        list.appendChild(li);
    });
}

async function fetchStock(symbol) {
    showState('loading-state');
    document.getElementById("chart-title").textContent = `${companyNames[symbol] || symbol}`;
    document.getElementById("live-indicator").style.display = 'flex';

    try {
        const res = await fetch(`${API_BASE}/stock/${symbol}`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();

        showState('chart-wrapper');
        drawChart(symbol, data.dates, data.close);

        // Update stats with latest day's data
        const lastIndex = data.close.length - 1;
        document.getElementById("high-price").textContent = `₹${data.high[lastIndex].toLocaleString('en-IN')}`;
        document.getElementById("low-price").textContent = `₹${data.low[lastIndex].toLocaleString('en-IN')}`;
        document.getElementById("volume").textContent = formatNumber(data.volume[lastIndex]);

    } catch (error) {
        console.error('Error fetching stock data:', error);
        showState('empty-state');
        document.getElementById('empty-state').innerHTML = `
            <div class="empty-icon">⚠️</div>
            <div class="empty-title">Error loading data</div>
            <div class="empty-subtitle">Please try again later</div>
        `;
        document.getElementById("live-indicator").style.display = 'none';
    }
}

// Search functionality
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredCompanies = allCompanies.filter(symbol => {
        const name = companyNames[symbol] || symbol;
        return name.toLowerCase().includes(searchTerm) || 
               symbol.toLowerCase().includes(searchTerm);
    });
    renderCompanies(filteredCompanies);
});

// Initialize
loadCompanies();