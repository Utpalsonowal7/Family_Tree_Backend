import mailgen from "mailgen";

const OtpEmailTemplate = (otp, name = "User") => {
     return {
          body: {
               name,
               intro: [
                    `Use the code below to complete your registration.`,
                    `<div style="text-align:center; font-size:32px; letter-spacing:8px; font-family:monospace; padding:20px; background:#f5f5f5; border-radius:8px; margin:16px 0;">
                    <strong>${otp}</strong>
                    </div>`,
                    `This code expires in <strong>5 minutes</strong>.`,
               ],
               outro: [
                    "If you did not request this, you can safely ignore this email.",
                    "Do not share this code with anyone.",
                    "গৈ নোপোৱা গাওঁ।",
               ],
          },
     };
};

const ResendOtpEmailTemplate = (otp) => {
     return {
          body: {
               name: "User",
               intro: [
                    "You requested a new OTP for your Family Tree App registration.",
                    `<div style="text-align:center; font-size:32px; letter-spacing:8px; font-family:monospace; padding:20px; background:#f5f5f5; border-radius:8px; margin:16px 0;">
                         <strong>${otp}</strong>
                    </div>`,
                    "This code expires in <strong>5 minutes</strong>.",
               ],
               outro: [
                    "If you did not request this, someone may be trying to access your account.",
                    "Do not share this code with anyone.",
               ],
          },
     };
};

export {OtpEmailTemplate, ResendOtpEmailTemplate}
