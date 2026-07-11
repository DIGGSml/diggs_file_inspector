#!/bin/bash
# PreToolUse/Bash hook: snapshot any uncommitted repo state into the git
# stash before letting a shell command run, so a rogue/mistaken command has
# something to recover from. Uses `stash create` + `stash store` rather than
# plain `stash push` so it never touches the working tree or index — no
# disruption to in-progress edits, and no visible commit lands on the
# branch. Skips entirely if nothing has changed since the last checkpoint,
# and keeps only the single newest checkpoint entry in the stash list to
# avoid clutter. Fails open (never blocks the actual command).
REPO="/Users/dponti/Documents/GitHub/diggs_file_inspector"
# Must live outside $REPO (else writing it would change the tree that
# `stash create -u` snapshots next time, causing an infinite "changed" loop)
# and inside the sandbox's allowWrite scope (/private/tmp/claude-501 is
# reliably writable; ~/.claude is not — it allowed one write then blocked
# a subsequent overwrite of the same path).
STATE_FILE="/private/tmp/claude-501/diggs_file_inspector-checkpoint-state/last-tree"
TAG="agent-checkpoint"

if ! git -C "$REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

NEW_SHA=$(git -C "$REPO" stash create -u 2>/dev/null)
if [ -z "$NEW_SHA" ]; then
  exit 0   # working tree is clean, nothing to protect
fi

NEW_TREE=$(git -C "$REPO" rev-parse "${NEW_SHA}^{tree}" 2>/dev/null)
LAST_TREE=""
[ -f "$STATE_FILE" ] && LAST_TREE=$(cat "$STATE_FILE")

if [ "$NEW_TREE" = "$LAST_TREE" ]; then
  exit 0   # nothing has changed since the last checkpoint
fi

if git -C "$REPO" stash store -m "$TAG: $(date '+%Y-%m-%d %H:%M:%S')" "$NEW_SHA" >/dev/null 2>&1; then
  mkdir -p "$(dirname "$STATE_FILE")"
  echo "$NEW_TREE" > "$STATE_FILE"

  # Keep only the newest agent-checkpoint stash entry; drop older ones we made.
  while true; do
    COUNT=$(git -C "$REPO" stash list | grep -c "$TAG")
    [ "$COUNT" -le 1 ] && break
    OLDEST_REF=$(git -C "$REPO" stash list | grep "$TAG" | tail -n 1 | cut -d: -f1)
    [ -z "$OLDEST_REF" ] && break
    git -C "$REPO" stash drop "$OLDEST_REF" >/dev/null 2>&1 || break
  done
else
  echo '{"systemMessage":"Auto-checkpoint stash failed before a Bash command ran — repo has uncommitted changes that were NOT snapshotted. Run git status to check."}'
fi
exit 0
