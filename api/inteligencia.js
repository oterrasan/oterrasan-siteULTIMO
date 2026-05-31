const LANGS = { Ingles: "ingles", Espanhol: "espanhol", Frances: "frances", Italiano: "italiano", Alemao: "alemao", Portugues: "portugues" };

const TOOLS = {
  reescrever: (t) => `Reescreva o texto abaixo em portugues brasileiro, mantendo o sentido e melhorando fluidez. Retorne apenas o texto final.\n\n${t}`,
  corretor: (t) => `Corrija ortografia, gramatica, pontuacao e concordancia. Retorne apenas o texto corrigido.\n\n${t}`,
  "detector-ia": (t) => `Analise sinais de texto gerado por IA. Retorne em portugues com percentual estimado e justificativa curta.\n\n${t}`,
  humanizar: (t) => `Humanize o texto, removendo padroes artificiais e deixando natural, claro e profissional. Retorne apenas o texto.\n\n${t}`,
  tradutor: (t,o={}) => `Traduza o texto para ${LANGS[o.targetLang] || "ingles"}. Retorne apenas a traducao.\n\n${t}`,
  resumidor: (t) => `Resuma o texto em portugues, preservando pontos importantes e deixando claro para uso profissional.\n\n${t}`,
  "reformular-tom": (t,o={}) => `Reformule o texto no tom ${o.tom || "Formal"}. Retorne apenas o texto final.\n\n${t}`,
  "email-profissional": (t) => `Transforme o contexto abaixo em um e-mail profissional completo, com assunto, saudacao, corpo e encerramento.\n\n${t}`,
  "resposta-critica": (t) => `Crie uma resposta profissional, empatica e estrategica para a critica ou avaliacao abaixo.\n\n${t}`,
  "whatsapp-pro": (t) => `Transforme a mensagem abaixo em uma comunicacao de WhatsApp profissional, objetiva e educada.\n\n${t}`,
  "roteiro-conversa": (t) => `Crie um roteiro para conduzir esta conversa dificil com clareza, empatia e firmeza.\n\n${t}`,
  reclamacao: (t) => `Escreva uma reclamacao formal, objetiva e bem estruturada com base nas informacoes abaixo.\n\n${t}`,
  "recurso-multa": (t) => `Escreva um recurso administrativo de multa de transito com linguagem formal, argumentos de defesa e pedido final.\n\n${t}`,
  "carta-apresentacao": (t) => `Crie uma carta de apresentacao profissional com base nas informacoes abaixo.\n\n${t}`,
  "peticao-simples": (t) => `Escreva uma peticao ou requerimento simples, formal e organizado, com objeto, fundamentos e pedido.\n\n${t}`,
  discurso: (t) => `Crie um discurso humano, elegante e memoravel para o evento descrito abaixo.\n\n${t}`,
  "mensagem-especial": (t) => `Crie uma mensagem especial, sensivel e bem escrita com base no contexto abaixo.\n\n${t}`,
  "bio-perfil": (t,o={}) => `Crie uma bio para ${o.plataforma || "LinkedIn"}, clara, atraente e adequada ao canal.\n\n${t}`,
  "ata-reuniao": (t) => `Transforme as anotacoes abaixo em uma ata de reuniao formal com pauta, participantes quando houver, decisoes e proximos passos.\n\n${t}`,
  "descricao-produto": (t,o={}) => `Crie uma descricao de produto para ${o.canal || "e-commerce"}, com titulo, beneficios, caracteristicas e chamada para acao.\n\n${t}`,
  "proposta-comercial": (t) => `Crie uma proposta comercial clara, persuasiva e profissional com escopo, beneficios, entregas e proximos passos.\n\n${t}`,
  "gerador-nome": (t) => `Gere 12 nomes para a ideia abaixo, separados por categorias e com breve justificativa.\n\n${t}`,
  "roteiro-video": (t,o={}) => `Crie um roteiro para ${o.plataforma || "video curto"}, com gancho, cenas, texto falado, legenda e CTA.\n\n${t}`,
  "gerador-piada": (t) => `Crie 5 piadas ou textos bem-humorados, leves e adequados para publico geral sobre o tema abaixo.\n\n${t}`
};

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function callGemini(prompt, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.62, maxOutputTokens: 2200 } }) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error?.message || "Falha no Gemini");
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n").trim() || "";
}

async function callGroq(prompt, key) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "system", content: "Voce escreve em portugues brasileiro claro, util e profissional." }, { role: "user", content: prompt }], temperature: 0.62, max_tokens: 2200 }) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error?.message || "Falha no Groq");
  return data.choices?.[0]?.message?.content?.trim() || "";
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use POST" });
  try {
    const { tool, text, options } = await readBody(req);
    if (!tool || !TOOLS[tool]) return send(res, 400, { ok: false, error: "Ferramenta desconhecida" });
    if (!text || !String(text).trim()) return send(res, 400, { ok: false, error: "Informe um texto" });
    const prompt = TOOLS[tool](String(text).trim(), options || {});
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    const groqKey = process.env.GROQ_API_KEY || "";
    let result = "";
    if (geminiKey) result = await callGemini(prompt, geminiKey);
    else if (groqKey) result = await callGroq(prompt, groqKey);
    else return send(res, 503, { ok: false, error: "GEMINI_API_KEY nao configurada no projeto O Terrasan" });
    return send(res, 200, { ok: true, result });
  } catch (err) {
    return send(res, 500, { ok: false, error: err.message || "Erro interno" });
  }
};
