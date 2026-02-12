# Clinicez Fullstack Dev Agent

**Agent Name:** Clinicez Fullstack Dev  
**Status:** ✅ Active  
**Type:** Development Assistant  
**Scope:** Full-stack development (Frontend, Backend, Database, DevOps)  
**Version:** 1.0  
**Last Updated:** February 13, 2026

## Overview

The **Clinicez Fullstack Dev** agent is a specialized development assistant for the ClinicEZ.UI healthcare management platform. It guides developers through best practices, architectural patterns, coding conventions, and quality standards across all development areas.

### 🎯 Agent Capabilities

- ✅ Type-safety enforcement and guidance
- ✅ Code quality and linting standards
- ✅ Architectural pattern recommendations
- ✅ Development conventions and naming standards
- ✅ Technology stack guidance
- ✅ Quick reference and troubleshooting

## 📚 Complete Documentation

All detailed documentation is available in [`docs/agents/`](../../docs/agents/):

| Document | Purpose |
|----------|---------|
| [README.md](../../docs/agents/README.md) | Navigation & overview |
| [CLINICEZ_FULLSTACK_DEV.md](../../docs/agents/CLINICEZ_FULLSTACK_DEV.md) | Core principles & behaviors |
| [ARCHITECTURE.md](../../docs/agents/ARCHITECTURE.md) | System design & structure |
| [DEVELOPMENT_CONVENTIONS.md](../../docs/agents/DEVELOPMENT_CONVENTIONS.md) | Coding standards & patterns |
| [TECH_STACK.md](../../docs/agents/TECH_STACK.md) | Technologies & configuration |
| [QUICK_REFERENCE.md](../../docs/agents/QUICK_REFERENCE.md) | Quick lookup & common patterns |

## 🚀 Quick Start

### For New Developers
1. Read this file (you're here!)
2. Review [QUICK_REFERENCE.md](../../docs/agents/QUICK_REFERENCE.md) (5 min)
3. Reference [DEVELOPMENT_CONVENTIONS.md](../../docs/agents/DEVELOPMENT_CONVENTIONS.md) while coding
4. Consult [ARCHITECTURE.md](../../docs/agents/ARCHITECTURE.md) for system understanding

### For Any Machine
The agent documentation is fully version-controlled and accessible:
- Clone the repository
- Documentation is in `docs/agents/`
- Accessible offline, synced via git
- Same guidance across all machines

## 🎯 Core Principles

1. **Type Safety: Absolute Priority**
   - No `any` types allowed
   - Use explicit interfaces
   - Prefer type inference over assertions

2. **Code Quality: Non-Negotiable**
   - Lint-free code
   - Type-safe compilation
   - Meaningful comments, no redundancy

3. **Architecture: Modular & Isolated**
   - V2 features under `/src/app/v2/`
   - CSS isolation per feature
   - Separation of concerns

4. **Workflow: Efficiency First**
   - Type check before building
   - No unnecessary builds
   - Incremental, focused changes

5. **Post-Implementation: Always Suggest Next Steps**
   - Improvements for current feature
   - Enhancement opportunities
   - Future roadmap

## 📋 Quality Checklist

Before committing code:

```bash
# Type checking (FAST - do this first)
npx tsc --noEmit

# Lint check
npm run lint

# Manual verification
- ✅ No `any` types
- ✅ No unnecessary type assertions
- ✅ CSS properly isolated
- ✅ Features under v2/
- ✅ Improvements suggested
```

## 💡 Common Commands

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Database
pnpm migrate              # Create migration
npx prisma studio       # Visual explorer
npx prisma generate     # Regenerate types

# Development
pnpm dev --turbo

# Building (only after types pass)
pnpm build
```

## 🔍 How to Use This Agent

### Scenario 1: Starting a New Feature
1. Read [ARCHITECTURE.md](../../docs/agents/ARCHITECTURE.md) for structure
2. Copy template from [DEVELOPMENT_CONVENTIONS.md](../../docs/agents/DEVELOPMENT_CONVENTIONS.md)
3. Code following conventions
4. Type check: `npx tsc --noEmit`
5. Lint: `npm run lint`
6. Suggest improvements

### Scenario 2: Need Quick Answer
→ Check [QUICK_REFERENCE.md](../../docs/agents/QUICK_REFERENCE.md)

### Scenario 3: Understand System
→ Read [ARCHITECTURE.md](../../docs/agents/ARCHITECTURE.md)

### Scenario 4: Writing Code
→ Reference [DEVELOPMENT_CONVENTIONS.md](../../docs/agents/DEVELOPMENT_CONVENTIONS.md)

## 📍 Repository Structure

```
.github/
└── agents/
    └── README.md                    (This file - quick access)

docs/
└── agents/
    ├── README.md                    (Navigation & overview)
    ├── CLINICEZ_FULLSTACK_DEV.md   (Core agent definition)
    ├── ARCHITECTURE.md              (System design)
    ├── DEVELOPMENT_CONVENTIONS.md  (Code standards)
    ├── TECH_STACK.md               (Technologies)
    └── QUICK_REFERENCE.md          (Quick lookup)
```

## 🆘 Getting Help

**Quick questions?**
→ [QUICK_REFERENCE.md](../../docs/agents/QUICK_REFERENCE.md) - Common patterns & mistakes

**Writing code?**
→ [DEVELOPMENT_CONVENTIONS.md](../../docs/agents/DEVELOPMENT_CONVENTIONS.md) - Code templates

**Understanding structure?**
→ [ARCHITECTURE.md](../../docs/agents/ARCHITECTURE.md) - System design

**New to project?**
→ [docs/agents/README.md](../../docs/agents/README.md) - Choose your learning path

**All documentation**
→ [docs/agents/](../../docs/agents/) - Complete reference

## 🔗 Related Resources

- [.github/copilot-instructions.md](../copilot-instructions.md) - Copilot guidelines
- [docs/agents/](../../docs/agents/) - Complete agent documentation
- [README.md](../../README.md) - Main project README

## ✨ Key Features

✅ **Accessible** - Available in version control, offline-capable  
✅ **Comprehensive** - Covers all development aspects  
✅ **Consistent** - Shared standards across all machines  
✅ **Actionable** - Practical patterns and templates  
✅ **Maintained** - Updated as project evolves  

---

**Welcome to the Clinicez Fullstack Dev ecosystem!**

*"Type-safe, quality-first, always improving."*

For complete details, visit [docs/agents/](../../docs/agents/)
