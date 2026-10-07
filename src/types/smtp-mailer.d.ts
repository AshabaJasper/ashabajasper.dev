// The patched SMTP library is aliased to avoid Auth.js's unused email-provider peer.
declare module "smtp-mailer" {
  import nodemailer from "nodemailer";
  export default nodemailer;
  export type { Transporter } from "nodemailer";
}
