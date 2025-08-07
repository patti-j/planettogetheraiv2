import React, { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface ActivityLink {
  fromId: number;
  toId: number;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag?: number; // in hours
  critical?: boolean;
}

interface GanttActivityLinksProps {
  links: ActivityLink[];
  operations: any[];
  resources: any[];
  timelineWidth: number;
  rowHeight: number;
  getOperationPosition: (operationId: number) => { x: number; y: number; width: number; height: number } | null;
  className?: string;
}

export default function GanttActivityLinks({
  links,
  operations,
  resources,
  timelineWidth,
  rowHeight,
  getOperationPosition,
  className
}: GanttActivityLinksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    critical: boolean = false
  ) => {
    const headlen = 10; // length of arrow head
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Set line style
    ctx.strokeStyle = critical ? '#ef4444' : '#6b7280';
    ctx.lineWidth = critical ? 2 : 1;
    ctx.fillStyle = critical ? '#ef4444' : '#6b7280';
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    
    // Create curved path for better visibility
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const curveOffset = Math.min(30, Math.abs(toY - fromY) / 2);
    
    if (Math.abs(toY - fromY) > 5) {
      // Vertical curve
      ctx.quadraticCurveTo(midX + curveOffset, midY, toX, toY);
    } else {
      // Straight line for same-row connections
      ctx.lineTo(toX, toY);
    }
    
    ctx.stroke();
    
    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };
  
  const drawLinks = useMemo(() => {
    return () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Enable anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw each link
      links.forEach(link => {
        const fromPos = getOperationPosition(link.fromId);
        const toPos = getOperationPosition(link.toId);
        
        if (!fromPos || !toPos) return;
        
        let fromX = 0;
        let fromY = 0;
        let toX = 0;
        let toY = 0;
        
        // Calculate connection points based on link type
        switch (link.type) {
          case 'finish-to-start':
            fromX = fromPos.x + fromPos.width;
            fromY = fromPos.y + fromPos.height / 2;
            toX = toPos.x;
            toY = toPos.y + toPos.height / 2;
            break;
          case 'start-to-start':
            fromX = fromPos.x;
            fromY = fromPos.y + fromPos.height / 2;
            toX = toPos.x;
            toY = toPos.y + toPos.height / 2;
            break;
          case 'finish-to-finish':
            fromX = fromPos.x + fromPos.width;
            fromY = fromPos.y + fromPos.height / 2;
            toX = toPos.x + toPos.width;
            toY = toPos.y + toPos.height / 2;
            break;
          case 'start-to-finish':
            fromX = fromPos.x;
            fromY = fromPos.y + fromPos.height / 2;
            toX = toPos.x + toPos.width;
            toY = toPos.y + toPos.height / 2;
            break;
        }
        
        // Draw the arrow
        drawArrow(ctx, fromX, fromY, toX, toY, link.critical);
        
        // Draw lag time label if present
        if (link.lag && link.lag !== 0) {
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;
          
          ctx.font = '11px sans-serif';
          ctx.fillStyle = link.critical ? '#ef4444' : '#6b7280';
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          
          const lagText = `${link.lag > 0 ? '+' : ''}${link.lag}h`;
          const textWidth = ctx.measureText(lagText).width;
          
          // Draw white background for text
          ctx.strokeText(lagText, midX - textWidth / 2, midY - 5);
          ctx.fillText(lagText, midX - textWidth / 2, midY - 5);
        }
      });
    };
  }, [links, getOperationPosition]);
  
  useEffect(() => {
    drawLinks();
  }, [drawLinks]);
  
  // Redraw on window resize
  useEffect(() => {
    const handleResize = () => {
      drawLinks();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawLinks]);
  
  return (
    <canvas
      ref={canvasRef}
      width={timelineWidth}
      height={resources.length * rowHeight}
      className={cn(
        'absolute inset-0 pointer-events-none z-10',
        className
      )}
      style={{
        width: timelineWidth,
        height: resources.length * rowHeight
      }}
    />
  );
}