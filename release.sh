#!/usr/bin/env bash
#
# Verify the working tree, commit it, and push it.
#
# This runs on YOUR MACHINE. GitHub Actions does the deploying (see
# .github/workflows/deploy.yml for the server side and the required repository
# secrets).
#
#   ./release.sh "Add product import filters"
#   ./release.sh --deploy "Ship the payment gateway"   # pushes main, so it deploys
#   ./release.sh --skip-checks "Fix a typo in the footer"
#   ./release.sh --no-push "Groundwork, not ready for production"
#
# The workflow has no test job: these checks are the only ones there are, so
# skipping them ships code that nothing has verified.
#
set -euo pipefail

BRANCH="${BRANCH:-main}"
# Empty means "find the container that runs this app". On this machine the
# checks run inside the dev container, where node_modules is already installed.
NPM_BIN="${NPM_BIN:-}"
CONTAINER="${CONTAINER:-htashop-frontend}"

RUN_CHECKS=1
DO_PUSH=1
DEPLOY=0
MESSAGE=""

step() { printf '\n\033[1;34m==>\033[0m \033[1m%s\033[0m\n' "$1"; }
info() { printf '    %s\n' "$1"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$1" >&2; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$1" >&2; exit 1; }

usage() {
    cat <<'USAGE'
Verify the working tree, commit it, and push it.

GitHub Actions does the rest: a push to main deploys to production (see
.github/workflows/deploy.yml). Pushing any other branch does not.

  --deploy        push to main, which starts the deploy
  --skip-checks   push without running the checks. Nothing else will run them
  --no-push       commit only
  -h, --help      show this message

Without --deploy the current branch is pushed; a commit message is required when
the tree has changes.
USAGE
    exit 0
}

for argument in "$@"; do
    case "$argument" in
        --deploy)      DEPLOY=1 ;;
        --skip-checks) RUN_CHECKS=0 ;;
        --no-push)     DO_PUSH=0 ;;
        -h|--help)     usage ;;
        -*)            die "unknown option: $argument (try --help)" ;;
        *)             MESSAGE="$argument" ;;
    esac
done

if [ "$DEPLOY" -eq 1 ] && [ "$DO_PUSH" -eq 0 ]; then
    die "--deploy and --no-push contradict each other (--deploy pushes to $BRANCH)"
fi

cd "$(dirname -- "${BASH_SOURCE[0]:-$0}")"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not a git repository"

# ---------------------------------------------------------------------------
# Checks
#
# These need the project's node_modules, which live in the dev container's
# volume, so the container is the right place to run them. Set NPM_BIN to use a
# host npm instead (only if the host has node_modules installed).
# ---------------------------------------------------------------------------

run_npm() {
    if [ -n "$NPM_BIN" ]; then
        "$NPM_BIN" "$@"
    else
        docker exec "$CONTAINER" npm "$@"
    fi
}

# The source files this release touches: tracked modifications (staged and
# unstaged) plus untracked files, limited to what Biome checks. This mirrors
# `pint --dirty` — the style gate is on the diff, not on the pre-existing
# corpus, so files that predate the formatter do not block a release.
changed_files() {
    {
        git diff --name-only --diff-filter=ACMR
        git diff --cached --name-only --diff-filter=ACMR
        git ls-files --others --exclude-standard
    } | grep -E '^src/.*\.(tsx?|jsx?|json|css)$' | sort -u || true
}

if [ "$RUN_CHECKS" -eq 1 ]; then
    if [ -n "$NPM_BIN" ]; then
        command -v "$NPM_BIN" >/dev/null 2>&1 || die "npm binary '$NPM_BIN' not found"
    else
        docker exec "$CONTAINER" npm -v >/dev/null 2>&1 \
            || die "cannot run npm in the '$CONTAINER' container.
  Start it (docker compose up -d), or set NPM_BIN to a host npm that has the
  project's node_modules installed."
    fi

    FILES="$(changed_files)"

    step "Lint (files in this release)"
    if [ -z "$FILES" ]; then
        info "no source files changed; nothing to lint"
    else
        # Word-splitting is intentional: $FILES is a newline-separated list.
        # shellcheck disable=SC2086
        run_npm exec biome check $FILES \
            || die "the files above are not clean.
  Fix them with: docker exec $CONTAINER npm run lint:fix"
    fi

    step "Type check"
    run_npm run type-check || die "type check failed"

    step "Tests"
    run_npm run test -- --run --passWithNoTests || die "tests failed"
else
    warn "checks skipped"
    warn "nothing else runs them: pushing to $BRANCH deploys straight to production"
fi

# ---------------------------------------------------------------------------
# Commit and push
#
# Deliberately explicit: a message means "commit everything", no message means
# the tree must already be clean. Nothing is committed by accident.
# ---------------------------------------------------------------------------

step "Publishing to GitHub"

if [ -n "$(git status --porcelain)" ]; then
    if [ -z "$MESSAGE" ]; then
        printf '\n'
        git status --short
        die "the tree has changes. Pass a commit message ('./release.sh \"...\"'), or commit them yourself."
    fi

    info "staging:"
    git status --short | sed 's/^/        /'

    git add -A
    git commit -m "$MESSAGE"
else
    info "nothing to commit"
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
COMMIT="$(git log -1 --format='%h %s')"

if [ "$DO_PUSH" -eq 0 ]; then
    step "Committed, not pushed"
    info "$COMMIT"
    exit 0
fi

# ---------------------------------------------------------------------------
# Push
#
# HEAD:$BRANCH pushes whatever is checked out, from any branch, so --deploy works
# the same whether you are on main or not. Git refuses a non-fast-forward itself,
# which is the wanted behaviour: a diverged main stops here rather than being
# rewritten.
# ---------------------------------------------------------------------------

if [ "$DEPLOY" -eq 1 ]; then
    step "Pushing to $BRANCH"
    git push origin "HEAD:$BRANCH"
    info "$COMMIT"

    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        info "your local $CURRENT_BRANCH did not move; 'git fetch' updates $BRANCH"
    fi
else
    step "Pushing $CURRENT_BRANCH"
    git push origin "$CURRENT_BRANCH"
    info "$COMMIT"
fi

# ---------------------------------------------------------------------------
# What happens next
# ---------------------------------------------------------------------------

step "Pushed"

DEPLOYS=0
if [ "$DEPLOY" -eq 1 ] || [ "$CURRENT_BRANCH" = "$BRANCH" ]; then
    DEPLOYS=1
fi

if [ "$DEPLOYS" -eq 0 ]; then
    info "'$CURRENT_BRANCH' is not '$BRANCH', so nothing is deployed."
    info "re-run with --deploy, or open a pull request into $BRANCH, to deploy."
    exit 0
fi

warn "$BRANCH deploys to production; the workflow is starting"

REMOTE_URL="$(git config --get remote.origin.url 2>/dev/null || true)"

case "$REMOTE_URL" in
    git@github.com:*)     REPO_PATH="${REMOTE_URL#git@github.com:}" ;;
    https://github.com/*) REPO_PATH="${REMOTE_URL#https://github.com/}" ;;
    *)                    REPO_PATH="" ;;
esac

if [ -n "$REPO_PATH" ]; then
    info "watch it at https://github.com/${REPO_PATH%.git}/actions"
fi
