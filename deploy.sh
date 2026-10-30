#!/usr/bin/env bash
#
# Build the frontend and prerender images and roll both Swarm services onto them.
#
# This runs ON THE SWARM MANAGER, normally arriving over stdin from
# .github/workflows/deploy.yml:
#
#   ssh "$USER@$HOST" "cd '$APP_DIR' && bash -s" < deploy.sh
#
# The manager keeps the checkout this builds from; the script updates it first, so
# what is built is what was pushed. The stack itself (networks, secrets, db, redis,
# typesense, haproxy) is deployed separately — see deploy/ — and this only moves the
# storefront and its prerender service.
#
#   ./deploy.sh --no-build      roll the existing images (already built)
#   ./deploy.sh --no-smoke      skip the post-rollout check
#   ./deploy.sh --help
#
# Environment:
#
#   APP_DIR                checkout to build from (defaults to this script's directory)
#   BRANCH                 branch to deploy (default: main)
#   STACK_NAME             (default: htashop)
#   SERVICE_NAME           (default: frontend)
#   PRERENDER_SERVICE_NAME (default: ${STACK_NAME}_prerender)
#   SMOKE_URL              e.g. https://htashop.com/
#
set -euo pipefail

BRANCH="${BRANCH:-main}"
STACK_NAME="${STACK_NAME:-htashop}"
SERVICE_NAME="${SERVICE_NAME:-frontend}"

SWARM_SERVICE_NAME="${STACK_NAME}_${SERVICE_NAME}"
IMAGE_NAME="${STACK_NAME}-${SERVICE_NAME}:latest"

PRERENDER_SERVICE_NAME="${PRERENDER_SERVICE_NAME:-${STACK_NAME}_prerender}"
PRERENDER_IMAGE="${STACK_NAME}-prerender:latest"

DO_BUILD=1
DO_SMOKE=1

step()  { printf '\n\033[1;34m==>\033[0m \033[1m%s\033[0m\n' "$1"; }
info()  { printf '    %s\n' "$1"; }
warn()  { printf '\033[1;33mwarning:\033[0m %s\n' "$1" >&2; }
die()   { printf '\033[1;31merror:\033[0m %s\n' "$1" >&2; exit 1; }

# set -e aborts without a message when a command substitution or a guard fails.
# That is indistinguishable from a hang or a Ctrl-C, so report the line. The
# trap captures $LINENO/$BASH_COMMAND/$? itself, before calling the function,
# so the reported line is the failing command's line rather than the helper's.
report_error() {
    local line="$1" command="$2" status="$3"
    printf "\033[1;31merror:\033[0m %s failed at line %s (exit %s)\n    %s\n" \
        "${0##*/}" "$line" "$status" "$command" >&2
    exit "$status"
}
trap 'report_error "$LINENO" "$BASH_COMMAND" "$?"' ERR

usage() {
    cat <<'USAGE'
Build the frontend and prerender images and roll both Swarm services onto them.

  --no-build   skip the builds and roll the existing images
  --no-smoke   skip the post-rollout smoke test
  -h, --help   show this message

With no options this updates the checkout, builds both images, rolls both services
and checks the storefront.
USAGE
    exit 0
}

for argument in "$@"; do
    case "$argument" in
        --no-build) DO_BUILD=0 ;;
        --no-smoke) DO_SMOKE=0 ;;
        -h|--help)  usage ;;
        *)          die "unknown option: $argument (try --help)" ;;
    esac
done

# Where this script lives. It normally arrives over stdin, in which case there is no
# path to derive and the caller is expected to have changed into the checkout.
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
else
    SCRIPT_DIR="$PWD"
fi

APP_DIR="${APP_DIR:-$SCRIPT_DIR}"

# ---------------------------------------------------------------------------
# Preflight
#
# Everything checkable is checked before the service is touched: a failed rollout
# costs a rollback and a window of reduced capacity.
# ---------------------------------------------------------------------------

step "Checking the environment"

cd "$APP_DIR" || die "cannot enter $APP_DIR"
[ -f Dockerfile ]  || die "$APP_DIR has no Dockerfile, so it is not the build context"
[ -f package.json ] || die "$APP_DIR does not look like the application (no package.json)"

command -v git >/dev/null 2>&1 || die "git not found"
command -v docker >/dev/null 2>&1 || die "docker not found"

docker info >/dev/null 2>&1 || die "cannot talk to the Docker daemon"

SWARM_STATE="$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || echo unknown)"
[ "$SWARM_STATE" = "active" ] \
    || die "this node is not part of a Swarm ($SWARM_STATE), so there is no service to roll"

# Checked before building: a missing service or a bad NAME would otherwise be
# discovered after several minutes of building.
docker service inspect "$SWARM_SERVICE_NAME" >/dev/null 2>&1 \
    || die "no service named '$SWARM_SERVICE_NAME'.
  The stack must be deployed first (see deploy/), or STACK_NAME/SERVICE_NAME are wrong."

docker service inspect "$PRERENDER_SERVICE_NAME" >/dev/null 2>&1 \
    || die "no service named '$PRERENDER_SERVICE_NAME'.
  The stack must be deployed first (see deploy/), or STACK_NAME/PRERENDER_SERVICE_NAME are wrong."

EXPECTED_REPLICAS="$(docker service inspect "$SWARM_SERVICE_NAME" \
    --format '{{.Spec.Mode.Replicated.Replicas}}' 2>/dev/null || echo '?')"

PRERENDER_REPLICAS="$(docker service inspect "$PRERENDER_SERVICE_NAME" \
    --format '{{.Spec.Mode.Replicated.Replicas}}' 2>/dev/null || echo '?')"

git remote get-url origin >/dev/null 2>&1 \
    || die "$APP_DIR has no 'origin' remote, so it is not the application's checkout"

info "app:       $APP_DIR"
info "service:   $SWARM_SERVICE_NAME ($EXPECTED_REPLICAS replicas)"
info "prerender: $PRERENDER_SERVICE_NAME ($PRERENDER_REPLICAS replicas)"
info "image:     $IMAGE_NAME"
info "image:     $PRERENDER_IMAGE"
info "branch:    $BRANCH"

# ---------------------------------------------------------------------------
# Code
#
# Fast-forward only. The manager is a build host, not a place to keep local work;
# if it somehow has commits, stop rather than discard something that exists nowhere
# else.
# ---------------------------------------------------------------------------

step "Updating the checkout"

git fetch --prune origin "$BRANCH"

if [ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$BRANCH")" ]; then
    info "already at $(git rev-parse --short HEAD)"
else
    git merge --ff-only "origin/$BRANCH" \
        || die "origin/$BRANCH cannot be fast-forwarded. The checkout has commits that are not on the remote; reconcile them before deploying."
    info "now at $(git log -1 --format='%h %s')"
fi

DIRTY="$(git status --porcelain)" || DIRTY=""
if [ -n "$DIRTY" ]; then
    warn "the checkout has uncommitted changes; the image will not match what was pushed"
    printf '%s\n' "$DIRTY" | sed 's/^/    /' >&2
fi

# Checked after the fast-forward: prerender/ arrives with the commit that adds
# it, so the preflight (before git fetch) cannot see it on the first deploy.
[ -f prerender/Dockerfile ] \
    || die "$APP_DIR/prerender/Dockerfile is missing from the checkout"

# ---------------------------------------------------------------------------
# Build
#
# Tagged with the commit as well as 'latest' so a rollback is a one-liner:
#   docker service update --force --image $IMAGE_NAME:<sha> $SWARM_SERVICE_NAME
# ---------------------------------------------------------------------------

SHORT_SHA="$(git rev-parse --short HEAD)"
BUILD_TAG="${STACK_NAME}-${SERVICE_NAME}:${SHORT_SHA}"
PRERENDER_BUILD_TAG="${STACK_NAME}-prerender:${SHORT_SHA}"

if [ "$DO_BUILD" -eq 1 ]; then
    step "Building $BUILD_TAG"

    docker build -t "$IMAGE_NAME" -t "$BUILD_TAG" .

    info "built $BUILD_TAG"

    step "Building $PRERENDER_BUILD_TAG"

    docker build -t "$PRERENDER_IMAGE" -t "$PRERENDER_BUILD_TAG" "$APP_DIR/prerender"

    info "built $PRERENDER_BUILD_TAG"
else
    step "Skipping the build"
    info "rolling $IMAGE_NAME and $PRERENDER_IMAGE, whatever they currently point at"
fi

# ---------------------------------------------------------------------------
# Roll out
# ---------------------------------------------------------------------------

roll_service() {
    local service="$1" image="$2" expected="$3"
    local running

    step "Rolling $service"

    docker service update --force --image "$image" "$service"

    docker service ps "$service" \
        --filter desired-state=running \
        --format 'table {{.Name}}\t{{.Node}}\t{{.CurrentState}}' \
        || warn "could not read the service's tasks"

    running="$(docker service ps "$service" \
        --filter desired-state=running --format '{{.CurrentState}}' 2>/dev/null \
        | grep -c '^Running' || true)"

    info "$running of ${expected} replicas running"

    if [ -n "$expected" ] && [ "$expected" != "?" ] && [ "$running" -lt "$expected" ]; then
        die "only $running of $expected replicas are running for $service.
  The rollout reported success but the service is short — check:
    docker service ps $service
    docker service logs $service --tail 100"
    fi
}

roll_service "$SWARM_SERVICE_NAME" "$IMAGE_NAME" "$EXPECTED_REPLICAS"
roll_service "$PRERENDER_SERVICE_NAME" "$PRERENDER_IMAGE" "$PRERENDER_REPLICAS"

# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------

if [ "$DO_SMOKE" -eq 1 ] && [ -n "${SMOKE_URL:-}" ]; then
    step "Smoke testing $SMOKE_URL"

    SMOKE_OK=0
    for attempt in 1 2 3 4 5; do
        if curl -fsS --max-time 10 -o /dev/null "$SMOKE_URL"; then
            SMOKE_OK=1
            break
        fi

        info "attempt $attempt did not answer; retrying in 5s"
        sleep 5
    done

    if [ "$SMOKE_OK" -eq 1 ]; then
        info "answered"
    else
        warn "$SMOKE_URL did not answer cleanly after 5 attempts"
        warn "the service is running, so this is more likely the proxy than the app:"
        warn "  docker service logs ${STACK_NAME}_haproxy --tail 50"
    fi
elif [ "$DO_SMOKE" -eq 1 ]; then
    info "no SMOKE_URL set, so nothing was checked from outside"
fi

# ---------------------------------------------------------------------------
# Housekeeping
# ---------------------------------------------------------------------------

step "Pruning dangling images"
docker image prune -f || warn "could not prune images"

step "Deployed ${SWARM_SERVICE_NAME} and ${PRERENDER_SERVICE_NAME} at ${SHORT_SHA}"
