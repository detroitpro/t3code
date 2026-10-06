# Agents panel

The right-panel **Agents** surface
([`AgentsPanel.tsx`](../../apps/web/src/components/AgentsPanel.tsx)) is a
**live-ops** view of subagents for the current thread. Chat still carries one
spawn-batch row per turn; the panel is where you monitor what is still working
and what problem each agent was assigned.

Source-neutral state comes from
[`subagentRuntime.ts`](../../packages/client-runtime/src/state/subagentRuntime.ts)
(`foldSubagentActivities` → `deriveAgentPanelModel`, with optional v2
projection). Partition helpers (`partitionAgentsForPanel`,
`partitionWorkflowsForPanel`) shape that model into bands.

## Product contract

- **Primary job:** answer “what is still working on this thread?” History is a
  collapsed **Completed** shelf, not the default scroll.
- **Mission vs step:** `title` is the mission (what problem the agent is
  solving). `progress` / recent activity is the current step. Weak titles are a
  spawn/adapter problem; the panel assumes title = mission.
- **Bands:** Working (pending/running/waiting) → Idle when anyone is idle →
  Completed (collapsed). Hide an empty Idle band. Always keep the Working frame
  when the thread has only completed work (“No agents working”).
- **Vocabulary:** agents **complete**; threads **settle**. Do not label agent
  bands or the panel footer “settled.”
- **Failures:** terminal failure/stop joins Completed; status color/icon
  differentiates inside the shelf.
- **Order:** Working keeps spawn / first-seen order. Completed sorts by newest
  `completedAt` (workflows and direct agents interleaved).
- **Cards:** collapsed = mission + one progress line + compact `model · tokens`
  (no tool count). Expand for full mission; **Steps** is a nested disclosure for
  `recentActivity` plus result/error.
- **Workflows:** non-terminal runs stay at the top (expanded by default).
  Terminal runs join Completed as whole units. “Direct spawns” labels only when
  both workflows and direct agents are present.
- **Filters:** bands only — no role/search filters in v1.

## Traps

- Fixed-height non-expanding rows were an earlier performance rule. Expandable
  cards intentionally reflow; keep collapsed density tight and avoid continuous
  animation.
- `settledCount` on `AgentPanelModel` still means “terminal agents” in code; UI
  copy must say **completed**.
- Idle is not Working and not Completed: resumable Codex children belong in the
  Idle band so they neither look stuck nor disappear into history.
- Mobile has no Agents sheet; spawn cards stay in the work log only.

## Related

- User-facing: [Inspect agent work](../user/thread-sidebar.md#inspect-agent-work)
- Chat spawn rows: [`MessagesTimeline.tsx`](../../apps/web/src/components/chat/MessagesTimeline.tsx)
  (`AgentSpawnRow`)
- Title/mission quality audit: https://github.com/detroitpro/t3code/issues/49
