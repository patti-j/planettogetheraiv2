import { db } from '../server/db';
import { knowledgeArticles } from '../shared/schema';
import { eq, asc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Article {
  id: number;
  title: string;
  content: string;
  category: string | null;
  sourceUrl: string | null;
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

function formatContentAsHtml(content: string): string {
  if (!content) return '';
  
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  return paragraphs.map(para => {
    const lines = para.split(/\n/).map(line => line.trim()).filter(line => line);
    
    if (lines.length === 1) {
      return `<p>${escapeHtml(lines[0])}</p>`;
    }
    
    const isBulletList = lines.every(line => 
      /^[-•*]\s/.test(line) || /^\d+[.)]\s/.test(line)
    );
    
    if (isBulletList) {
      const listItems = lines.map(line => {
        const cleanedLine = line.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '');
        return `<li>${escapeHtml(cleanedLine)}</li>`;
      }).join('\n');
      return `<ul>${listItems}</ul>`;
    }
    
    return `<p>${lines.map(l => escapeHtml(l)).join('<br>')}</p>`;
  }).join('\n');
}

async function generateKnowledgeBasePDF() {
  console.log('Fetching articles from database...');
  
  const articles = await db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      category: knowledgeArticles.category,
      sourceUrl: knowledgeArticles.sourceUrl,
    })
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.isActive, true))
    .orderBy(asc(knowledgeArticles.category), asc(knowledgeArticles.title));

  console.log(`Found ${articles.length} articles`);

  const categorizedArticles = new Map<string, Article[]>();
  
  for (const article of articles) {
    const category = article.category || 'Uncategorized';
    if (!categorizedArticles.has(category)) {
      categorizedArticles.set(category, []);
    }
    categorizedArticles.get(category)!.push(article as Article);
  }

  let tocHtml = '';
  let contentHtml = '';
  let articleIndex = 0;

  const categories = Array.from(categorizedArticles.keys()).sort();

  for (const category of categories) {
    const categorySlug = slugify(category);
    tocHtml += `<li class="toc-category"><a href="#cat-${categorySlug}">${escapeHtml(category)}</a><ul>`;
    
    contentHtml += `<h2 id="cat-${categorySlug}" class="category-header">${escapeHtml(category)}</h2>`;
    
    const categoryArticles = categorizedArticles.get(category)!;
    
    for (const article of categoryArticles) {
      articleIndex++;
      const articleSlug = `article-${article.id}-${slugify(article.title)}`;
      
      tocHtml += `<li class="toc-article"><a href="#${articleSlug}">${escapeHtml(article.title)}</a></li>`;
      
      contentHtml += `
        <section class="article" id="${articleSlug}">
          <h3 class="article-title">${escapeHtml(article.title)}</h3>
          ${article.sourceUrl ? `<p class="source-url"><a href="${escapeHtml(article.sourceUrl)}" target="_blank">Source</a></p>` : ''}
          <div class="article-content">${formatContentAsHtml(article.content)}</div>
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
    .article-content h4 {
      color: #2c3e50;
      margin-top: 15px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    
    .article-content h1 { font-size: 14pt; }
    .article-content h2 { font-size: 13pt; }
    .article-content h3 { font-size: 12pt; }
    .article-content h4 { font-size: 11pt; }
    
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
    <p>PlanetTogether Knowledge Base - Generated from HubSpot KB Import</p>
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
