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
 * Envoie un e-mail d’accusé de réception de la demande de réservation.
 */
export async function sendReservationAcknowledgment(
    to: string,
    { date, time, restaurantName, restaurantAddress }: ReservationDetails
) {
    const msg = {
        to,
        from: process.env.EMAIL_FROM!,
        subject: "Nous avons bien reçu votre demande de réservation",
        text: `
Bonjour,

Nous avons bien reçu votre demande de réservation au restaurant ${restaurantName}.
${restaurantAddress ? `Adresse : ${restaurantAddress}\n` : ""}Date : ${date}\nHeure : ${time}\n
Votre demande est en cours de traitement. Vous serez informé(e) dès que le restaurateur la confirmera.

Merci de votre patience !`,
        html: `
<p>Bonjour,</p>
<p>Nous avons bien reçu votre demande de réservation au restaurant <strong>${restaurantName}</strong>.</p>
${restaurantAddress ? `<p><strong>Adresse :</strong> ${restaurantAddress}</p>` : ""}
<p><strong>Date :</strong> ${date}</p>
<p><strong>Heure :</strong> ${time}</p>
<p>Votre demande est en cours de traitement. Vous serez informé(e) dès que le restaurateur la confirmera.</p>
<p>Merci de votre patience !</p>
`,
    };

    try {
        await sgMail.send(msg);
        logger.info(`Email d’accusé de réception envoyé à ${to}`);
    } catch (error: any) {
        logger.error("Échec de l’envoi de l’email d’accusé de réception");
        logger.error(error);
        throw error;
    }
}

/**
 * Envoie un e-mail de confirmation finale une fois que le restaurateur a validé la réservation.
 */
export async function sendReservationValidated(
    to: string,
    { date, time, restaurantName, restaurantAddress }: ReservationDetails
) {
    const msg = {
        to,
        from: process.env.EMAIL_FROM!,
        subject: "Votre réservation est confirmée !",
        text: `
Bonjour,

Votre réservation au restaurant ${restaurantName} a été acceptée et est désormais confirmée.
${restaurantAddress ? `Adresse : ${restaurantAddress}\n` : ""}Date : ${date}\nHeure : ${time}\n
Nous nous réjouissons de vous accueillir !`,
        html: `
<p>Bonjour,</p>
<p>Votre réservation au restaurant <strong>${restaurantName}</strong> a été acceptée et est désormais confirmée.</p>
${restaurantAddress ? `<p><strong>Adresse :</strong> ${restaurantAddress}</p>` : ""}
<p><strong>Date :</strong> ${date}</p>
<p><strong>Heure :</strong> ${time}</p>
<p>Nous nous réjouissons de vous accueillir !</p>
`,
    };

    try {
        await sgMail.send(msg);
        logger.info(`Email de confirmation finale envoyé à ${to}`);
    } catch (error: any) {
        logger.error("Échec de l’envoi de l’email de confirmation finale");
        logger.error(error);
        throw error;
    }
}

/**
 * Envoie un e-mail de notification d'annulation de réservation.
 */
export async function sendReservationCancellation(
    to: string,
    customerName: string
) {
    const msg = {
        to,
        from: process.env.EMAIL_FROM!,
        subject: "Votre réservation a été annulée",
        text: `
Bonjour,

Votre réservation pour ${customerName} a été annulée.

Si vous avez des questions, n’hésitez pas à nous contacter.
`,
        html: `
<p>Bonjour,</p>
<p>Votre réservation pour <strong>${customerName}</strong> a été annulée.</p>
<p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
`,
    };

    try {
        await sgMail.send(msg);
        logger.info(`Email d'annulation envoyé à ${to}`);
    } catch (error: any) {
        logger.error("Échec de l’envoi de l’email d’annulation");
        logger.error(error);
        throw error;
    }
}
