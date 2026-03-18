const translations = {
    en: {
        total_balance: "Total Balance", add_asset_btn: "Add Asset", empty_portfolio: "Your portfolio is empty. Add assets.",
        top_gainer: "Top Gainer", top_loser: "Top Loser", latest_news: "Financial News",
        converter_title: "Global Converter", you_pay: "You Pay", you_get: "You Get",
        tab_crypto: "Crypto", tab_fiat: "Fiat", search_placeholder: "Search assets...",
        col_asset: "Asset", col_price: "Price", col_24h: "24h %", col_trend: "Trend (7d)", col_cap: "Market Cap",
        footer_about: "Your financial guide to crypto and fiat markets. Fast, accurate, and reliable real-time data.",
        footer_links: "Resources", footer_contact: "Contact", api_error: "Failed to load data. Please try again later."
    },
    ka: {
        total_balance: "საერთო ბალანსი", add_asset_btn: "აქტივის დამატება", empty_portfolio: "პორტფელი ცარიელია. დაამატეთ აქტივები.",
        top_gainer: "დღის ლიდერი", top_loser: "დღის წამგებიანი", latest_news: "ფინანსური სიახლეები",
        converter_title: "გლობალური კონვერტერი", you_pay: "იხდით", you_get: "იღებთ",
        tab_crypto: "კრიპტო", tab_fiat: "ვალუტა", search_placeholder: "მოძებნე აქტივი...",
        col_asset: "აქტივი", col_price: "ფასი", col_24h: "24სთ %", col_trend: "ტრენდი (7დ)", col_cap: "კაპიტალიზაცია",
        footer_about: "თქვენი ფინანსური მეგზური კრიპტო და ვალუტის ბაზრებზე. სწრაფი, ზუსტი და სანდო მონაცემები რეალურ დროში.",
        footer_links: "რესურსები", footer_contact: "კონტაქტი", api_error: "მონაცემების ჩატვირთვა ვერ მოხერხდა. სცადეთ მოგვიანებით."
    },
    ru: {
        total_balance: "Общий баланс", add_asset_btn: "Добавить актив", empty_portfolio: "Ваш портфель пуст.",
        top_gainer: "Лидер роста", top_loser: "Лидер падения", latest_news: "Финансовые новости",
        converter_title: "Глобальный конвертер", you_pay: "Вы платите", you_get: "Вы получаете",
        tab_crypto: "Крипто", tab_fiat: "Фиат", search_placeholder: "Поиск...",
        col_asset: "Актив", col_price: "Цена", col_24h: "24ч %", col_trend: "Тренд", col_cap: "Капитализация",
        footer_about: "Ваш финансовый гид на рынках. Быстрые и точные данные в реальном времени.",
        footer_links: "Ресурсы", footer_contact: "Контакты", api_error: "Не удалось загрузить данные. Попробуйте позже."
    },
    fr: {
        total_balance: "Solde Total", add_asset_btn: "Ajouter", empty_portfolio: "Portefeuille vide.",
        top_gainer: "Plus Forte Hausse", top_loser: "Plus Forte Baisse", latest_news: "Actualités",
        converter_title: "Convertisseur", you_pay: "Vous Payez", you_get: "Vous Obtenez",
        tab_crypto: "Crypto", tab_fiat: "Devises", search_placeholder: "Rechercher...",
        col_asset: "Actif", col_price: "Prix", col_24h: "24h %", col_trend: "Tendance", col_cap: "Capitalisation",
        footer_about: "Votre guide financier. Données rapides et précises en temps réel.",
        footer_links: "Ressources", footer_contact: "Contact", api_error: "Échec du chargement des données."
    },
    de: {
        total_balance: "Gesamtsaldo", add_asset_btn: "Hinzufügen", empty_portfolio: "Portfolio ist leer.",
        top_gainer: "Gewinner", top_loser: "Verlierer", latest_news: "Nachrichten",
        converter_title: "Währungsrechner", you_pay: "Sie zahlen", you_get: "Sie erhalten",
        tab_crypto: "Krypto", tab_fiat: "Fiat", search_placeholder: "Suchen...",
        col_asset: "Asset", col_price: "Preis", col_24h: "24h %", col_trend: "Trend", col_cap: "Marktkapitalisierung",
        footer_about: "Ihr Finanzführer. Schnelle und genaue Echtzeitdaten.",
        footer_links: "Ressourcen", footer_contact: "Kontakt", api_error: "Daten konnten nicht geladen werden."
    }
};

let currentLang = localStorage.getItem('novafi_lang') || 'en';
function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) el.placeholder = translations[lang][key];
    });
}
function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('novafi_lang', lang);
    applyLanguage(lang);
}

let rates = { USD: 1 }; 
let currentTab = 'crypto';
let cachedCrypto = [];
let cachedFiat = [];
let lastCryptoFetch = 0;
let lastFiatFetch = 0;
const CACHE_TIME = 60000; 

let favorites = JSON.parse(localStorage.getItem('novafi_favorites')) || [];
let myPortfolio = JSON.parse(localStorage.getItem('novafi_portfolio_web')) || {}; 

const formatNum = (num, digits = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').classList.replace('fa-moon', 'fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-icon').classList.replace('fa-sun', 'fa-moon');
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

async function fetchCryptoData(force = false) {
    const now = Date.now();
    if (!force && now - lastCryptoFetch < CACHE_TIME && cachedCrypto.length > 0) {
        if (currentTab === 'crypto') renderCrypto(cachedCrypto);
        return;
    }
    try {
        showLoader(true);
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h');
        
        if (!res.ok) throw new Error("API Limit Reached");
        const data = await res.json();
        
        if (!Array.isArray(data)) throw new Error("Invalid format");
        
        cachedCrypto = data;
        lastCryptoFetch = Date.now();
        cachedCrypto.forEach(coin => { rates[coin.symbol.toUpperCase()] = coin.current_price; });
        
        renderHighlights(cachedCrypto);
        updatePortfolioUI();
        if(currentTab === 'crypto') renderCrypto(cachedCrypto);
        updateTimestamp();
        updateConversion(); 
    } catch (e) { 
        console.error("Crypto API error:", e); 
        const tbody = document.getElementById('data-table');
        if(currentTab === 'crypto') {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-rose-500 font-bold bg-rose-500/10 rounded-xl">${translations[currentLang].api_error}</td></tr>`;
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
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        
        rates['GEL'] = 1 / data.rates.GEL;
        
        const fiatList = [
            { name: 'US Dollar', symbol: 'USD' },
            { name: 'Euro', symbol: 'EUR' },
            { name: 'British Pound', symbol: 'GBP' },
            { name: 'Swiss Franc', symbol: 'CHF' },
            { name: 'Japanese Yen', symbol: 'JPY' },
            { name: 'Australian Dollar', symbol: 'AUD' },
            { name: 'Canadian Dollar', symbol: 'CAD' },
            { name: 'Turkish Lira', symbol: 'TRY' },
            { name: 'UAE Dirham', symbol: 'AED' },
            { name: 'Georgian Lari', symbol: 'GEL' }
        ];

        cachedFiat = fiatList.map(f => {
            if(data.rates[f.symbol]) {
                rates[f.symbol] = 1 / data.rates[f.symbol];
                return { name: f.name, symbol: f.symbol }; // ახლა ფასს დინამიურად ვითვლით
            }
        }).filter(Boolean);

        lastFiatFetch = Date.now();
        updatePortfolioUI();
        if(currentTab === 'fiat') renderFiat(cachedFiat);
        updateTimestamp();
        updateConversion(); 
    } catch (e) { 
        console.error("Fiat API error:", e); 
    } finally { 
        showLoader(false); 
    }
}

async function fetchNews() {
    const container = document.getElementById('news-container');
    try {
        const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
        const data = await res.json();
        if (data && data.Data) {
            container.innerHTML = '';
            data.Data.slice(0, 8).forEach(news => {
                const timeStr = new Date(news.published_on * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                container.innerHTML += `
                    <div class="news-card glass-panel border border-white/40 dark:border-slate-800/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md hover:-translate-y-1 transition duration-300" onclick="window.open('${news.url}', '_blank')">
                        <div class="flex gap-4 mb-2">
                            <img src="${news.imageurl}" class="w-16 h-16 rounded-xl object-cover shadow-sm" alt="news" onerror="this.src='https://via.placeholder.com/64'">
                            <h4 class="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-3">${news.title}</h4>
                        </div>
                        <div class="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase mt-3">
                            <span class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${news.source_info.name}</span>
                            <span><i class="far fa-clock"></i> ${timeStr}</span>
                        </div>
                    </div>
                `;
            });
        }
    } catch(e) { container.innerHTML = `<p class="text-sm text-center w-full text-slate-500">News temporarily unavailable</p>`; }
}

function renderHighlights(data) {
    if(!data || !data.length) return;
    let sorted = [...data].filter(c => c.price_change_percentage_24h !== null).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    let gainer = sorted[0], loser = sorted[sorted.length - 1];

    document.getElementById('gainer-symbol').innerText = gainer.symbol.toUpperCase();
    document.getElementById('gainer-change').innerText = `+${gainer.price_change_percentage_24h.toFixed(2)}%`;
    document.getElementById('gainer-img').src = gainer.image; document.getElementById('gainer-img').classList.remove('hidden');

    document.getElementById('loser-symbol').innerText = loser.symbol.toUpperCase();
    document.getElementById('loser-change').innerText = `${loser.price_change_percentage_24h.toFixed(2)}%`;
    document.getElementById('loser-img').src = loser.image; document.getElementById('loser-img').classList.remove('hidden');
}

function addAssetPrompt() {
    let symbol = prompt(currentLang === 'ka' ? "შეიყვანეთ ვალუტის სიმბოლო (მაგ. BTC, EUR, USD):" : "Enter Asset Symbol (e.g. BTC, EUR, USD):", "BTC");
    if(!symbol) return;
    symbol = symbol.toUpperCase();
    let amountStr = prompt(currentLang === 'ka' ? "შეიყვანეთ რაოდენობა:" : "Enter Amount:", "0.5");
    if(!amountStr) return;
    let amount = parseFloat(amountStr);
    if(isNaN(amount)) return alert(currentLang === 'ka' ? "არასწორი რაოდენობა" : "Invalid amount");
    
    myPortfolio[symbol] = (myPortfolio[symbol] || 0) + amount;
    if(myPortfolio[symbol] <= 0) delete myPortfolio[symbol];
    localStorage.setItem('novafi_portfolio_web', JSON.stringify(myPortfolio));
    updatePortfolioUI();
}

function updatePortfolioUI() {
    const list = document.getElementById('portfolio-list');
    const msg = document.getElementById('empty-portfolio-msg');
    let totalUSD = 0;
    list.innerHTML = '';
    const keys = Object.keys(myPortfolio);
    
    if(keys.length === 0) { msg.style.display = 'block'; } else {
        msg.style.display = 'none';
        keys.forEach(sym => {
            const amount = myPortfolio[sym];
            const rate = rates[sym] || 0;
            const usdValue = amount * rate;
            totalUSD += usdValue;
            
            list.innerHTML += `
                <div class="flex justify-between items-center p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-700/30">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">${sym[0]}</div>
                        <span class="font-bold text-sm text-slate-800 dark:text-white">${amount} <span class="text-xs text-slate-500">${sym}</span></span>
                    </div>
                    <span class="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">$${formatNum(usdValue, 2)}</span>
                </div>
            `;
        });
    }
    document.getElementById('portfolio-total').innerText = `$${formatNum(totalUSD, 2)}`;
}

function toggleFavorite(symbol, event) {
    event.stopPropagation();
    favorites.includes(symbol) ? favorites = favorites.filter(fav => fav !== symbol) : favorites.push(symbol);
    localStorage.setItem('novafi_favorites', JSON.stringify(favorites));
    if(currentTab === 'crypto') renderCrypto(cachedCrypto);
}

function generateSparkline(sparklineData, isUp) {
    if (!sparklineData || !sparklineData.price || !sparklineData.price.length) return '';
    const prices = sparklineData.price;
    const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
    const points = prices.map((p, i) => `${(i / (prices.length - 1)) * 100},${30 - ((p - min) / range) * 30}`).join(' ');
    const color = isUp ? '#10b981' : '#e11d48'; 
    return `<svg viewBox="0 -5 100 40" class="w-24 h-10 mx-auto" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="2.5" points="${points}" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
}

function updateConversion() {
    const fromAmt = parseFloat(document.getElementById('convert-from-amount').value);
    const fromCur = document.getElementById('convert-from-select').value;
    const toCur = document.getElementById('convert-to-select').value;
    const resultField = document.getElementById('convert-to-amount');
    
    updateSymbols();
    
    if (isNaN(fromAmt) || !rates[fromCur] || !rates[toCur]) { resultField.value = ''; return; }
    resultField.value = ((fromAmt * rates[fromCur]) / rates[toCur]).toFixed(isCrypto(toCur) ? 6 : 2);

    // ვაახლებთ ცხრილებს დინამიურად, არჩეული ვალუტის მიხედვით
    if (currentTab === 'crypto' && cachedCrypto.length > 0) renderCrypto(cachedCrypto);
    if (currentTab === 'fiat' && cachedFiat.length > 0) renderFiat(cachedFiat);
}

function isCrypto(symbol) { return !['USD', 'GEL', 'EUR', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'TRY', 'AED'].includes(symbol); }

function swapCurrencies() {
    const fromSel = document.getElementById('convert-from-select'), toSel = document.getElementById('convert-to-select');
    const temp = fromSel.value; fromSel.value = toSel.value; toSel.value = temp;
    updateConversion(); 
}

function ensureOptionExists(sel, val) {
    if (!Array.from(sel.options).some(opt => opt.value === val)) {
        let opt = document.createElement('option'); opt.value = opt.text = val; sel.add(opt);
    }
}

function selectForConversion(symbol) {
    const fromSel = document.getElementById('convert-from-select'), toSel = document.getElementById('convert-to-select');
    ensureOptionExists(fromSel, symbol); ensureOptionExists(toSel, symbol);
    fromSel.value = symbol;
    document.getElementById('converter-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
    const box = document.getElementById('converter-section').firstElementChild;
    box.classList.add('ring-4', 'ring-blue-500/50');
    setTimeout(() => box.classList.remove('ring-4', 'ring-blue-500/50'), 800);
    updateConversion();
}

function updateSymbols() {
    const f = document.getElementById('convert-from-select').value, t = document.getElementById('convert-to-select').value;
    const icons = { 'GEL': '₾', 'USD': '$', 'BTC': '₿', 'ETH': 'Ξ', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'TRY': '₺', 'AED': 'د.إ' };
    document.getElementById('from-symbol-icon').innerText = icons[f] || f[0];
    document.getElementById('to-symbol-icon').innerText = icons[t] || t[0];
}

document.getElementById('convert-from-amount').addEventListener('input', updateConversion);

// აქტიური "You Pay" ვალუტის ლოგიკა ცხრილებისთვის
function getBaseCurrencyInfo() {
    const baseCur = document.getElementById('convert-from-select').value;
    const baseRate = rates[baseCur] || 1;
    const icons = { 'GEL': '₾', 'USD': '$', 'BTC': '₿', 'ETH': 'Ξ', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'TRY': '₺', 'AED': 'د.إ' };
    const baseIcon = icons[baseCur] || baseCur;
    return { baseCur, baseRate, baseIcon };
}

function renderCrypto(data) {
    const tbody = document.getElementById('data-table'); tbody.innerHTML = '';
    const sorted = [...data].sort((a, b) => (favorites.includes(b.symbol.toUpperCase()) ? 1 : 0) - (favorites.includes(a.symbol.toUpperCase()) ? 1 : 0));
    
    const { baseCur, baseRate, baseIcon } = getBaseCurrencyInfo();

    sorted.forEach(c => {
        const isUp = c.price_change_percentage_24h >= 0, sym = c.symbol.toUpperCase(), isFav = favorites.includes(sym);
        const priceInBase = c.current_price / baseRate;
        const capInBase = c.market_cap / baseRate;
        
        tbody.innerHTML += `
            <tr onclick="selectForConversion('${sym}')" class="hover:bg-slate-200/50 dark:hover:bg-slate-700/40 transition group border-b border-slate-200 dark:border-slate-800">
                <td class="p-4 text-center"><i onclick="toggleFavorite('${sym}', event)" class="${isFav ? 'fas text-yellow-400' : 'far text-slate-300 dark:text-slate-600 hover:text-yellow-400'} fa-star text-lg transition z-10 relative"></i></td>
                <td class="p-4 flex items-center space-x-4"><img src="${c.image}" class="w-8 h-8 rounded-full shadow-sm" alt="icon">
                    <div><span class="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">${c.name}</span><span class="text-[10px] text-slate-500 uppercase">${sym}</span></div>
                </td>
                <td class="p-4 text-right font-mono text-sm font-bold text-blue-700 dark:text-blue-200">${baseIcon} ${formatNum(priceInBase, isCrypto(baseCur) ? 6 : 2)}</td>
                <td class="p-4 text-right"><span class="px-2 py-1.5 rounded-lg text-xs font-bold ${isUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}">${isUp ? '▲' : '▼'} ${Math.abs(c.price_change_percentage_24h).toFixed(2)}%</span></td>
                <td class="p-4 text-center hidden md:table-cell align-middle">${generateSparkline(c.sparkline_in_7d, isUp)}</td>
                <td class="p-4 text-right text-slate-500 text-xs hidden lg:table-cell font-mono">${baseIcon} ${formatNum(capInBase / 1e9)}B</td>
            </tr>`;
    }); filterTable();
}

function renderFiat(data) {
    const tbody = document.getElementById('data-table'); tbody.innerHTML = '';
    
    const { baseCur, baseRate, baseIcon } = getBaseCurrencyInfo();

    data.forEach(i => {
        if (i.symbol === baseCur) return; // არ გამოვაჩინოთ იგივე ვალუტა ცხრილში (მაგ. USD -> USD)
        
        const assetRate = rates[i.symbol] || 0;
        const priceInBase = assetRate / baseRate; // დინამიური ფასი

        tbody.innerHTML += `
            <tr onclick="selectForConversion('${i.symbol}')" class="hover:bg-slate-200/50 dark:hover:bg-slate-700/40 transition border-b border-slate-200 dark:border-slate-800 group">
                <td class="p-4 text-center text-slate-300">-</td>
                <td class="p-4 flex items-center space-x-4"><div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">${i.symbol[0]}</div>
                    <div><span class="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition">${i.name}</span><span class="text-[10px] text-slate-500 uppercase">${i.symbol}</span></div>
                </td>
                <td class="p-4 text-right font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">${baseIcon} ${formatNum(priceInBase, 4)}</td>
                <td class="p-4 text-right text-slate-500">--</td><td class="p-4 text-center hidden md:table-cell">--</td><td class="p-4 text-right hidden lg:table-cell text-xs text-slate-400">-</td>
            </tr>`;
    }); filterTable();
}

function filterTable() {
    const input = document.getElementById("searchInput").value.toLowerCase(), rows = document.getElementById("data-table").getElementsByTagName("tr");
    for (let r of rows) { const td = r.getElementsByTagName("td")[1]; if (td) r.style.display = (td.textContent || td.innerText).toLowerCase().includes(input) ? "" : "none"; }
}

function switchTab(t) {
    currentTab = t; document.getElementById('searchInput').value = '';
    const act = "px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold transition-all shadow-md flex-1 text-sm";
    const inact = "px-8 py-2.5 rounded-xl text-slate-500 font-bold hover:text-slate-900 dark:hover:text-white transition-all flex-1 text-sm";
    document.getElementById('cryptoTab').className = t === 'crypto' ? act : inact;
    document.getElementById('fiatTab').className = t === 'fiat' ? act : inact;
    t === 'crypto' ? (cachedCrypto.length ? renderCrypto(cachedCrypto) : fetchCryptoData()) : (cachedFiat.length ? renderFiat(cachedFiat) : fetchFiatData());
}

function showLoader(show) { document.getElementById('loading-overlay').classList.toggle('hidden', !show); document.getElementById('refresh-icon').classList.toggle('fa-spin', show); }
function updateTimestamp() { const el = document.getElementById('last-updated'); if(el) el.innerText = `Updated: ${new Date().toLocaleTimeString()}`; }
function refreshData() { fetchFiatData(true); fetchCryptoData(true); fetchNews(); }

document.getElementById('convert-from-select').addEventListener('change', () => {
    updateConversion();
});

initTheme();
document.getElementById('language-selector').value = currentLang;
applyLanguage(currentLang);
fetchFiatData();
fetchCryptoData();
fetchNews();
