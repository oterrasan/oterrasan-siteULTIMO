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
    btc: "R$ 620 mil",
    selic: "10,50%",
    ipca: "4,50%",
    ibov: "126.000 pts",
    nasdaq: "17.800 pts",
    sp500: "5.300 pts"
};

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
        const data = await getJson("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL");
        const usd = data.USDBRL;
        const eur = data.EURBRL;
        const btc = data.BTCBRL;

        if (usd?.bid) {
            setMarket("usd", BRL.format(Number(usd.bid)));
            setChange("usd", `${Number(usd.pctChange || 0).toFixed(2).replace(".", ",")}%`);
        }
        if (eur?.bid) {
            setMarket("eur", BRL.format(Number(eur.bid)));
            setChange("eur", `${Number(eur.pctChange || 0).toFixed(2).replace(".", ",")}%`);
        }
        if (btc?.bid) {
            setMarket("btc", BRL.format(Number(btc.bid)));
            setChange("btc", `${Number(btc.pctChange || 0).toFixed(2).replace(".", ",")}%`);
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

async function loadMarketIndexes() {
    const items = [
        ["ibov", "%5EBVSP", "pts"],
        ["nasdaq", "%5EIXIC", "pts"],
        ["sp500", "%5EGSPC", "pts"]
    ];

    await Promise.all(items.map(async ([key, symbol, suffix]) => {
        try {
            const data = await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=5m`);
            const meta = data?.chart?.result?.[0]?.meta;
            const value = Number(meta?.regularMarketPrice);
            if (Number.isFinite(value)) setMarket(key, `${PLAIN.format(value)} ${suffix}`);
        } catch (error) {
            console.info(`Indice ${key} indisponivel; mantendo fallback local.`, error);
        }
    }));
}

function startTaxometer() {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - startOfYear) / 1000));
    const annualEstimate = 3800000000000;
    const secondsInYear = 365 * 24 * 60 * 60;
    const rate = annualEstimate / secondsInYear;
    let value = elapsedSeconds * rate;

    const render = () => {
        setMarket("taxometer", BRL.format(value).replace(",00", ""));
        value += rate;
    };

    render();
    setInterval(render, 1000);
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
    const links = document.querySelectorAll(".side-link");

    if (toggle) {
        toggle.addEventListener("click", () => {
            const open = document.body.classList.toggle("menu-open");
            toggle.setAttribute("aria-expanded", String(open));
        });
    }

    links.forEach((link) => {
        link.addEventListener("click", () => {
            document.body.classList.remove("menu-open");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
    });
}

function setupActiveNav() {
    const sections = [...document.querySelectorAll("section[id]")];
    const links = [...document.querySelectorAll(".side-link")];
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
    loadCurrencies();
    loadBcbSeries();
    loadMarketIndexes();
    setInterval(loadCurrencies, 120000);
    setInterval(loadBcbSeries, 300000);
    setInterval(loadMarketIndexes, 180000);
});
