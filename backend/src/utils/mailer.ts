import sgMail from '@sendgrid/mail';

// Vérifier que les variables d’env sont présentes
console.log('→ SENDGRID_API_KEY loaded:', Boolean(process.env.SENDGRID_API_KEY));
console.log('→ EMAIL_FROM        loaded:', process.env.EMAIL_FROM);
console.log('→ NEXT_PUBLIC_APP_URL loaded:', process.env.NEXT_PUBLIC_APP_URL);

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/utilisateurs/verify-email?token=${token}`;
    const msg = {
        to,
        from: process.env.EMAIL_FROM!,
        subject: 'Veuillez vérifier votre adresse email',
        html: `
      <p>Bonjour,</p>
      <p>Merci pour votre inscription. Pour vérifier votre email, cliquez sur :</p>
      <p><a href="${verifyUrl}">Valider mon email</a></p>
      <p>Ce lien expire dans 24 heures.</p>
    `,
    };

    console.log(`→ Envoi du mail à ${to}…`);
    try {
        const [response] = await sgMail.send(msg);
        console.log('→ SendGrid response status:', response.statusCode);
        console.log('→ SendGrid response headers:', response.headers);
    } catch (err: any) {
        console.error('‼️ Erreur lors de l’envoi via SendGrid:', err);
    }
}
