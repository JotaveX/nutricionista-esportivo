import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

const isValidApiKey = (apiKey: string): boolean => {
    const expected = process.env.API_KEY;
    if (!expected || apiKey.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected));
};

const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'];

    if (typeof apiKey !== 'string' || !isValidApiKey(apiKey)) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    next();
};

export default apiKeyMiddleware