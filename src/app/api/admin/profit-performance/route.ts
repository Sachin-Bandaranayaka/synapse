// src/app/api/admin/profit-performance/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { profitPerformanceMonitor } from '@/lib/profit-performance-monitor';
import { profitCache } from '@/lib/profit-cache';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins and super admins to access performance metrics
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '3600000'); // Default 1 hour

    // Get performance statistics
    const overallStats = profitPerformanceMonitor.getOverallStats(timeWindow);
    const cacheEffectiveness = profitPerformanceMonitor.getCacheEffectiveness(timeWindow);
    const cacheStats = profitCache.getStats();

    // Get operation-specific stats
    const operationStats = {
      calculateOrderProfit: profitPerformanceMonitor.getOperationStats('calculateOrderProfit', timeWindow),
      calculatePeriodProfit: profitPerformanceMonitor.getOperationStats('calculatePeriodProfit', timeWindow),
    };

    const performanceReport = {
      timeWindow: {
        durationMs: timeWindow,
        description: `Last ${Math.round(timeWindow / 60000)} minutes`,
      },
      overall: overallStats,
      cache: {
        effectiveness: cacheEffectiveness,
        stats: cacheStats,
      },
      operations: operationStats,
      recommendations: generatePerformanceRecommendations(overallStats, cacheEffectiveness, operationStats),
    };

    return NextResponse.json(performanceReport);
  } catch (error) {
    console.error('Error generating performance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate performance report' },
      { status: 500 }
    );
  }
}

function generatePerformanceRecommendations(
  overallStats: any,
  cacheEffectiveness: any,
  operationStats: any
): string[] {
  const recommendations: string[] = [];

  // Cache hit rate recommendations
  if (cacheEffectiveness.hitRate < 50) {
    recommendations.push('Cache hit rate is low (<50%). Consider increasing cache TTL or reviewing cache invalidation strategy.');
  } else if (cacheEffectiveness.hitRate > 90) {
    recommendations.push('Excellent cache hit rate (>90%). Cache strategy is working well.');
  }

  // Slow operations recommendations
  if (overallStats.slowOperations > 0) {
    recommendations.push(`${overallStats.slowOperations} slow operations detected (>1s). Consider optimizing database queries or adding more indexes.`);
  }

  // Average duration recommendations
  if (overallStats.avgDuration > 500) {
    recommendations.push('Average operation duration is high (>500ms). Consider performance optimizations.');
  }

  // Operation-specific recommendations
  if (operationStats.calculateOrderProfit.avgDuration > 200) {
    recommendations.push('Order profit calculations are slow (>200ms). Consider pre-calculating and storing results.');
  }

  if (operationStats.calculatePeriodProfit.avgDuration > 2000) {
    recommendations.push('Period profit calculations are slow (>2s). Consider implementing pagination or background processing.');
  }

  // Cache size recommendations
  if (cacheEffectiveness.totalRequests > 100 && cacheEffectiveness.hitRate < 30) {
    recommendations.push('Low cache hit rate with high request volume. Consider reviewing cache key generation or increasing cache size.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance metrics look good. No immediate optimizations needed.');
  }

  return recommendations;
}