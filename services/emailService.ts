import { Resend } from 'resend';

export const sendReportEmail = async (email: string, session: any, records: any) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  if (!resend) {
    console.log("--- MOCK EMAIL REPORT ---");
    console.log("To:", email);
    console.log("Subject:", `Relatório de Validades - ${session.loja} - ${session.period.toUpperCase()}`);
    console.log("Records Count:", records.length);
    console.log("--------------------------");
    return { 
      success: true, 
      message: "Modo de Teste: O relatório foi gerado com sucesso para " + email + " (ver logs do servidor)." 
    };
  }

  const expiredCount = records.filter((r: any) => r.status === 'expired').length;
  const warningCount = records.filter((r: any) => r.status === 'expiring_soon').length;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background: #1e293b; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Relatório de Validades</h1>
        <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">${session.loja} - ${session.period.toUpperCase()}</p>
      </div>
      <div style="padding: 24px;">
        <p>Olá,</p>
        <p>O operador <strong>${session.operatorName}</strong> finalizou a verificação de validades.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center;">
            <span style="display: block; font-size: 24px; font-weight: bold;">${records.length}</span>
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Total Verificado</span>
          </div>
          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; text-align: center;">
            <span style="display: block; font-size: 24px; font-weight: bold; color: #dc2626;">${expiredCount}</span>
            <span style="font-size: 12px; color: #ef4444; text-transform: uppercase;">Caducados</span>
          </div>
        </div>

        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 8px;">Detalhes dos Registos:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase;">
              <th style="padding: 8px 0;">Produto</th>
              <th style="padding: 8px 0;">Validade</th>
              <th style="padding: 8px 0;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${records.map((r: any) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 0; font-weight: bold;">${r.nome_produto}</td>
                <td style="padding: 12px 0; font-size: 14px;">${new Date(r.data_validade).toLocaleDateString('pt-PT')} ${r.hora_registo !== 'N/A' ? `@ ${r.hora_registo}` : ''}</td>
                <td style="padding: 12px 0;">
                  <span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; ${
                    r.status === 'expired' ? 'background: #fee2e2; color: #991b1b;' : 
                    r.status === 'expiring_soon' ? 'background: #fef3c7; color: #92400e;' : 
                    'background: #ecfdf5; color: #065f46;'
                  }">
                    ${r.status === 'expired' ? 'Caducado' : r.status === 'expiring_soon' ? 'Atenção' : 'OK'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        Enviado via ValidaControl PWA
      </div>
    </div>
  `;

  const recipients = email.split(',').map((e: string) => e.trim()).filter((e: string) => e.length > 0);
  
  if (recipients.length === 0) {
    throw new Error("Nenhum email válido fornecido.");
  }

  const { data, error } = await resend.emails.send({
    from: 'ValidaControl <onboarding@resend.dev>',
    to: recipients,
    subject: `Relatório de Validades - ${session.loja} - ${session.period.toUpperCase()}`,
    html: htmlContent,
  });

  if (error) {
    throw error;
  }

  return { success: true, data };
};
