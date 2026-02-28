# Migration Guide: v2 Restructure & Route Isolation

**Date:** February 13, 2026  
**Branch:** development  
**Commit:** Merge: Complete architectural restructuring with (v1) route isolation and TypeScript fixes

## What Changed

### 🏗️ Major Structural Changes

1. **Route Reorganization**
   - All original app routes moved into `(v1)` route group
   - **Old:** `src/app/user/[user]/phr/...`
   - **New:** `src/app/(v1)/(main)/user/[user]/phr/...`
   - See complete mapping below

2. **New v2 Routes**
   - `/v2/patient/dashboard` (Phase 1: Foundation)
   - `/v2/clinic/...` - Clinic-specific dashboards
   - `/v2/organizations/...` - Organization dashboards
   - Isolated from original v1 routes

3. **Import Path Improvements**
   - Converted 300+ files from relative imports to path aliases
   - New aliases added to `tsconfig.json`:
     - `@app/*` → `./src/app/*` (for cross-boundary imports)
     - `@provider/*` → `./src/provider/*`

4. **Component Export Reorganization**
   - Created 7 barrel export files (`index.ts`) in route directories
   - Enables cleaner component sharing across route boundaries

### 📁 Complete Route Mapping

| Old Path | New Path |
|----------|----------|
| `app/user/[user]/phr/...` | `app/(v1)/(main)/user/[user]/phr/...` |
| `app/organizations/...` | `app/(v1)/(dashboard)/organizations/...` |
| `app/clinics/...` | `app/(v1)/(dashboard)/clinics/...` |
| `app/hp/...` | `app/(v1)/(main)/hp/...` |
| `app/sign-in` | `app/(v1)/(auth)/sign-in` |
| `app/sign-up` | `app/(v1)/(auth)/sign-up` |
| `app/super-admin/...` | `app/(v1)/(super-admin)/...` |
| `app/onboarding/...` | `app/(v1)/onboarding/...` |

## Impact

### ✅ What Still Works
- All existing functionality intact
- All authentication/authorization flows
- All API routes
- Database connectivity
- All styling and components

### ⚠️ Breaking Changes
- Import paths changed (use new path aliases)
- Route structure changed
- Some shared components now imported via barrel exports
- TypeScript errors if using old import patterns

## Migration Steps for Your Branch

### Option 1: Rebase (Recommended for clean history)

```bash
# 1. Stash any uncommitted changes
git stash

# 2. Rebase on latest development
git pull origin development --rebase

# 3. Fix conflicts (see conflict resolution section)
# Git will stop at conflicts - resolve them and continue

# 4. Push with force-with-lease
git push origin [your-branch-name] --force-with-lease

# 5. Unstash if needed
git stash pop
```

### Option 2: Merge (Keeps your branch history)

```bash
# 1. Ensure you're on your feature branch
git checkout [your-branch-name]

# 2. Merge development
git merge origin/development

# 3. Fix conflicts (see conflicts section)
git add .
git commit -m "Merge: Update with v2 restructure"

# 4. Push
git push origin [your-branch-name]
```

## Conflict Resolution

### Import Path Conflicts

**Old import (will conflict):**
```typescript
import { Component } from "@/app/user/[user]/phr/...";
```

**New import (resolution):**
```typescript
import { Component } from "@app/(v1)/(main)/user/[user]/phr/...";
```

### File Path Conflicts

If you modified files that were moved, Git will show:
- **Deleted in them** - Old location was moved
- **Added by us** - New location in (v1) group

**Resolution:** Accept new location, update imports, delete old imports

### Component Import Conflicts

**Old (direct imports):**
```typescript
import AllergiesForm from "@app/(main)/user/[user]/phr/allergies/AllergiesForm";
```

**New (barrel exports):**
```typescript
import { AllergiesForm } from "@app/(v1)/(main)/user/[user]/phr/allergies";
```

## Validation Steps

After resolving conflicts, verify your branch:

```bash
# 1. Check TypeScript compilation
npx tsc --noEmit

# 2. Check for remaining import errors
npx tsc --noEmit 2>&1 | grep "error TS"

# 3. Run full build
pnpm build

# 4. Start dev server
pnpm dev
```

## Path Alias Reference

Update your imports to use these aliases:

```typescript
// ✅ Correct (use these)
import { Picture } from "@components/phr/Picture";
import { AllergiesForm } from "@app/(v1)/(main)/user/[user]/phr/allergies";
import { Clinic } from "@app/(v1)/(dashboard)/organizations/[orgUid]/clinics";

// ❌ Avoid (old style)
import Component from "@/app/user/[user]/phr/allergies/AllergiesForm";
import Component from "../../../../components/...";
```

## Common Issues & Solutions

### Issue: "Cannot find module '@app/...'

**Solution:** Ensure path includes `(v1)` group:
```typescript
// ❌ Wrong
import { Component } from "@app/(main)/...";

// ✅ Correct
import { Component } from "@app/(v1)/(main)/...";
```

### Issue: Type import errors

**Solution:** Use `export type` for type-only exports:
```typescript
import type { MyType } from "@app/(v1)/...";
```

### Issue: "Re-exporting a type when 'isolatedModules' is enabled"

**Solution:** Already fixed in index.ts files. Re-export types properly:
```typescript
// In index.ts
export type { MyType } from "./file";
export { default, Component } from "./file";
```

## Questions?

Refer to:
- [Copilot Instructions](.github/copilot-instructions.md) - Full development guide
- [Agents Documentation](.github/agents/) - Comprehensive architecture
- [README.md](README.md) - Quick start

## Timeline

- **Phase 1 Complete:** Route restructuring & TypeScript fixes ✓
- **Phase 2 (Next):** Patient dashboard layout implementation
- **Phase 3 (Next):** Component implementation

## Notes

- **No database changes required**
- **All existing data intact**
- **No API changes**
- **Build artifacts:** `.next/` directory
- **Config changes:** `tsconfig.json` only (path aliases)

---

**Status:** All changes merged to `development` branch.  
**Next Step:** Update your feature branch, test, and continue development.
