# 🌍 Mapa de Oportunidades com IA

> Plataforma colaborativa para descobrir e partilhar oportunidades de negócio em cidades de todo o mundo, potenciadas por Inteligência Artificial.

---

## 📋 Análise do Projeto

### O que é?
Uma aplicação web **full-stack** e **pública** que permite a qualquer utilizador publicar, explorar e avaliar oportunidades de negócio detetadas em cidades. Toda a informação é partilhada em tempo real entre todos os utilizadores através do **Supabase**.

### Stack Tecnológica
| Camada | Tecnologia |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript (Vanilla) |
| Base de Dados | Supabase (PostgreSQL) |
| API | Supabase REST API |
| Tipografia | Google Fonts — Inter |
| Design | Dark Mode, Glassmorphism, Gradientes |

---

## ✨ Funcionalidades

- **Publicar oportunidades** — formulário com validação por campo e sanitização de texto
- **Listagem pública** — todas as oportunidades visíveis para qualquer utilizador
- **Filtros em tempo real** — por cidade, país e categoria
- **Sistema de likes** — actualização directa no Supabase, com controlo anti-duplicado
- **Estatísticas ao vivo** — total de oportunidades, cidades únicas e likes globais
- **Notificações toast** — feedback visual imediato para todas as acções

---

## 🗄️ Base de Dados (Supabase)

**Tabela:** `opportunities`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único (gerado automaticamente) |
| `name` | TEXT | Nome / Título da oportunidade |
| `city` | TEXT | Cidade onde foi detetada |
| `country` | TEXT | País |
| `problem` | TEXT | Descrição do problema identificado |
| `ai_solution` | TEXT | Proposta de solução com IA |
| `category` | TEXT | Categoria (Saúde, Tecnologia, etc.) |
| `potential` | TEXT | Potencial de mercado estimado |
| `likes` | INTEGER | Número de likes (default: 0) |
| `created_at` | TIMESTAMPTZ | Data de criação (automática) |

**Políticas RLS (Row Level Security):**
- `SELECT` público — qualquer pessoa lê todas as oportunidades
- `INSERT` público — qualquer pessoa pode publicar
- `UPDATE` público — qualquer pessoa pode dar like

---

## 📁 Estrutura do Projeto

```
MAP-AI/
├── index.html    # Estrutura da app (hero, filtros, cards, modal)
├── style.css     # Design system completo (dark mode, animações)
└── app.js        # Lógica de negócio + integração Supabase REST API
```

---

## 🚀 Como usar

1. Abre o ficheiro `index.html` no browser
2. As oportunidades existentes carregam automaticamente do Supabase
3. Clica em **"Publicar Oportunidade"** para adicionar uma nova
4. Usa os filtros para encontrar oportunidades por cidade, país ou categoria
5. Dá ❤️ like nas oportunidades que te interessam

---

## 🔒 Segurança & Validação

- Todos os campos são obrigatórios (validação no frontend)
- Texto é sanitizado: `trim()`, remoção de HTML, limite de caracteres
- Likes guardados localmente (localStorage) para evitar duplicados por sessão
- XSS prevenido via função `esc()` que escapa caracteres especiais no HTML gerado

---

*Projecto desenvolvido na Sessão 08 — Full-Stack com Supabase · Google Antigravity*