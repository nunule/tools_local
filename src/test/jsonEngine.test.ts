import { describe, it, expect } from 'vitest';
import {
  formatJson,
  minifyJson,
  safeRepairJson,
  escapeJsonString,
  unescapeJsonString,
  chineseToUnicode,
  unicodeToChinese,
  sortObjectKeys,
  protectBigNumbers,
  extractJsonError,
} from '@/utils/jsonEngine';

describe('JSON Engine - Tier 1 & Tier 2 Capabilities', () => {
  describe('Tier 1: Lossless BigInt & Multi-Indent Formatting', () => {
    it('preserves 18+ digit BigInt numbers without precision loss', () => {
      const input = `{
  "snowflakeId": 18294719284719284719,
  "negativeBig": -9007199254740993000,
  "str": "18294719284719284719",
  "list": [18294719284719284719, 9007199254740992001]
}`;
      const result = formatJson(input, { indent: 2 });
      expect(result.success).toBe(true);
      expect(result.output).toContain('"snowflakeId": 18294719284719284719');
      expect(result.output).toContain('"negativeBig": -9007199254740993000');
      expect(result.output).toContain('"str": "18294719284719284719"');
      expect(result.output).toContain('18294719284719284719');
      expect(result.output).toContain('9007199254740992001');
    });

    it('preserves quotes when a BigInt number is used as an object key', () => {
      const input = '{ 18294719284719284719: "val", 9007199254740993000: 18294719284719284719 }';
      const result = formatJson(input, { indent: 2, autoRepair: true });
      expect(result.success).toBe(true);
      // Key must remain a quoted string in JSON
      expect(result.output).toContain('"18294719284719284719": "val"');
      // Value must remain an unquoted BigInt
      expect(result.output).toContain('"9007199254740993000": 18294719284719284719');
      // Parsed JSON must be valid
      expect(() => JSON.parse(result.output.replace(/:\s*18294719284719284719/g, ': 0'))).not.toThrow();
    });

    it('formats with 2 spaces, 4 spaces, and Tab indents', () => {
      const input = '{"a":1,"b":{"c":2}}';

      const res2 = formatJson(input, { indent: 2 });
      expect(res2.output).toBe('{\n  "a": 1,\n  "b": {\n    "c": 2\n  }\n}');

      const res4 = formatJson(input, { indent: 4 });
      expect(res4.output).toBe('{\n    "a": 1,\n    "b": {\n        "c": 2\n    }\n}');

      const resTab = formatJson(input, { indent: '\t' });
      expect(resTab.output).toBe('{\n\t"a": 1,\n\t"b": {\n\t\t"c": 2\n\t}\n}');
    });

    it('minifies JSON and calculates compression ratio accurately without negative ratios', () => {
      const input = `{
  "name": "tools-local",
  "id": 18294719284719284719,
  "enabled": true
}`;
      const minified = minifyJson(input);
      expect(minified.success).toBe(true);
      expect(minified.output).toBe('{"name":"tools-local","id":18294719284719284719,"enabled":true}');
      expect(minified.originalBytes).toBeGreaterThan(minified.minifiedBytes);
      expect(minified.compressionRatio).toBeGreaterThan(0);

      // Testing already minified small input: ratio should never be negative
      const alreadyMinified = minifyJson('{"a":1}');
      expect(alreadyMinified.compressionRatio).toBeGreaterThanOrEqual(0);
    });

    it('detects syntax errors with accurate line and column numbers even with leading newlines', () => {
      const malformedWithLeadingLines = '\n\n{\n  "name": "test",\n  "age": \n}';
      const result = formatJson(malformedWithLeadingLines, { autoRepair: false });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Leading newlines must not shift line number into wrong offset
      expect(result.error?.line).toBe(6);
      expect(result.error?.snippet).toContain('^');
    });
  });

  describe('Tier 2: FSM Fault-Tolerant Repair', () => {
    it('strips line comments and block comments cleanly while preserving line breaks', () => {
      const commented = `// Root comment
{
  /* Header comment */
  "name": "tools local", // trailing comment
  "version": 1.0 /* inline comment */
}`;
      const repaired = safeRepairJson(commented);
      expect(repaired.repaired).toBe(true);
      const res = formatJson(repaired.output);
      expect(res.success).toBe(true);
      expect(res.output).toContain('"name": "tools local"');
      expect(res.output).toContain('"version": 1');
      expect(res.output).not.toContain('//');
      expect(res.output).not.toContain('/*');
    });

    it('removes trailing commas in objects and arrays while preserving layout whitespace', () => {
      const withTrailingCommas = `[
  1,
  2,
]`;
      const repaired = safeRepairJson(withTrailingCommas);
      expect(repaired.repaired).toBe(true);
      // The comma after 1 should remain on line with 1, not be shifted before 2
      expect(repaired.output).toContain('1,\n  2');
      expect(repaired.output).not.toContain('2,');
    });

    it('fixes unquoted Chinese keys, identifiers, and reserved words', () => {
      const looseObject = `{
  姓名: '张三',
  状态码: 200,
  true: 'boolean key',
  null: 'null key',
  default: 42,
  user_id: 1001,
}`;
      const repaired = safeRepairJson(looseObject);
      expect(repaired.repaired).toBe(true);
      const res = formatJson(repaired.output);
      expect(res.success).toBe(true);
      expect(res.output).toContain('"姓名": "张三"');
      expect(res.output).toContain('"状态码": 200');
      expect(res.output).toContain('"true": "boolean key"');
      expect(res.output).toContain('"null": "null key"');
      expect(res.output).toContain('"default": 42');
      expect(res.output).toContain('"user_id": 1001');
    });

    it('repairs JS console BigInt suffix n, hex numbers, and non-standard primitives', () => {
      const consoleOutput = `{
  big: 18294719284719284719n,
  hex: 0x1f,
  undef: undefined,
  nanVal: NaN,
  inf: Infinity,
  negInf: -Infinity,
  positiveNum: +42,
}`;
      const repaired = safeRepairJson(consoleOutput);
      expect(repaired.repaired).toBe(true);
      const res = formatJson(repaired.output);
      expect(res.success).toBe(true);
      expect(res.output).toContain('"big": 18294719284719284719');
      expect(res.output).toContain('"hex": 31');
      expect(res.output).toContain('"undef": null');
      expect(res.output).toContain('"nanVal": null');
      expect(res.output).toContain('"inf": null');
      expect(res.output).toContain('"negInf": null');
      expect(res.output).toContain('"positiveNum": 42');
    });
  });

  describe('Tier 2: String Escape & Unescape (Single-Pass Safe)', () => {
    it('escapes and unescapes strings correctly without sequential backslash corruption', () => {
      // Path containing backslashes before characters 'n' and 't'
      const raw = '{\n  "path": "C:\\\\notes\\\\text\\\\file.txt",\n  "regex": "\\\\d+" \n}';
      const escaped = escapeJsonString(raw);

      const unescaped = unescapeJsonString(escaped);
      expect(unescaped).toBe(raw);
    });

    it('unescapes outer-quoted strings directly', () => {
      const quoted = '"{\\"id\\":18294719284719284719,\\"name\\":\\"test\\"}"';
      const unescaped = unescapeJsonString(quoted);
      expect(unescaped).toContain('"id":18294719284719284719');
      const formatted = formatJson(unescaped);
      expect(formatted.success).toBe(true);
    });
  });

  describe('Tier 2: Unicode & Chinese Conversion', () => {
    it('converts Chinese to Unicode escapes and back', () => {
      const chineseJson = '{"title": "纯本地离线工具", "author": "张三"}';
      const unicodeJson = chineseToUnicode(chineseJson);
      expect(unicodeJson).toContain('\\u7eaf\\u672c\\u5730\\u79bb\\u7ebf\\u5de5\\u5177');
      expect(unicodeJson).not.toContain('纯本地');

      const restored = unicodeToChinese(unicodeJson);
      expect(restored).toBe(chineseJson);
    });

    it('supports surrogate pair emojis and protects JSON structural quotes', () => {
      const emojiJson = '{"emoji": "😀🎉", "quote": "\\u0022Hello\\u0022"}';
      const escaped = chineseToUnicode(emojiJson);
      // Emojis should be represented with surrogate pairs
      expect(escaped).toContain('\\ud83d\\ude00');

      const decoded = unicodeToChinese(escaped);
      // Emoji decoded back
      expect(decoded).toContain('😀🎉');
      // Critical: \u0022 must NOT be unescaped into bare unescaped quote that breaks JSON
      expect(decoded).toContain('\\u0022Hello\\u0022');
    });
  });

  describe('Tier 2: Recursive Key Sorting (A-Z) with BigInt Preservation', () => {
    it('recursively sorts object keys alphabetically while maintaining array order and BigInts', () => {
      const input = `{
  "zeta": 1,
  "alpha": {
    "c": 3,
    "a": 18294719284719284719,
    "b": 2
  },
  "beta": [3, 1, 2]
}`;
      const result = formatJson(input, { sortKeys: true });
      expect(result.success).toBe(true);
      const lines = result.output.split('\n');
      const alphaIdx = lines.findIndex((l) => l.includes('"alpha"'));
      const betaIdx = lines.findIndex((l) => l.includes('"beta"'));
      const zetaIdx = lines.findIndex((l) => l.includes('"zeta"'));

      expect(alphaIdx).toBeLessThan(betaIdx);
      expect(betaIdx).toBeLessThan(zetaIdx);

      // Verify nested keys sorted
      const aIdx = lines.findIndex((l) => l.includes('"a": 18294719284719284719'));
      const bIdx = lines.findIndex((l) => l.includes('"b": 2'));
      const cIdx = lines.findIndex((l) => l.includes('"c": 3'));
      expect(aIdx).toBeLessThan(bIdx);
      expect(bIdx).toBeLessThan(cIdx);

      // Verify BigInt value maintained
      expect(result.output).toContain('"a": 18294719284719284719');
      // Verify array order unchanged
      expect(result.output).toContain('3,\n');
    });
  });
});
