(() => {
  const tools = [
    ["classicas","reescrever","Reescrever","Parafraseie mantendo sentido e clareza."],
    ["classicas","corretor","Corretor","Corrija ortografia, gramatica e pontuacao."],
    ["classicas","detector-ia","Detector IA","Estime sinais de texto gerado por IA."],
    ["classicas","humanizar","Humanizar","Deixe o texto mais natural e humano."],
    ["classicas","tradutor","Tradutor","Traduza entre portugues e outros idiomas."],
    ["classicas","resumidor","Resumidor","Crie um resumo objetivo e utilizavel."],
    ["comunicacao","reformular-tom","Reformular Tom","Adapte o texto para o tom desejado."],
    ["comunicacao","email-profissional","E-mail Profissional","Transforme contexto em e-mail completo."],
    ["comunicacao","resposta-critica","Resposta a Critica","Responda avaliacoes e criticas com equilibrio."],
    ["comunicacao","whatsapp-pro","WhatsApp Pro","Converta mensagens em comunicacao profissional."],
    ["comunicacao","roteiro-conversa","Roteiro de Conversa","Prepare conversas dificeis com estrutura."],
    ["burocracia","reclamacao","Reclamacao","Gere reclamacoes formais e objetivas."],
    ["burocracia","recurso-multa","Recurso de Multa","Monte defesa administrativa de transito."],
    ["burocracia","carta-apresentacao","Carta de Apresentacao","Crie carta para vaga, projeto ou parceria."],
    ["burocracia","peticao-simples","Peticao Simples","Organize um requerimento formal."],
    ["vida","discurso","Discurso","Crie discursos para eventos e homenagens."],
    ["vida","mensagem-especial","Mensagem Especial","Escreva mensagens pessoais com bom tom."],
    ["vida","bio-perfil","Bio e Perfil","Crie bios para LinkedIn, Instagram e apresentacoes."],
    ["trabalho","ata-reuniao","Ata de Reuniao","Transforme anotacoes em ata formal."],
    ["trabalho","descricao-produto","Descricao de Produto","Crie descricoes para venda online."],
    ["trabalho","proposta-comercial","Proposta Comercial","Estruture proposta para cliente."],
    ["criatividade","gerador-nome","Gerador de Nome","Gere nomes para marcas, produtos e projetos."],
    ["criatividade","roteiro-video","Roteiro de Video","Crie roteiro para Reels, Shorts e TikTok."],
    ["criatividade","gerador-piada","Gerador de Piada","Crie humor leve para conteudo."],
    ["local","limpador","Limpador de Texto","Remove sujeira e normaliza texto localmente."],
    ["local","contador","Contador Avancado","Conta caracteres, palavras e linhas em tempo real."]
  ];
  const labels = {classicas:"Classicas",comunicacao:"Comunicacao",burocracia:"Burocracia",vida:"Vida pessoal",trabalho:"Trabalho",criatividade:"Criatividade",local:"Utilitarios locais"};
  const optionMap = {
    tradutor:["targetLang",["Ingles","Espanhol","Frances","Italiano","Alemao","Portugues"]],
    "reformular-tom":["tom",["Formal","Casual","Tecnico","Persuasivo","Criativo"]],
    "bio-perfil":["plataforma",["LinkedIn","Instagram","Apresentacao profissional"]],
    "descricao-produto":["canal",["Marketplace","Instagram","Site","WhatsApp"]],
    "roteiro-video":["plataforma",["Instagram Reels","YouTube Shorts","TikTok"]]
  };
  const $ = (s) => document.querySelector(s);
  const nav = $("#toolNav"), dash = $("#dashboard"), input = $("#inputText"), output = $("#outputText"), status = $("#statusText"), options = $("#options");
  let current = tools[0][1];
  function grouped() { return tools.reduce((acc,t)=>((acc[t[0]] ||= []).push(t), acc), {}); }
  function renderNav(){
    nav.innerHTML = "";
    Object.entries(grouped()).forEach(([group,items]) => {
      const h = document.createElement("div"); h.className = "nav-section"; h.textContent = labels[group] || group; nav.append(h);
      items.forEach(t => { const b=document.createElement("button"); b.type="button"; b.dataset.tool=t[1]; b.innerHTML=`<span>${t[2]}</span><em>${group === "local" ? "local" : "IA"}</em>`; b.onclick=()=>selectTool(t[1]); nav.append(b); });
    });
  }
  function renderDash(){
    dash.innerHTML = tools.map(t => `<button class="tool-card" type="button" data-card="${t[1]}"><span>${labels[t[0]]}</span><strong>${t[2]}</strong><p>${t[3]}</p></button>`).join("");
    dash.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>selectTool(b.dataset.card));
    $("#toolCount").textContent = String(tools.length);
  }
  function renderOptions(tool){
    options.innerHTML = "";
    const opt = optionMap[tool];
    if (!opt) return;
    const label = document.createElement("label");
    label.innerHTML = `<span>Opcao</span><select data-option="${opt[0]}">${opt[1].map(v=>`<option value="${v}">${v}</option>`).join("")}</select>`;
    options.append(label);
  }
  function selectTool(tool){
    current = tool;
    const meta = tools.find(t=>t[1]===tool) || tools[0];
    $("#toolCategory").textContent = labels[meta[0]] || meta[0];
    $("#toolTitle").textContent = meta[2];
    $("#toolDescription").textContent = meta[3];
    document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("active", b.dataset.tool===tool));
    renderOptions(tool);
    input.placeholder = meta[0] === "local" ? "Cole o texto para processar localmente." : "Cole o texto e execute a ferramenta.";
    status.textContent = "";
    document.getElementById("toolPanel").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function getOptions(){ const o={}; options.querySelectorAll("[data-option]").forEach(el=>o[el.dataset.option]=el.value); return o; }
  function cleanText(t){ return t.replace(/<[^>]*>/g," ").replace(/[\t ]+/g," ").replace(/\n{3,}/g,"\n\n").trim(); }
  function countText(t){ const words=t.trim()?t.trim().split(/\s+/).length:0; const lines=t? t.split(/\n/).length:0; return `Caracteres: ${t.length}\nPalavras: ${words}\nLinhas: ${lines}\nTempo estimado de leitura: ${Math.max(1,Math.ceil(words/220))} min`; }
  async function run(){
    const text = input.value.trim();
    if (!text) { status.textContent = "Insira um texto primeiro."; return; }
    output.value = ""; status.textContent = "Processando..."; $("#runBtn").disabled = true;
    try {
      if (current === "limpador") output.value = cleanText(input.value);
      else if (current === "contador") output.value = countText(input.value);
      else {
        const r = await fetch("/api/inteligencia", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({tool:current,text,options:getOptions()})});
        const j = await r.json().catch(()=>({}));
        if (!r.ok || !j.ok) throw new Error(j.error || "Falha no processamento");
        output.value = j.result || "";
      }
      status.textContent = "Concluido.";
    } catch (err) { status.textContent = err.message; }
    finally { $("#runBtn").disabled = false; }
  }
  function tick(){ const d=new Date(); $("#clock").textContent = d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }
  renderNav(); renderDash(); selectTool(current); tick(); setInterval(tick,30000);
  $("#runBtn").onclick = run;
  $("#clearBtn").onclick = () => { input.value=""; output.value=""; status.textContent=""; };
  $("#copyBtn").onclick = async () => { if(output.value){ await navigator.clipboard.writeText(output.value); status.textContent="Resultado copiado."; } };
  document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>selectTool(b.dataset.jump));
})();
