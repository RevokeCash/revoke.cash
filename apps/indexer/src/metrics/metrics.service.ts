import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('indexer_events_scans_total') public readonly eventsScansTotal: Counter<string>,
    @InjectMetric('indexer_events_scan_duration_seconds') public readonly eventsScanDuration: Histogram<string>,
    @InjectMetric('indexer_events_scan_logs_fetched') public readonly eventsScanLogsFetched: Histogram<string>,
    @InjectMetric('indexer_scheduler_tick_outcomes_total') public readonly schedulerTickOutcomes: Counter<string>,
    @InjectMetric('indexer_scheduler_lag_seconds') public readonly schedulerLag: Gauge<string>,
    @InjectMetric('indexer_allowances_total') public readonly allowancesTotal: Counter<string>,
    @InjectMetric('indexer_allowance_recompute_duration_seconds')
    public readonly allowanceRecomputeDuration: Histogram<string>,
    @InjectMetric('indexer_token_metadata_total') public readonly tokenMetadataTotal: Counter<string>,
    @InjectMetric('indexer_token_metadata_duration_seconds')
    public readonly tokenMetadataDuration: Histogram<string>,
    @InjectMetric('indexer_spender_metadata_total') public readonly spenderMetadataTotal: Counter<string>,
    @InjectMetric('indexer_spender_metadata_duration_seconds')
    public readonly spenderMetadataDuration: Histogram<string>,
    @InjectMetric('auto_revoke_evaluations_total') public readonly autoRevokeEvaluationsTotal: Counter<string>,
  ) {}
}
