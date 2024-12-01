// lib/api-middleware.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';

export const withAuth = (handler: Function) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      return await handler(req, res, session);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};