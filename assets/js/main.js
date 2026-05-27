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
    Object.entries(data?.currencies || {}).forEach(([key, item]) => {
        const formatted = formatMarketCurrency(key, item?.value);
        if (formatted) setMarket(key, formatted);
        if (Number.isFinite(Number(item?.change))) setChange(key, formatPercent(item.change));
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
}

async function loadMarketApi() {
    const data = await getJson("/api/market", 7500);
    applyMarketApi(data);
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
    setupSidebar();
    setupActiveNav();
    setupReveal();
    startClock();
    startTaxometer();
    refreshMarketData();
    setInterval(refreshMarketData, 60000);
});
