
import Navbar from "../components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.state?.mode || "signup";

  const roles = [
    {
      id: "admin",
      title: "Admin",
      icon: "/images/roles/admin.png",
    },
    {
      id: "user",
      title: "User",
      icon: "/images/roles/user.png",
    },
  ];

  const handleRoleSelect = (role) => {
    navigate(`/${mode}/${role}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Navbar />

      {/* Main container */}
      <div className="pt-32 px-4 flex justify-center">
        <div className="w-full max-w-6xl border border-cyan-400/60 rounded-3xl px-6 py-16 sm:px-10">

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-16 pb-8 border-b border-cyan-500/30">
            Select your Role
          </h1>

          {/* Roles container: Increased vertical gap (gap-y-24) for mobile screens */}
          <div className="
            flex
            flex-col
            lg:flex-row
            lg:flex-nowrap
            gap-y-24
            lg:gap-x-10
            justify-center
            items-center
          ">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className="
                  group
                  cursor-pointer
                  relative
                  w-full
                  max-w-sm
                  bg-gradient-to-br from-[#0f172a] to-[#020617]
                  rounded-2xl
                  px-8
                  pt-20
                  pb-12
                  text-center
                  border border-cyan-500/30
                  transition-all
                  duration-300
                  hover:scale-105
                  hover:shadow-xl
                  hover:shadow-cyan-500/30
                "
              >
                {/* Icon */}
                <div
                  className="
                    absolute
                    -top-12
                    left-1/2
                    -translate-x-1/2
                    h-24
                    w-24
                    rounded-full
                    bg-[#111827]
                    flex
                    items-center
                    justify-center
                    border border-cyan-400/40
                    overflow-hidden
                  "
                >

                  <img
                    src={role.icon}
                    alt={`${role.title} role`}
                    className="h-24 w-24 object-contain"
                  />
                </div>

                {/* Role name */}
                <h2 className="text-xl sm:text-2xl font-semibold">
                  {role.title}
                </h2>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

