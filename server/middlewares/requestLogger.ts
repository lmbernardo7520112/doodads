// server/middlewares/requestLogger.ts
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export default function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // request-id: reutiliza se já vier do cliente, senão cria
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();
  res.setHeader("X-Request-Id", requestId);
  (req as any).requestId = requestId;

  // registra cabeçalho Authorization existência (sem vazar token completo)
  const authHeader = req.headers.authorization || req.headers.Authorization || null;
  const authPresent = !!authHeader;
  const authSample = authHeader ? String(authHeader).slice(-16) : null;

  const ip = req.ip || (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

  // body size (se disponível)
  let bodySize = 0;
  try {
    if (req.body) {
      if (typeof req.body === "string") bodySize = Buffer.byteLength(req.body);
      else bodySize = Buffer.byteLength(JSON.stringify(req.body));
    }
  } catch {}

  console.log(
    `➡️ [req] id=${requestId} method=${req.method} url=${req.originalUrl} ip=${ip} auth=${authPresent} authSample=${authSample} bodySize=${bodySize}`
  );

  // intercepta finish para log de resposta e duração
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `⬅️ [res] id=${requestId} status=${res.statusCode} duration=${duration}ms method=${req.method} url=${req.originalUrl}`
    );
  });

  next();
}
