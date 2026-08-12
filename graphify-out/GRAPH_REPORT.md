# Graph Report - C:\Users\Test\OneDrive\Desktop\teju-projects\mvp\.cursor  (2026-08-11)

## Corpus Check
- Corpus is ~2,588 words - fits in a single context window. You may not need a graph.

## Summary
- 17 nodes · 24 edges · 4 communities (3 shown, 1 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Agent OS + Caveman
- Ponytail + Skills Policy
- Graphify Discovery
- Usage Checkpoint

## God Nodes (most connected - your core abstractions)
1. `AGENTS.md Cursor Agent OS` - 8 edges
2. `Ponytail` - 7 edges
3. `Graphify` - 6 edges
4. `Caveman` - 5 edges
5. `Coding Workflow A-F` - 4 edges
6. `Final Directive` - 4 edges
7. `Every-10-Prompts Usage Checkpoint` - 2 edges
8. `Graphify Skills Directory` - 2 edges
9. `Skill Conflict Priority` - 2 edges
10. `Core Contract` - 1 edges

## Surprising Connections (you probably didn't know these)
- `Caveman` --semantically_similar_to--> `Ponytail`  [INFERRED] [semantically similar]
  AGENTS.md → AGENTS.md  _Bridges community 0 → community 1_
- `AGENTS.md Cursor Agent OS` --references--> `Graphify`  [EXTRACTED]
  AGENTS.md → AGENTS.md  _Bridges community 0 → community 2_
- `AGENTS.md Cursor Agent OS` --references--> `Every-10-Prompts Usage Checkpoint`  [EXTRACTED]
  AGENTS.md → AGENTS.md  _Bridges community 0 → community 3_

## Hyperedges (group relationships)
- **Core Stack Trio** — cursor_agents_md_caveman, cursor_agents_md_ponytail, cursor_agents_md_graphify [EXTRACTED 1.00]
- **Workflow Composes Core Tools** — cursor_agents_md_coding_workflow, cursor_agents_md_caveman, cursor_agents_md_ponytail, cursor_agents_md_graphify [EXTRACTED 1.00]

## Communities (4 total, 1 thin omitted)

### Community 0 - "Agent OS + Caveman"
Cohesion: 0.47
Nodes (6): AGENTS.md Cursor Agent OS, Caveman, Coding Workflow A-F, Core Contract, Final Directive, Compress Output Not Analysis

### Community 1 - "Ponytail + Skills Policy"
Cohesion: 0.40
Nodes (5): Skill Conflict Priority, Compress Implementation Not Correctness, Ponytail, Simplicity Ladder, Graphify Skills Directory

### Community 2 - "Graphify Discovery"
Cohesion: 0.50
Nodes (4): Reduce Discovery Cost, Repository Exploration Tiers, Graphify, Graph Guides Then Verify Source

## Knowledge Gaps
- **3 isolated node(s):** `Core Contract`, `Simplicity Ladder`, `Repository Exploration Tiers`
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AGENTS.md Cursor Agent OS` connect `Agent OS + Caveman` to `Ponytail + Skills Policy`, `Graphify Discovery`, `Usage Checkpoint`?**
  _High betweenness centrality (0.495) - this node is a cross-community bridge._
- **Why does `Graphify` connect `Graphify Discovery` to `Agent OS + Caveman`?**
  _High betweenness centrality (0.352) - this node is a cross-community bridge._
- **Why does `Ponytail` connect `Ponytail + Skills Policy` to `Agent OS + Caveman`?**
  _High betweenness centrality (0.319) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Ponytail` (e.g. with `Caveman` and `Skill Conflict Priority`) actually correct?**
  _`Ponytail` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Core Contract`, `Simplicity Ladder`, `Repository Exploration Tiers` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._