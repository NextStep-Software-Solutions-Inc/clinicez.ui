# Clinicez Fullstack Dev Agent Documentation

Welcome to the **Clinicez Fullstack Dev Agent** - your specialized AI development assistant for the ClinicEZ.UI healthcare platform.

## 📖 Documentation Overview

This agent documentation provides comprehensive guidance for maintaining code quality, architectural consistency, and development efficiency in the ClinicEZ project.

### Getting Started

**New to this project?** Start here:

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ← Start here for a 5-minute overview
2. **[CLINICEZ_FULLSTACK_DEV.md](./CLINICEZ_FULLSTACK_DEV.md)** ← Agent principles & behaviors
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** ← How the system is structured
4. **[DEVELOPMENT_CONVENTIONS.md](./DEVELOPMENT_CONVENTIONS.md)** ← How to write code
5. **[TECH_STACK.md](./TECH_STACK.md)** ← Technologies & configuration

## 📚 Documentation Files

### 1. **CLINICEZ_FULLSTACK_DEV.md** (Core Agent Definition)

**What:** Agent definition, core principles, and behavioral guidelines  
**Read when:** You want to understand the agent's philosophy and approach  
**Contains:**

- Agent overview & purpose
- Core principles (type safety, quality, architecture, workflow)
- Quality gates & acceptance criteria
- Debugging guidelines
- Collaboration standards

**Key takeaway:** This is the "constitution" of the agent.

---

### 2. **ARCHITECTURE.md** (System Design)

**What:** Complete system architecture, component hierarchy, data flow  
**Read when:** You need to understand how the system is organized  
**Contains:**

- High-level system overview
- Route structure & dashboard organization
- Component hierarchy
- Data flow patterns (server components, server actions)
- Database schema overview
- Styling architecture
- State management
- Security architecture
- AI integration points
- Performance optimization strategies

**Key takeaway:** This is your map of the entire system.

---

### 3. **DEVELOPMENT_CONVENTIONS.md** (Coding Standards)

**What:** Detailed coding patterns, naming conventions, best practices  
**Read when:** Actually writing code  
**Contains:**

- File naming conventions
- Directory structure guidelines
- TypeScript conventions (types, imports, function parameters)
- Server actions patterns & templates
- Component templates
- CSS organization & naming (BEM-inspired)
- Comment & JSDoc standards
- Git conventions
- Error handling patterns
- Performance best practices
- Code examples for each pattern

**Key takeaway:** This is your style guide and code template reference.

---

### 4. **TECH_STACK.md** (Technologies & Configuration)

**What:** Complete technology stack details and configuration  
**Read when:** Setting up or understanding tools  
**Contains:**

- Next.js & TypeScript configuration
- Database (PostgreSQL, Prisma)
- UI framework (Shadcn/ui, Tailwind)
- Authentication (Auth0, Clerk)
- Testing framework (Jest)
- AI integration (Gemini, OpenAI)
- Cloud services (Azure, Vercel)
- Development scripts & commands
- Performance metrics

**Key takeaway:** This is your technology reference manual.

---

### 5. **QUICK_REFERENCE.md** (At-a-Glance Guide)

**What:** Quick lookup reference for common tasks  
**Read when:** You need fast answers  
**Contains:**

- Core values (5 key principles)
- Quick start commands
- Project structure overview
- Quality checklist
- Common patterns (copy-paste templates)
- Development workflow (step-by-step)
- Common mistakes (what NOT to do)
- Documentation index
- Learning path for new features

**Key takeaway:** This is your cheat sheet.

---

## 🎯 How to Use This Agent Context

### For Regular Development

```
1. Consult QUICK_REFERENCE.md for immediate answers
2. Refer to DEVELOPMENT_CONVENTIONS.md when writing code
3. Check ARCHITECTURE.md if confused about structure
4. Look at TECH_STACK.md for tool configuration
5. Review CLINICEZ_FULLSTACK_DEV.md for principles & approach
```

### When Starting a New Feature

```
1. Read QUICK_REFERENCE.md > Learning Path section
2. Check ARCHITECTURE.md > Component Hierarchy
3. Find similar component in codebase
4. Copy pattern from DEVELOPMENT_CONVENTIONS.md
5. Type check: npx tsc --noEmit
6. Lint: npm run lint
7. Suggest improvements from CLINICEZ_FULLSTACK_DEV.md
```

### When Debugging

```
1. Check QUICK_REFERENCE.md > Red Flags
2. Consult DEVELOPMENT_CONVENTIONS.md > Error Handling
3. Review ARCHITECTURE.md > related section
4. Check TECH_STACK.md > troubleshooting (if tool-related)
```

### When Stuck

```
1. QUICK_REFERENCE.md > Common Mistakes
2. DEVELOPMENT_CONVENTIONS.md > Examples section
3. ARCHITECTURE.md for context
4. Actual codebase for real examples
```

## 🔑 Core Agent Principles (Summary)

### 1️⃣ Type Safety: Absolute Priority

- **No `any` types** - use explicit interfaces
- **Type inference preferred** - let TypeScript figure it out
- **Regenerate types** - after schema changes with `npx prisma generate`

### 2️⃣ Code Quality: Non-Negotiable

- **Lint-free code** - `npm run lint`
- **Type-safe code** - `npx tsc --noEmit`
- **Type inference** - over type assertions
- **Const over let/var** - immutability first

### 3️⃣ Architecture: Modular & Isolated

- **V2 folder umbrella** - all V2 features go under `/src/app/v2/`
- **CSS isolation** - no global style pollution
- **Separation of concerns** - UI, logic, data access

### 4️⃣ Workflow: Efficiency First

- **No build unless asked** - avoid port conflicts
- **Type check first** - 10x faster than build
- **Incremental changes** - focused, testable updates

### 5️⃣ Post-Implementation: Always Provide Roadmap

- **Never say "complete"** - always suggest next steps
- **List improvements** - for current feature
- **Identify enhancements** - for related features
- **Provide summary** - what's done, what's next

## 📋 Quality Gates (Before Any PR)

```bash
✅ npx tsc --noEmit          # No type errors
✅ npm run lint              # No linting issues
✅ Search for 'any' types    # None found
✅ Review type assertions    # All necessary
✅ Check CSS isolation       # Feature scoped
✅ Verify v2 structure       # Under v2/
✅ Run suggested improvements # Documented
```

## 🚀 Quick Command Reference

```bash
# Type checking (ALWAYS do this first)
npx tsc --noEmit

# Linting
npm run lint

# Development
pnpm dev --turbo

# Database
pnpm migrate              # Create migration
npx prisma studio       # Visual DB explorer
npx prisma generate     # Regenerate types

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode

# Building (ONLY after types pass)
pnpm build
```

## 📁 Key Project Paths

```
docs/agents/                          # This documentation
├── CLINICEZ_FULLSTACK_DEV.md        # Agent definition
├── ARCHITECTURE.md                   # System design
├── DEVELOPMENT_CONVENTIONS.md       # Code standards
├── TECH_STACK.md                    # Technologies
├── QUICK_REFERENCE.md               # Quick lookup
└── README.md                        # This file

src/app/v2/                          # All V2 features
src/components/v2/                   # V2 components
src/styles/dashboards/               # Isolated CSS
prisma/schema.prisma                 # Data models
.github/copilot-instructions.md     # Copilot guidelines
```

## 🎓 Learning Paths

### Complete Beginner

1. QUICK_REFERENCE.md (10 min)
2. CLINICEZ_FULLSTACK_DEV.md (15 min)
3. ARCHITECTURE.md (20 min)
4. DEVELOPMENT_CONVENTIONS.md (30 min)
5. Start with simple component

### Experienced Developer

1. QUICK_REFERENCE.md (5 min)
2. Review examples in DEVELOPMENT_CONVENTIONS.md
3. Consult ARCHITECTURE.md as needed
4. Start implementing

### Specific Focus

- **Want to understand structure?** → ARCHITECTURE.md
- **Need to write code?** → DEVELOPMENT_CONVENTIONS.md
- **Setting up tools?** → TECH_STACK.md
- **Need quick answers?** → QUICK_REFERENCE.md
- **Want to understand approach?** → CLINICEZ_FULLSTACK_DEV.md

## 🌟 Agent Strengths

This agent excels at:

- ✅ Maintaining type safety across the codebase
- ✅ Ensuring code quality and consistency
- ✅ Architecting modular, isolated features
- ✅ Following best practices without reminder
- ✅ Providing actionable improvement suggestions
- ✅ Suggesting next steps and enhancements
- ✅ Explaining architectural decisions
- ✅ Writing production-ready code

## ⚠️ Agent Limitations

This agent requires:

- ⚠️ Explicit task requirements
- ⚠️ Clear scope definition
- ⚠️ Context about dependencies
- ⚠️ Clarification for ambiguous requests

## 🔄 Feedback & Updates

### Document Updates

If these documents become outdated, they should be updated:

- When new technologies are adopted
- When architectural patterns change
- When new V2 features are added
- When conventions evolve

### Version Control

- **Version:** 1.0
- **Last Updated:** February 13, 2026
- **Status:** Active & Maintained

## 📞 When to Reference What

| Situation | Reference |
|-----------|-----------|
| **Quick lookup** | QUICK_REFERENCE.md |
| **Understanding system** | ARCHITECTURE.md |
| **Writing code** | DEVELOPMENT_CONVENTIONS.md |
| **Tool configuration** | TECH_STACK.md |
| **Agent behavior** | CLINICEZ_FULLSTACK_DEV.md |
| **Type patterns** | DEVELOPMENT_CONVENTIONS.md / Examples |
| **Component patterns** | DEVELOPMENT_CONVENTIONS.md / Templates |
| **Styling patterns** | DEVELOPMENT_CONVENTIONS.md / CSS |
| **Project structure** | ARCHITECTURE.md / QUICK_REFERENCE.md |
| **Commands** | QUICK_REFERENCE.md / TECH_STACK.md |

---

## 🎯 Getting Started Right Now

### If you have 5 minutes

→ Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

### If you have 20 minutes

→ Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) + [CLINICEZ_FULLSTACK_DEV.md](./CLINICEZ_FULLSTACK_DEV.md)

### If you have 1 hour

→ Read all navigation paths above in order

### If you're about to code

→ Read [DEVELOPMENT_CONVENTIONS.md](./DEVELOPMENT_CONVENTIONS.md) + check examples

---

**Welcome to the Clinicez Fullstack Dev ecosystem. Let's build something great together.**

*"Type-safe, quality-first, always improving."*
