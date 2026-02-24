# Serena Tool Preference

When `SERENA_INSTALLED=true`, prefer Serena MCP tools for code navigation over native equivalents. Serena tools return only the symbols and relationships you need, greatly reducing token usage compared to reading entire files or grepping across the codebase.

| Task | Instead of | Use |
|------|-----------|-----|
| Symbol lookup | `Grep "class Foo"` | `find_symbol` or `jet_brains_find_symbol` |
| Reference tracking | `Grep` for usages | `find_referencing_symbols` or `jet_brains_find_referencing_symbols` |
| File structure | `Read` entire file | `get_symbols_overview` or `jet_brains_get_symbols_overview` |
| Pattern search | `Grep` | `search_for_pattern` |
| Find file | `Glob` | `find_file` |

**Keep using native tools for:** non-code files, complex glob patterns, known file+line reads.

**Fallback:** If Serena tools fail, immediately use native tools. Do not block on Serena errors.
