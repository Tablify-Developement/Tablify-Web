"use strict";
// backend/src/utils/mailService.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReservationConfirmation = sendReservationConfirmation;
exports.sendReservationCancellation = sendReservationCancellation;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const logger_1 = require("./logger");
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
/**
 * Envoie un e-mail de confirmation de réservation.
 */
function sendReservationConfirmation(to, details) {
    return __awaiter(this, void 0, void 0, function* () {
        const { date, time, restaurantName, restaurantAddress } = details;
        const msg = {
            to,
            from: process.env.EMAIL_FROM,
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
            yield mail_1.default.send(msg);
            logger_1.logger.info(`E-mail de confirmation envoyé à ${to}`);
        }
        catch (error) {
            logger_1.logger.error("Échec de l'envoi du mail de confirmation");
            logger_1.logger.error(error);
            throw error;
        }
    });
}
/**
 * Envoie un e-mail de confirmation d'annulation de réservation.
 */
function sendReservationCancellation(to, customerName) {
    return __awaiter(this, void 0, void 0, function* () {
        const msg = {
            to,
            from: process.env.EMAIL_FROM,
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
            yield mail_1.default.send(msg);
            logger_1.logger.info(`E-mail d'annulation envoyé à ${to}`);
        }
        catch (error) {
            logger_1.logger.error("Échec de l'envoi du mail d'annulation");
            logger_1.logger.error(error);
            throw error;
        }
    });
}
