---
name: serena-code-navigation
description: Serena MCP code navigation tool mapping. Prefer Serena semantic tools over native Grep/Glob when Serena is installed.
user-invocable: false
---

# Serena Code Navigation

> **Guard clause**: This skill only applies when Serena MCP is available (`SERENA_INSTALLED=true`). If Serena is not installed, ignore this entire skill and use native tools normally.

## Tool Mapping

When Serena is available, prefer these semantic tools over native equivalents:

| Task | Native Tool | Serena Alternative | When to Prefer Serena |
|------|------------|-------------------|----------------------|
| Find symbol definition | Grep `class Foo` | `find_symbol` (name_path=`Foo`) | Always for known symbol names |
| Find references to symbol | Grep for usages | `find_referencing_symbols` | Always for tracking callers/dependents |
| Get file structure overview | Read entire file | `get_symbols_overview` | When you need class/function listing without reading bodies |
| Find symbol with body | Read + scroll to function | `find_symbol` (include_body=true) | When you need specific method implementation |
| Text pattern search | Grep | `search_for_pattern` | For regex/text patterns across codebase |
| Find file by name | Glob | `find_file` | For locating files by name pattern |
| List directory contents | Bash `ls` | `list_dir` | For directory exploration |
| Type hierarchy | Grep for extends/implements | `type_hierarchy` | Always for inheritance chains |

### Keep Using Native Tools For

- **Glob**: Complex file path patterns (e.g., `**/*.test.ts`) - Glob is more flexible
- **Read**: Reading non-code files (configs, docs, JSON) - Serena is code-focused
- **Read**: When you already know the exact file and line range
- **Grep**: Simple text search in non-code files

## JetBrains vs Non-JetBrains Tools

Some Serena tools require JetBrains IDE connection (`SERENA_JETBRAINS_AVAILABLE=true`):

**Always available (LSP backend):**
- `search_for_pattern` - Text/regex pattern search
- `find_file` - File name search
- `list_dir` - Directory listing

**Require JetBrains for best results:**
- `jet_brains_find_symbol` - Symbol definition lookup
- `jet_brains_find_referencing_symbols` - Reference tracking
- `jet_brains_get_symbols_overview` - File symbol overview
- `jet_brains_type_hierarchy` - Inheritance chains

When JetBrains is not available, fall back to `search_for_pattern` + native tools.

## Decision Tree

```
Need to understand code?
  |
  +-- Know the symbol name?
  |     +-- YES --> find_symbol (name_path, include_body=true/false)
  |     +-- NO  --> get_symbols_overview (file) or search_for_pattern
  |
  +-- Need to find who calls/uses a symbol?
  |     +-- YES --> find_referencing_symbols
  |
  +-- Need inheritance/type info?
  |     +-- YES --> type_hierarchy (JetBrains required)
  |
  +-- Need to find a file?
  |     +-- By name --> find_file
  |     +-- By glob pattern --> use native Glob
  |
  +-- Need text search across files?
        +-- Code pattern --> search_for_pattern
        +-- Non-code files --> use native Grep
```

## Fallback

If any Serena tool call fails (timeout, not connected, server error), immediately fall back to native tools (Grep, Glob, Read). Do not retry Serena tools more than once per failure type in a session.
