import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Article {
  title: string;
  subtitle: string;
  url: string;
  body: string;
  category: string;
  subcategory: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseCSV(content: string): Article[] {
  const articles: Article[] = [];
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  const header = lines[0];
  console.log('CSV Header:', header);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const fields: string[] = [];
    let field = '';
    let inFieldQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inFieldQuotes && line[j + 1] === '"') {
          field += '"';
          j++;
        } else {
          inFieldQuotes = !inFieldQuotes;
        }
      } else if (char === ',' && !inFieldQuotes) {
        fields.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field);
    
    if (fields.length >= 7) {
      const article: Article = {
        title: fields[0] || '',
        subtitle: fields[1] || '',
        url: fields[3] || '',
        body: fields[4] || '',
        category: fields[5] || 'Uncategorized',
        subcategory: fields[6] || '',
      };
      
      if (article.title && article.body) {
        articles.push(article);
      }
    }
  }
  
  return articles;
}

function processHtmlContent(html: string, articleIndex: number): string {
  if (!html) return '';
  
  let processed = html;
  
  processed = processed.replace(/class="([^"]*)"/g, 'class="$1"');
  processed = processed.replace(/data-[a-z-]+="[^"]*"/g, '');
  
  processed = processed.replace(
    /<a\s+href="(https?:\/\/www\.planettogether\.com\/knowledge[^"]*)"([^>]*)>([^<]*)<\/a>/gi,
    (match, url, attrs, text) => {
      const articleSlug = url.split('/').pop()?.replace(/[^a-z0-9-]/gi, '-') || '';
      return `<a href="#${articleSlug}" class="internal-link">${text}</a>`;
    }
  );
  
  return processed;
}

async function generateKnowledgeBasePDF() {
  const csvPath = path.join(process.cwd(), 'attached_assets/hubspot-knowledge-base-export-empty-2025-12-11_1765485879660.csv');
  
  console.log('Reading CSV file:', csvPath);
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  console.log(`CSV file size: ${(csvContent.length / 1024).toFixed(2)} KB`);
  
  const articles = parseCSV(csvContent);
  console.log(`Parsed ${articles.length} articles from CSV`);

  const categorizedArticles = new Map<string, Article[]>();
  
  for (const article of articles) {
    const category = article.category || 'Uncategorized';
    if (!categorizedArticles.has(category)) {
      categorizedArticles.set(category, []);
    }
    categorizedArticles.get(category)!.push(article);
  }

  let tocHtml = '';
  let contentHtml = '';
  let articleIndex = 0;

  const categories = Array.from(categorizedArticles.keys()).sort();
  console.log(`Categories found: ${categories.join(', ')}`);

  for (const category of categories) {
    const categorySlug = slugify(category);
    tocHtml += `<li class="toc-category"><a href="#cat-${categorySlug}">${escapeHtml(category)}</a><ul>`;
    
    contentHtml += `<a name="cat-${categorySlug}"></a><h2 class="category-header">${escapeHtml(category)}</h2>`;
    
    const categoryArticles = categorizedArticles.get(category)!;
    
    categoryArticles.sort((a, b) => a.title.localeCompare(b.title));
    
    for (const article of categoryArticles) {
      articleIndex++;
      const articleSlug = slugify(article.title);
      
      tocHtml += `<li class="toc-article"><a href="#${articleSlug}">${escapeHtml(article.title)}</a></li>`;
      
      const processedBody = processHtmlContent(article.body, articleIndex);
      
      contentHtml += `
        <a name="${articleSlug}"></a>
        <section class="article">
          <h3 class="article-title">${escapeHtml(article.title)}</h3>
          ${article.subtitle ? `<p class="article-subtitle">${escapeHtml(article.subtitle)}</p>` : ''}
          ${article.url ? `<p class="source-url"><a href="${escapeHtml(article.url)}" target="_blank">View Online</a></p>` : ''}
          <div class="article-content">${processedBody}</div>
        </section>
      `;
    }
    
    tocHtml += '</ul></li>';
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PlanetTogether Knowledge Base</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 25mm 15mm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 100%;
      margin: 0;
      padding: 20px;
    }
    
    h1 {
      color: #0a3d62;
      font-size: 28pt;
      text-align: center;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    
    .subtitle {
      text-align: center;
      color: #666;
      font-size: 12pt;
      margin-bottom: 30px;
    }
    
    .toc {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px 30px;
      margin-bottom: 40px;
      page-break-after: always;
    }
    
    .toc h2 {
      color: #0a3d62;
      margin-top: 0;
      font-size: 18pt;
      border-bottom: 2px solid #0a3d62;
      padding-bottom: 10px;
    }
    
    .toc ul {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }
    
    .toc-category {
      margin: 15px 0 5px 0;
    }
    
    .toc-category > a {
      font-weight: bold;
      color: #0a3d62;
      font-size: 12pt;
      text-decoration: none;
    }
    
    .toc-category > a:hover {
      text-decoration: underline;
    }
    
    .toc-category > ul {
      padding-left: 20px;
      margin-top: 5px;
    }
    
    .toc-article {
      margin: 3px 0;
    }
    
    .toc-article a {
      color: #495057;
      text-decoration: none;
      font-size: 10pt;
    }
    
    .toc-article a:hover {
      color: #0a3d62;
      text-decoration: underline;
    }
    
    .category-header {
      color: #0a3d62;
      font-size: 20pt;
      border-bottom: 3px solid #0a3d62;
      padding-bottom: 8px;
      margin-top: 40px;
      page-break-after: avoid;
    }
    
    .article {
      margin-bottom: 30px;
      padding: 15px 0;
      border-bottom: 1px solid #e9ecef;
      page-break-inside: avoid;
    }
    
    .article-title {
      color: #2c3e50;
      font-size: 14pt;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    
    .article-subtitle {
      font-size: 10pt;
      color: #666;
      font-style: italic;
      margin-bottom: 10px;
    }
    
    .source-url {
      font-size: 9pt;
      color: #6c757d;
      margin-bottom: 10px;
    }
    
    .source-url a {
      color: #0a3d62;
    }
    
    .article-content {
      font-size: 10.5pt;
      line-height: 1.6;
    }
    
    .article-content h1,
    .article-content h2,
    .article-content h3,
    .article-content h4,
    .article-content h5,
    .article-content h6 {
      color: #2c3e50;
      margin-top: 15px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    
    .article-content h1 { font-size: 14pt; }
    .article-content h2 { font-size: 13pt; }
    .article-content h3 { font-size: 12pt; }
    .article-content h4 { font-size: 11pt; }
    .article-content h5 { font-size: 10.5pt; }
    .article-content h6 { font-size: 10pt; }
    
    .article-content p {
      margin: 8px 0;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    
    .article-content li {
      margin: 4px 0;
    }
    
    .article-content a {
      color: #0a3d62;
      text-decoration: underline;
    }
    
    .article-content .internal-link {
      color: #0a3d62;
      text-decoration: none;
      border-bottom: 1px dashed #0a3d62;
    }
    
    .article-content code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 9.5pt;
    }
    
    .article-content pre {
      background: #f4f4f4;
      padding: 12px;
      border-radius: 5px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.4;
    }
    
    .article-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    .article-content th,
    .article-content td {
      border: 1px solid #dee2e6;
      padding: 8px 10px;
      text-align: left;
    }
    
    .article-content th {
      background: #f8f9fa;
      font-weight: bold;
    }
    
    .article-content img {
      max-width: 100%;
      height: auto;
    }
    
    .article-content blockquote {
      border-left: 4px solid #0a3d62;
      margin: 15px 0;
      padding: 10px 15px;
      background: #f8f9fa;
      font-style: italic;
    }
    
    .article-content strong {
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .article-content em {
      font-style: italic;
    }
    
    .article-content u {
      text-decoration: underline;
    }
    
    /* HubSpot callout styles */
    .hs-callout-type-tip,
    .hs-callout-type-note,
    .hs-callout-type-warning,
    .hs-callout-type-info {
      border-left: 4px solid #0a3d62;
      margin: 15px 0;
      padding: 10px 15px;
      background: #f0f7ff;
    }
    
    .hs-callout-type-warning {
      border-left-color: #f0ad4e;
      background: #fff8e6;
    }
    
    .hs-callout-type-tip {
      border-left-color: #5cb85c;
      background: #f0fff0;
    }
    
    .footer {
      text-align: center;
      font-size: 9pt;
      color: #6c757d;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
    }
  </style>
</head>
<body>
  <h1>PlanetTogether Knowledge Base</h1>
  <p class="subtitle">Complete Reference Guide - Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <p class="subtitle">${articles.length} Articles across ${categories.length} Categories</p>
  
  <nav class="toc">
    <h2>Table of Contents</h2>
    <ul>
      ${tocHtml}
    </ul>
  </nav>
  
  <main>
    ${contentHtml}
  </main>
  
  <footer class="footer">
    <p>PlanetTogether Knowledge Base - Generated from HubSpot KB Export</p>
    <p>Total Articles: ${articles.length} | Categories: ${categories.length}</p>
  </footer>
</body>
</html>`;

  const outputDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const htmlPath = path.join(outputDir, 'knowledge-base.html');
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  console.log(`HTML file saved: ${htmlPath}`);

  console.log('Generating PDF with wkhtmltopdf...');
  
  const pdfPath = path.join(outputDir, 'knowledge-base.pdf');
  
  try {
    execSync(`wkhtmltopdf --page-size A4 --margin-top 20mm --margin-right 15mm --margin-bottom 25mm --margin-left 15mm --enable-local-file-access --enable-internal-links --footer-center "Page [page] of [topage]" --footer-font-size 9 --header-center "PlanetTogether Knowledge Base" --header-font-size 9 --header-spacing 5 --footer-spacing 5 "${htmlPath}" "${pdfPath}"`, {
      stdio: 'inherit',
      timeout: 300000
    });
  } catch (error) {
    console.error('wkhtmltopdf error:', error);
    throw error;
  }
  
  console.log(`PDF generated successfully: ${pdfPath}`);
  
  const stats = fs.statSync(pdfPath);
  console.log(`PDF size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  return { htmlPath, pdfPath, articleCount: articles.length, categoryCount: categories.length };
}

generateKnowledgeBasePDF()
  .then(result => {
    console.log('\n=== Generation Complete ===');
    console.log(`Articles: ${result.articleCount}`);
    console.log(`Categories: ${result.categoryCount}`);
    console.log(`HTML: ${result.htmlPath}`);
    console.log(`PDF: ${result.pdfPath}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
  });
