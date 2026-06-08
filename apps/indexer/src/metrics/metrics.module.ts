import { Global, Module } from '@nestjs/common';
import { INSTANCE_ID } from '@revoke.cash/backend/observability/instance';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { ConfigService } from '../config/config.service';
import { MetricsService } from './metrics.service';
import { MetricsPusherService } from './metrics-pusher.service';

// We need to instantiate ConfigService here to get the role before the module is loaded.
const config = new ConfigService();

const counters = [
  makeCounterProvider({
    name: 'indexer_events_scans_total',
    help: 'Total events-indexing attempts by chain and outcome (ok, failed, nonce_zero)',
    labelNames: ['chain_id', 'outcome'],
  }),
  makeCounterProvider({
    name: 'indexer_scheduler_tick_outcomes_total',
    help: 'Per-tick scheduler enqueue outcomes (added, deduped, no_queue)',
    labelNames: ['outcome'],
  }),
  makeCounterProvider({
    name: 'indexer_allowances_total',
    help: 'Total allowance recompute attempts by chain and outcome (ok, skipped, failed)',
    labelNames: ['chain_id', 'outcome'],
  }),
  makeCounterProvider({
    name: 'indexer_token_metadata_total',
    help: 'Total token-metadata attempts by chain and outcome (enriched, spam, error, failed)',
    labelNames: ['chain_id', 'outcome'],
  }),
  makeCounterProvider({
    name: 'indexer_spender_metadata_total',
    help: 'Total spender-metadata attempts by chain and outcome (enriched, error, failed)',
    labelNames: ['chain_id', 'outcome'],
  }),
];

const histograms = [
  makeHistogramProvider({
    name: 'indexer_events_scan_duration_seconds',
    help: 'Wall-clock duration of a single events-indexing run (excluding BullMQ overhead)',
    labelNames: ['chain_id', 'path'],
    buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
  }),
  makeHistogramProvider({
    name: 'indexer_events_scan_logs_fetched',
    help: 'Number of logs fetched in a single events-indexing run',
    labelNames: ['chain_id', 'path'],
    buckets: [0, 1, 10, 100, 1_000, 10_000, 100_000],
  }),
  makeHistogramProvider({
    name: 'indexer_allowance_recompute_duration_seconds',
    help: 'Wall-clock duration of a single allowance recompute (signature check + RPC + DB write)',
    labelNames: ['chain_id'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  }),
  makeHistogramProvider({
    name: 'indexer_token_metadata_duration_seconds',
    help: 'Wall-clock duration of a single token-metadata attempt (whois + RPC + DB write)',
    labelNames: ['chain_id'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  }),
  makeHistogramProvider({
    name: 'indexer_spender_metadata_duration_seconds',
    help: 'Wall-clock duration of a single spender-metadata attempt (whois + risk sources + DB write)',
    labelNames: ['chain_id'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  }),
];

const gauges = [
  makeGaugeProvider({
    name: 'indexer_scheduler_lag_seconds',
    help: 'Seconds between now() and the oldest overdue events_state.next_run_at — primary "are we keeping up" signal',
  }),
];

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      defaultLabels: { service: 'indexer', role: config.role, instance: INSTANCE_ID },
      path: '/metrics',
    }),
  ],
  providers: [...counters, ...histograms, ...gauges, MetricsService, MetricsPusherService],
  exports: [MetricsService],
})
export class MetricsModule {}
