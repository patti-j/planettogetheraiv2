// Type declarations for jspdf-autotable
import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => void;
    lastAutoTable?: {
      finalY: number;
    };
    previousAutoTable?: {
      finalY: number;
    };
  }

  interface AutoTableOptions {
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    startY?: number;
    margin?: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
    } | number;
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    styles?: {
      fontSize?: number;
      cellPadding?: number | {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
      };
      minCellHeight?: number;
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
      fillColor?: number | number[];
      textColor?: number | number[];
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
      cellWidth?: 'auto' | 'wrap' | number;
      lineColor?: number | number[];
      lineWidth?: number;
    };
    headStyles?: any;
    bodyStyles?: any;
    footStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: { [key: string]: any };
    didParseCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didDrawCell?: (data: any) => void;
    didDrawPage?: (data: any) => void;
  }
}

export {};