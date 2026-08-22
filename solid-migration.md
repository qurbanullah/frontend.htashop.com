# Track Service — SOLID Architecture Migration Plan

**Created:** 2026-07-23
**Target Launch:** August 1, 2026
**Principle:** Zero breaking changes. Every phase is independently shippable.
**Approach:** Strangler Fig Pattern — new code lives alongside old code until verified, then old code is removed.

---

## Architecture Target (Layer-First)

```
track/src/
├── api/                    # HTTP transport layer
│   ├── client.ts           # Shared ky instance
│   ├── manuscripts/
│   ├── reviews/
│   ├── journals/
│   ├── users/
│   ├── notifications/
│   ├── auth/
│   └── ...
├── actions/                # Single-purpose operations (one function per file)
│   ├── manuscripts/
│   ├── reviews/
│   ├── auth/
│   └── journals/
├── services/               # Business logic orchestration
│   ├── manuscripts/
│   ├── reviews/
│   └── auth/
├── hooks/                  # React Query wrappers + custom state hooks
│   ├── manuscripts/
│   ├── reviews/
│   ├── auth/
│   ├── dashboard/
│   └── shared/
├── components/             # UI components
│   ├── manuscripts/
│   ├── reviews/
│   ├── ui/
│   └── shared/
├── pages/                  # Thin route entry points
├── stores/                 # Global Zustand stores
├── types/                  # Shared TypeScript types
├── utils/                  # Pure utility functions
└── i18n/                   # Internationalization
```

**Dependency Rule (top-down, no upward imports):**

```
components/ ──imports──▶ hooks/ ──imports──▶ services/ ──imports──▶ actions/ ──imports──▶ api/
                │            │
                ▼            ▼
             stores/      stores/
```

Components may also import stores directly. Actions may NOT import hooks, services, components, or stores.

---

## Pre-Launch Freeze (July 23 — August 1, 2026)

### ⛔ NO structural changes during this window

- No file moves, renames, or directory creation
- No refactoring of existing components
- No changes to import paths

### ✅ Permitted during freeze

- Bug fixes in existing code
- Copy/style adjustments
- New features that don't touch existing component internals

---

## Phase 0: Foundation Setup (August 2-3, 2026)

**Risk Level: 🟢 Zero — net-new files only, nothing imported yet**

### Step 0.1: Create Directory Scaffolding

Create all target directories with `.gitkeep` files so they exist but are empty:

```bash
mkdir -p track/src/actions/{manuscripts,reviews,auth,journals,users,notifications,editor}
mkdir -p track/src/services/{manuscripts,reviews,auth}
mkdir -p track/src/hooks/{manuscripts,reviews,auth,dashboard,shared}
```

✅ **Verification:** `git status` shows only new empty directories. `npm run build` passes. App runs unchanged.

### Step 0.2: Create `src/api/client.ts` (Consolidated HTTP Client)

Move the ky instance configuration from `src/lib/api.ts` into `src/api/client.ts`. Keep the old file as a re-export.

**Create:** `src/api/client.ts`
- Extract only the `ky.create({...})` block and `getApiUrl()` function
- No auth hooks, no types, no authApi object — just the raw HTTP client

**Modify:** `src/lib/api.ts`
- Import `api` from `@/api/client` and re-export it
- Everything else stays identical
- This is a transparent change — zero consumer impact

✅ **Verification:** All existing imports of `@/lib/api` still work. `npm run build` passes. Login flow works.

### Step 0.3: Create `src/hooks/shared/useMutation.ts` (Generic Mutation Hook)

**Create:** `src/hooks/shared/useMutation.ts`

This is the single most impactful file in the entire migration. It eliminates the try/catch/setLoading/success/error boilerplate that appears in every component.

```typescript
// hooks/shared/useMutation.ts
import {
  useMutation as useReactQueryMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toaster";

interface UseMutationOptions<TData> {
  onSuccessMessage?: string | ((data: TData) => string);
  invalidateQueries?: QueryKey[];
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData> = {},
) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useReactQueryMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options.onSuccessMessage) {
        const msg =
          typeof options.onSuccessMessage === "function"
            ? options.onSuccessMessage(data)
            : options.onSuccessMessage;
        success(msg);
      }
      if (options.invalidateQueries) {
        for (const key of options.invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      showError(error.message || "An unexpected error occurred");
      options.onError?.(error);
    },
  });
}
```

✅ **Verification:** File exists, compiles. Not yet used by any component. `npm run type-check` passes.

---

## Phase 1: First Action Extraction (August 4-6, 2026)

**Risk Level: 🟢 Low — one component at a time, old code stays**

### Step 1.1: Extract `withdrawManuscript` Action

This is the ideal first action because:
- It's self-contained
- Has clear input/output
- Has validation logic
- Is only used in one place (`ManuscriptDetail.tsx`)

**Create:** `src/actions/manuscripts/withdrawManuscript.ts`

```typescript
import manuscriptApi from "@/lib/manuscriptApi";

export interface WithdrawManuscriptPayload {
  reason: string;
  comments: string;
}

export async function withdrawManuscript(
  manuscriptId: number,
  payload: WithdrawManuscriptPayload,
) {
  if (!payload.reason || !payload.comments.trim()) {
    throw new Error(
      "Please select a reason and provide comments for withdrawal",
    );
  }
  const response = await manuscriptApi.withdrawManuscript(
    manuscriptId,
    payload,
  );
  return response.data;
}
```

**Create:** `src/hooks/manuscripts/useWithdrawManuscript.ts`

```typescript
import { useMutation } from "@/hooks/shared/useMutation";
import { withdrawManuscript } from "@/actions/manuscripts/withdrawManuscript";

export function useWithdrawManuscript(manuscriptId: number) {
  return useMutation(
    (payload: { reason: string; comments: string }) =>
      withdrawManuscript(manuscriptId, payload),
    {
      onSuccessMessage: "Manuscript withdrawn successfully",
      invalidateQueries: [["manuscript", manuscriptId]],
    },
  );
}
```

**Modify:** `src/pages/manuscripts/ManuscriptDetail.tsx`

Replace the `handleWithdraw` function body with the hook:

```tsx
// ADD this import:
import { useWithdrawManuscript } from "@/hooks/manuscripts/useWithdrawManuscript";

// ADD inside component:
const { mutate: withdrawMutation, isPending: withdrawing } =
  useWithdrawManuscript(manuscript?.id ?? 0);

// REPLACE handleWithdraw body:
const handleWithdraw = async () => {
  if (!manuscript) return;
  withdrawMutation(
    { reason: withdrawalReason, comments: withdrawalComments },
    {
      onSuccess: () => {
        setWithdrawDialogOpen(false);
        setWithdrawalReason("");
        setWithdrawalComments("");
      },
    },
  );
};
```

✅ **Verification:** Manual test: withdraw a manuscript. Toast shows success. Manuscript detail refreshes. Old code path works identically.

### Step 1.2: Extract `approveForReview` Action

Same pattern as above. Even simpler — no validation, just a mutation.

**Create:** `src/actions/manuscripts/approveForReview.ts`
**Create:** `src/hooks/manuscripts/useApproveForReview.ts`
**Modify:** `src/pages/manuscripts/ManuscriptDetail.tsx`

✅ **Verification:** Manual test: approve manuscript for review.

### Step 1.3: Extract `assignHandlingEditor` + `removeHandlingEditor` Actions

**Create:** `src/actions/manuscripts/assignHandlingEditor.ts`
**Create:** `src/actions/manuscripts/removeHandlingEditor.ts`
**Create:** `src/hooks/manuscripts/useAssignHandlingEditor.ts`
**Modify:** `src/pages/manuscripts/ManuscriptDetail.tsx`

✅ **Verification:** Manual test: assign and remove handling editor.

---

## Phase 2: Centralized Permission Service (August 7-8, 2026)

**Risk Level: 🟡 Medium — touches permission logic used everywhere**

This phase is critical because `ManuscriptDetail.tsx` has 30+ permission-checking functions that are duplicated in sidebar components.

### Step 2.1: Create ManuscriptPermissionService

**Create:** `src/services/manuscripts/ManuscriptPermissionService.ts`

This consolidates ALL permission logic into one class. It takes a manuscript and user, and exposes computed booleans.

```typescript
import type { Manuscript } from "@/types/academic";
import type { User } from "@/stores/auth";

export interface ManuscriptPermissions {
  isAuthor: boolean;
  isReviewer: boolean;
  isHandlingEditor: boolean;
  isManagingEditor: boolean;
  isProductionEditor: boolean;
  isPublishingEditor: boolean;
  isEditorInChief: boolean;
  isJournalStaff: boolean;
  canViewFiles: boolean;
  canViewDocxFile: boolean;
  canViewPdfFile: boolean;
  canViewReviewerSuggestions: boolean;
  canRequestRevision: boolean;
  canMakeFinalDecision: boolean;
  canWithdraw: boolean;
  isReviewerOnlyView: boolean;
  reviewerHasAccepted: boolean;
  submittedReviewerCount: number;
}

/**
 * Centralized permission service for manuscript operations.
 * Single source of truth for all RBAC logic.
 *
 * USAGE:
 *   const perms = new ManuscriptPermissionService(manuscript, user);
 *   if (perms.isAuthor) { ... }
 *   if (perms.canRequestRevision) { ... }
 */
export class ManuscriptPermissionService {
  constructor(
    private manuscript: Manuscript,
    private user: User,
  ) {}

  // ─── Role Checks ───────────────────────────────────────

  get isAuthor(): boolean {
    if (!this.manuscript || !this.user) return false;
    const isSubmitting =
      this.manuscript.submitting_author_id === this.user.id;
    const isCorresponding =
      this.manuscript.corresponding_author?.id === this.user.id;
    const isCoAuthor = this.manuscript.authors?.some(
      (a) => a.user?.id === this.user.id || a.user_id === this.user.id,
    );
    return isSubmitting || isCorresponding || isCoAuthor;
  }

  get isReviewer(): boolean {
    return (
      this.manuscript?.reviewers?.some(
        (r) => r.reviewer?.id === this.user.id,
      ) ?? false
    );
  }

  get reviewerHasAccepted(): boolean {
    const review = this.manuscript?.reviewers?.find(
      (r) => r.reviewer?.id === this.user.id,
    );
    return (
      review?.status === "in_progress" || review?.status === "completed"
    );
  }

  get isHandlingEditor(): boolean {
    return (
      this.manuscript?.handling_editor_id === this.user.id ||
      this.manuscript?.handling_editor?.id === this.user.id
    );
  }

  get isManagingEditor(): boolean {
    return (
      this.manuscript?.journal?.managing_editors?.some(
        (me) => me.id === this.user.id,
      ) ?? false
    );
  }

  get isProductionEditor(): boolean {
    return (
      this.manuscript?.journal?.production_editors?.some(
        (pe) => pe.id === this.user.id,
      ) ?? false
    );
  }

  get isPublishingEditor(): boolean {
    return (
      this.manuscript?.journal?.publishing_editors?.some(
        (pe) => pe.id === this.user.id,
      ) ?? false
    );
  }

  get isEditorInChief(): boolean {
    return this.normalizeRoles().some((role) =>
      ["admin", "eic", "editor_in_chief", "journal_editor_in_chief"].includes(
        role,
      ),
    );
  }

  get isEICByDesignation(): boolean {
    const journalId = this.manuscript?.journal?.id;
    return this.user.designations?.some(
      (d) =>
        (d.journal_id === journalId || d.journal_id === null) &&
        ["editor_in_chief", "eic"].includes(d.type?.toLowerCase() ?? ""),
    ) ?? false;
  }

  get isStrictEIC(): boolean {
    return this.isEditorInChief || this.isEICByDesignation;
  }

  get isJournalStaff(): boolean {
    if (!this.user) return false;
    return (
      this.user.roles?.some((r) => {
        const name = this.normalizeRoleName(r);
        return ["journal_office", "journal-office", "staff"].includes(name);
      }) ?? false
    );
  }

  get isEditorByDesignation(): boolean {
    if (!this.user?.designations) return false;
    return this.user.designations.some((d) =>
      [
        "editor",
        "editor_in_chief",
        "editor-in-chief",
        "eic",
        "managing_editor",
        "handling_editor",
      ].includes(d.type?.toLowerCase() ?? ""),
    );
  }

  // ─── Permission Computations ───────────────────────────

  get canViewFiles(): boolean {
    if (this.isEditorInChief) return true;
    if (this.isManagingEditor) return true;
    if (this.isHandlingEditor) return true;
    if (this.isProductionEditor) return true;
    if (this.isPublishingEditor) return true;
    if (this.isAuthor) return true;
    if (this.isReviewer && this.reviewerHasAccepted) return true;
    return false;
  }

  get canViewDocxFile(): boolean {
    return (
      this.isEditorInChief ||
      this.isManagingEditor ||
      this.isHandlingEditor ||
      this.isJournalStaff ||
      this.isEditorByDesignation
    );
  }

  get canViewPdfFile(): boolean {
    return (
      this.isAuthor ||
      (this.isReviewer && this.reviewerHasAccepted) ||
      this.isEditorInChief ||
      this.isManagingEditor ||
      this.isHandlingEditor ||
      this.isJournalStaff ||
      this.isEditorByDesignation
    );
  }

  get canViewReviewerSuggestions(): boolean {
    return (
      this.isEditorInChief ||
      this.isManagingEditor ||
      this.isHandlingEditor ||
      this.isJournalStaff ||
      this.isAuthor
    );
  }

  get canWithdraw(): boolean {
    return this.isAuthor;
  }

  get submittedReviewerCount(): number {
    if (!this.manuscript) return 0;
    const latestRevisionNumber =
      this.manuscript.revisions?.reduce(
        (max, r) => Math.max(max, r.version_number || 1),
        1,
      ) || 1;

    return (this.manuscript.reviewers || []).filter((reviewer) => {
      if (reviewer.status === "declined") return false;
      return (reviewer.reviews || []).some((review) => {
        if (review.status !== "submitted") return false;
        const revVersion = review.revision?.version_number || 1;
        return revVersion === latestRevisionNumber;
      });
    }).length;
  }

  get canRequestRevision(): boolean {
    if (!this.manuscript) return false;
    const hasMinimum = this.submittedReviewerCount >= 2;
    const canTransition = [
      "pending_decision",
      "revision_submitted",
    ].includes(this.manuscript.status);

    if (this.manuscript.status === "revision_submitted") {
      return (
        (this.isEditorInChief || this.isHandlingEditor) && hasMinimum
      );
    }

    const staleButReady =
      hasMinimum &&
      ![
        "draft",
        "revision_requested",
        "accepted",
        "rejected",
        "withdrawn",
        "in_copyedit",
        "in_production",
        "published",
        "archived",
      ].includes(this.manuscript.status);

    if (!canTransition && !staleButReady) return false;
    if (!hasMinimum) return false;
    return this.isEditorInChief || this.isHandlingEditor;
  }

  get canMakeFinalDecision(): boolean {
    if (!this.manuscript) return false;
    const hasMinimum = this.submittedReviewerCount >= 2;
    const canTransition = [
      "pending_decision",
      "revision_submitted",
    ].includes(this.manuscript.status);

    if (this.manuscript.status === "revision_submitted") {
      return this.isEditorInChief || this.isHandlingEditor;
    }

    const staleButReady =
      hasMinimum &&
      ![
        "draft",
        "revision_requested",
        "accepted",
        "rejected",
        "withdrawn",
        "in_copyedit",
        "in_production",
        "published",
        "archived",
      ].includes(this.manuscript.status);

    if (!canTransition && !staleButReady) return false;
    if (!hasMinimum) return false;
    return this.isEditorInChief || this.isHandlingEditor;
  }

  get isReviewerOnlyView(): boolean {
    if (!this.isReviewer) return false;
    return (
      !this.isEditorInChief &&
      !this.isManagingEditor &&
      !this.isProductionEditor &&
      !this.isPublishingEditor &&
      !this.isHandlingEditor &&
      !this.isAuthor
    );
  }

  // ─── All permissions as a single object ─────────────────

  /**
   * Returns all permissions as a plain object.
   * Use with useMemo in components to prevent recomputation.
   */
  toJSON(): ManuscriptPermissions {
    return {
      isAuthor: this.isAuthor,
      isReviewer: this.isReviewer,
      isHandlingEditor: this.isHandlingEditor,
      isManagingEditor: this.isManagingEditor,
      isProductionEditor: this.isProductionEditor,
      isPublishingEditor: this.isPublishingEditor,
      isEditorInChief: this.isEditorInChief,
      isJournalStaff: this.isJournalStaff,
      canViewFiles: this.canViewFiles,
      canViewDocxFile: this.canViewDocxFile,
      canViewPdfFile: this.canViewPdfFile,
      canViewReviewerSuggestions: this.canViewReviewerSuggestions,
      canRequestRevision: this.canRequestRevision,
      canMakeFinalDecision: this.canMakeFinalDecision,
      canWithdraw: this.canWithdraw,
      isReviewerOnlyView: this.isReviewerOnlyView,
      reviewerHasAccepted: this.reviewerHasAccepted,
      submittedReviewerCount: this.submittedReviewerCount,
    };
  }

  // ─── Private Helpers ────────────────────────────────────

  private normalizeRoles(): string[] {
    return (this.user?.roles || []).map((r) => this.normalizeRoleName(r));
  }

  private normalizeRoleName(role: unknown): string {
    if (typeof role === "string") return role.toLowerCase();
    if (role && typeof role === "object" && "name" in role) {
      return String(
        (role as { name?: unknown }).name || "",
      ).toLowerCase();
    }
    return "";
  }
}
```

### Step 2.2: Create React Hook Wrapper

**Create:** `src/hooks/manuscripts/useManuscriptPermissions.ts`

```typescript
import { useMemo } from "react";
import { ManuscriptPermissionService } from "@/services/manuscripts/ManuscriptPermissionService";
import { useAuthStore } from "@/stores/auth";
import type { Manuscript } from "@/types/academic";

export function useManuscriptPermissions(manuscript: Manuscript | null | undefined) {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    if (!manuscript || !user) return null;
    return new ManuscriptPermissionService(manuscript, user).toJSON();
  }, [manuscript, user]);
}
```

### Step 2.3: Integrate into ManuscriptDetail.tsx

**Modify:** `src/pages/manuscripts/ManuscriptDetail.tsx`

Replace the 30+ inline permission functions with:

```tsx
import { useManuscriptPermissions } from "@/hooks/manuscripts/useManuscriptPermissions";

// Inside component:
const permissions = useManuscriptPermissions(manuscript);

// Replace inline permission checks:
// OLD: isAuthor() ? <X /> : null
// NEW: permissions?.isAuthor ? <X /> : null
```

**This step is the most delicate.** Do it as a separate commit. If anything breaks, revert only this commit.

✅ **Verification:** Every role (author, reviewer, handling editor, managing editor, EIC, production editor, publishing editor) views a manuscript and sees correct UI elements. All sidebar variants render correctly.

### Step 2.4: Integrate into Sidebar Components

**Modify:** Each sidebar component under `src/components/manuscripts/sidebars/`

Replace inline role checks with permissions object passed as prop:

```tsx
// AuthorSidebar.tsx — BEFORE (self-contained role check):
const { user } = useAuthStore();
const isAuthor = manuscript?.submitting_author_id === user?.id;

// AuthorSidebar.tsx — AFTER (receives permissions):
interface AuthorSidebarProps {
  manuscript: Manuscript;
  permissions: ManuscriptPermissions; // from parent
}
```

This removes duplicated authorization logic from 7 sidebar components.

✅ **Verification:** Each sidebar variant tested independently. Same visual output as before.

---

## Phase 3: Dashboard Migration to React Query (August 9-12, 2026)

**Risk Level: 🟡 Medium — changes data fetching pattern**

### Step 3.1: Create Dashboard API Module

**Create:** `src/api/dashboard/dashboardApi.ts`

```typescript
import api from "@/api/client";

export const dashboardApi = {
  getAuthorDashboard: (period = "month") =>
    api.get(`dashboard/author?period=${period}`).json(),

  getEditorDashboard: (period = "month") =>
    api.get(`dashboard/editor?period=${period}`).json(),

  getReviewerDashboard: (period = "month") =>
    api.get(`dashboard/reviewer?period=${period}`).json(),

  getEditorInChiefDashboard: (period = "month") =>
    api.get(`dashboard/editor-in-chief?period=${period}`).json(),

  getManagingEditorDashboard: (period = "month") =>
    api.get(`dashboard/managing-editor?period=${period}`).json(),
};
```

### Step 3.2: Create Dashboard Hooks

**Create:** `src/hooks/dashboard/useAuthorDashboard.ts`
**Create:** `src/hooks/dashboard/useEditorDashboard.ts`
**Create:** `src/hooks/dashboard/useReviewerDashboard.ts`

Each follows the same pattern:

```typescript
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard/dashboardApi";

export function useAuthorDashboard(period = "month") {
  return useQuery({
    queryKey: ["dashboard", "author", period],
    queryFn: () => dashboardApi.getAuthorDashboard(period),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

### Step 3.3: Refactor Dashboard Components

**Modify:** Each dashboard component one at a time:

1. `AuthorDashboard.tsx`
2. `EditorDashboard.tsx`
3. `ReviewerDashboard.tsx`
4. `ManagingEditorMainDashboard.tsx`
5. `EditorInChiefDashboard.tsx`
6. `HandlingEditorDashboard.tsx`
7. `PublishingEditorDashboard.tsx`

**Pattern (before → after):**

```tsx
// BEFORE: raw useState + useEffect
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => { fetchData(); }, []);

// AFTER: React Query hook
const { data, isLoading, isRefetching, refetch } = useAuthorDashboard();
```

**Benefits after migration:**
- No loading spinner on tab switch (cache-first)
- Automatic background refetch on window focus
- Shared cache — if user visits dashboard twice, no request
- Smaller component code

✅ **Verification:** Each dashboard loads, refreshes, and displays data correctly. No regressions in data display.

---

## Phase 4: Remaining Actions Extraction (August 13-16, 2026)

**Risk Level: 🟢 Low — established pattern, rinse and repeat**

Extract remaining mutations from `ManuscriptDetail.tsx` and other components:

### Step 4.1: Editorial Decision Actions

**Create:**
- `src/actions/manuscripts/requestRevision.ts`
- `src/actions/manuscripts/makeFinalDecision.ts`
- `src/actions/manuscripts/deskReject.ts`

**Create hooks:**
- `src/hooks/manuscripts/useRequestRevision.ts`
- `src/hooks/manuscripts/useMakeFinalDecision.ts`
- `src/hooks/manuscripts/useDeskReject.ts`

**Integrate into:** `EditorialDecisionPanel.tsx` (already extracted component — low risk)

### Step 4.2: Managing Editor Actions

**Create:**
- `src/actions/manuscripts/managingEditorApprove.ts`
- `src/actions/manuscripts/managingEditorReject.ts`
- `src/actions/manuscripts/managingEditorReturnToAuthor.ts`

**Integrate into:** `ManagingEditorActionPanel.tsx`

### Step 4.3: Production/Publishing Actions

**Create:**
- `src/actions/manuscripts/startProduction.ts`
- `src/actions/manuscripts/forwardToPublishing.ts`
- `src/actions/manuscripts/publishManuscript.ts`

**Integrate into:** `ProductionEditorSidebar.tsx`, `PublishingEditorSidebar.tsx`

✅ **Verification:** Full manuscript lifecycle test: submit → approve → assign reviewers → reviews submitted → request revision → author revises → accept → start production → publish.

---

## Phase 5: API Layer Reorganization (August 17-19, 2026)

**Risk Level: 🟡 Medium — moves files, re-exports maintain backward compat**

### Step 5.1: Move API Modules to `src/api/`

Move each API module from `src/lib/` to `src/api/{feature}/` and keep old location as re-export:

```bash
# Move files
mv src/lib/manuscriptApi.ts → src/api/manuscripts/manuscriptApi.ts
mv src/lib/reviewApi.ts     → src/api/reviews/reviewApi.ts
mv src/lib/journalApi.ts    → src/api/journals/journalApi.ts
mv src/lib/reviewerApi.ts   → src/api/reviews/reviewerApi.ts
mv src/lib/userApi.ts       → src/api/users/userApi.ts
# ... etc.

# Create re-export shims in src/lib/ for backward compat
# src/lib/manuscriptApi.ts → export { manuscriptApi } from "@/api/manuscripts/manuscriptApi";
```

### Step 5.2: Update Internal Imports

Gradually update imports in actions and hooks to use new paths:

```typescript
// OLD:
import manuscriptApi from "@/lib/manuscriptApi";

// NEW:
import { manuscriptApi } from "@/api/manuscripts/manuscriptApi";
```

### Step 5.3: Remove Re-export Shims

Once all consumers use new paths, delete the old `src/lib/*Api.ts` shims.

✅ **Verification:** `npm run build` passes. All features work. `grep -r "from '@/lib/" src/` returns no results for API modules.

---

## Phase 6: Component Cleanup (August 20-22, 2026)

**Risk Level: 🟡 Medium — removes dead code from large files**

### Step 6.1: Slim Down ManuscriptDetail.tsx

By this phase, `ManuscriptDetail.tsx` should have:
- ✅ All mutations extracted to actions/hooks
- ✅ All permissions extracted to service
- ✅ Sidebars receiving permissions as props

**Remaining work:** Remove dead code (old inline functions that are now unused).

**Target:** Reduce from ~900 lines to ~200 lines.

### Step 6.2: Verify ManuscriptForm.tsx

Check if `ManuscriptForm.tsx` benefits from action extraction. The create/edit flow might be simple enough to leave as-is. Only extract if it reduces complexity.

### Step 6.3: Clean Up Unused `src/lib/` Files

Once all API modules are migrated:
- Remove `src/lib/*Api.ts` shims
- Keep `src/lib/utils.ts` (cn, debounce — these are utilities, not API)
- Keep `src/lib/toast.ts` until Phase 7 replaces it

---

## Phase 7: Toast System Modernization (August 23-24, 2026)

**Risk Level: 🟢 Low — Radix Toast is already installed, just not used**

### Step 7.1: Replace Vanilla DOM Toast with Radix

The current `src/lib/toast.ts` uses `document.createElement('div')` — bypassing React's virtual DOM. Radix Toast (`@radix-ui/react-toast` v1.2.2) is already in `package.json`.

**Modify:** `src/components/ui/Toaster.tsx` (or create if not exists)
**Remove:** `src/lib/toast.ts` (or keep as deprecated wrapper)

### Step 7.2: Create Toast Provider

Wrap the app with a Toast provider so all components can use it via the existing `useToast()` hook.

✅ **Verification:** Success/error/info/warning toasts display correctly with proper React rendering.

---

## Phase 8: ESLint Architectural Rules (August 25, 2026)

**Risk Level: 🟢 Zero — lint-only, no runtime impact**

### Step 8.1: Add `eslint-plugin-import` Path Rules

Enforce the layer dependency rule:

```js
// biome.json or .eslintrc.cjs
"import/no-restricted-paths": [
  "error",
  {
    "zones": [
      { "target": "./src/actions", "from": "./src/hooks" },
      { "target": "./src/actions", "from": "./src/components" },
      { "target": "./src/actions", "from": "./src/stores" },
      { "target": "./src/services", "from": "./src/components" },
      { "target": "./src/api", "from": "./src/hooks" },
      { "target": "./src/api", "from": "./src/services" },
      { "target": "./src/api", "from": "./src/actions" },
    ],
  },
],
```

### Step 8.2: Add to CI Pipeline

Add `npm run lint` to CI (if not already) so architectural violations block PRs.

✅ **Verification:** Intentionally violate a rule, run lint, confirm it fails.

---

## Phase 9: Documentation & Onboarding (August 26-27, 2026)

### Step 9.1: Update AGENTS.md for Track

Add the layer-first architecture rules to `track/` documentation so future AI agents and developers follow the pattern.

### Step 9.2: Create Architecture Decision Record (ADR)

Document WHY layer-first was chosen over feature-first:

```markdown
# ADR-001: Layer-First Architecture for Track Service

**Status:** Accepted
**Date:** 2026-07-23

## Context
Track service needs a scalable architecture matching the API's
Controller → Service → Action pattern.

## Decision
Use layer-first directory structure (actions/, services/, hooks/,
api/, components/) with feature subdirectories.

## Rationale
- Mirrors API service architecture for team consistency
- Enforceable via ESLint import rules
- Easier cross-feature refactoring
- Better for backend-heavy teams
```

---

## Migration Summary by Phase

| Phase | Dates | Files Created | Files Modified | Risk |
|-------|-------|--------------|----------------|------|
| 0: Foundation | Aug 2-3 | 4 | 1 | 🟢 Zero |
| 1: First Actions | Aug 4-6 | 8 | 1 | 🟢 Low |
| 2: Permission Service | Aug 7-8 | 2 | 8 | 🟡 Medium |
| 3: Dashboard React Query | Aug 9-12 | 8 | 7 | 🟡 Medium |
| 4: Remaining Actions | Aug 13-16 | 12 | 4 | 🟢 Low |
| 5: API Reorganization | Aug 17-19 | 8 | 20+ | 🟡 Medium |
| 6: Component Cleanup | Aug 20-22 | 0 | 3 | 🟡 Medium |
| 7: Toast Modernization | Aug 23-24 | 1 | 2 | 🟢 Low |
| 8: ESLint Rules | Aug 25 | 0 | 1 | 🟢 Zero |
| 9: Documentation | Aug 26-27 | 3 | 1 | 🟢 Zero |

**Total:** ~27 days, 46 new files, minimal risk per phase.

---

## Rollback Strategy Per Phase

Every phase is independently revertible:

| Phase | Rollback Method |
|-------|----------------|
| 0 | Delete new directories, revert `lib/api.ts` change |
| 1 | Revert component changes (new hook/action files can stay — unused) |
| 2 | Revert `ManuscriptDetail.tsx` + sidebar changes to inline permission checks |
| 3 | Revert dashboard components to `useState` + `useEffect` |
| 4 | Revert component changes (action files can stay) |
| 5 | Revert import path changes; shims still in place |
| 6 | Revert deletions from git history |
| 7 | Revert toaster changes; old toast.ts still exists |
| 8 | Remove lint rule |
| 9 | N/A — documentation only |

---

## What NOT to Change (Deliberately Excluded)

- **`src/stores/auth.ts`**: Already well-structured with Zustand + Immer + Persist. No changes needed.
- **`src/types/`**: Already clean. Add new types as needed but don't restructure.
- **`src/utils/`**: Pure utility functions. Stay as-is.
- **`src/i18n/`**: No structural issues. No changes needed.
- **`src/contexts/`**: Theme and other contexts. No changes needed.
- **`src/components/ui/`**: Design system components. Stay as-is.
- **Component file naming**: Keep `PascalCase.tsx` for components, `camelCase.ts` for utilities.
- **`src/api/client.ts`**: The re-export shim. Keep indefinitely for backward compatibility.

---

## Progress Tracker

| Phase | Status | Completed Date | Notes |
|-------|--------|---------------|-------|
| Pre-Launch Freeze | 🔴 Active | — | Until Aug 1 |
| 0: Foundation | ⬜ Pending | — | — |
| 1: First Actions | ⬜ Pending | — | — |
| 2: Permission Service | ⬜ Pending | — | — |
| 3: Dashboard React Query | ⬜ Pending | — | — |
| 4: Remaining Actions | ⬜ Pending | — | — |
| 5: API Reorganization | ⬜ Pending | — | — |
| 6: Component Cleanup | ⬜ Pending | — | — |
| 7: Toast Modernization | ⬜ Pending | — | — |
| 8: ESLint Rules | ⬜ Pending | — | — |
| 9: Documentation | ⬜ Pending | — | — |

---

## Daily Checklist for Each Phase

Before starting a phase:
- [ ] `git checkout -b phase-X-description` (new branch)
- [ ] `npm run type-check` (confirm clean baseline)
- [ ] `npm run build` (confirm clean build)

After completing a phase:
- [ ] `npm run type-check` (must pass with zero errors)
- [ ] `npm run lint` (must pass)
- [ ] `npm run build` (must succeed)
- [ ] Manual smoke test: login → dashboard → manuscript detail → submit action
- [ ] Merge to main via PR (NOT direct push)

---

## Notes

- **This is a living document.** Update the progress tracker as phases complete.
- **No phase is mandatory.** If a phase proves too disruptive, skip it and revisit later.
- **Actions are the priority.** Even without directories or services, extracting business logic into pure functions is the highest-value change.
- **The permission service is the second priority.** It eliminates the most duplication and risk of inconsistent authorization.
- **Wait until after launch** before starting Phase 0. No changes before August 2.
