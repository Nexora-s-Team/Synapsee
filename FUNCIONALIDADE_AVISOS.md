# 📢 Funcionalidade de Avisos - Synapsee

## Visão Geral

A funcionalidade de **Avisos & Notícias** permite que professores criem comunicados (avisos, eventos e provas) que os alunos podem visualizar filtrados por categoria.

---

## 👨‍🏫 O que Professores Podem Fazer

### 1. **Criar Avisos**

- Clique no botão **"+" (Plus)** no canto superior direito
- Preencha o formulário com:
  - **Título**: Máximo 140 caracteres
  - **Descrição**: Máximo 4000 caracteres
  - **Categoria**: Escolha entre:
    - 📖 **Acadêmico** - Conteúdo acadêmico, material de aula, recursos de estudo
    - 📅 **Eventos** - Eventos, palestras, encontros, atividades extracurriculares
    - ✏️ **Provas** - Provas, avaliações, datas de submissão, critérios
    - ⚠️ **Aviso geral** - Comunicados importantes, alterações de horário
  - **Fixar no topo** (opcional): Mantém o aviso em destaque

### 2. **Gerenciar Avisos Próprios**

- **Fixar/Desafixar**: Coloca o aviso no topo (destacado)
- **Apagar**: Remove o aviso completamente
- _Obs: Apenas o professor que criou pode gerenciar_

### 3. **Validações**

- Título deve ter no mínimo 3 caracteres
- Descrição deve ter no mínimo 3 caracteres
- Feedback visual ao publicar com sucesso

---

## 👨‍🎓 O que Alunos Podem Fazer

### 1. **Visualizar Avisos**

- Veem todos os avisos criados pelos professores
- Não podem criar, editar ou deletar avisos
- Podem filtrar por categoria

### 2. **Filtrar por Categoria**

Clique nos filtros no topo:

- **Tudo**: Mostra todos os avisos
- **Acadêmico**: 📖 Avisos acadêmicos
- **Eventos**: 📅 Eventos e palestras
- **Provas**: ✏️ Provas e avaliações
- **Aviso geral**: ⚠️ Comunicados gerais

---

## 🎨 Melhorias Implementadas

### Visual por Categoria

Cada tipo de aviso tem uma cor e ícone distintivo:

| Categoria   | Ícone | Cor      | Badge                           |
| ----------- | ----- | -------- | ------------------------------- |
| Acadêmico   | 📖    | Azul     | `bg-blue-100 text-blue-800`     |
| Eventos     | 📅    | Roxo     | `bg-purple-100 text-purple-800` |
| Provas      | ✏️    | Laranja  | `bg-orange-100 text-orange-800` |
| Aviso geral | ⚠️    | Vermelho | `bg-red-100 text-red-800`       |

### Layout Melhorado

- ✅ Categoria em destaque no topo do card
- ✅ Informações do autor com ícone de verificação
- ✅ Conteúdo bem estruturado e legível
- ✅ Ações (Fixar/Apagar) apenas para professor autor
- ✅ Efeito hover suave para melhor UX
- ✅ Avisos fixados sempre aparecem no topo

### Composer (Modal de Criação)

- ✅ Seleção visual melhorada de categorias
- ✅ Descrição de cada categoria para clareza
- ✅ Preview do tamanho da descrição (X/4000)
- ✅ Feedback em tempo real

---

## 🗄️ Estrutura no Banco de Dados

### Tabela: `announcements`

```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (professor/admin que criou),
  title TEXT (3-140 chars),
  body TEXT (3-4000 chars),
  category TEXT ('academico' | 'eventos' | 'provas' | 'aviso_geral'),
  pinned BOOLEAN (fixado no topo?),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Row Level Security (RLS)

- ✅ **SELECT**: Todos autenticados podem ler
- ✅ **INSERT**: Apenas professores/admins podem criar
- ✅ **UPDATE**: Apenas professor autor pode editar
- ✅ **DELETE**: Apenas professor autor ou admin pode deletar

---

## 📁 Arquivos Envolvidos

### Frontend

- `src/components/sinapse/screens/AvisosScreen.tsx` - Tela principal com filtros
- `src/components/sinapse/AnnouncementComposer.tsx` - Modal para criar avisos

### Hooks

- `src/hooks/useAnnouncements.ts` - Hook com lógica CRUD

### Banco de Dados

- `supabase/migrations/20260421164519_*.sql` - Migration da tabela

---

## 🚀 Como Usar

### Para Professores

1. Navegue até a seção "Avisos & Notícias"
2. Clique no botão "+" no topo
3. Preencha o formulário com título e descrição
4. Selecione a categoria apropriada
5. (Opcional) Marque "Fixar no topo"
6. Clique "Publicar aviso"

### Para Alunos

1. Navegue até a seção "Avisos & Notícias"
2. Use os filtros para visualizar avisos específicos
3. Leia os comunicados do professor
4. _Não pode criar, editar ou deletar avisos_

---

## 🔐 Segurança

- ✅ Apenas professores/admins podem criar
- ✅ Apenas alunos autenticados podem visualizar
- ✅ Apenas professor autor pode editar/deletar
- ✅ Validação de comprimento de texto
- ✅ Proteção via RLS policies no Supabase

---

## 📞 Suporte

Para reportar problemas ou sugerir melhorias na funcionalidade de avisos, entre em contato com o time de desenvolvimento.
