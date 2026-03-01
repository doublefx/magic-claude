#!/usr/bin/env node
/**
 * Deprecation Checker - Detect usage of deprecated functions
 *
 * Scans for @deprecated JSDoc tags and finds usages of deprecated functions.
 * Run as: node scripts/lib/deprecation-checker.cjs [directories...]
 *
 * Exit codes:
 *   0 - No deprecated usages found
 *   1 - Deprecated usages found
 */

const fs = require('fs');
const path = require('path');

// File extensions to scan
const EXTENSIONS = ['.js', '.cjs', '.mjs', '.ts', '.tsx'];

/**
 * Find all JavaScript/TypeScript files in a directory
 */
function findFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'coverage', '.git'].includes(entry.name)) {
        findFiles(fullPath, files);
      }
    } else if (entry.isFile() && EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract deprecated function names from a file
 */
function findDeprecatedFunctions(content, filePath) {
  // Skip the deprecation checker itself to avoid false positives
  if (filePath.includes('deprecation-checker')) {
    return [];
  }

  const deprecated = [];

  // Pattern: /** ... @deprecated ... */ followed by function/const/let/var name
  // Uses [\s\S] to match any character including newlines within JSDoc
  const jsdocPattern = /\/\*\*[\s\S]*?@deprecated[\s\S]*?\*\/\s*(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/g;

  let match;
  while ((match = jsdocPattern.exec(content)) !== null) {
    const name = match[1] || match[2];
    if (name) {
      // Find line number of the function declaration (after the JSDoc)
      const beforeMatch = content.substring(0, match.index + match[0].length);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length;

      deprecated.push({
        name,
        file: filePath,
        line: lineNumber
      });
    }
  }

  // Pattern: // @deprecated inline comment on line before function
  const inlineCommentPattern = /\/\/\s*@deprecated[^\n]*\n\s*(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/g;

  while ((match = inlineCommentPattern.exec(content)) !== null) {
    const name = match[1] || match[2];
    if (name) {
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 2; // +2 for comment line and function line

      deprecated.push({
        name,
        file: filePath,
        line: lineNumber
      });
    }
  }

  return deprecated;
}

/**
 * Find usages of deprecated functions
 */
function findUsages(content, filePath, deprecatedFunctions) {
  const usages = [];
  const lines = content.split('\n');

  for (const func of deprecatedFunctions) {
    // Skip if the function is defined in this file (don't flag the definition)
    const isDefinedHere = func.file === filePath;

    // Create pattern to find function calls
    // Match: funcName( or funcName, or funcName) or funcName; etc.
    const pattern = new RegExp(`\\b${func.name}\\s*\\(`, 'g');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip if this is near the definition line in the same file (within 3 lines)
      if (isDefinedHere && Math.abs(i + 1 - func.line) <= 3) {
        continue;
      }

      // Skip if this line contains the @deprecated comment (definition context)
      if (line.includes('@deprecated')) {
        continue;
      }

      // Skip comment lines
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        continue;
      }

      // Skip if this is a function definition (not a call)
      if (line.includes(`function ${func.name}`) || line.includes(`${func.name} =`)) {
        continue;
      }

      // Skip if this is a method definition in a class (line ends with { or has default params)
      const methodDefPattern = new RegExp(`^\\s*${func.name}\\s*\\([^)]*\\)\\s*\\{?\\s*$`);
      if (methodDefPattern.test(line)) {
        continue;
      }

      if (pattern.test(line)) {
        usages.push({
          deprecatedFunction: func.name,
          definedIn: func.file,
          definedLine: func.line,
          usedIn: filePath,
          usedLine: i + 1,
          lineContent: line.trim()
        });
      }

      // Reset pattern lastIndex for next line
      pattern.lastIndex = 0;
    }
  }

  return usages;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const directories = args.length > 0 ? args : ['scripts'];

  console.log('Deprecation Checker');
  console.log('===================\n');

  // Step 1: Find all files
  let allFiles = [];
  for (const dir of directories) {
    const dirPath = path.resolve(process.cwd(), dir);
    allFiles = allFiles.concat(findFiles(dirPath));
  }

  console.log(`Scanning ${allFiles.length} files in: ${directories.join(', ')}\n`);

  // Step 2: Find all deprecated functions
  const allDeprecated = [];
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const deprecated = findDeprecatedFunctions(content, file);
    allDeprecated.push(...deprecated);
  }

  if (allDeprecated.length === 0) {
    console.log('No @deprecated functions found.\n');
    console.log('To mark a function as deprecated, add a JSDoc comment:');
    console.log('  /** @deprecated Use newFunction() instead */');
    console.log('  function oldFunction() { ... }\n');
    process.exit(0);
  }

  console.log(`Found ${allDeprecated.length} deprecated function(s):\n`);
  for (const func of allDeprecated) {
    const relPath = path.relative(process.cwd(), func.file);
    console.log(`  - ${func.name} (${relPath}:${func.line})`);
  }
  console.log('');

  // Step 3: Find usages of deprecated functions
  const allUsages = [];
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const usages = findUsages(content, file, allDeprecated);
    allUsages.push(...usages);
  }

  if (allUsages.length === 0) {
    console.log('No usages of deprecated functions found.\n');
    process.exit(0);
  }

  // Step 4: Report usages
  console.log(`Found ${allUsages.length} usage(s) of deprecated functions:\n`);

  // Group by deprecated function
  const byFunction = {};
  for (const usage of allUsages) {
    if (!byFunction[usage.deprecatedFunction]) {
      byFunction[usage.deprecatedFunction] = [];
    }
    byFunction[usage.deprecatedFunction].push(usage);
  }

  for (const [funcName, usages] of Object.entries(byFunction)) {
    const def = allDeprecated.find(d => d.name === funcName);
    const defPath = path.relative(process.cwd(), def.file);

    console.log(`${funcName} (deprecated at ${defPath}:${def.line}):`);

    for (const usage of usages) {
      const usagePath = path.relative(process.cwd(), usage.usedIn);
      console.log(`  ${usagePath}:${usage.usedLine}`);
      console.log(`    ${usage.lineContent}\n`);
    }
  }

  console.log('To fix: Replace deprecated function calls with their recommended alternatives.');
  console.log('Check the @deprecated JSDoc comment for migration guidance.\n');

  process.exit(1);
}

main();
