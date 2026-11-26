import type { NextFunction, Response } from 'express';
import { auth } from '../config/firebase.js';
import type { AuthenticatedRequest } from '../types/payment.js';

export async function requireFirebaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const match = req.header('authorization')?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    const decoded = await auth.verifyIdToken(match[1]!);
    req.userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid authentication token.' });
  }
}
