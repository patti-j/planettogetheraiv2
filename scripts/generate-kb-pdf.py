#!/usr/bin/env python3
"""
Knowledge Base PDF Generator

Generates a PDF from the HubSpot Knowledge Base CSV export.
The CSV contains original HTML content which preserves formatting and internal links.

Usage: python3 scripts/generate-kb-pdf.py
"""

import pandas as pd
import html
import os
import subprocess
from datetime import datetime

CSV_PATH = 'attached_assets/hubspot-knowledge-base-export-empty-2025-12-11_1765485879660.csv'
OUTPUT_DIR = 'docs'

def slugify(text):
    import re
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = re.sub(r'^-|-$', '', text)
    return text[:50]

def escape_html(text):
    return html.escape(str(text)) if pd.notna(text) else ''

def generate_pdf():
    print(f"Reading CSV: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)
    
    categories = sorted(df['Category'].dropna().unique())
    print(f"Processing {len(df)} articles in {len(categories)} categories")

    toc_html = ''
    content_html = ''

    for category in categories:
        cat_articles = df[df['Category'] == category].sort_values('Article title')
        cat_slug = slugify(category)
        
        toc_html += f'<li class="toc-category"><a href="#cat-{cat_slug}">{escape_html(category)}</a><ul>'
        content_html += f'<a name="cat-{cat_slug}"></a><h2 class="category-header">{escape_html(category)}</h2>'
        
        for _, article in cat_articles.iterrows():
            title = article['Article title']
            subtitle = article['Article subtitle'] if pd.notna(article['Article subtitle']) else ''
            url = article['Article URL'] if pd.notna(article['Article URL']) else ''
            body = article['Article body'] if pd.notna(article['Article body']) else ''
            
            art_slug = slugify(title)
            
            toc_html += f'<li class="toc-article"><a href="#{art_slug}">{escape_html(title)}</a></li>'
            
            content_html += f'''
            <a name="{art_slug}"></a>
            <section class="article">
              <h3 class="article-title">{escape_html(title)}</h3>
              {f'<p class="article-subtitle">{escape_html(subtitle)}</p>' if subtitle else ''}
              {f'<p class="source-url"><a href="{escape_html(url)}" target="_blank">View Online</a></p>' if url else ''}
              <div class="article-content">{body}</div>
            </section>
            '''
        
        toc_html += '</ul></li>'

    full_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PlanetTogether Knowledge Base</title>
  <style>
    @page {{ size: A4; margin: 20mm 15mm 25mm 15mm; }}
    * {{ box-sizing: border-box; }}
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; margin: 0; padding: 20px; }}
    h1 {{ color: #0a3d62; font-size: 28pt; text-align: center; margin-bottom: 10px; page-break-after: avoid; }}
    .subtitle {{ text-align: center; color: #666; font-size: 12pt; margin-bottom: 30px; }}
    .toc {{ background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px 30px; margin-bottom: 40px; page-break-after: always; }}
    .toc h2 {{ color: #0a3d62; margin-top: 0; font-size: 18pt; border-bottom: 2px solid #0a3d62; padding-bottom: 10px; }}
    .toc ul {{ list-style: none; padding-left: 0; margin: 0; }}
    .toc-category {{ margin: 15px 0 5px 0; }}
    .toc-category > a {{ font-weight: bold; color: #0a3d62; font-size: 12pt; text-decoration: none; }}
    .toc-category > ul {{ padding-left: 20px; margin-top: 5px; }}
    .toc-article {{ margin: 3px 0; }}
    .toc-article a {{ color: #495057; text-decoration: none; font-size: 10pt; }}
    .category-header {{ color: #0a3d62; font-size: 20pt; border-bottom: 3px solid #0a3d62; padding-bottom: 8px; margin-top: 40px; page-break-after: avoid; }}
    .article {{ margin-bottom: 30px; padding: 15px 0; border-bottom: 1px solid #e9ecef; page-break-inside: avoid; }}
    .article-title {{ color: #2c3e50; font-size: 14pt; margin-bottom: 8px; page-break-after: avoid; }}
    .article-subtitle {{ font-size: 10pt; color: #666; font-style: italic; margin-bottom: 10px; }}
    .source-url {{ font-size: 9pt; color: #6c757d; margin-bottom: 10px; }}
    .source-url a {{ color: #0a3d62; }}
    .article-content {{ font-size: 10.5pt; line-height: 1.6; }}
    .article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6 {{ color: #2c3e50; margin-top: 15px; margin-bottom: 8px; page-break-after: avoid; }}
    .article-content h1 {{ font-size: 14pt; }} .article-content h2 {{ font-size: 13pt; }} .article-content h3 {{ font-size: 12pt; }} .article-content h4 {{ font-size: 11pt; }}
    .article-content p {{ margin: 8px 0; }}
    .article-content ul, .article-content ol {{ margin: 10px 0; padding-left: 25px; }}
    .article-content li {{ margin: 4px 0; }}
    .article-content a {{ color: #0a3d62; text-decoration: underline; }}
    .article-content code {{ background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: Consolas, Monaco, monospace; font-size: 9.5pt; }}
    .article-content pre {{ background: #f4f4f4; padding: 12px; border-radius: 5px; overflow-x: auto; font-size: 9pt; }}
    .article-content table {{ border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 10pt; }}
    .article-content th, .article-content td {{ border: 1px solid #dee2e6; padding: 8px 10px; text-align: left; }}
    .article-content th {{ background: #f8f9fa; font-weight: bold; }}
    .article-content img {{ max-width: 100%; height: auto; }}
    .article-content blockquote {{ border-left: 4px solid #0a3d62; margin: 15px 0; padding: 10px 15px; background: #f8f9fa; font-style: italic; }}
    .hs-callout-type-tip, .hs-callout-type-note, .hs-callout-type-info {{ border-left: 4px solid #5cb85c; margin: 15px 0; padding: 10px 15px; background: #f0fff0; }}
    .hs-callout-type-warning, .hs-callout-type-caution {{ border-left: 4px solid #f0ad4e; margin: 15px 0; padding: 10px 15px; background: #fff8e6; }}
    .footer {{ text-align: center; font-size: 9pt; color: #6c757d; margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; }}
  </style>
</head>
<body>
  <h1>PlanetTogether Knowledge Base</h1>
  <p class="subtitle">Complete Reference Guide - Generated {datetime.now().strftime("%B %d, %Y")}</p>
  <p class="subtitle">{len(df)} Articles across {len(categories)} Categories</p>
  
  <nav class="toc">
    <h2>Table of Contents</h2>
    <ul>{toc_html}</ul>
  </nav>
  
  <main>{content_html}</main>
  
  <footer class="footer">
    <p>PlanetTogether Knowledge Base - Generated from HubSpot KB Export</p>
    <p>Total Articles: {len(df)} | Categories: {len(categories)}</p>
  </footer>
</body>
</html>'''

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    html_path = os.path.join(OUTPUT_DIR, 'knowledge-base.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"HTML saved: {html_path}")

    pdf_path = os.path.join(OUTPUT_DIR, 'knowledge-base.pdf')
    cmd = f'wkhtmltopdf --page-size A4 --margin-top 20mm --margin-right 15mm --margin-bottom 25mm --margin-left 15mm --enable-local-file-access --enable-internal-links --footer-center "Page [page] of [topage]" --footer-font-size 9 --header-center "PlanetTogether Knowledge Base" --header-font-size 9 --header-spacing 5 --footer-spacing 5 "{html_path}" "{pdf_path}"'
    subprocess.run(cmd, shell=True, check=True)

    size_mb = os.path.getsize(pdf_path) / 1024 / 1024
    print(f"\n=== Generation Complete ===")
    print(f"PDF: {pdf_path} ({size_mb:.2f} MB)")
    print(f"Articles: {len(df)}")
    print(f"Categories: {len(categories)}")

if __name__ == '__main__':
    generate_pdf()
