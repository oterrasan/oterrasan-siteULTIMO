(() => {
    const legacy = "https://cdn.jsdelivr.net/gh/oterrasan/oterrasan-siteULTIMO@a61ee033e89289651cdeb032fbe2dc1729ea5dfa/assets/js/main.js";
    const replaceBrand = (value) => String(value || "")
        .replace(/TERRANZAN/g, "TERRASAN")
        .replace(/Terranzan/g, "Terrasan");
    const attrs = ["aria-label", "alt", "title", "content", "placeholder"];

    function normalizeTerrasanName(root = document) {
        document.title = replaceBrand(document.title);
        document.querySelectorAll("meta[content], [aria-label], [alt], [title], [placeholder]").forEach((node) => {
            attrs.forEach((attr) => {
                if (!node.hasAttribute?.(attr)) return;
                const current = node.getAttribute(attr);
                const next = replaceBrand(current);
                if (next !== current) node.setAttribute(attr, next);
            });
        });

        const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach((node) => {
            const next = replaceBrand(node.nodeValue);
            if (next !== node.nodeValue) node.nodeValue = next;
        });
    }

    function applyCorporateScale() {
        const eyebrow = document.querySelector(".hero-copy .eyebrow");
        const title = document.querySelector(".hero-command h1");
        const intro = document.querySelector(".hero-copy > p");
        const strip = document.querySelector(".enterprise-strip");

        if (eyebrow) eyebrow.textContent = "Grupo Terrasan | corporate operating system";
        if (title) title.textContent = "Um grupo de tecnologia, capital e midia desenhado para operar em escala institucional.";
        if (intro) intro.textContent = "Uma arquitetura corporativa que conecta audiencia, inteligencia artificial, produtos financeiros, CRM e ativos digitais em um mesmo sistema de crescimento.";

        if (intro && !document.querySelector(".executive-ribbon")) {
            const ribbon = document.createElement("div");
            ribbon.className = "executive-ribbon";
            ribbon.setAttribute("aria-label", "Capacidades institucionais do grupo");
            ribbon.innerHTML = `
                <div><span>Enterprise scope</span><strong>midia, capital, tecnologia e produtos</strong></div>
                <div><span>Distribution engine</span><strong>conteudo, redes, dados e relacionamento</strong></div>
                <div><span>AI operations</span><strong>automacao, CRM, agentes e dashboards</strong></div>
            `;
            intro.after(ribbon);
        }

        if (strip && !strip.textContent.includes("Client platforms")) {
            const item = document.createElement("span");
            item.textContent = "Client platforms";
            strip.append(item);
        }
    }

    window.normalizeTerrasanName = normalizeTerrasanName;
    window.applyCorporateScale = applyCorporateScale;

    const runPolish = () => {
        applyCorporateScale();
        normalizeTerrasanName();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runPolish, { once: true });
    } else {
        runPolish();
    }

    window.addEventListener("load", runPolish);
    setTimeout(runPolish, 250);
    setTimeout(runPolish, 1500);

    const startObserver = () => {
        if (!document.body) return;
        new MutationObserver(() => normalizeTerrasanName()).observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startObserver, { once: true });
    } else {
        startObserver();
    }

    document.write(`<script src="${legacy}"><\/script>`);
})();
