import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Button, Card, Checkbox, Field, Input, Select, Textarea } from "./ui";

const meta = {
  title: "Shared/UI/Primitives",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controls: Story = {
  render: function ControlsStory() {
    const [checked, setChecked] = useState(true);
    return (
      <div className="grid max-w-2xl gap-6" dir="rtl">
        <Card className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>ذخیره تغییرات</Button>
            <Button variant="soft">انصراف</Button>
            <Button variant="danger">حذف</Button>
            <Button variant="ghost">جزئیات</Button>
            <Button loading loadingLabel="در حال ذخیره" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">فعال</Badge>
            <Badge tone="amber">در انتظار</Badge>
            <Badge tone="red">نیازمند رسیدگی</Badge>
          </div>
        </Card>

        <Card className="grid gap-4">
          <Field
            label="نام و نام خانوادگی"
            description="این نام در پرونده دانش‌آموز نمایش داده می‌شود."
          >
            <Input defaultValue="عبدالله احمدی" />
          </Field>
          <Field label="پایه تحصیلی">
            <Select defaultValue="grade-8">
              <option value="grade-7">هفتم</option>
              <option value="grade-8">هشتم</option>
              <option value="grade-9">نهم</option>
            </Select>
          </Field>
          <Field label="یادداشت">
            <Textarea placeholder="یادداشت تکمیلی…" />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-ink))]">
            <Checkbox checked={checked} onCheckedChange={setChecked} />
            ارسال اعلان به سرپرست
          </label>
        </Card>
      </div>
    );
  },
};
