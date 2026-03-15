let rates = { USD: 1 }; 
let currentTab = 'crypto';

let cachedCrypto = [];
let cachedFiat = [];
let lastCryptoFetch = 0;
let lastFiatFetch = 0;
const CACHE_TIME = 30000; 

const formatNum = (num, digits = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);

// Theme ლოგიკა (ღამის/დღის რეჟიმი)
function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').classList.replace('fa-moon', 'fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-icon').classList.replace('fa-sun', 'fa-moon');
    }
}
initTheme();

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const icon = document.getElementById('theme-icon');
    if(isDark) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

async function fetchCryptoData(force = false) {
    const now = Date.now();
    if (!force && now - lastCryptoFetch < CACHE_TIME && cachedCrypto.length > 0) {
        if (currentTab === 'crypto') renderCrypto(cachedCrypto);
        return;
    }

    try {
        showLoader(true);
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h');
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        cachedCrypto = data;
        lastCryptoFetch = Date.now();
        
        data.forEach(coin => { rates[coin.symbol.toUpperCase()] = coin.current_price; });

        if(currentTab === 'crypto') renderCrypto(cachedCrypto);
        updateTimestamp();
        updateConversion(); 
    } catch (e) { 
        console.error("კრიპტო ერორი:", e); 
        if (cachedCrypto.length > 0 && currentTab === 'crypto') {
            renderCrypto(cachedCrypto);
            const timeInfo = document.getElementById('last-updated');
            timeInfo.innerText = "განახლება შეფერხდა (API Limit).";
            timeInfo.classList.add('text-rose-500');
            setTimeout(() => timeInfo.classList.remove('text-rose-500'), 5000);
        }
    } finally { 
        showLoader(false); 
    }
}

async function fetchFiatData(force = false) {
    const now = Date.now();
    if (!force && now - lastFiatFetch < CACHE_TIME && cachedFiat.length > 0) {
        if (currentTab === 'fiat') renderFiat(cachedFiat);
        return;
    }

    try {
        showLoader(true);
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) throw new Error("Fiat API Error");
        
        const data = await response.json();
        
        rates['GEL'] = 1 / data.rates.GEL;
        rates['EUR'] = 1 / data.rates.EUR;
        rates['GBP'] = 1 / data.rates.GBP;

        cachedFiat = [
            { name: 'აშშ დოლარი', symbol: 'USD', price: data.rates.GEL }, 
            { name: 'ევრო', symbol: 'EUR', price: data.rates.GEL / data.rates.EUR }, 
            { name: 'ბრიტანული ფუნტი', symbol: 'GBP', price: data.rates.GEL / data.rates.GBP }
        ];
        
        lastFiatFetch = Date.now();

        if(currentTab === 'fiat') renderFiat(cachedFiat);
        updateTimestamp();
        updateConversion(); 
    } catch (e) { 
        console.error("ვალუტის ერორი:", e); 
        if (cachedFiat.length > 0 && currentTab === 'fiat') renderFiat(cachedFiat);
    } finally { 
        showLoader(false); 
    }
}

function updateConversion() {
    const fromAmount = parseFloat(document.getElementById('convert-from-amount').value);
    const fromCurrency = document.getElementById('convert-from-select').value;
    const toCurrency = document.getElementById('convert-to-select').value;
    const resultField = document.getElementById('convert-to-amount');

    updateSymbols();

    if (isNaN(fromAmount) || !rates[fromCurrency] || !rates[toCurrency]) {
        resultField.value = '';
        return;
    }

    if (fromCurrency === toCurrency) {
        resultField.value = formatNum(fromAmount, isCrypto(toCurrency) ? 6 : 2);
        return;
    }

    let amountInUSD = fromAmount * rates[fromCurrency];
    let finalResult = amountInUSD / rates[toCurrency];

    const digits = isCrypto(toCurrency) ? 6 : 2;
    resultField.value = finalResult.toFixed(digits);
}

function isCrypto(symbol) {
    return !['USD', 'GEL', 'EUR', 'GBP'].includes(symbol);
}

function swapCurrencies() {
    const fromSelect = document.getElementById('convert-from-select');
    const toSelect = document.getElementById('convert-to-select');
    
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;
    
    updateConversion(); 
}

function ensureOptionExists(selectElement, value) {
    let exists = Array.from(selectElement.options).some(opt => opt.value === value);
    if (!exists) {
        let opt = document.createElement('option');
        opt.value = value;
        opt.text = value;
        selectElement.add(opt);
    }
}

function selectForConversion(symbol) {
    const fromSelect = document.getElementById('convert-from-select');
    const toSelect = document.getElementById('convert-to-select');

    ensureOptionExists(fromSelect, symbol);
    ensureOptionExists(toSelect, symbol);

    fromSelect.value = symbol;

    document.getElementById('converter-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    const convBox = document.getElementById('converter-section').firstElementChild;
    convBox.classList.add('ring-2', 'ring-blue-500');
    setTimeout(() => convBox.classList.remove('ring-2', 'ring-blue-500'), 500);

    updateConversion();
}

function updateSymbols() {
    const fromCurrency = document.getElementById('convert-from-select').value;
    const toCurrency = document.getElementById('convert-to-select').value;
    
    const icons = { 'GEL': '₾', 'USD': '$', 'BTC': '₿', 'ETH': 'Ξ', 'EUR': '€', 'GBP': '£' };
    
    document.getElementById('from-symbol-icon').innerText = icons[fromCurrency] || fromCurrency.substring(0,1);
    document.getElementById('to-symbol-icon').innerText = icons[toCurrency] || toCurrency.substring(0,1);
}

document.getElementById('convert-from-amount').addEventListener('input', updateConversion);
document.getElementById('convert-from-select').addEventListener('change', updateConversion);
document.getElementById('convert-to-select').addEventListener('change', updateConversion);

function renderCrypto(data) {
    const tableBody = document.getElementById('data-table');
    tableBody.innerHTML = '';
    
    data.forEach(coin => {
        const isUp = coin.price_change_percentage_24h >= 0;
        tableBody.innerHTML += `
            <tr onclick="selectForConversion('${coin.symbol.toUpperCase()}')" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition group border-b border-slate-200 dark:border-slate-700/30">
                <td class="p-5 flex items-center space-x-4">
                    <img src="${coin.image}" class="w-7 h-7 rounded-full" alt="${coin.name}">
                    <div>
                        <span class="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">${coin.name}</span>
                        <span class="text-[10px] text-slate-500 uppercase">${coin.symbol}</span>
                    </div>
                </td>
                <td class="p-5 text-right font-mono text-sm font-bold text-blue-700 dark:text-blue-100">$${formatNum(coin.current_price, 2)}</td>
                <td class="p-5 text-right text-sm font-semibold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                    ${isUp ? '▲' : '▼'} ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </td>
                <td class="p-5 text-right text-slate-500 text-xs hidden md:table-cell">$${formatNum(coin.market_cap / 1000000000)}B</td>
            </tr>`;
    });
    filterTable();
}

function renderFiat(ratesData) {
    const tableBody = document.getElementById('data-table');
    tableBody.innerHTML = '';

    ratesData.forEach(item => {
        tableBody.innerHTML += `
            <tr onclick="selectForConversion('${item.symbol}')" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition border-b border-slate-200 dark:border-slate-700/30 group">
                <td class="p-5 flex items-center space-x-4">
                    <div class="w-7 h-7 bg-blue-100 dark:bg-blue-600/20 rounded-full flex items-center justify-center text-[10px] text-blue-600 dark:text-blue-400 font-bold group-hover:bg-blue-600 group-hover:text-white transition">${item.symbol[0]}</div>
                    <div>
                        <span class="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">${item.name}</span>
                        <span class="text-[10px] text-slate-500 uppercase">${item.symbol}</span>
                    </div>
                </td>
                <td class="p-5 text-right font-mono text-sm font-bold text-emerald-700 dark:text-emerald-100">${formatNum(item.price, 4)} ₾</td>
                <td class="p-5 text-right text-sm text-slate-500">--</td>
                <td class="p-5 text-right text-slate-500 text-xs hidden md:table-cell">საერთაშორისო ბაზარი</td>
            </tr>`;
    });
    filterTable();
}

function filterTable() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const tableBody = document.getElementById("data-table");
    const rows = tableBody.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
        const nameColumn = rows[i].getElementsByTagName("td")[0];
        if (nameColumn) {
            const textValue = nameColumn.textContent || nameColumn.innerText;
            rows[i].style.display = textValue.toLowerCase().indexOf(input) > -1 ? "" : "none";
        }       
    }
}

function switchTab(type) {
    currentTab = type;
    document.getElementById('searchInput').value = '';
    
    // ტაბების სტილის შეცვლა
    const activeClass = "px-6 py-2 rounded-lg bg-blue-600 text-white font-bold transition-all shadow-lg whitespace-nowrap";
    const inactiveClass = "px-6 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all whitespace-nowrap";
    
    document.getElementById('cryptoTab').className = type === 'crypto' ? activeClass : inactiveClass;
    document.getElementById('fiatTab').className = type === 'fiat' ? activeClass : inactiveClass;
    
    if (type === 'crypto') {
        if(cachedCrypto.length > 0) renderCrypto(cachedCrypto);
        fetchCryptoData();
    } else {
        if(cachedFiat.length > 0) renderFiat(cachedFiat);
        fetchFiatData(); 
    }
    // ამოღებულია კალკულატორის ავტომატური შეცვლის ლოგიკა!
}

function showLoader(show) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !show);
    document.getElementById('refresh-icon').classList.toggle('fa-spin', show);
}

function updateTimestamp() {
    document.getElementById('last-updated').innerText = `განახლდა: ${new Date().toLocaleTimeString()}`;
}

function refreshData() { 
    fetchFiatData(true); 
    fetchCryptoData(true);
}

fetchFiatData();
fetchCryptoData();
