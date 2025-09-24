import { NextResponse } from "next/server";
import { swaggerSpec } from "@/lib/swagger";

/**
 * Simple fallback documentation page
 */
export async function GET() {
  const spec = swaggerSpec as {
    paths?: Record<
      string,
      Record<string, { summary?: string; tags?: string[] }>
    >;
    info?: { version?: string; description?: string };
  };
  const paths = Object.keys(spec.paths || {});

  let endpointsHtml = "";

  paths.forEach((path) => {
    const pathObj = spec.paths?.[path];
    if (!pathObj) return;

    Object.keys(pathObj).forEach((method) => {
      const operation = pathObj[method];
      if (!operation) return;

      const tag = operation.tags?.[0] || "General";

      endpointsHtml += `
        <div class="endpoint">
          <div class="method ${method.toLowerCase()}">${method.toUpperCase()}</div>
          <div class="path">${path}</div>
          <div class="summary">${operation.summary || "No summary"}</div>
          <div class="tag">${tag}</div>
        </div>
      `;
    });
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HireLens API Documentation - Simple View</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #334155;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 2rem;
    }
    .header p {
      margin: 0.5rem 0 0 0;
      opacity: 0.9;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .info {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    .endpoints {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .endpoints h2 {
      margin: 0;
      padding: 1.5rem 2rem;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
    }
    .endpoint {
      display: flex;
      align-items: center;
      padding: 1rem 2rem;
      border-bottom: 1px solid #f1f5f9;
      gap: 1rem;
    }
    .endpoint:last-child {
      border-bottom: none;
    }
    .method {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.75rem;
      min-width: 60px;
      text-align: center;
    }
    .method.get { background: #dcfce7; color: #166534; }
    .method.post { background: #dbeafe; color: #1e40af; }
    .method.put { background: #fef3c7; color: #92400e; }
    .method.delete { background: #fecaca; color: #dc2626; }
    .path {
      font-family: 'Monaco', 'Menlo', monospace;
      font-weight: 500;
      flex: 1;
    }
    .summary {
      color: #64748b;
      flex: 2;
    }
    .tag {
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #475569;
    }
    .links {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .link {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
    }
    .link:hover {
      background: #1d4ed8;
    }
    .link.secondary {
      background: #64748b;
    }
    .link.secondary:hover {
      background: #475569;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>HireLens API Documentation</h1>
    <p>AI-Powered Job Discovery Platform - API Reference</p>
  </div>

  <div class="container">
    <div class="info">
      <h2>API Information</h2>
      <p><strong>Version:</strong> ${spec.info?.version || "2.0.0"}</p>
      <p><strong>Description:</strong> ${
        spec.info?.description || "HireLens API Documentation"
      }</p>

      <div class="links">
        <a href="/api/docs" class="link">🔄 Try Full Swagger UI</a>
        <a href="/api/docs/spec" class="link secondary">📄 View JSON Spec</a>
      </div>
    </div>

    <div class="endpoints">
      <h2>API Endpoints (${paths.length} total)</h2>
      ${endpointsHtml}
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
