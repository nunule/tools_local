/**
 * Ultra-fast, lossless JSON engine with finite-state machine (FSM) fault tolerance,
 * BigInt (>18 digits) precision preservation, comment stripping, and telemetry.
 */

export interface JsonParseError {
  message: string;
  line: number;
  column: number;
  position: number;
  snippet?: string;
}

export type IndentType = 2 | 4 | '\t';

export interface FormatResult {
  success: boolean;
  output: string;
  error?: JsonParseError;
  durationMs: number;
  isRepaired?: boolean;
}

export interface MinifyResult {
  success: boolean;
  output: string;
  error?: JsonParseError;
  durationMs: number;
  originalBytes: number;
  minifiedBytes: number;
  compressionRatio: number; // percentage saved, e.g. 52.4%
  isRepaired?: boolean;
}

export interface RepairResult {
  output: string;
  repaired: boolean;
  changesCount: number;
}

/**
 * Calculates byte size of a UTF-8 string accurately and efficiently.
 */
export function getUtf8ByteSize(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return new Blob([str]).size;
}

/**
 * Parses error position and line/column from standard JSON.parse exceptions against raw input.
 */
export function extractJsonError(text: string, err: any): JsonParseError {
  const message = err?.message || 'Syntax error in JSON';
  let position = -1;

  // 1. Look for 'at position X'
  const posMatch = message.match(/at position (\d+)/i);
  if (posMatch) {
    position = parseInt(posMatch[1], 10);
  }

  // 2. Look for 'line X column Y' in error message
  const lineColMatch = message.match(/line (\d+) column (\d+)/i);
  let line = 1;
  let column = 1;

  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
    if (position === -1) {
      // derive approximate position from line/col
      const lines = text.split('\n');
      position = 0;
      for (let i = 0; i < line - 1 && i < lines.length; i++) {
        position += lines[i].length + 1;
      }
      position += column - 1;
    }
  } else if (position >= 0 && position <= text.length) {
    // Calculate line and col from position
    const textBefore = text.slice(0, position);
    const lines = textBefore.split('\n');
    line = lines.length;
    column = lines[lines.length - 1].length + 1;
  } else {
    // Fallback if position is out of bounds or not provided
    line = 1;
    column = 1;
    position = 0;
  }

  // Generate code snippet around error line
  const allLines = text.split('\n');
  let snippet = '';
  if (line >= 1 && line <= allLines.length) {
    const errorLineContent = allLines[line - 1];
    const prevLine = line > 1 ? `${(line - 1).toString().padStart(4, ' ')} | ${allLines[line - 2]}\n` : '';
    const currLine = `${line.toString().padStart(4, ' ')} | ${errorLineContent}\n`;
    const pointer = `       ${' '.repeat(Math.max(0, column - 1))}^\n`;
    const nextLine = line < allLines.length ? `${(line + 1).toString().padStart(4, ' ')} | ${allLines[line]}\n` : '';
    snippet = `${prevLine}${currLine}${pointer}${nextLine}`;
  }

  return {
    message,
    line,
    column,
    position,
    snippet,
  };
}

/**
 * Streaming Finite-State Machine (FSM) to safely repair malformed JSON / JS objects:
 * - Strips single-line comments (// ...)
 * - Strips multi-line comments (/* ... * /) while preserving newline structure
 * - Safely strips trailing commas before '}' and ']' without displacing preceding whitespace
 * - Normalizes single-quoted strings & template strings to double-quoted JSON strings
 * - Escapes raw newlines and tabs inside strings
 * - Quotes unquoted object keys (supporting ASCII, Chinese/Unicode, numbers, and keywords before ':')
 * - Strips BigInt literal 'n' suffix (e.g. 18294719284719284719n -> 18294719284719284719)
 * - Converts non-standard JS console primitives: undefined -> null, NaN -> null, Infinity -> null
 * - Converts hex literals (0x1f -> 31)
 * - Collapses consecutive invalid commas (e.g. [1,,2] -> [1,2])
 */
export function safeRepairJson(rawInput: string): RepairResult {
  let output = '';
  let i = 0;
  const len = rawInput.length;
  let changesCount = 0;
  let pendingComma = false;
  let pendingWhitespace = '';

  while (i < len) {
    const char = rawInput[i];

    // Whitespace handling: buffer whitespace if a comma is pending
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      if (pendingComma) {
        pendingWhitespace += char;
      } else {
        output += char;
      }
      i++;
      continue;
    }

    // 1. Line comment: // ...
    if (char === '/' && i + 1 < len && rawInput[i + 1] === '/') {
      changesCount++;
      i += 2;
      while (i < len && rawInput[i] !== '\n' && rawInput[i] !== '\r') {
        i++;
      }
      continue;
    }

    // 2. Block comment: /* ... */
    if (char === '/' && i + 1 < len && rawInput[i + 1] === '*') {
      changesCount++;
      i += 2;
      while (i + 1 < len && !(rawInput[i] === '*' && rawInput[i + 1] === '/')) {
        if (rawInput[i] === '\n') {
          if (pendingComma) {
            pendingWhitespace += '\n';
          } else {
            output += '\n'; // preserve line numbering
          }
        }
        i++;
      }
      i += 2; // skip */
      continue;
    }

    // 3. Comma handling
    if (char === ',') {
      if (pendingComma) {
        // Redundant consecutive comma: discard
        changesCount++;
      } else {
        pendingComma = true;
        pendingWhitespace = '';
      }
      i++;
      continue;
    }

    // If we have a pending comma and we see a closing brace/bracket:
    if (pendingComma) {
      if (char === '}' || char === ']') {
        // Trailing comma before closing brace or bracket! Safely discard!
        changesCount++;
        pendingComma = false;
        output += pendingWhitespace; // emit the indentation before closing delimiter
        pendingWhitespace = '';
      } else {
        // Legitimate comma followed by next item
        output += ',' + pendingWhitespace;
        pendingComma = false;
        pendingWhitespace = '';
      }
    }

    // 4. Double-quoted string: copy intact, escaping unescaped newlines/tabs
    if (char === '"') {
      output += char;
      i++;
      while (i < len) {
        const c = rawInput[i];
        if (c === '\\') {
          output += c;
          i++;
          if (i < len) {
            output += rawInput[i];
          }
        } else if (c === '"') {
          output += c;
          break;
        } else if (c === '\n') {
          // Unescaped newline in JSON string -> escape it
          output += '\\n';
          changesCount++;
        } else if (c === '\r') {
          output += '\\r';
          changesCount++;
        } else if (c === '\t') {
          output += '\\t';
          changesCount++;
        } else {
          output += c;
        }
        i++;
      }
      i++;
      continue;
    }

    // 5. Single-quoted string or backtick string: convert to double-quoted JSON string
    if (char === "'" || char === '`') {
      const quoteChar = char;
      changesCount++;
      output += '"';
      i++;
      while (i < len) {
        const c = rawInput[i];
        if (c === '\\') {
          i++;
          if (i < len) {
            const nextC = rawInput[i];
            if (nextC === quoteChar) {
              output += quoteChar;
            } else if (nextC === '"') {
              output += '\\"';
            } else {
              output += '\\' + nextC;
            }
          }
        } else if (c === '"') {
          output += '\\"'; // escape double quotes inside
        } else if (c === quoteChar) {
          output += '"';
          break;
        } else if (c === '\n') {
          output += '\\n';
        } else if (c === '\r') {
          output += '\\r';
        } else if (c === '\t') {
          output += '\\t';
        } else {
          output += c;
        }
        i++;
      }
      i++;
      continue;
    }

    // 6. Hexadecimal numbers: 0x...
    if (char === '0' && i + 1 < len && (rawInput[i + 1] === 'x' || rawInput[i + 1] === 'X')) {
      let j = i + 2;
      while (j < len && /[0-9a-fA-F]/.test(rawInput[j])) {
        j++;
      }
      const hexStr = rawInput.slice(i, j);
      try {
        const decVal = BigInt(hexStr).toString();
        output += decVal;
        changesCount++;
        i = j;
        continue;
      } catch {
        // fallback
      }
    }

    // 7. Positive number with leading '+': e.g. +123 -> 123
    if (char === '+' && i + 1 < len && /[0-9]/.test(rawInput[i + 1])) {
      changesCount++;
      i++; // skip '+'
      continue;
    }

    // 8. Negative or positive Infinity: -Infinity / +Infinity -> null
    if ((char === '-' || char === '+') && rawInput.slice(i + 1).startsWith('Infinity')) {
      changesCount++;
      output += 'null';
      i += 1 + 'Infinity'.length;
      continue;
    }

    // 9. Numbers with BigInt 'n' suffix or numeric object keys (including negative numbers)
    if ((char >= '0' && char <= '9') || (char === '-' && i + 1 < len && rawInput[i + 1] >= '0' && rawInput[i + 1] <= '9')) {
      let numStr = char;
      let j = i + 1;
      while (j < len && (/[0-9.eE+-]/.test(rawInput[j]))) {
        numStr += rawInput[j];
        j++;
      }
      if (j < len && rawInput[j] === 'n') {
        // Strip BigInt 'n' suffix
        changesCount++;
        j++;
      }

      // Check if followed by colon (i.e. numeric key like { 1001: "val" })
      let peek = j;
      while (peek < len && (rawInput[peek] === ' ' || rawInput[peek] === '\t' || rawInput[peek] === '\n' || rawInput[peek] === '\r')) {
        peek++;
      }
      if (peek < len && rawInput[peek] === ':') {
        changesCount++;
        output += `"${numStr}"`;
        i = j;
        continue;
      }

      output += numStr;
      i = j;
      continue;
    }

    // 9. Identifiers / Unquoted keys / non-standard keywords
    // Supports ASCII letters, _, $, unicode letters (e.g. Chinese characters)
    if (/[a-zA-Z_$\u00A0-\uFFFF]/.test(char)) {
      let ident = char;
      let j = i + 1;
      while (j < len && /[a-zA-Z0-9_$\-\u00A0-\uFFFF]/.test(rawInput[j])) {
        ident += rawInput[j];
        j++;
      }

      // Lookahead to see if followed by colon ':' -> this is a KEY!
      let peek = j;
      while (peek < len && (rawInput[peek] === ' ' || rawInput[peek] === '\t' || rawInput[peek] === '\n' || rawInput[peek] === '\r')) {
        peek++;
      }

      if (peek < len && rawInput[peek] === ':') {
        // It is an unquoted key! Always wrap in double quotes!
        changesCount++;
        output += `"${ident}"`;
        i = j;
        continue;
      }

      // In VALUE position: check standard JSON literals
      if (ident === 'true' || ident === 'false' || ident === 'null') {
        output += ident;
        i = j;
        continue;
      }

      // In VALUE position: non-standard JS console primitives -> convert to null
      if (ident === 'undefined' || ident === 'NaN' || ident === 'Infinity' || ident === '+Infinity' || ident === '-Infinity') {
        changesCount++;
        output += 'null';
        i = j;
        continue;
      }

      // Otherwise, unquoted string value in relaxed JS object: wrap in quotes
      changesCount++;
      output += `"${ident}"`;
      i = j;
      continue;
    }

    output += char;
    i++;
  }

  // If input ended with a pending comma, discard it
  if (pendingComma) {
    changesCount++;
  } else if (pendingWhitespace) {
    output += pendingWhitespace;
  }

  return {
    output,
    repaired: changesCount > 0,
    changesCount,
  };
}

/**
 * Preprocesses JSON text to protect large integers (>15 digits or beyond MAX_SAFE_INTEGER)
 * from precision degradation in standard JavaScript JSON.parse.
 * Preserves whether the number was a property key or value during restoration.
 */
export function protectBigNumbers(jsonText: string): { processed: string; restore: (formattedText: string) => string } {
  const tokenMap = new Map<string, string>();
  let counter = 0;
  const nonce = `__TL_BN_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_`;

  let output = '';
  let i = 0;
  const len = jsonText.length;

  while (i < len) {
    const char = jsonText[i];

    // Double-quoted strings: preserve verbatim
    if (char === '"') {
      output += char;
      i++;
      while (i < len) {
        const c = jsonText[i];
        output += c;
        if (c === '\\') {
          i++;
          if (i < len) output += jsonText[i];
        } else if (c === '"') {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // Number literal outside strings
    if ((char >= '0' && char <= '9') || (char === '-' && i + 1 < len && jsonText[i + 1] >= '0' && jsonText[i + 1] <= '9')) {
      let numStr = char;
      i++;
      while (i < len) {
        const c = jsonText[i];
        if ((c >= '0' && c <= '9') || c === '.' || c === 'e' || c === 'E' || ((c === '+' || c === '-') && (numStr.endsWith('e') || numStr.endsWith('E')))) {
          numStr += c;
          i++;
        } else {
          break;
        }
      }

      // Check if it qualifies as a BigInt/large precision number (>15 digits or safe integer overflow)
      const digitsOnly = numStr.replace(/[^0-9]/g, '');
      const isLargeInteger = !numStr.includes('.') && !numStr.toLowerCase().includes('e');
      let isBig = digitsOnly.length >= 16;

      if (!isBig && isLargeInteger && digitsOnly.length >= 15) {
        try {
          const val = BigInt(numStr);
          if (val > BigInt(Number.MAX_SAFE_INTEGER) || val < BigInt(Number.MIN_SAFE_INTEGER)) {
            isBig = true;
          }
        } catch {
          // ignore
        }
      }

      if (isBig) {
        const token = `${nonce}${counter++}__`;
        tokenMap.set(token, numStr);
        output += `"${token}"`;
      } else {
        output += numStr;
      }
      continue;
    }

    output += char;
    i++;
  }

  const restore = (formattedText: string): string => {
    if (tokenMap.size === 0) return formattedText;
    // Match token inside quotes, checking if it is an object key (followed by optional spaces and colon)
    const tokenRegex = new RegExp(`"(${nonce}\\d+__)"(\\s*)?:?`, 'g');
    return formattedText.replace(tokenRegex, (match, token, space) => {
      const rawNum = tokenMap.get(token);
      if (!rawNum) return match;
      if (match.endsWith(':')) {
        // It was an object key: in JSON, keys MUST remain quoted strings!
        return `"${rawNum}"${space || ''}:`;
      }
      // It was an object or array value: restore as raw unquoted number
      return rawNum;
    });
  };

  return { processed: output, restore };
}

/**
 * Recursively sorts the keys of an object in alphabetical (A-Z) order.
 * Arrays retain their element order.
 */
export function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    for (const key of keys) {
      sorted[key] = sortObjectKeys(obj[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Lossless JSON Beautifier:
 * - Indent specification: 2 spaces, 4 spaces, Tab ('\t')
 * - Complete preservation of >18 digit BigInt numbers
 * - Auto-repair via streaming FSM if repair is enabled or if initial parse fails
 * - Optional recursive key sorting (A-Z)
 */
export function formatJson(
  input: string,
  options: {
    indent?: IndentType;
    sortKeys?: boolean;
    autoRepair?: boolean;
  } = {}
): FormatResult {
  const startTime = performance.now();
  if (!input || !input.trim()) {
    return {
      success: true,
      output: '',
      durationMs: 0,
    };
  }

  const indent = options.indent ?? 2;
  const sortKeys = options.sortKeys ?? false;
  let textToParse = input;
  let isRepaired = false;

  // Try direct parse with BigInt protection first
  let protectedRes = protectBigNumbers(textToParse);
  let parsedData: any;
  let parseErr: any = null;

  try {
    parsedData = JSON.parse(protectedRes.processed);
  } catch (err: any) {
    parseErr = err;
  }

  // If direct parse failed and autoRepair is enabled (or fallback repair)
  if (parseErr && options.autoRepair !== false) {
    const repairRes = safeRepairJson(input);
    if (repairRes.repaired) {
      isRepaired = true;
      textToParse = repairRes.output;
      protectedRes = protectBigNumbers(textToParse);
      try {
        parsedData = JSON.parse(protectedRes.processed);
        parseErr = null;
      } catch (secondErr: any) {
        parseErr = secondErr;
      }
    }
  }

  if (parseErr) {
    const error = extractJsonError(input, parseErr);
    return {
      success: false,
      output: input,
      error,
      durationMs: Number((performance.now() - startTime).toFixed(2)),
      isRepaired,
    };
  }

  if (sortKeys) {
    parsedData = sortObjectKeys(parsedData);
  }

  const stringified = JSON.stringify(parsedData, null, indent);
  const finalOutput = protectedRes.restore(stringified);
  const durationMs = Number((performance.now() - startTime).toFixed(2));

  return {
    success: true,
    output: finalOutput,
    durationMs,
    isRepaired,
  };
}

/**
 * Lossless JSON Minifier:
 * - Strips all unnecessary whitespace outside strings
 * - Preserves BigInt numbers without precision loss
 * - Calculates compression ratio and byte metrics
 */
export function minifyJson(
  input: string,
  options: { autoRepair?: boolean } = {}
): MinifyResult {
  const startTime = performance.now();
  if (!input || !input.trim()) {
    return {
      success: true,
      output: '',
      durationMs: 0,
      originalBytes: 0,
      minifiedBytes: 0,
      compressionRatio: 0,
    };
  }

  const originalBytes = getUtf8ByteSize(input);
  let textToParse = input;
  let isRepaired = false;

  let protectedRes = protectBigNumbers(textToParse);
  let parsedData: any;
  let parseErr: any = null;

  try {
    parsedData = JSON.parse(protectedRes.processed);
  } catch (err: any) {
    parseErr = err;
  }

  if (parseErr && options.autoRepair !== false) {
    const repairRes = safeRepairJson(input);
    if (repairRes.repaired) {
      isRepaired = true;
      textToParse = repairRes.output;
      protectedRes = protectBigNumbers(textToParse);
      try {
        parsedData = JSON.parse(protectedRes.processed);
        parseErr = null;
      } catch (secondErr: any) {
        parseErr = secondErr;
      }
    }
  }

  if (parseErr) {
    const error = extractJsonError(input, parseErr);
    return {
      success: false,
      output: input,
      error,
      durationMs: Number((performance.now() - startTime).toFixed(2)),
      originalBytes,
      minifiedBytes: originalBytes,
      compressionRatio: 0,
      isRepaired,
    };
  }

  const stringified = JSON.stringify(parsedData);
  const finalOutput = protectedRes.restore(stringified);
  const minifiedBytes = getUtf8ByteSize(finalOutput);
  const rawRatio = originalBytes > 0
    ? Number((((originalBytes - minifiedBytes) / originalBytes) * 100).toFixed(1))
    : 0;
  const compressionRatio = Math.max(0, rawRatio);

  const durationMs = Number((performance.now() - startTime).toFixed(2));

  return {
    success: true,
    output: finalOutput,
    durationMs,
    originalBytes,
    minifiedBytes,
    compressionRatio,
    isRepaired,
  };
}

/**
 * Escapes a JSON string for embedding into string literals in programming languages or JSON strings.
 */
export function escapeJsonString(str: string): string {
  return JSON.stringify(str).slice(1, -1);
}

/**
 * Unescapes an escaped string back to raw JSON without data corruption.
 * Uses a single-pass tokenization to avoid secondary replacement errors on escaped backslashes.
 */
export function unescapeJsonString(str: string): string {
  let s = str.trim();
  // Strip outer quotes if present and attempt direct JSON string unescaping
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try {
      return JSON.parse(s);
    } catch {
      s = s.slice(1, -1);
    }
  }

  // Single-pass escape sequence resolver
  return s.replace(/\\(["'\\/bfnrt]|u[0-9a-fA-F]{4})/g, (match, seq) => {
    switch (seq) {
      case '"': return '"';
      case "'": return "'";
      case '\\': return '\\';
      case '/': return '/';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      default:
        if (seq.startsWith('u')) {
          const hex = seq.slice(1);
          return String.fromCharCode(parseInt(hex, 16));
        }
        return match;
    }
  });
}

/**
 * Converts Chinese & non-ASCII characters to standard \uXXXX Unicode escapes.
 * Astral/supplementary plane characters (e.g. emojis) are safely converted to surrogate pairs.
 */
export function chineseToUnicode(str: string): string {
  return str.replace(/[^\x00-\x7F]/g, (char) => {
    return '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0');
  });
}

/**
 * Decodes \uXXXX Unicode escape sequences back into readable UTF-8 characters.
 * Non-ASCII and CJK characters/emojis are converted, while JSON structural delimiters
 * (such as \u0022 '"' or \u005c '\' and ASCII control characters) are protected
 * to prevent breaking JSON document structure.
 */
export function unicodeToChinese(str: string): string {
  // First pass: surrogate pairs \uD800..\uDBFF followed by \uDC00..\uDFFF (e.g. emojis, CJK Ext B+)
  const withSurrogates = str.replace(/\\u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})/g, (_, hi, lo) => {
    const high = parseInt(hi, 16);
    const low = parseInt(lo, 16);
    return String.fromCharCode(high, low);
  });

  // Second pass: single \uXXXX where code >= 0x0080 (non-ASCII characters)
  return withSurrogates.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    const code = parseInt(hex, 16);
    // Protect ASCII control characters and quotes/backslashes from prematurely ending JSON strings
    if (code < 0x0080) {
      return match;
    }
    return String.fromCharCode(code);
  });
}
