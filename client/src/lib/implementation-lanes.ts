import { Globe, LayoutDashboard, Zap, Cpu, type LucideIcon } from 'lucide-react';

export type LaneNumber = 0 | 1 | 2 | 3;
export type LaneKey = 'lane_0' | 'lane_1' | 'lane_2' | 'lane_3';

export interface LaneDefinition {
  laneNumber: LaneNumber;
  laneKey: LaneKey;
  name: string;
  shortName: string;
  description: string;
  valueProposition: string;
  dataRequirements: string[];
  features: string[];
  prerequisites: string[];
  typicalDurationWeeks: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
}

export const LANE_DEFINITIONS: Record<LaneKey, LaneDefinition> = {
  lane_0: {
    laneNumber: 0,
    laneKey: 'lane_0',
    name: 'Companywide Visibility',
    shortName: 'Lane 0',
    description: 'Cross-plant executive dashboards with minimal data requirements. Provides immediate visibility across all plants without detailed configuration.',
    valueProposition: 'Immediate companywide visibility. Executives see which plants are overloaded, spare capacity, and at-risk orders. AI alerts across the network. No detailed data needed.',
    dataRequirements: [
      'Plant list',
      'Resource families or major lines',
      'High-level order data (quantities, due dates)',
      'Basic calendars'
    ],
    features: [
      'Cross-plant dashboards',
      'Companywide OTD performance',
      'Load balancing visibility',
      'AI alerts across network',
      'Risk identification'
    ],
    prerequisites: [],
    typicalDurationWeeks: 1,
    color: '#6366F1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-500',
    icon: Globe
  },
  lane_1: {
    laneNumber: 1,
    laneKey: 'lane_1',
    name: 'Plant-Level Visibility',
    shortName: 'Lane 1',
    description: 'Dispatch lists, work center views, collaboration tools, and basic job tracking at the plant level.',
    valueProposition: 'Every plant gets immediate practical value. Dispatch lists, collaboration features, capacity charts. No heavy configuration needed. Builds usage and familiarity.',
    dataRequirements: [
      'Order details',
      'Resource assignments',
      'Basic capacity data',
      'Work center definitions'
    ],
    features: [
      'Dispatch lists',
      'Work center views',
      'Collaboration tools',
      'Basic job tracking',
      'Capacity charts',
      'Basic AI insights'
    ],
    prerequisites: ['Lane 0 completion'],
    typicalDurationWeeks: 2,
    color: '#3B82F6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-500',
    icon: LayoutDashboard
  },
  lane_2: {
    laneNumber: 2,
    laneKey: 'lane_2',
    name: 'Assistive Scheduling',
    shortName: 'Lane 2',
    description: 'Sequencing optimization, what-if scenarios, batching, and AI-powered recommendations for improved scheduling decisions.',
    valueProposition: 'AI-optimized sequencing. Setup reduction. Demonstrates tangible scheduling improvements in controlled environment. Plants see success and voluntarily opt-in.',
    dataRequirements: [
      'Detailed routings',
      'Setup matrices',
      'Constraint definitions',
      'Historical performance data'
    ],
    features: [
      'Sequencing optimization',
      'What-if scenarios',
      'Batching optimization',
      'AI recommendations',
      'Semi-automated scheduling',
      'Attribute-based scheduling'
    ],
    prerequisites: ['Lane 1 completion', 'Basic routing data', 'Trained users'],
    typicalDurationWeeks: 4,
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-500',
    icon: Zap
  },
  lane_3: {
    laneNumber: 3,
    laneKey: 'lane_3',
    name: 'Full APS',
    shortName: 'Lane 3',
    description: 'Complete automated constraint-accurate scheduling with multi-constraint optimization and AI policy-driven replanning.',
    valueProposition: 'Full scheduling accuracy. Automated replanning. Multi-constraint optimization. AI policy-driven scheduling. Maximum ROI from complete system capabilities.',
    dataRequirements: [
      'Complete routings with all constraints',
      'Accurate capacity models',
      'Full setup time matrices',
      'Material constraints',
      'Tooling constraints'
    ],
    features: [
      'Automated scheduling',
      'Multi-constraint optimization',
      'AI policy-driven scheduling',
      'Full replanning',
      'Advanced constraint handling',
      'Complete visibility'
    ],
    prerequisites: ['Lane 2 completion', 'Complete data validation', 'Change management readiness'],
    typicalDurationWeeks: 8,
    color: '#EF4444',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-500',
    icon: Cpu
  }
};

export const LANE_ORDER: LaneKey[] = ['lane_0', 'lane_1', 'lane_2', 'lane_3'];

export function getLaneDefinition(lane: LaneKey | LaneNumber): LaneDefinition {
  if (typeof lane === 'number') {
    return LANE_DEFINITIONS[`lane_${lane}` as LaneKey];
  }
  return LANE_DEFINITIONS[lane];
}

export function getNextLane(currentLane: LaneKey): LaneKey | null {
  const currentIndex = LANE_ORDER.indexOf(currentLane);
  if (currentIndex === -1 || currentIndex >= LANE_ORDER.length - 1) {
    return null;
  }
  return LANE_ORDER[currentIndex + 1];
}

export function getPreviousLane(currentLane: LaneKey): LaneKey | null {
  const currentIndex = LANE_ORDER.indexOf(currentLane);
  if (currentIndex <= 0) {
    return null;
  }
  return LANE_ORDER[currentIndex - 1];
}

export function getLaneProgress(currentLane: LaneKey, targetLane: LaneKey, laneProgress: number): number {
  const currentIndex = LANE_ORDER.indexOf(currentLane);
  const targetIndex = LANE_ORDER.indexOf(targetLane);
  
  if (currentIndex >= targetIndex) {
    return 100;
  }
  
  const totalSteps = targetIndex - currentIndex;
  const completedSteps = 0; // Current lane is still in progress
  const currentStepProgress = laneProgress / 100;
  
  return Math.round(((completedSteps + currentStepProgress) / totalSteps) * 100);
}

export function getLaneStatusColor(currentLane: LaneKey, targetLane: LaneKey): string {
  const currentIndex = LANE_ORDER.indexOf(currentLane);
  const targetIndex = LANE_ORDER.indexOf(targetLane);
  
  if (currentIndex >= targetIndex) {
    return 'text-green-600 dark:text-green-400';
  }
  if (currentIndex === targetIndex - 1) {
    return 'text-blue-600 dark:text-blue-400';
  }
  return 'text-amber-600 dark:text-amber-400';
}

export function formatLaneForDisplay(lane: LaneKey | null | undefined): string {
  if (!lane) return 'Not Set';
  const def = LANE_DEFINITIONS[lane];
  return def ? `${def.shortName}: ${def.name}` : lane;
}

export function getLaneColor(lane: LaneKey | null | undefined): string {
  if (!lane) return '#9CA3AF';
  return LANE_DEFINITIONS[lane]?.color || '#9CA3AF';
}
