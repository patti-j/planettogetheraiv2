import { Operation, Resource } from "@shared/schema";

/**
 * Safely validates if an operation can be dropped on a resource
 * with comprehensive error handling
 */
export function safeCanDrop(
  item: any, 
  resource: Resource,
  context: string = "general"
): boolean {
  try {
    const operation = item?.operation;
    if (!operation) {
      console.warn(`${context}: No operation found in drag item`);
      return false;
    }

    // If operation has no required capabilities, it can be dropped anywhere
    if (!operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
      return true;
    }

    // Safely check resource capabilities
    const resourceCapabilities = resource?.capabilities || [];
    const operationCapabilities = operation.requiredCapabilities || [];
    
    // Ensure all required capabilities are available on the resource
    return operationCapabilities.every((reqCap: number) => 
      resourceCapabilities.includes(reqCap)
    );
  } catch (error) {
    console.error(`Error in ${context} canDrop validation:`, error);
    console.error("Item:", item);
    console.error("Resource:", resource);
    return false; // Fail safely - don't allow drop if validation fails
  }
}

/**
 * Safely validates operation assignment capabilities
 */
export function safeCanAssignOperation(
  operation: Operation, 
  resource: Resource,
  context: string = "assignment"
): boolean {
  try {
    if (!operation) {
      console.warn(`${context}: No operation provided for assignment validation`);
      return false;
    }

    if (!resource) {
      console.warn(`${context}: No resource provided for assignment validation`);
      return false;
    }

    // If operation has no required capabilities, it can be assigned anywhere
    if (!operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
      return true;
    }

    // Safely check resource capabilities
    const resourceCapabilities = resource.capabilities || [];
    const operationCapabilities = operation.requiredCapabilities || [];
    
    // Ensure all required capabilities are available on the resource
    return operationCapabilities.every((reqCap: number) => 
      resourceCapabilities.includes(reqCap)
    );
  } catch (error) {
    console.error(`Error in ${context} capability validation:`, error);
    console.error("Operation:", operation);
    console.error("Resource:", resource);
    return false; // Fail safely
  }
}

/**
 * Enhanced error logging for drag-drop operations
 */
export function logDragDropError(
  error: any, 
  context: string, 
  additionalData?: any
): void {
  console.error(`🔥 Drag-Drop Error [${context}]:`, error);
  if (additionalData) {
    console.error(`🔍 Context Data:`, additionalData);
  }
  console.error(`📍 Stack:`, error?.stack || 'No stack trace available');
}