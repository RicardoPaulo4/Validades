import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendReportEmail } from '../services/emailService.ts';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, session, records } = request.body;
    const result = await sendReportEmail(email, session, records);
    return response.status(200).json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return response.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
