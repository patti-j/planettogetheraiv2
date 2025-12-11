/**
 * Generate Workday Summary Document
 * 
 * Creates a Word document (.docx) with the daily work summary.
 * 
 * Usage:
 *   npx tsx scripts/generate-workday-doc.ts
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import * as fs from 'fs';

const today = new Date();
const dateStr = today.toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});
const fileDate = today.toISOString().split('T')[0];

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "PlanetTogether - Workday Summary",
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: dateStr,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 400 }
      }),
      
      new Paragraph({
        text: "Knowledge Base RAG Integration",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Status: ", bold: true }),
          new TextRun({ text: "Complete ✓" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: "Integrated knowledge base retrieval-augmented generation (RAG) into Max AI for documentation-based responses.",
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        text: "RAG Architecture:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• isKnowledgeQuestion() detects help/how-to queries", bullet: { level: 0 } }),
      new Paragraph({ text: "• generateKBResponse() method for KB-augmented answers", bullet: { level: 0 } }),
      new Paragraph({ text: "• Uses knowledgeRetrievalService.search() with 0.3 score threshold", bullet: { level: 0 } }),
      new Paragraph({ text: "• Builds prompt with retrieved passages and citation markers [1], [2], [3]", bullet: { level: 0 } }),
      
      new Paragraph({
        text: "Max AI Integration:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• KB check happens after playbooks but before internal data analysis", bullet: { level: 0 } }),
      new Paragraph({ text: "• Successful KB hits return early with sources array", bullet: { level: 0 } }),
      new Paragraph({ text: "• Response includes sources: KBSource[] for citation display", bullet: { level: 0 } }),
      
      new Paragraph({
        text: "Frontend UI Changes:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• MaxResponse interface updated with sources field", bullet: { level: 0 } }),
      new Paragraph({ text: "• AI panel displays Sources section with BookOpen icon", bullet: { level: 0 } }),
      new Paragraph({ text: "• External links have ExternalLink icon and open in new tab", bullet: { level: 0 } }),
      new Paragraph({ text: "• Shows top 3 sources as clickable citations", bullet: { level: 0 } }),
      
      new Paragraph({
        text: "HubSpot KB Import",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Status: ", bold: true }),
          new TextRun({ text: "Complete ✓" })
        ],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        text: "Import Statistics:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "Metric", alignment: "center" })] }),
              new TableCell({ children: [new Paragraph({ text: "Value", alignment: "center" })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Articles Imported")] }),
              new TableCell({ children: [new Paragraph("168")] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Chunks Created")] }),
              new TableCell({ children: [new Paragraph("168")] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Source")] }),
              new TableCell({ children: [new Paragraph("HubSpot KB Export")] })
            ]
          })
        ]
      }),
      
      new Paragraph({
        text: "Monthly Refresh Process:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 100 }
      }),
      new Paragraph({ text: "1. Export from HubSpot (Service > Knowledge Base > Export)", bullet: { level: 0 } }),
      new Paragraph({ text: "2. Save file to attached_assets/ folder", bullet: { level: 0 } }),
      new Paragraph({ text: "3. Run: npx tsx scripts/import-knowledge-base.ts ./attached_assets/file.txt --clear", bullet: { level: 0 } }),
      
      new Paragraph({
        text: "Files Created/Modified",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      
      new Paragraph({
        text: "New Files:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• scripts/import-knowledge-base.ts - Reusable KB import script", bullet: { level: 0 } }),
      new Paragraph({ text: "• docs/KNOWLEDGE-BASE-IMPORT.md - Monthly refresh documentation", bullet: { level: 0 } }),
      new Paragraph({ text: "• server/services/knowledge-retrieval.service.ts - RAG service", bullet: { level: 0 } }),
      
      new Paragraph({
        text: "Modified Files:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• server/services/max-ai-service.ts - RAG integration, KBSource interface", bullet: { level: 0 } }),
      new Paragraph({ text: "• client/src/components/navigation/ai-left-panel.tsx - Sources display UI", bullet: { level: 0 } }),
      new Paragraph({ text: "• shared/schema.ts - knowledgeArticles, knowledgeChunks tables", bullet: { level: 0 } }),
      new Paragraph({ text: "• server/routes.ts - KB API endpoints", bullet: { level: 0 } }),
      new Paragraph({ text: "• replit.md - Updated project documentation", bullet: { level: 0 } }),
      
      new Paragraph({
        text: "Git History Investigation",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: "Investigated why KB was previously removed. Found that original KB implementation (Nov 20, 2025, commits c913cbf, 15aebdf) was on a Replit Agent branch that never merged to main. The work was orphaned, not intentionally deleted.",
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        text: "Next Steps",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({ text: "• Test RAG responses with various documentation queries", bullet: { level: 0 } }),
      new Paragraph({ text: "• Consider adding embedding-based semantic search (currently keyword-based)", bullet: { level: 0 } }),
      new Paragraph({ text: "• Schedule monthly KB refresh reminder", bullet: { level: 0 } })
    ]
  }]
});

async function generate() {
  const buffer = await Packer.toBuffer(doc);
  const filename = `docs/workday-summary-${fileDate}.docx`;
  fs.writeFileSync(filename, buffer);
  console.log(`✅ Created: ${filename}`);
}

generate();
