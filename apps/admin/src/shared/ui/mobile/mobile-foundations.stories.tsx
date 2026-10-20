import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChartNoAxesColumn, Home, Users } from "lucide-react";

import {
  StatisticCard,
  ProgressIndicator,
  ProgressRing,
  StatusBadge,
  Timeline,
} from "./data-display";
import { MobileSkeleton, OfflineBanner, UndoAction } from "./feedback";
import {
  MobileCard,
  MobileGrid,
  MobilePageContainer,
  MobileSection,
  MobileStack,
  PageHeader,
} from "./layout";
import { MobileBottomNavigation, MobileHeader, StickyActionBar } from "./navigation";
import { Button } from "../ui";

const meta = {
  title: "Shared/Mobile foundations",
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile1" } },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardSurface: Story = {
  render: () => (
    <MobilePageContainer>
      <MobileStack gap="lg">
        <MobileHeader
          title={<strong>داشبورد دانش‌آموز</strong>}
          end={
            <Button size="icon" variant="ghost" aria-label="اعلان‌ها">
              ۳
            </Button>
          }
        />
        <PageHeader title="امروز" description="برنامه و روند یادگیری شما" />
        <MobileGrid>
          <StatisticCard label="حضور این ماه" value="۹۴٪" trend="۴٪ بهتر از ماه قبل" />
          <StatisticCard label="تکلیف باز" value="۳" />
        </MobileGrid>
        <MobileSection title="پیشرفت هفتگی">
          <MobileCard className="grid gap-4">
            <ProgressIndicator value={72} label="مطالعهٔ هدفمند" />
            <div className="flex items-center gap-4">
              <ProgressRing value={72} label="پیشرفت" />
              <StatusBadge tone="success">در مسیر هدف</StatusBadge>
            </div>
          </MobileCard>
        </MobileSection>
        <MobileSection title="رویدادهای امروز">
          <Timeline
            items={[
              { title: "کلاس فقه", time: "۰۸:۰۰" },
              { title: "تحویل تمرین", description: "تا پایان روز", time: "۱۷:۰۰" },
            ]}
          />
        </MobileSection>
        <OfflineBanner />
        <MobileSkeleton lines={2} />
        <UndoAction onUndo={() => undefined} />
        <StickyActionBar
          primaryAction={<Button>ثبت حضور</Button>}
          secondaryAction={<Button variant="soft">بعداً</Button>}
        />
        <MobileBottomNavigation
          currentPath="/"
          items={[
            { path: "/", label: "خانه", icon: <Home />, onSelect: () => undefined },
            { path: "/students", label: "دانش‌آموزان", icon: <Users />, onSelect: () => undefined },
            {
              path: "/reports",
              label: "گزارش",
              icon: <ChartNoAxesColumn />,
              onSelect: () => undefined,
            },
          ]}
        />
      </MobileStack>
    </MobilePageContainer>
  ),
};
