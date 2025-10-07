import { Check, X } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
}

const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const requirements = [
    {
      text: "Minst 8 tecken",
      met: password.length >= 8,
    },
    {
      text: "Innehåller stor bokstav",
      met: /[A-Z]/.test(password),
    },
    {
      text: "Innehåller liten bokstav",
      met: /[a-z]/.test(password),
    },
    {
      text: "Innehåller siffra",
      met: /[0-9]/.test(password),
    },
  ];

  return (
    <div className="space-y-2 mt-2">
      {requirements.map((req, index) => (
        <div
          key={index}
          className={`flex items-center gap-2 text-xs transition-colors ${
            req.met ? "text-green-600" : "text-destructive"
          }`}
        >
          {req.met ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
          <span>{req.text}</span>
        </div>
      ))}
    </div>
  );
};

export default PasswordRequirements;
