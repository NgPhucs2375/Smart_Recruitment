import { User, Briefcase } from "lucide-react";
import { Label } from "@/components/ui/label";

interface RoleSelectorProps {
  value: string;
  onChange: (role: "UNG_VIEN" | "NGUOI_DAI_DIEN") => void;
  disabled?: boolean;
}

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-[#69727a]">
        Bạn tham gia với tư cách
      </Label>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onChange("UNG_VIEN")}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 transition-all ${
            value === "UNG_VIEN"
              ? "border-[#151515] bg-[#151515] text-white shadow-sm"
              : "border-[#d8d5ce] bg-white text-[#69727a] hover:border-[#151515]"
          }`}
        >
          <User className="size-4" />
          <span className="text-xs font-medium">Ứng viên IT</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("NGUOI_DAI_DIEN")}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 transition-all ${
            value === "NGUOI_DAI_DIEN"
              ? "border-[#151515] bg-[#151515] text-white shadow-sm"
              : "border-[#d8d5ce] bg-white text-[#69727a] hover:border-[#151515]"
          }`}
        >
          <Briefcase className="size-4" />
          <span className="text-xs font-medium">Nhà tuyển dụng</span>
        </button>
      </div>
    </div>
  );
}
