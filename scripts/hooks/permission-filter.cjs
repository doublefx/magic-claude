#!/usr/bin/env node
/**
 * Permission Filter - Auto-approve safe operations
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PermissionRequest event.
 * Auto-approves known safe bash commands.
 */

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    // Default: don't modify behavior (let user decide)
    let decision = null;
    let reason = '';

    // Auto-approve safe bash commands
    if (toolName === 'Bash') {
      const command = toolInput.command || '';

      // Whitelist of safe command patterns
      const safePatterns = [
        // Testing
        /^(npm|yarn|pnpm|bun)\s+(test|run\s+test)/,
        /^npx\s+(jest|vitest|mocha|playwright)/,
        /^(pytest|python\s+-m\s+pytest)/,
        /^go\s+test/,
        /^cargo\s+test/,
        /^mvn\s+test/,
        /^gradle(w)?\s+test/,

        // Linting/formatting (read-only analysis)
        /^(npm|yarn|pnpm|bun)\s+run\s+(lint|format|prettier|eslint)/,
        /^npx\s+(prettier|eslint|tsc)\s+--check/,
        /^(ruff|black|flake8|mypy)\s+check/,

        // Build commands
        /^(npm|yarn|pnpm|bun)\s+run\s+build/,
        /^npx\s+tsc/,
        /^mvn\s+(compile|package)/,
        /^gradle(w)?\s+(build|assemble)/,
        /^cargo\s+build/,
        /^go\s+build/,

        // Git read operations
        /^git\s+(status|log|diff|branch|show|blame)/,
        /^git\s+rev-parse/,

        // Package info
        /^(npm|yarn|pnpm)\s+(list|ls|outdated|audit)/,

        // Safe system info
        /^(which|whereis|type)\s+/,
        /^(node|npm|yarn|pnpm|python|java|go|cargo|rustc)\s+(-v|--version)/
      ];

      for (const pattern of safePatterns) {
        if (pattern.test(command)) {
          decision = { behavior: 'allow' };
          reason = `Auto-approved safe command: ${command.substring(0, 50)}...`;
          break;
        }
      }
    }

    // Build output
    const output = { ...input };

    if (decision) {
      output.hookSpecificOutput = {
        hookEventName: 'PermissionRequest',
        decision: decision,
        additionalContext: reason
      };
    }

    console.log(JSON.stringify(output));
  } catch (error) {
    console.error(`[PermissionFilter] Error: ${error.message}`);
    // Pass through on error
    console.log(data);
  }
});
