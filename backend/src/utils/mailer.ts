// File: backend/src/utils/mailer.ts
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

/**
 * Envoie un email de vérification à l'utilisateur avec un JWT
 * signé contenant son userId.
 */
export async function sendVerificationEmail(userEmail: string, userId: string) {
    // Génère un JWT contenant l'ID utilisateur
    const token = jwt.sign(
        { userId },
        process.env.JWT_EMAIL_SECRET!,
        { expiresIn: '24h' }
    );

    // Construit le lien vers ton frontend
    const link = `${process.env.FRONTEND_URL}/verify/${token}`;

    const msg = {
        to: userEmail,
        from: process.env.EMAIL_FROM!,
        subject: '🔒 Confirmez votre adresse email',
        html: `
      <h1>Bienvenue sur Tablify</h1>
      <p>Pour valider votre compte, cliquez sur le lien ci-dessous :</p>
      <a href="${link}">Vérifier mon email</a>
      <p>Ce lien expirera dans 24 heures.</p>
    `,
    };

    await sgMail.send(msg);
}
