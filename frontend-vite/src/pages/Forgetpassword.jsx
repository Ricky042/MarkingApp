// Page that allows you to signup, can access login from here

import { ForgetPasswordForm } from "@/components/forgetpassword-form";

export default function changePassword() {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-deakinTeal/50 bg-cover bg-center relative"
      // style={{ 
      //   backgroundImage: `linear-gradient(to bottom, rgba(217, 217, 217, 0.2), rgba(115, 115, 115, 0.7)), url(/Deakin_background.jpg)` 
      // }}
    >
      <ForgetPasswordForm/>
    </div>
  );
}
