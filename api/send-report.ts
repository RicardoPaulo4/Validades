import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  response.setHeader('Content-Type', 'application/json');

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, session, records } = request.body;
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!email || !session || !records) {
      return response.status(400).json({ error: 'Dados incompletos para o relatório.' });
    }

    if (!brevoApiKey) {
      console.log("AVISO: BREVO_API_KEY não configurada. Modo Simulação ativo.");
      return response.status(200).json({ 
        success: true, 
        message: `Modo de Teste: Relatório para ${email} processado (configure a BREVO_API_KEY para envio real).` 
      });
    }

    // Lógica de construção do HTML (Consolidada aqui para evitar erros de import)
    const expiredCount = records.filter((r: any) => r.status === 'expired').length;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e293b; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Relatório de Validades</h1>
          <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">${session.loja} - ${session.period.toUpperCase()}</p>
        </div>
        <div style="padding: 24px;">
          <p>Olá,</p>
          <p>O operador <strong>${session.operatorName}</strong> finalizou a verificação.</p>
          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="display: block; font-size: 24px; font-weight: bold; color: #dc2626;">${expiredCount}</span>
            <span style="font-size: 12px; color: #ef4444; text-transform: uppercase;">Produtos Caducados</span>
          </div>
          <p>Consulte a aplicação para detalhes completos.</p>
        </div>
      </div>
    `;

    const recipientEmails = email.split(',').map((e: string) => e.trim()).filter((e: string) => e.length > 0);

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: "ValidaControl", email: "no-reply@validacontrol.com" },
        to: recipientEmails.map(e => ({ email: e })),
        subject: `Relatório de Validades - ${session.loja} - ${session.period.toUpperCase()}`,
        htmlContent: htmlContent
      })
    });

    const data = await brevoRes.json();

    if (!brevoRes.ok) {
      return response.status(brevoRes.status).json({ 
        error: data.message || 'Erro na API do Brevo',
        code: data.code 
      });
    }

    return response.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error('Vercel Function Error:', error);
    return response.status(500).json({ 
      error: 'Erro crítico no servidor.',
      message: error.message 
    });
  }
}
