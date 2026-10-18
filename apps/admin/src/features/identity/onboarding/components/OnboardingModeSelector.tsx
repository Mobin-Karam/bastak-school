import { SlidersHorizontal, WandSparkles } from "lucide-react";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { useLocale } from "../../../shared/ui/locale";
import { onboardingCopy } from "../onboarding-locale";
import type { OnboardingMode } from "../types/onboarding.types";

export function OnboardingModeSelector({
  value,
  onChange,
}: {
  value: OnboardingMode;
  onChange: (mode: OnboardingMode) => void;
}) {
  const { language } = useLocale();
  const copy = onboardingCopy(language);
  return (
    <SegmentedControl
      value={value}
      onValueChange={onChange}
      ariaLabel={copy.modeLabel}
      className="w-full"
      options={
        [
          {
            value: "AUTO",
            label: (
              <span className="inline-flex items-center gap-2">
                <WandSparkles size={15} aria-hidden="true" />
                {copy.auto}
              </span>
            ),
            title: copy.autoHint,
          },
          {
            value: "MANUAL",
            label: (
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal size={15} aria-hidden="true" />
                {copy.manual}
              </span>
            ),
            title: copy.manualHint,
          },
        ] as const
      }
    />
  );
}
