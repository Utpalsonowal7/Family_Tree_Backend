import Mailgen from "mailgen";
import nodemailer from "nodemailer";

export const sendEmail = async (options) => {

     const mailGenerator = new Mailgen({
          theme: "default",
          product: {     
               name: "Family Tree App",
               link: "https://familytreeapp.com",
               logo: "https://tlink.up.railway.app/gtM_1_1OXl",
          },
     });

     const htmlMail = mailGenerator.generate(options.mailgenContent);
     const plainMail = mailGenerator.generatePlaintext(options.mailgenContent);

     const transporter = nodemailer.createTransport({
          host: process.env.MAIL_GOOGLE_HOST,
          port: process.env.MAIL_GOOGLE_PORT,
          secure: false,
          auth: {
               user: process.env.MAIL_GOOGLE_USER,
               pass: process.env.MAIL_GOOGLE_PASS,
          },
     });

     const mailOptions = {
          from: `"Family Tree App"  <${process.env.BREVO_FROM}>`,
          to: options.email,
          subject: options.subject,
          text: plainMail,
          html: htmlMail,
     };


     try {
          const info = await transporter.sendMail(mailOptions);
          console.log("✅ Message sent:", info.messageId);

          if (info.rejected.length > 0) {
               console.warn("Some recipients were rejected:", info.rejected);
          }
     } catch (err) {
          console.error("❌ Error sending email:", err);
          console.error("Mail server is failing to send email. Please check your mail server configuration and credentials.");
     }
}