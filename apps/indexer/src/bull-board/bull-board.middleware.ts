import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import expressBasicAuth from 'express-basic-auth';
import { ConfigService } from '../config/config.service';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof expressBasicAuth>;

  constructor(config: ConfigService) {
    this.handler = expressBasicAuth({
      users: { [config.bullBoardUser]: config.bullBoardPassword },
      challenge: true,
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}
