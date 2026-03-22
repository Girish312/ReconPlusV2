import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function SignupSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  // role passed from signup page
  const role = location.state?.role || "user";

  return (
    <div 
      className="min-h-screen text-white bg-cover bg-no-repeat bg-fixed"
      style={{
        backgroundImage: "url('/images/backgrounds/signin-bg.png')",
      }}
    >
      <Navbar />

      <div className="pt-32 px-4 flex justify-center items-center">
        {/* Added backdrop-blur-sm to make the card pop against the background image */}
        <div className="w-full max-w-md bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl px-10 py-14 text-center shadow-2xl backdrop-blur-sm">

          {/* Title */}
          <h1 className="text-3xl font-bold mb-8">
            Sign Up Successful
          </h1>

          {/* Check Icon */}
          <div className="flex justify-center mb-10">
            <div className="h-28 w-28 rounded-full border-4 border-white flex items-center justify-center">
              <span className="text-6xl">✓</span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => navigate(`/signin/${role}`)}
            className="w-full py-3 rounded-md bg-[#34B3DD] text-white font-semibold hover:bg-cyan-300 transition"
          >
            Sign In Here
          </button>

        </div>
      </div>
    </div>
  );
}
