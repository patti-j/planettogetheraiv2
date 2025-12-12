import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import * as fs from 'fs';

const mdContent = fs.readFileSync('docs/workday-summary-2025-12-11.md', 'utf-8');

const lines = mdContent.split('\n');
const children: any[] = [];

let inCodeBlock = false;
let codeBlockContent: string[] = [];
let inTable = false;
let tableRows: string[][] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('```')) {
    if (inCodeBlock) {
      children.push(new Paragraph({
        children: [new TextRun({ text: codeBlockContent.join('\n'), font: 'Courier New', size: 18 })],
        shading: { fill: 'E8E8E8' },
        spacing: { before: 100, after: 100 }
      }));
      codeBlockContent = [];
      inCodeBlock = false;
    } else {
      inCodeBlock = true;
    }
    continue;
  }
  
  if (inCodeBlock) {
    codeBlockContent.push(line);
    continue;
  }
  
  if (line.startsWith('|') && line.includes('|')) {
    const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
    if (cells.length > 0 && !cells.every(c => c.match(/^[-:]+$/))) {
      tableRows.push(cells);
    }
    if (i + 1 >= lines.length || !lines[i + 1].startsWith('|')) {
      if (tableRows.length > 0) {
        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows.map((row, idx) => new TableRow({
            children: row.map(cell => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell, bold: idx === 0, size: 20 })] })],
              width: { size: Math.floor(100 / row.length), type: WidthType.PERCENTAGE }
            }))
          }))
        });
        children.push(table);
        children.push(new Paragraph({ text: '' }));
        tableRows = [];
      }
    }
    continue;
  }
  
  if (line.startsWith('# ')) {
    children.push(new Paragraph({
      text: line.substring(2),
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    }));
  } else if (line.startsWith('## ')) {
    children.push(new Paragraph({
      text: line.substring(3),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 }
    }));
  } else if (line.startsWith('### ')) {
    children.push(new Paragraph({
      text: line.substring(4),
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 }
    }));
  } else if (line.startsWith('#### ')) {
    children.push(new Paragraph({
      children: [new TextRun({ text: line.substring(5), bold: true, size: 22 })],
      spacing: { before: 150, after: 75 }
    }));
  } else if (line.startsWith('- **')) {
    const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/);
    if (match) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: '• ', size: 22 }),
          new TextRun({ text: match[1], bold: true, size: 22 }),
          new TextRun({ text: match[2] ? ': ' + match[2] : '', size: 22 })
        ],
        spacing: { before: 50 }
      }));
    }
  } else if (line.startsWith('- ')) {
    children.push(new Paragraph({
      children: [new TextRun({ text: '• ' + line.substring(2), size: 22 })],
      spacing: { before: 50 }
    }));
  } else if (line.startsWith('---')) {
    children.push(new Paragraph({
      children: [new TextRun({ text: '─'.repeat(50), color: '999999' })],
      spacing: { before: 200, after: 200 }
    }));
  } else if (line.trim() === '') {
    children.push(new Paragraph({ text: '' }));
  } else {
    let text = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`(.+?)`/g, '$1');
    children.push(new Paragraph({
      children: [new TextRun({ text, size: 22 })],
      spacing: { before: 50, after: 50 }
    }));
  }
}

const doc = new Document({
  sections: [{
    properties: {},
    children: children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('docs/workday-summary-2025-12-11.docx', buffer);
  console.log('Word document created: docs/workday-summary-2025-12-11.docx');
});
