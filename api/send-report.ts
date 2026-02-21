import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendReportEmail } from '../services/emailService';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Garantir que a resposta é sempre JSON
  response.setHeader('Content-Type', 'application/json');

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, session, records } = request.body;
    
    if (!email || !session || !records) {
      return response.status(400).json({ error: 'Dados incompletos para o relatório.' });
    }

    const result = await sendReportEmail(email, session, records);
    return response.status(200).json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return response.status(500).json({ 
      error: error.message || 'Erro interno no servidor de email.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
