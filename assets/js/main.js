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

    window.normalizeTerrasanName = normalizeTerrasanName;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => normalizeTerrasanName(), { once: true });
    } else {
        normalizeTerrasanName();
    }

    window.addEventListener("load", () => normalizeTerrasanName());
    setTimeout(normalizeTerrasanName, 250);
    setTimeout(normalizeTerrasanName, 1500);

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
