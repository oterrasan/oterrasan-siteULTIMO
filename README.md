# Site Roberto Terrasan - Lions Corretora

## 🎯 Sobre o Projeto

Site institucional premium para Roberto Terrasan, especialista em proteção patrimonial com mais de 25 anos de experiência. O site foi desenvolvido com estrutura baseada na XP Investimentos, utilizando cores Preto/Branco/Cinza/Dourado.

## 📁 Estrutura de Arquivos

```
oterrasan-site/
├── index.html                  # Homepage
├── roberto-terrasan.html       # Biografia
├── lions.html                  # Lions Corretora
├── jarvis.html                 # JARVIS CRM
├── noticias.html               # Notícias
├── contato.html                # Contato
├── politica-privacidade.html   # Política de Privacidade
├── termos-de-uso.html          # Termos de Uso
├── 404.html                    # Página de Erro
├── solucoes/                   # 11 páginas de soluções
├── assets/
│   ├── css/
│   │   └── style.css           # CSS principal
│   ├── js/
│   │   └── main.js             # JavaScript
│   └── images/
│       ├── hero-terrasan.png   # Foto poltrona (hero)
│       ├── team-fullwidth.png  # Foto equipe (Lions)
│       └── contact-bg.png      # Foto P&B (Contato)
└── README.md
```

## 🚀 Deploy no Vercel

### Passo 1: Fazer Upload no GitHub

1. Acesse https://github.com/oterrasan/oterrasan-site
2. Faça upload de todos os arquivos
3. Commit com mensagem: "Site completo v1.0"

### Passo 2: Conectar Vercel

1. Acesse https://vercel.com
2. Clique em "New Project"
3. Import o repositório: github.com/oterrasan/oterrasan-site
4. Deploy automático!

### Passo 3: Configurar Domínio

1. No dashboard Vercel, vá em "Domains"
2. Adicione: www.oterrasan.com.br
3. Configure DNS no Registro.br:
   - Tipo: A / Host: @ / Valor: [IP do Vercel]
   - Tipo: CNAME / Host: www / Valor: [CNAME do Vercel]

## ⚙️ Configurações Necessárias

### 1. Google Analytics
Editar em todas as páginas HTML:
```html
<!-- Linha 28-35: Descomentar e inserir ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

### 2. WhatsApp
Substituir em TODAS as páginas:
```html
<!-- Procurar por: 5511999999999 -->
<!-- Substituir por: SEU_NUMERO_REAL -->
```

### 3. Calendly
Substituir em TODAS as páginas:
```html
<!-- Procurar por: SEU-USUARIO/consultoria -->
<!-- Substituir por: seu-usuario-real/consultoria -->
```

### 4. Formspree (Formulário)
Em contato.html, linha 98:
```html
<form action="https://formspree.io/f/XXXXXXXX" method="POST">
<!-- Substituir XXXXXXXX pelo ID do Formspree -->
```

### 5. E-mails e Telefones
Substituir nos footers de TODAS as páginas:
- +55 11 99999-9999 → SEU TELEFONE
- contato@oterrasan.com.br → SEU EMAIL

## 📞 Informações de Contato (EDITAR)

**Telefone:** +55 11 99999-9999  
**WhatsApp:** +55 11 99999-9999  
**E-mail:** contato@oterrasan.com.br  
**Site:** www.oterrasan.com.br

## 🎨 Cores do Site

- **Preto:** #000000, #0a0a0a, #1a1a1a
- **Branco:** #FFFFFF
- **Cinza:** #666666, #f5f5f5
- **Dourado:** #D4AF37
- **Amarelo:** #FFB81C

## ✅ Checklist de Lançamento

- [ ] Fazer upload no GitHub
- [ ] Conectar Vercel
- [ ] Configurar domínio (DNS)
- [ ] Inserir Google Analytics ID
- [ ] Atualizar número WhatsApp
- [ ] Configurar Calendly
- [ ] Configurar Formspree
- [ ] Atualizar e-mails e telefones
- [ ] Testar formulário
- [ ] Testar em mobile
- [ ] Verificar todos os links

## 📝 Próximas Etapas (Futuro)

1. Criar as 11 páginas de soluções com conteúdo completo
2. Implementar sistema de notícias/blog
3. Adicionar área de cliente (login)
4. Integrar JARVIS CRM
5. Otimizar SEO avançado
6. Implementar chatbot

## 🛠️ Suporte

Para dúvidas ou problemas técnicos, consulte a documentação do Vercel: https://vercel.com/docs

---

**Desenvolvido por:** Claude (Anthropic)  
**Data:** Outubro 2025  
**Versão:** 1.0
