// backend/src/utils/mailService.ts

import sgMail from "@sendgrid/mail";
import { logger } from "./logger";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface ReservationDetails {
    date: string;           // ex. "2025-05-01"
    time: string;           // ex. "19:30"
    restaurantName: string;
    restaurantAddress?: string;
}

/**
 * Envoie un e-mail de confirmation de réservation.
 */
export async function sendReservationConfirmation(
    to: string,
    details: ReservationDetails
): Promise<void> {
    const { date, time, restaurantName, restaurantAddress } = details;

    const msg = {
        to,
        from: process.env.EMAIL_FROM!,
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
        logger.error("Échec de l'envoi du mail de confirmation");
        logger.error(error);
        throw error;
    }
}

/**
 * Envoie un e-mail de confirmation d'annulation de réservation.
 */
export async function sendReservationCancellation(
    to: string,
    customerName: string
): Promise<void> {
    const msg = {
        to,
        from: process.env.EMAIL_FROM!,
        subject: "Annulation de votre réservation",
        text: `
Bonjour ${customerName},

Votre réservation a été annulée avec succès.

Merci de nous avoir prévenus.

À bientôt !
    `,
        html: `
      <p>Bonjour ${customerName},</p>
      <p>Votre réservation a été <strong>annulée</strong> avec succès.</p>
      <p>Merci de nous avoir prévenus.</p>
      <p>À bientôt !</p>
    `,
    };

    try {
        await sgMail.send(msg);
        logger.info(`E-mail d'annulation envoyé à ${to}`);
    } catch (error: any) {
        logger.error("Échec de l'envoi du mail d'annulation");
        logger.error(error);
        throw error;
    }
}
