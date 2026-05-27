const BRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2
});

const PLAIN = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2
});

const defaults = {
    usd: "R$ 5,66",
    eur: "R$ 6,14",
    gbp: "R$ 7,20",
    btc: "R$ 620 mil",
    eth: "R$ 18 mil",
    selic: "10,50%",
    cdi: "10,40%",
    ipca: "4,50%",
    ibov: "126.000 pts",
    nasdaq: "17.800 pts",
    dow: "39.000 pts",
    sp500: "5.300 pts"
};

let taxometerTimer;

function setText(selector, value) {
    document.querySelectorAll(selector).forEach((node) => {
        node.textContent = value;
    });
}

function setMarket(key, value) {
    setText(`[data-market="${key}"]`, value);
}

function setChange(key, value) {
    document.querySelectorAll(`[data-market-change="${key}"]`).forEach((node) => {
        node.textContent = value;
        node.style.color = value.trim().startsWith("-") ? "var(--red)" : "var(--green)";
    });
}

function chartPoints(values) {
    const points = (values || []).map(Number).filter(Number.isFinite).slice(-36);
    if (points.length < 2) return null;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || Math.abs(max) || 1;

    return points.map((value, index) => {
        const x = (index / (points.length - 1)) * 300;
        const y = 112 - ((value - min) / span) * 94;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
}

function renderChart(key, values) {
    const points = chartPoints(values);
    if (!points) return;

    document.querySelectorAll(`[data-chart="${key}"]`).forEach((node) => {
        node.setAttribute("points", points);
    });
}

function enhanceRadarCards() {
    const thumbs = ["thumb-market", "thumb-insurance", "thumb-sector", "thumb-ai", "thumb-build"];

    document.querySelectorAll(".radar-list a").forEach((link, index) => {
        const meta = link.querySelector("span:not(.radar-thumb)");
        if (meta) meta.classList.add("radar-meta");

        if (!link.querySelector(".radar-thumb")) {
            const thumb = document.createElement("span");
            thumb.className = `radar-thumb ${thumbs[index % thumbs.length]}`;
            link.prepend(thumb);
        }

        if (!link.querySelector("strong")) {
            const text = [...link.childNodes]
                .filter((node) => node.nodeType === Node.TEXT_NODE)
                .map((node) => node.textContent.trim())
                .filter(Boolean)
                .join(" ");

            [...link.childNodes].forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) node.remove();
            });

            const title = document.createElement("strong");
            title.textContent = text || link.textContent.trim();
            link.append(title);
        }
    });
}

function ensureLivePanelChrome() {
    const panelStatus = document.querySelector(".panel-status");
    if (panelStatus && !document.querySelector(".source-pulse")) {
        panelStatus.insertAdjacentHTML("afterend", `
            <div class="source-pulse">
                <span>Dados reais</span>
                <strong>Yahoo Finance, BCB SGS, BrasilAPI, AwesomeAPI e Impostometro</strong>
            </div>
        `);
    }

    const charts = document.querySelector(".dual-charts");
    if (charts && !charts.querySelector('[data-chart="usd"]')) {
        charts.insertAdjacentHTML("beforeend", `
            <div class="market-screen" aria-label="Grafico de moedas animado">
                <div class="screen-head"><span>FX pulse</span><strong>Dolar / Cripto</strong></div>
                <svg class="live-chart" viewBox="0 0 300 130" role="img" aria-label="Linha de moedas em movimento">
                    <path class="chart-grid" d="M0 26 H300 M0 65 H300 M0 104 H300 M60 0 V130 M120 0 V130 M180 0 V130 M240 0 V130"></path>
                    <polyline class="chart-line" data-chart="usd" points="0,64 28,58 58,74 88,52 118,66 148,42 178,55 208,34 238,49 268,30 300,38"></polyline>
                    <polyline class="chart-line" data-chart="btc" points="0,92 24,76 54,86 86,62 116,72 146,44 176,66 206,36 238,48 268,28 300,58"></polyline>
                </svg>
                <div class="market-scan"></div>
            </div>
        `);
    }

    if (charts && !charts.querySelector('[data-chart="dow"]')) {
        charts.insertAdjacentHTML("beforeend", `
            <div class="market-screen" aria-label="Grafico Dow Jones e euro animado">
                <div class="screen-head"><span>Wall Street / FX</span><strong>Dow / Euro</strong></div>
                <svg class="live-chart" viewBox="0 0 300 130" role="img" aria-label="Linha Dow Jones e euro em movimento">
                    <path class="chart-grid" d="M0 26 H300 M0 65 H300 M0 104 H300 M60 0 V130 M120 0 V130 M180 0 V130 M240 0 V130"></path>
                    <polyline class="chart-line" data-chart="dow" points="0,82 28,70 56,78 86,58 116,64 146,40 176,52 206,33 236,44 266,31 300,46"></polyline>
                    <polyline class="chart-line" data-chart="eur" points="0,44 28,58 56,50 86,72 116,60 146,86 176,66 206,92 236,74 266,100 300,84"></polyline>
                </svg>
                <div class="market-scan"></div>
            </div>
        `);
    }

    if (charts && !charts.querySelector('[data-chart="gbp"]')) {
        charts.insertAdjacentHTML("beforeend", `
            <div class="market-screen" aria-label="Grafico libra e ethereum animado">
                <div class="screen-head"><span>Risk pulse</span><strong>Libra / ETH</strong></div>
                <svg class="live-chart" viewBox="0 0 300 130" role="img" aria-label="Linha libra e ethereum em movimento">
                    <path class="chart-grid" d="M0 26 H300 M0 65 H300 M0 104 H300 M60 0 V130 M120 0 V130 M180 0 V130 M240 0 V130"></path>
                    <polyline class="chart-line" data-chart="gbp" points="0,70 28,60 56,68 86,48 116,60 146,42 176,54 206,38 236,52 266,36 300,44"></polyline>
                    <polyline class="chart-line" data-chart="eth" points="0,96 28,82 56,88 86,64 116,76 146,48 176,70 206,42 236,56 266,34 300,62"></polyline>
                </svg>
                <div class="market-scan"></div>
            </div>
        `);
    }

    if (charts && !document.querySelector(".market-marquee")) {
        charts.insertAdjacentHTML("afterend", `
            <div class="market-marquee" aria-label="Esteira de mercado">
                <span>IBOV</span><span>DOLAR</span><span>EURO</span><span>BTC</span><span>SELIC</span><span>CDI</span><span>IPCA</span><span>IMPOSTOS</span>
            </div>
        `);
    }
}

function parseCurrencyText(value) {
    const digits = String(value || "").replace(/[^\d,]/g, "").replace(",", ".");
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value) {
    const parsed = Number(value || 0);
    return `${parsed.toFixed(2).replace(".", ",")}%`;
}

function formatMarketCurrency(key, value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (key === "btc" || key === "eth") return BRL.format(parsed).replace(",00", "");
    return BRL.format(parsed);
}

function setUpdated(value) {
    const date = value ? new Date(value) : new Date();
    const label = Number.isNaN(date.getTime()) ? "atualizado agora" : date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "America/Sao_Paulo"
    });
    setText("[data-updated]", `atualizado ${label}`);
}

function bootDefaults() {
    Object.entries(defaults).forEach(([key, value]) => setMarket(key, value));
}

async function getJson(url, timeout = 6500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

async function loadCurrencies() {
    try {
        const data = await getJson("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL,ETH-BRL");
        const usd = data.USDBRL;
        const eur = data.EURBRL;
        const gbp = data.GBPBRL;
        const btc = data.BTCBRL;
        const eth = data.ETHBRL;

        if (usd?.bid) {
            setMarket("usd", BRL.format(Number(usd.bid)));
            setChange("usd", formatPercent(usd.pctChange));
        }
        if (eur?.bid) {
            setMarket("eur", BRL.format(Number(eur.bid)));
            setChange("eur", formatPercent(eur.pctChange));
        }
        if (gbp?.bid) {
            setMarket("gbp", BRL.format(Number(gbp.bid)));
            setChange("gbp", formatPercent(gbp.pctChange));
        }
        if (btc?.bid) {
            setMarket("btc", BRL.format(Number(btc.bid)));
            setChange("btc", formatPercent(btc.pctChange));
        }
        if (eth?.bid) {
            setMarket("eth", BRL.format(Number(eth.bid)));
            setChange("eth", formatPercent(eth.pctChange));
        }
    } catch (error) {
        console.info("Cotacoes externas indisponiveis; mantendo fallback local.", error);
    }
}

async function loadBcbSeries() {
    const series = [
        ["selic", "432"],
        ["ipca", "433"]
    ];

    await Promise.all(series.map(async ([key, code]) => {
        try {
            const data = await getJson(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/1?formato=json`);
            const value = Number(data?.[0]?.valor);
            if (Number.isFinite(value)) setMarket(key, `${PLAIN.format(value)}%`);
        } catch (error) {
            console.info(`Serie BCB ${code} indisponivel; mantendo fallback local.`, error);
        }
    }));
}

async function loadBrasilApiRates() {
    try {
        const data = await getJson("https://brasilapi.com.br/api/taxas/v1");
        const cdi = Array.isArray(data) ? data.find((item) => String(item.nome || "").toUpperCase() === "CDI") : null;
        if (Number.isFinite(Number(cdi?.valor))) setMarket("cdi", `${PLAIN.format(Number(cdi.valor))}%`);
    } catch (error) {
        console.info("BrasilAPI taxas indisponivel; mantendo fallback local.", error);
    }
}

async function loadMarketIndexes() {
    const items = [
        ["ibov", "%5EBVSP", "pts"],
        ["nasdaq", "%5EIXIC", "pts"],
        ["sp500", "%5EGSPC", "pts"],
        ["dow", "%5EDJI", "pts"]
    ];

    await Promise.all(items.map(async ([key, symbol, suffix]) => {
        try {
            const data = await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=5m`);
            const meta = data?.chart?.result?.[0]?.meta;
            const quote = data?.chart?.result?.[0]?.indicators?.quote?.[0];
            const closes = Array.isArray(quote?.close) ? quote.close.filter(Number.isFinite) : [];
            const value = Number(meta?.regularMarketPrice);
            if (Number.isFinite(value)) setMarket(key, `${PLAIN.format(value)} ${suffix}`);
            renderChart(key, closes);
        } catch (error) {
            console.info(`Indice ${key} indisponivel; mantendo fallback local.`, error);
        }
    }));
}

function startTaxometer(initialValue) {
    if (taxometerTimer) clearInterval(taxometerTimer);

    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - startOfYear) / 1000));
    const annualEstimate = 3800000000000;
    const secondsInYear = 365 * 24 * 60 * 60;
    const rate = annualEstimate / secondsInYear;
    let value = Number.isFinite(initialValue) ? initialValue : elapsedSeconds * rate;

    const render = () => {
        setMarket("taxometer", BRL.format(value).replace(",00", ""));
        value += rate;
    };

    render();
    taxometerTimer = setInterval(render, 1000);
}

function applyMarketApi(data) {
    let currencyCount = 0;

    Object.entries(data?.currencies || {}).forEach(([key, item]) => {
        const formatted = formatMarketCurrency(key, item?.value);
        if (formatted) {
            currencyCount += 1;
            setMarket(key, formatted);
        }
        if (Number.isFinite(Number(item?.change))) setChange(key, formatPercent(item.change));
        renderChart(key, item?.chart);
    });

    Object.entries(data?.macro || {}).forEach(([key, item]) => {
        if (Number.isFinite(Number(item?.value))) setMarket(key, `${PLAIN.format(Number(item.value))}%`);
    });

    Object.entries(data?.indexes || {}).forEach(([key, item]) => {
        if (Number.isFinite(Number(item?.value))) setMarket(key, `${PLAIN.format(Number(item.value))} pts`);
        renderChart(key, item?.chart);
    });

    if (data?.taxometer?.display) {
        setMarket("taxometer", data.taxometer.display);
        const parsed = parseCurrencyText(data.taxometer.display);
        if (parsed) startTaxometer(parsed);
    }

    setUpdated(data?.updatedAt);
    return { currencyCount };
}

async function loadMarketApi() {
    const data = await getJson("/api/market", 7500);
    const result = applyMarketApi(data);
    if (!result.currencyCount) await loadCurrencies();
}

async function refreshMarketData() {
    try {
        await loadMarketApi();
    } catch (error) {
        console.info("API propria de mercado indisponivel; usando fontes diretas.", error);
        await Promise.all([
            loadCurrencies(),
            loadBcbSeries(),
            loadBrasilApiRates(),
            loadMarketIndexes()
        ]);
        setUpdated();
    }
}

function startClock() {
    const render = () => {
        const now = new Date();
        const time = now.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo"
        });
        setText("[data-clock]", time);
    };
    render();
    setInterval(render, 10000);
}

function setupSidebar() {
    const toggle = document.querySelector(".mobile-shell-toggle");
    const links = document.querySelectorAll(".top-nav a");

    if (toggle) {
        toggle.addEventListener("click", () => {
            const open = document.body.classList.toggle("nav-open");
            toggle.setAttribute("aria-expanded", String(open));
        });
    }

    links.forEach((link) => {
        link.addEventListener("click", () => {
            document.body.classList.remove("nav-open");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
    });
}

function setupActiveNav() {
    const sections = [...document.querySelectorAll("section[id]")];
    const links = [...document.querySelectorAll(".top-nav > .nav-item > a, .top-nav > a")];
    const map = new Map(links.map((link) => [link.getAttribute("href")?.replace("#", ""), link]));

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        links.forEach((link) => link.classList.remove("active"));
        map.get(visible.target.id)?.classList.add("active");
    }, {
        rootMargin: "-22% 0px -60% 0px",
        threshold: [0.16, 0.32, 0.48]
    });

    sections.forEach((section) => observer.observe(section));
}

function setupReveal() {
    const items = document.querySelectorAll(".section-block, .impact-copy, .impact-command, .market-tape");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
    }, { threshold: 0.08 });

    items.forEach((item) => {
        item.classList.add("reveal");
        observer.observe(item);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    bootDefaults();
    enhanceRadarCards();
    ensureLivePanelChrome();
    setupSidebar();
    setupActiveNav();
    setupReveal();
    startClock();
    startTaxometer();
    refreshMarketData();
    setInterval(refreshMarketData, 60000);
});
