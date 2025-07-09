const StatsD = require('hot-shots');
const logger = require('./logger');
const config = require('../config');

// StatsD 클라이언트 설정
const client = new StatsD({
  host: config.statsd.host,
  port: config.statsd.port,
  prefix: 'maekcode.',
  errorHandler: error => {
    logger.error('StatsD error:', error);
  }
});

class Metrics {
  constructor() {
    this.client = client;
  }

  // 카운터 증가
  increment(metric, tags = {}) {
    try {
      this.client.increment(metric, this._formatTags(tags));
    } catch (error) {
      logger.error('Metrics increment error:', {
        metric,
        tags,
        error: error.message
      });
    }
  }

  // 게이지 설정
  gauge(metric, value, tags = {}) {
    try {
      this.client.gauge(metric, value, this._formatTags(tags));
    } catch (error) {
      logger.error('Metrics gauge error:', {
        metric,
        value,
        tags,
        error: error.message
      });
    }
  }

  // 타이밍 측정
  timing(metric, time, tags = {}) {
    try {
      this.client.timing(metric, time, this._formatTags(tags));
    } catch (error) {
      logger.error('Metrics timing error:', {
        metric,
        time,
        tags,
        error: error.message
      });
    }
  }

  // 히스토그램 기록
  histogram(metric, value, tags = {}) {
    try {
      this.client.histogram(metric, value, this._formatTags(tags));
    } catch (error) {
      logger.error('Metrics histogram error:', {
        metric,
        value,
        tags,
        error: error.message
      });
    }
  }

  // 분포 기록
  distribution(metric, value, tags = {}) {
    try {
      this.client.distribution(metric, value, this._formatTags(tags));
    } catch (error) {
      logger.error('Metrics distribution error:', {
        metric,
        value,
        tags,
        error: error.message
      });
    }
  }

  // 이벤트 기록
  event(title, text, tags = {}) {
    try {
      this.client.event(title, text, this._formatTags(tags));
    } catch (error) {
      logger.error('Metrics event error:', {
        title,
        text,
        tags,
        error: error.message
      });
    }
  }

  // 태그 포맷팅
  _formatTags(tags) {
    const formattedTags = [];
    for (const [key, value] of Object.entries(tags)) {
      if (value !== undefined && value !== null) {
        formattedTags.push(`${key}:${value}`);
      }
    }
    return formattedTags;
  }

  // 성능 측정 래퍼
  async measurePerformance(name, func, tags = {}) {
    const start = process.hrtime();
    
    try {
      const result = await func();
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      
      this.timing(`${name}.duration`, duration, tags);
      this.increment(`${name}.success`, tags);
      
      return result;
    } catch (error) {
      this.increment(`${name}.error`, {
        ...tags,
        error: error.name
      });
      throw error;
    }
  }

  // 리소스 사용량 모니터링
  recordResourceUsage() {
    const usage = process.memoryUsage();
    
    this.gauge('memory.heapTotal', usage.heapTotal);
    this.gauge('memory.heapUsed', usage.heapUsed);
    this.gauge('memory.rss', usage.rss);
    this.gauge('memory.external', usage.external);
    
    const cpuUsage = process.cpuUsage();
    this.gauge('cpu.user', cpuUsage.user);
    this.gauge('cpu.system', cpuUsage.system);
  }

  // 커넥션 풀 모니터링
  recordConnectionPoolStats(stats) {
    this.gauge('db.connections.total', stats.totalConnections);
    this.gauge('db.connections.active', stats.activeConnections);
    this.gauge('db.connections.available', stats.availableConnections);
    this.gauge('db.connections.pending', stats.pendingConnections);
  }

  // 캐시 성능 모니터링
  recordCacheStats(stats) {
    this.gauge('cache.hits', stats.hits);
    this.gauge('cache.misses', stats.misses);
    this.gauge('cache.keys', stats.keys);
    this.gauge('cache.memory', stats.memoryUsage);
    this.histogram('cache.latency', stats.latency);
  }

  // WebSocket 연결 모니터링
  recordWebSocketStats(stats) {
    this.gauge('ws.connections.total', stats.totalConnections);
    this.gauge('ws.connections.authenticated', stats.authenticatedConnections);
    this.gauge('ws.messages.sent', stats.messagesSent);
    this.gauge('ws.messages.received', stats.messagesReceived);
    this.histogram('ws.message.size', stats.messageSize);
  }
}

module.exports = new Metrics(); 