import { SignupForm } from "@/components/signup-form";


export default function Login() {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-deakinTeal/50 bg-cover bg-center relative"
      // style={{ 
      //   backgroundImage: `linear-gradient(to bottom, rgba(217, 217, 217, 0.2), rgba(115, 115, 115, 0.7)), url(/Deakin_background.jpg)` 
      // }}
    >
      <SignupForm/>
    </div>
  );
}

