import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('monitor_scans_total') public readonly scansTotal: Counter<string>,
    @InjectMetric('monitor_scan_duration_seconds') public readonly scanDuration: Histogram<string>,
    @InjectMetric('monitor_scan_logs_fetched') public readonly scanLogsFetched: Histogram<string>,
    @InjectMetric('monitor_scheduler_tick_outcomes_total') public readonly schedulerTickOutcomes: Counter<string>,
    @InjectMetric('monitor_scheduler_lag_seconds') public readonly schedulerLag: Gauge<string>,
    @InjectMetric('monitor_allowances_total') public readonly allowancesTotal: Counter<string>,
    @InjectMetric('monitor_allowance_recompute_duration_seconds')
    public readonly allowanceRecomputeDuration: Histogram<string>,
  ) {}
}
