import type { ReactNode } from "react";

type LoginBenefitProps = {
  icon: ReactNode;
  title: string;
  text: string;
};

export function LoginBenefit({ icon, title, text }: LoginBenefitProps) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className="
          grid size-9 shrink-0 place-items-center
          rounded-lg
          bg-white/[0.08]
          text-teal-200
        "
      >
        {icon}
      </span>

      <div className="min-w-0">
        <strong className="block text-xs font-bold text-white">{title}</strong>

        <p className="mt-0.5 text-[10px] leading-5 text-slate-400">{text}</p>
      </div>
    </div>
  );
}
