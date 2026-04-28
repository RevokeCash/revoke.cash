import { Global, Module } from '@nestjs/common';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { ConfigService } from '../config/config.service';
import { MetricsService } from './metrics.service';
import { MetricsPusherService } from './metrics-pusher.service';

// We need to instantiate ConfigService here to get the role and instanceId before the module is loaded.
const config = new ConfigService();

const counters = [
  makeCounterProvider({
    name: 'monitor_scans_total',
    help: 'Total scan attempts by chain and outcome (ok, failed, nonce_zero)',
    labelNames: ['chain_id', 'outcome'],
  }),
  makeCounterProvider({
    name: 'monitor_scheduler_tick_outcomes_total',
    help: 'Per-tick scheduler enqueue outcomes (added, deduped, no_queue)',
    labelNames: ['outcome'],
  }),
];

const histograms = [
  makeHistogramProvider({
    name: 'monitor_scan_duration_seconds',
    help: 'Wall-clock duration of a single scan attempt (excluding BullMQ overhead)',
    labelNames: ['chain_id', 'path'],
    buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
  }),
  makeHistogramProvider({
    name: 'monitor_scan_logs_fetched',
    help: 'Number of logs fetched in a single scan',
    labelNames: ['chain_id', 'path'],
    buckets: [0, 1, 10, 100, 1_000, 10_000, 100_000],
  }),
];

const gauges = [
  makeGaugeProvider({
    name: 'monitor_scheduler_lag_seconds',
    help: 'Seconds between now() and the oldest overdue scan_state.next_run_at — primary "are we keeping up" signal',
  }),
];

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      defaultLabels: { service: 'approval-monitor', role: config.role, instance: config.instanceId },
      path: '/metrics',
    }),
  ],
  providers: [...counters, ...histograms, ...gauges, MetricsService, MetricsPusherService],
  exports: [MetricsService],
})
export class MetricsModule {}
