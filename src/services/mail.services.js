import Mailgen from "mailgen";

const mailGenerator = new Mailgen({
     theme: "default",
     product: {
          name: "Family Tree App",
          link: "https://familytreeapp.com",
          logo:"https://tlink.up.railway.app/gtM_1_1OXl"
     },
});

export const sendEmail = async (options) => {
     const htmlMail = mailGenerator.generate(options.mailgenContent);
     const plainMail = mailGenerator.generatePlaintext(options.mailgenContent);

     try {
          const res = await fetch("https://api.brevo.com/v3/smtp/email", {
               method: "POST",
               headers: {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "api-key": process.env.BREVO_API_KEY,
               },
               body: JSON.stringify({
                    sender: { name: "Family Tree App", email: process.env.BREVO_FROM },
                    to: [{ email: options.email }],
                    subject: options.subject,
                    htmlContent: htmlMail,
                    textContent: plainMail,
               }),
          });

          const data = await res.json();

          if (!res.ok) {
               console.error("❌ Brevo error:", data);
               throw new Error(data.message || "Email failed");
          }

          console.log("✅ Email sent:", data.messageId);
     } catch (err) {
          console.error("❌ Error sending email:", err.message);
          throw err;
     }
};