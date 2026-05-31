const fmt = new Intl.NumberFormat("pt-BR");
const state = {
  selectedId: null,
  companies: [],
  contacts: {},
  linksByCompany: {},
  fullCounts: { empresas: 0, contatos: 0, vinculos_validos: 0 },
  sampleCounts: { empresas: 0, contatos: 0, vinculos: 0 },
};

const FALLBACK_PREVIEW = {
  fullCounts: { empresas: 72380, contatos: 193553, vinculos_validos: 192877 },
  sampleCounts: { empresas: 3, contatos: 8, vinculos: 8 },
  companies: [
    {
      empresa_id_legado: "155728",
      nome_fantasia: "Iphan - ES | 30700 - Iphan - ES",
      razao_social: "Instituto do Patrimonio Historico e Artistico Nacional de ES",
      setor: "Estadual",
      site: "http://portal.iphan.gov.br/es",
      endereco: "R. Jose Marcelino",
      numero: "203",
      bairro: "Centro",
      cep: "29010-120",
      cidade: "Vitoria",
      uf: "ES",
      telefone_1: "(27) 3223-0606",
      responsavel: "Matheus Barcelos",
    },
    {
      empresa_id_legado: "147066",
      nome_fantasia: "Super Terminais | 37815 - Super Terminais",
      razao_social: "Super Terminais Comercio e Industria Ltda - AM",
      setor: "Servicos",
      site: "http://superterminais.com.br",
      endereco: "Rua Ponta Grossa",
      numero: "256",
      bairro: "Colonia Oliveira Machado",
      cep: "69074-190",
      cidade: "Manaus",
      uf: "AM",
      telefone_1: "(92) 3623-3700",
      responsavel: "Z_Resprospector - Construtoras",
    },
    {
      empresa_id_legado: "197904",
      nome_fantasia: "13ANX Construtora e Incorporadora Ltda - RS",
      razao_social: "13ANX Construtora e Incorporadora Ltda - RS",
      setor: "Construtora",
      site: "http://construtora13anx.com.br",
      endereco: "Rua Antonio Souza",
      cidade: "Gravatai",
      uf: "RS",
      telefone_1: "(51) 3047-8911",
      responsavel: "Luciane Alves Rodrigues Moya",
    },
  ],
  contacts: {
    "301505": { contato_id_legado: "301505", nome: "Eliene Machado Brum", cargo: "Administrativo", email: "administrativa.s@iphan.gov.br", telefone_1: "-" },
    "301502": { contato_id_legado: "301502", nome: "Elisa Machado Taveira", cargo: "Superintendente", email: "iphan-es@iphan.gov.br", telefone_1: "-" },
    "321399": { contato_id_legado: "321399", nome: "Joabe de Franca Barros", cargo: "Gerente Operacional", email: "joabe@superterminais.com.br", telefone_1: "92-36233700" },
    "345267": { contato_id_legado: "345267", nome: "Julio Almeida", cargo: "Gerente de Obras", email: "julio@superterminais.com.br", telefone_1: "92-36233700" },
    "321398": { contato_id_legado: "321398", nome: "Marcello di Gregorio", cargo: "Diretor", email: "superterminais@superterminais.com.br", telefone_1: "92-36233700" },
    "321400": { contato_id_legado: "321400", nome: "Wanderson", cargo: "Gerente Operacional", email: "wanderson@superterminais.com.br", telefone_1: "-" },
    "197904-1": { contato_id_legado: "197904-1", nome: "Thiago", cargo: "Comprador", email: "-", telefone_1: "(51) 3047-8911" },
    "197904-2": { contato_id_legado: "197904-2", nome: "Bruna", cargo: "Engenharia", email: "-", telefone_1: "(51) 3047-8911" },
  },
  linksByCompany: {
    "155728": ["301505", "301502"],
    "147066": ["321399", "345267", "321398", "321400"],
    "197904": ["197904-1", "197904-2"],
  },
};

const els = {
  kpiCompanies: document.getElementById("kpiCompanies"),
  kpiContacts: document.getElementById("kpiContacts"),
  kpiLinks: document.getElementById("kpiLinks"),
  kpiStatus: document.getElementById("kpiStatus"),
  resultCount: document.getElementById("resultCount"),
  companyList: document.getElementById("companyList"),
  companyDetail: document.getElementById("companyDetail"),
  searchInput: document.getElementById("searchInput"),
};

function text(value, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function escapeHtml(value) {
  return text(value, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalize(value) {
  return text(value, "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function loadStaticData() {
  let payload = FALLBACK_PREVIEW;
  try {
    const response = await fetch("./data/sample.json", { cache: "no-store" });
    if (response.ok) payload = await response.json();
  } catch (_) {
    payload = FALLBACK_PREVIEW;
  }
  state.companies = payload.companies || [];
  state.contacts = payload.contacts || {};
  state.linksByCompany = payload.linksByCompany || {};
  state.fullCounts = payload.fullCounts || state.fullCounts;
  state.sampleCounts = payload.sampleCounts || state.sampleCounts;
}

function loadHealth() {
  els.kpiCompanies.textContent = fmt.format(state.fullCounts.empresas || state.sampleCounts.empresas || 0);
  els.kpiContacts.textContent = fmt.format(state.fullCounts.contatos || state.sampleCounts.contatos || 0);
  els.kpiLinks.textContent = fmt.format(state.fullCounts.vinculos_validos || state.sampleCounts.vinculos || 0);
  els.kpiStatus.textContent = `${fmt.format(state.sampleCounts.empresas || 0)} em preview`;
}

function companySearchBlob(company) {
  return normalize([
    company.nome_fantasia,
    company.razao_social,
    company.nome_lista,
    company.cidade,
    company.uf,
    company.cnpj,
    company.empresa_id_legado,
  ].join(" "));
}

function findCompanies(q = "") {
  const query = normalize(q);
  const filtered = query
    ? state.companies.filter((company) => companySearchBlob(company).includes(query))
    : state.companies;
  return {
    items: filtered.slice(0, 80),
    total: filtered.length,
  };
}

function loadCompanies(q = "") {
  const result = findCompanies(q);
  els.resultCount.textContent = `${fmt.format(result.total)} nesta amostra`;
  els.companyList.innerHTML = result.items
    .map((company) => {
      const id = String(company.empresa_id_legado);
      const links = state.linksByCompany[id] || [];
      return `
        <button class="companyRow ${state.selectedId === id ? "active" : ""}" data-id="${escapeHtml(id)}">
          <span>
            <strong>${escapeHtml(company.nome_fantasia || company.nome_lista || company.razao_social)}</strong>
            <span>${escapeHtml(company.razao_social)}</span>
            <small>${escapeHtml([company.cidade, company.uf].filter(Boolean).join(" / "))} | ID ${escapeHtml(id)}</small>
          </span>
          <em class="tag">${fmt.format(links.length)}</em>
        </button>
      `;
    })
    .join("");
  document.querySelectorAll(".companyRow").forEach((button) => {
    button.addEventListener("click", () => selectCompany(button.dataset.id));
  });
  if (!state.selectedId && result.items[0]) selectCompany(result.items[0].empresa_id_legado);
}

function fact(label, value) {
  return `<div class="fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function getCompany(id) {
  const company = state.companies.find((item) => String(item.empresa_id_legado) === String(id));
  if (!company) return null;
  const contacts = (state.linksByCompany[String(id)] || [])
    .map((contactId) => state.contacts[String(contactId)])
    .filter(Boolean);
  return { ...company, contacts };
}

function selectCompany(id) {
  state.selectedId = String(id);
  document.querySelectorAll(".companyRow").forEach((button) => {
    button.classList.toggle("active", button.dataset.id === state.selectedId);
  });
  const company = getCompany(id);
  if (!company) return;
  const contacts = company.contacts || [];
  els.companyDetail.classList.remove("empty");
  els.companyDetail.innerHTML = `
    <div class="detailTitle">
      <div>
        <h1>${escapeHtml(company.nome_fantasia || company.nome_lista || company.razao_social)}</h1>
        <p>${escapeHtml(company.razao_social)}</p>
      </div>
      <span class="tag">ID ${escapeHtml(company.empresa_id_legado)}</span>
    </div>
    <div class="facts">
      ${fact("Cidade / UF", [company.cidade, company.uf].filter(Boolean).join(" / "))}
      ${fact("Setor", company.setor)}
      ${fact("Telefone", company.telefone_1)}
      ${fact("Site", company.site)}
      ${fact("Endereco", [company.endereco, company.numero, company.bairro].filter(Boolean).join(", "))}
      ${fact("Responsavel", company.responsavel)}
      ${fact("Tipo", company.tipo_empresa)}
      ${fact("Segmento", company.segmento_principal)}
    </div>
    <div class="panelHead">
      <div>
        <span>Contatos relacionados</span>
        <strong>${fmt.format(contacts.length)} contato(s)</strong>
      </div>
    </div>
    <div class="contacts">
      ${
        contacts.length
          ? contacts
              .slice(0, 24)
              .map(
                (contact) => `
                  <div class="contactCard">
                    <strong>${escapeHtml(contact.nome)}</strong>
                    <span>${escapeHtml(contact.cargo)}</span>
                    <small>${escapeHtml(contact.email)} ${escapeHtml(contact.telefone_1 ? ` | ${contact.telefone_1}` : "")}</small>
                  </div>
                `,
              )
              .join("")
          : '<div class="contactCard"><span>Nenhum contato vinculado nesta ficha.</span></div>'
      }
    </div>
  `;
}

let searchTimer = null;
els.searchInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    state.selectedId = null;
    loadCompanies(els.searchInput.value.trim());
  }, 160);
});

document.querySelectorAll(".themes button").forEach((button) => {
  button.addEventListener("click", () => {
    document.body.dataset.theme = button.dataset.theme;
    document.querySelectorAll(".themes button").forEach((item) => item.classList.toggle("active", item === button));
  });
});

function showError(error) {
  els.kpiStatus.textContent = "Erro";
  els.companyDetail.classList.add("empty");
  els.companyDetail.textContent = error.message;
}

loadStaticData()
  .then(() => {
    loadHealth();
    loadCompanies();
  })
  .catch(showError);
