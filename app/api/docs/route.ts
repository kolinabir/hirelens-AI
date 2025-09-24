import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Swagger UI Documentation
 *     description: Interactive Swagger UI for the HireLens API documentation
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HireLens API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" crossorigin="anonymous" />
  <link rel="icon" type="image/png" href="/hirelensLogo.png" sizes="32x32" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self';">
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #2563eb;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
    .swagger-ui .info .title {
      color: #2563eb;
    }
    .custom-header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 20px;
      text-align: center;
      margin-bottom: 0;
    }
    .custom-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: bold;
    }
    .custom-header p {
      margin: 8px 0 0 0;
      opacity: 0.9;
    }
    .logo {
      width: 32px;
      height: 32px;
      display: inline-block;
      vertical-align: middle;
      margin-right: 12px;
      background: white;
      border-radius: 6px;
      padding: 4px;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>
      <img src="/hirelensLogo.png" alt="HireLens" class="logo" />
      HireLens API Documentation
    </h1>
    <p>AI-Powered Job Discovery Platform - Complete API Reference</p>
  </div>

  <div id="swagger-ui">
    <div style="padding: 60px 20px; text-align: center; color: #666;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
      <h3 style="margin: 0 0 10px 0; color: #2563eb;">Loading HireLens API Documentation...</h3>
      <p style="margin: 0; font-size: 14px;">Please wait while we load the interactive documentation.</p>
    </div>
  </div>

  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>

  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
  <script>
    // Add error handling and fallback
    function initSwagger() {
      try {
        if (typeof SwaggerUIBundle === 'undefined') {
          document.getElementById('swagger-ui').innerHTML =
            '<div style="padding: 40px; text-align: center; color: #666;">' +
            '<h3>Loading API Documentation...</h3>' +
            '<p>If this message persists, please try refreshing the page.</p>' +
            '<p><a href="/api/docs/spec" style="color: #2563eb;">View Raw API Specification</a> | ' +
            '<a href="/api/docs/simple" style="color: #2563eb;">Simple Documentation View</a></p>' +
            '</div>';
          return;
        }

        const ui = SwaggerUIBundle({
          url: window.location.origin + '/api/docs/spec',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          tryItOutEnabled: true,
          requestInterceptor: function(request) {
            request.headers['Content-Type'] = 'application/json';
            return request;
          },
          responseInterceptor: function(response) {
            return response;
          },
          docExpansion: 'list',
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 2,
          showExtensions: true,
          showCommonExtensions: true,
          validatorUrl: null,
          onComplete: function() {
            console.log('Swagger UI loaded successfully');
          },
          onFailure: function(error) {
            console.error('Swagger UI failed to load:', error);
            document.getElementById('swagger-ui').innerHTML =
              '<div style="padding: 40px; text-align: center; color: #dc2626;">' +
              '<h3>Failed to Load API Documentation</h3>' +
              '<p>There was an error loading the Swagger UI. Please try refreshing the page.</p>' +
              '<p><a href="/api/docs/spec" style="color: #2563eb;">View Raw API Specification</a> | ' +
              '<a href="/api/docs/simple" style="color: #2563eb;">Simple Documentation View</a></p>' +
              '</div>';
          }
        });
      } catch (error) {
        console.error('Error initializing Swagger UI:', error);
        document.getElementById('swagger-ui').innerHTML =
          '<div style="padding: 40px; text-align: center; color: #dc2626;">' +
          '<h3>Error Loading Documentation</h3>' +
          '<p>Failed to initialize Swagger UI. Please check your internet connection and try again.</p>' +
          '<p><a href="/api/docs/spec" style="color: #2563eb;">View Raw API Specification</a> | ' +
          '<a href="/api/docs/simple" style="color: #2563eb;">Simple Documentation View</a></p>' +
          '</div>';
      }
    }

    // Multiple initialization attempts
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSwagger);
    } else {
      initSwagger();
    }

    // Fallback initialization
    window.onload = function() {
      setTimeout(initSwagger, 1000);
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
    },
  });
}
