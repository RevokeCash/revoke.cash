import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { type MetricObjectWithValues, type MetricValue, register } from 'prom-client';
import { pushTimeseries } from 'prometheus-remote-write';
import { ConfigService } from '../config/config.service';

const PUSH_INTERVAL_MS = 30_000;
const REMOTE_WRITE_HEADERS = {
  'Content-Encoding': 'snappy',
  'User-Agent': 'revoke-approval-monitor/1.0',
  'X-Prometheus-Remote-Write-Version': '0.1.0',
};

@Injectable()
export class MetricsPusherService implements OnModuleInit {
  private readonly logger = new Logger(MetricsPusherService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.metricsRemoteWriteUrl;
    if (url) {
      this.logger.log({ intervalMs: PUSH_INTERVAL_MS }, 'metrics push enabled');
    } else {
      this.logger.log('METRICS_REMOTE_WRITE_URL not set; metrics push disabled');
    }
  }

  @Interval(PUSH_INTERVAL_MS)
  async push(): Promise<void> {
    const url = this.config.metricsRemoteWriteUrl;
    if (!url) return;

    try {
      const timeseries = metricsToTimeseries(await register.getMetricsAsJSON());
      if (timeseries.length === 0) return;

      const result = await pushTimeseries(timeseries, { headers: REMOTE_WRITE_HEADERS, url });
      if (!isSuccessfulPush(result)) this.logger.error(result, 'metrics push failed');
    } catch (error) {
      this.logger.error({ error: parseErrorMessage(error) }, 'metrics push failed');
    }
  }
}

interface RemoteWriteTimeseries {
  labels: { [key: string]: string; __name__: string };
  samples: Array<{ value: number; timestamp: number }>;
}

type RemoteWriteResult = Awaited<ReturnType<typeof pushTimeseries>>;
type MetricEntry = MetricValue<string> & { metricName?: string };

const metricsToTimeseries = (metrics: Array<MetricObjectWithValues<MetricValue<string>>>): RemoteWriteTimeseries[] => {
  const timestamp = Date.now();

  return metrics.flatMap((metric) =>
    metric.values.map((entry) => ({
      labels: {
        __name__: getMetricName(metric.name, entry),
        ...stringifyLabels(entry.labels),
      },
      samples: [{ value: entry.value, timestamp }],
    })),
  );
};

const getMetricName = (defaultName: string, entry: MetricValue<string>): string => {
  return (entry as MetricEntry).metricName ?? defaultName;
};

const stringifyLabels = (labels: MetricValue<string>['labels']): Record<string, string> => {
  return Object.fromEntries(Object.entries(labels).map(([key, value]) => [key, String(value)]));
};

const isSuccessfulPush = (result: RemoteWriteResult): boolean => {
  return result.status >= 200 && result.status < 300;
};
