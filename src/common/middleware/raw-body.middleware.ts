import { Request, Response, NextFunction } from 'express';
import * as getRawBody from 'raw-body';

export function rawBodyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.headers['content-type'] === 'application/json') {
    getRawBody(req, {
      length: req.headers['content-length'],
      limit: '1mb',
      encoding: true,
    })
      .then((buf) => {
        (req as any).rawBody = buf;
        next();
      })
      .catch((err) => {
        next(err);
      });
  } else {
    next();
  }
}
