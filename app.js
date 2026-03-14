// გლობალური ობიექტი
let rates = { USD: 1 }; 
let currentTab = 'crypto';

// ჭკვიანი ქეშირება - API შეზღუდვების თავიდან ასაცილებლად
let cachedCrypto = [];
let cachedFiat = [];
let lastCryptoFetch = 0;
let lastFiatFetch = 0;
const CACHE_TIME = 30000; // 30 წამიანი დაცვა სპამისგან

const formatNum = (num, digits = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);

// მონაცემების წამოღება (კრიპტო)
async function fetchCryptoData(force = false) {
    const now = Date.now();
    
    // თუ 30 წამი არ გასულა ბოლო განახლებიდან და ქეში გვაქვს, უბრალოდ გამოვიყენოთ ქეში (API-ს არ ვეხებით)
    if (!force && now - lastCryptoFetch < CACHE_TIME && cachedCrypto.length > 0) {
        if (currentTab === 'crypto') renderCrypto(cachedCrypto);
        return;
    }

    try {
        showLoader(true);
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h');
        
        // თუ API-მ დაგვბლოკა ან რამე შეცდომაა
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ვინახავთ წარმატებულ მონაცემებს ქეშში
        cachedCrypto = data;
        lastCryptoFetch = Date.now();
        
        data.forEach(coin => {
            rates[coin.symbol.toUpperCase()] = coin.current_price;
        });

        if(currentTab === 'crypto') renderCrypto(cachedCrypto);
        
        updateTimestamp();
        updateConversion(); 
    } catch (e) { 
        console.error("კრიპტო ერორი (სავარაუდოდ Rate Limit):", e); 
        
        // თუ კოდი ჩამოვარდა, მაგრამ ძველი მონაცემები შენახული გვაქვს, გამოვაჩინოთ ისევ ის!
        if (cachedCrypto.length > 0 && currentTab === 'crypto') {
            renderCrypto(cachedCrypto);
            const timeInfo = document.getElementById('last-updated');
            timeInfo.innerText = "განახლება შეფერხდა (API Limit). ველოდებით...";
            timeInfo.classList.add('text-rose-400');
            setTimeout(() => timeInfo.classList.remove('text-rose-400'), 5000);
        } else if (currentTab === 'crypto') {
            // თუ ქეშიც ცარიელია (მაგ: საიტზე ახალი შემოსულია) და ეგრევე გაჭედა
            document.getElementById('data-table').innerHTML = `
                <tr>
                    <td colspan="4" class="p-8 text-center text-rose-400 font-bold bg-slate-800/50">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2 block"></i>
                        ბაზა გადატვირთულია. გთხოვთ მოიცადოთ 30 წამი და განაახლოთ გვერდი.
                    </td>
                </tr>`;
        }
    } finally { 
        showLoader(false); 
    }
}

// მონაცემების წამოღება (ვალუტა)
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
        if (cachedFiat.length > 0 && currentTab === 'fiat') {
            renderFiat(cachedFiat);
        } else if (currentTab === 'fiat') {
            document.getElementById('data-table').innerHTML = `<tr><td colspan="4" class="p-5 text-center text-rose-400">შეფერხება... სცადეთ მოგვიანებით.</td></tr>`;
        }
    } finally { 
        showLoader(false); 
    }
}

// -------------------------
// კონვერტერის ლოგიკა
// -------------------------
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

// ცხრილში დაჭერის ფუნქცია
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

// -------------------------
// ცხრილის რენდერი
// -------------------------
function renderCrypto(data) {
    const tableBody = document.getElementById('data-table');
    tableBody.innerHTML = '';
    
    data.forEach(coin => {
        const isUp = coin.price_change_percentage_24h >= 0;
        tableBody.innerHTML += `
            <tr onclick="selectForConversion('${coin.symbol.toUpperCase()}')" class="cursor-pointer hover:bg-slate-700/40 transition group border-b border-slate-700/30">
                <td class="p-5 flex items-center space-x-4">
                    <img src="${coin.image}" class="w-7 h-7 rounded-full" alt="${coin.name}">
                    <div>
                        <span class="block font-bold text-sm text-white group-hover:text-blue-400 transition">${coin.name}</span>
                        <span class="text-[10px] text-slate-500 uppercase">${coin.symbol}</span>
                    </div>
                </td>
                <td class="p-5 text-right font-mono text-sm font-bold text-blue-100">$${formatNum(coin.current_price, 2)}</td>
                <td class="p-5 text-right text-sm font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}">
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
            <tr onclick="selectForConversion('${item.symbol}')" class="cursor-pointer hover:bg-slate-700/40 transition border-b border-slate-700/30 group">
                <td class="p-5 flex items-center space-x-4">
                    <div class="w-7 h-7 bg-blue-600/20 rounded-full flex items-center justify-center text-[10px] text-blue-400 font-bold group-hover:bg-blue-600 group-hover:text-white transition">${item.symbol[0]}</div>
                    <div>
                        <span class="block font-bold text-sm text-white group-hover:text-blue-400 transition">${item.name}</span>
                        <span class="text-[10px] text-slate-500 uppercase">${item.symbol}</span>
                    </div>
                </td>
                <td class="p-5 text-right font-mono text-sm font-bold text-emerald-100">${formatNum(item.price, 4)} ₾</td>
                <td class="p-5 text-right text-sm text-slate-500">
                    --
                </td>
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

// -------------------------
// კონტროლები და ტაბები
// -------------------------
function switchTab(type) {
    // 1. ვრთავთ ტაბებს
    currentTab = type;
    document.getElementById('searchInput').value = '';
    
    document.getElementById('cryptoTab').className = type === 'crypto' ? "px-6 py-2 rounded-lg bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap" : "px-6 py-2 rounded-lg text-slate-400 hover:text-white transition-all whitespace-nowrap";
    document.getElementById('fiatTab').className = type === 'fiat' ? "px-6 py-2 rounded-lg bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap" : "px-6 py-2 rounded-lg text-slate-400 hover:text-white transition-all whitespace-nowrap";
    
    // 2. ვცვლით დეფოლტებს კონვერტერში
    const toSelect = document.getElementById('convert-to-select');
    if (type === 'crypto') {
        toSelect.value = 'USD';
        // ვაჩვენოთ ქეში ეგრევე, მერე API-ს ვკითხოთ სიახლე (თუ 30 წამი გავიდა)
        if(cachedCrypto.length > 0) renderCrypto(cachedCrypto);
        fetchCryptoData();
    } else {
        toSelect.value = 'GEL';
        if(cachedFiat.length > 0) renderFiat(cachedFiat);
        fetchFiatData(); 
    }
    updateConversion();
}

function showLoader(show) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !show);
    document.getElementById('refresh-icon').classList.toggle('fa-spin', show);
}

function updateTimestamp() {
    document.getElementById('last-updated').innerText = `განახლდა: ${new Date().toLocaleTimeString()}`;
    document.getElementById('last-updated').classList.remove('text-rose-400');
}

function refreshData() { 
    // ღილაკზე დაჭერით Force update (ძალით ვანახლებთ), მაგრამ მაინც იმოქმედებს catch ბლოკი თუ API გაგვიბრაზდება
    fetchFiatData(true); 
    fetchCryptoData(true);
}

// საწყისი გაშვება
fetchFiatData();
fetchCryptoData();