/**
 * Rich realistic sample JSON with BigInt IDs, comments, trailing commas,
 * and multi-language content to showcase Tier 1 and Tier 2 capabilities.
 */

export const DEFAULT_JSON_SAMPLE = `// API Gateway Response - Production Cluster
{
  /* Request Header & Trace Meta */
  "code": 200,
  "message": "success",
  "traceId": "trace_99a8b7c6d5e4",
  "timestamp": 1729864200000,

  "data": {
    "organization": "Tools Local Dev Group",
    "site": "https://local-tools.dev/api",
    
    // 18+ digit Snowflake IDs (Lossless BigInt Preservation)
    "transactionId": 18294719284719284719,
    "primaryAccountId": 9007199254740993000,
    "referenceOrderNo": 8839201948572019482,

    "user": {
      "name": "张三 (Alex Zhang)",
      "department": "平台架构部",
      "roles": [
        "admin",
        "infrastructure",
        "auditor",
      ], // intentional trailing comma
      "preferences": {
        "theme": "dark",
        "notifications": true,
        "backupQuotaBytes": 53687091200,
      },
    },

    "services": [
      {
        "serviceId": 1001,
        "name": "Local Image Privacy",
        "status": "HEALTHY",
        "activeConnections": 1420,
      },
      {
        "serviceId": 1002,
        "name": "Lossless JSON Engine",
        "status": "HEALTHY",
        "features": [
          "FSM Comment Stripping",
          "Trailing Comma Auto-Fix",
          "A-Z Key Sorting",
          "Unicode <-> Chinese",
          "Escape / Unescape",
        ],
      },
    ],
  },
}
`;

export const UNICODE_DEMO_SAMPLE = `{
  "title": "\\u672c\\u5730\\u79bb\\u7ebf\\u5de5\\u5177\\u7bb1",
  "slogan": "\\u96f6\\u4e0a\\u4f20\\u00b7\\u9690\\u79c1\\u5b89\\u5168",
  "status": "SUCCESS",
  "code": 0
}
`;

export const ESCAPED_DEMO_SAMPLE = `"{\\"name\\":\\"张三\\",\\"snowflakeId\\":18294719284719284719,\\"nested\\":{\\"city\\":\\"北京\\",\\"active\\":true}}"`;
