const DEFAULT_TIMEOUT = 6500;

function json(res, status, payload) {
    res.statusCode = status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "s-maxage=60, stale-while-revalidate=300");
    res.setHeader("access-control-allow-origin", "*");
    res.end(JSON.stringify(payload));
}

async function fetchText(url, timeout = DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "user-agent": "O Terrasan market radar/1.0",
                "accept": "text/html,application/json"
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    } finally {
        clearTimeout(timer);
    }
}

async function fetchJson(url, timeout = DEFAULT_TIMEOUT) {
    return JSON.parse(await fetchText(url, timeout));
}

function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function fromAwesome(item) {
    if (!item?.bid) return null;
    return {
        value: number(item.bid),
        change: number(item.pctChange),
        source: "AwesomeAPI"
    };
}

async function getCurrencies() {
    const pairs = [
        ["usd", "BRL=X"],
        ["eur", "EURBRL=X"],
        ["gbp", "GBPBRL=X"],
        ["btc", "BTC-BRL"],
        ["eth", "ETH-BRL"]
    ];
    let primary = {};

    try {
        const data = await fetchJson("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL,ETH-BRL");
        const awesome = {
            usd: fromAwesome(data.USDBRL),
            eur: fromAwesome(data.EURBRL),
            gbp: fromAwesome(data.GBPBRL),
            btc: fromAwesome(data.BTCBRL),
            eth: fromAwesome(data.ETHBRL)
        };
        primary = Object.fromEntries(Object.entries(awesome).filter(([, value]) => Number.isFinite(Number(value?.value))));
    } catch {
        primary = {};
    }

    const fallbackEntries = await Promise.allSettled(pairs.map(async ([key, symbol]) => {
        const quote = await getYahooIndex(symbol);
        return [key, quote ? { ...quote, source: "Yahoo Finance chart" } : null];
    }));

    const fallback = Object.fromEntries(fallbackEntries
        .filter((entry) => entry.status === "fulfilled")
        .map((entry) => entry.value)
        .filter(([, value]) => Number.isFinite(Number(value?.value))));

    return Object.fromEntries(pairs.map(([key]) => {
        const yahoo = fallback[key];
        const awesome = primary[key];
        if (!Number.isFinite(Number(yahoo?.value)) && !Number.isFinite(Number(awesome?.value))) return null;

        return [key, {
            ...(yahoo || {}),
            ...(awesome || {}),
            chart: Array.isArray(yahoo?.chart) && yahoo.chart.length ? yahoo.chart : (awesome?.chart || [])
        }];
    }).filter(Boolean));
}

async function getBcbMacro() {
    const series = [
        ["selic", "432"],
        ["ipca", "433"]
    ];
    const entries = await Promise.all(series.map(async ([key, code]) => {
        const data = await fetchJson(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/1?formato=json`);
        return [key, { value: number(data?.[0]?.valor), source: `BCB SGS ${code}` }];
    }));
    return Object.fromEntries(entries);
}

async function getBrasilApiRates() {
    const data = await fetchJson("https://brasilapi.com.br/api/taxas/v1");
    const cdi = Array.isArray(data) ? data.find((item) => String(item.nome || "").toUpperCase() === "CDI") : null;
    return cdi ? { cdi: { value: number(cdi.valor), source: "BrasilAPI" } } : {};
}

function fromYahoo(result) {
    const meta = result?.chart?.result?.[0]?.meta;
    const quote = result?.chart?.result?.[0]?.indicators?.quote?.[0];
    const closes = Array.isArray(quote?.close) ? quote.close.filter((item) => Number.isFinite(item)) : [];
    const value = number(meta?.regularMarketPrice ?? closes.at(-1));
    const previous = number(meta?.chartPreviousClose);
    return {
        value,
        change: value && previous ? ((value - previous) / previous) * 100 : null,
        chart: closes.slice(-36),
        source: "Yahoo Finance chart"
    };
}

async function getYahooIndex(symbol) {
    return fromYahoo(await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`));
}

async function getBrapiIndex(symbol) {
    const url = new URL(`https://brapi.dev/api/quote/${encodeURIComponent(symbol)}`);
    const token = process.env.BRAPI_TOKEN || process.env.BRAPI_API_KEY;
    if (token) url.searchParams.set("token", token);

    const data = await fetchJson(url.toString());
    const item = data?.results?.[0];
    return item ? {
        value: number(item.regularMarketPrice),
        change: number(item.regularMarketChangePercent),
        chart: [],
        source: "brapi.dev"
    } : null;
}

async function getIndex(symbol) {
    try {
        const yahoo = await getYahooIndex(symbol);
        if (Number.isFinite(Number(yahoo?.value))) return yahoo;
        throw new Error(`Yahoo returned no value for ${symbol}`);
    } catch (error) {
        try {
            const brapi = await getBrapiIndex(symbol);
            if (Number.isFinite(Number(brapi?.value))) return brapi;
            throw new Error(`brapi returned no value for ${symbol}`);
        } catch {
            throw error;
        }
    }
}

function parseBrazilCurrency(text) {
    const match = text.match(/R\$\s*[\d\.\s\u00a0]+(?:,\d+)?/);
    if (!match) return null;
    return match[0].replace(/\s+/g, " ").trim();
}

async function getTaxometer() {
    const html = await fetchText("https://impostometro.org/");
    const display = parseBrazilCurrency(html);
    return display ? {
        display,
        source: "impostometro.org"
    } : null;
}

module.exports = async function handler(req, res) {
    if (req.method === "OPTIONS") return json(res, 200, {});

    const settled = await Promise.allSettled([
        getCurrencies(),
        getBcbMacro(),
        getBrasilApiRates(),
        Promise.all([
            getIndex("^BVSP"),
            getIndex("^IXIC"),
            getIndex("^GSPC"),
            getIndex("^DJI")
        ]),
        getTaxometer()
    ]);

    const [currencies, macroBcb, macroBrasilApi, indexesList, taxometer] = settled.map((item) => (
        item.status === "fulfilled" ? item.value : null
    ));

    const [ibov, nasdaq, sp500, dow] = indexesList || [];

    json(res, 200, {
        updatedAt: new Date().toISOString(),
        currencies: currencies || {},
        macro: {
            ...(macroBcb || {}),
            ...(macroBrasilApi || {})
        },
        indexes: { ibov, nasdaq, sp500, dow },
        taxometer,
        status: {
            currencies: settled[0].status,
            macroBcb: settled[1].status,
            macroBrasilApi: settled[2].status,
            indexes: settled[3].status,
            taxometer: settled[4].status
        }
    });
};
