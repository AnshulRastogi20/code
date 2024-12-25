// lib/api-middleware.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { Session } from 'next-auth';

// Define the type for handler function
type AuthenticatedHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) => Promise<void | NextApiResponse>;

export const withAuth = (handler: AuthenticatedHandler) => {
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