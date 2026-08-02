import { Controller, Get } from '@nestjs/common';
import * as os from 'node:os';
import { AppService } from './app.service';
import { Roles } from './common/decorators/roles.decorator';
import { StaffRole } from './common/enums';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /// M-255: the deployment platform (Dokploy) exposes no container-level CPU/
  /// memory stats endpoint at the project-scoped API key access level, and no
  /// host SSH access exists in this project's records — leaving NFR backend
  /// resource-usage measurement genuinely unreachable. Node can report its own
  /// process memory and the container's OS-level CPU load directly, which
  /// gives a real number without needing external infra access.
  @Roles(StaffRole.SUPER_ADMIN)
  @Get('health/stats')
  getStats() {
    const mem = process.memoryUsage();
    const cpus = os.cpus();

    return {
      process: {
        uptime_seconds: Math.round(process.uptime()),
        rss_mb: round1(mem.rss / 1024 / 1024),
        heap_used_mb: round1(mem.heapUsed / 1024 / 1024),
        heap_total_mb: round1(mem.heapTotal / 1024 / 1024),
        external_mb: round1(mem.external / 1024 / 1024),
      },
      system: {
        cpu_count: cpus.length,
        // 1/5/15-minute load averages — on Linux these are already
        // normalised against core count by the kernel, so a value near 1.0
        // per core means fully loaded, not necessarily overloaded.
        load_average: os.loadavg().map((v) => round1(v)),
        total_memory_mb: round1(os.totalmem() / 1024 / 1024),
        free_memory_mb: round1(os.freemem() / 1024 / 1024),
      },
      captured_at: new Date().toISOString(),
    };
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
