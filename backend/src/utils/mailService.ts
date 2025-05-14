// backend/src/utils/mailService.ts

import sgMail from "@sendgrid/mail";
import { logger } from "./logger";  // ou "../utils/logger" selon ton arborescence

// Initialise SendGrid avec la clé de l'environnement
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface ReservationDetails {
    date: string;           // ex. "2025-05-01"
    time: string;           // ex. "19:30"
    restaurantName: string;
    restaurantAddress?: string;
}

/**
 * Envoie un e-mail de confirmation de réservation.
 *
 * @param to - l'adresse e-mail du client
 * @param details - les détails de la réservation
 */
export async function sendReservationConfirmation(
    to: string,
    details: ReservationDetails
): Promise<void> {
    const { date, time, restaurantName, restaurantAddress } = details;

    const msg = {
        to,
        from: process.env.EMAIL_FROM!,    // Doit être validé dans SendGrid
        subject: "Confirmation de votre réservation",
        text: `
Bonjour,

Votre réservation est confirmée :

• Restaurant : ${restaurantName}
${restaurantAddress ? `• Adresse : ${restaurantAddress}` : ""}
• Date : ${date}
• Heure : ${time}

Merci de votre confiance !
    `,
        html: `
      <p>Bonjour,</p>
      <p>Votre réservation est <strong>confirmée</strong> :</p>
      <ul>
        <li><strong>Restaurant :</strong> ${restaurantName}</li>
        ${restaurantAddress ? `<li><strong>Adresse :</strong> ${restaurantAddress}</li>` : ""}
        <li><strong>Date :</strong> ${date}</li>
        <li><strong>Heure :</strong> ${time}</li>
      </ul>
      <p>Merci de votre confiance !</p>
    `,
    };

    try {
        await sgMail.send(msg);
        logger.info(`E-mail de confirmation envoyé à ${to}`);
    } catch (error: any) {
        // Premier log : message d’erreur générique
        logger.error("Échec de l'envoi du mail de confirmation");
        // Puis log de l’erreur détaillée
        logger.error(error);
        throw error;
    }
}
