"use strict";
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
exports.sendVerificationEmail = sendVerificationEmail;
const mail_1 = __importDefault(require("@sendgrid/mail"));
// Vérifier que les variables d’env sont présentes
console.log('→ SENDGRID_API_KEY loaded:', Boolean(process.env.SENDGRID_API_KEY));
console.log('→ EMAIL_FROM        loaded:', process.env.EMAIL_FROM);
console.log('→ NEXT_PUBLIC_APP_URL loaded:', process.env.NEXT_PUBLIC_APP_URL);
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
function sendVerificationEmail(to, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/utilisateurs/verify-email?token=${token}`;
        const msg = {
            to,
            from: process.env.EMAIL_FROM,
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
            const [response] = yield mail_1.default.send(msg);
            console.log('→ SendGrid response status:', response.statusCode);
            console.log('→ SendGrid response headers:', response.headers);
        }
        catch (err) {
            console.error('‼️ Erreur lors de l’envoi via SendGrid:', err);
        }
    });
}
