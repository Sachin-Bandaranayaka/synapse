// src/lib/hierarchy-helper.ts

import { Tenant } from '@prisma/client';

// A list of distinct colors for different referral branches
const AESTHETIC_COLORS = [
  '#5A9BD5', // Blue
  '#ED7D31', // Orange
  '#A5A5A5', // Gray
  '#FFC000', // Yellow
  '#4472C4', // Darker Blue
  '#70AD47', // Green
  '#255E91', // Indigo
  '#9E480E', // Brown
];

// This function converts your tenant data into a format for React Flow
export function prepareReactFlowData(tenants: Tenant[]) {
  const nodes = [];
  const edges = [];

  const tenantMap = new Map(tenants.map(t => [t.id, { ...t, level: -1, childrenCount: 0, xOffset: 0 }]));

  // First pass: determine the level of each tenant
  for (const tenant of tenants) {
    let current = tenantMap.get(tenant.id);
    let level = 0;
    let parentId = current?.referredById;
    while (parentId) {
      level++;
      parentId = tenantMap.get(parentId)?.referredById;
    }
    if (current) {
      current.level = level;
    }
  }

  const sortedTenants = Array.from(tenantMap.values()).sort((a, b) => a.level - b.level);

  // Keep track of horizontal positions for each branch
  const levelXOffset: Record<number, number> = {};
  const parentColorMap = new Map<string, string>();
  let colorIndex = 0;

  // Second pass: create nodes and edges with positions and colors
  for (const tenant of sortedTenants) {
    if (tenant.level === -1) continue;

    let parentNode = tenant.referredById ? tenantMap.get(tenant.referredById) : null;
    let color = '#777777'; // Default color

    if (tenant.level === 0) { // Top-level tenants
      color = AESTHETIC_COLORS[colorIndex % AESTHETIC_COLORS.length];
      parentColorMap.set(tenant.id, color);
      colorIndex++;
    } else if (parentNode) {
      // Inherit color from the top-most parent in the branch
      let rootParentId = parentNode.id;
      let tempParent = parentNode;
      while (tempParent.referredById) {
        rootParentId = tempParent.referredById;
        tempParent = tenantMap.get(rootParentId)!;
      }
      color = parentColorMap.get(rootParentId) || color;
    }

    // This logic separates branches horizontally
    const currentLevelX = levelXOffset[tenant.level] || 0;
    tenant.xOffset = parentNode ? parentNode.xOffset + (parentNode.childrenCount - 1) * 275 : currentLevelX;
    if(parentNode) parentNode.childrenCount++;

    nodes.push({
      id: tenant.id,
      type: 'default',
      data: { label: tenant.name },
      position: {
        x: tenant.xOffset,
        y: tenant.level * 120, // Reduced vertical spacing
      },
      style: { // Apply colors
        background: `${color}30`, // Light tint
        borderColor: color,
        color: '#ffffff',
        borderWidth: 2,
      },
    });

    if (tenant.referredById) {
      edges.push({
        id: `e-${tenant.referredById}-${tenant.id}`,
        source: tenant.referredById,
        target: tenant.id,
        type: 'smoothstep',
        style: { stroke: color, strokeWidth: 2 },
        animated: true,
      });
    }

    if (!parentNode) {
        levelXOffset[tenant.level] = (levelXOffset[tenant.level] || 0) + 300;
    }
  }

  return { nodes, edges };
}