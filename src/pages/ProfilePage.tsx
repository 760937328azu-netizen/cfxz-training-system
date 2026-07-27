import { BriefcaseBusiness, Building2, CalendarDays, User } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

function formatEntryDay(entryDate: string): string {
  if (!entryDate) return "待完善";
  const start = new Date(entryDate);
  const now = new Date();
  // 按本地时间计算两个日期的天数差，忽略时分秒
  const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = nowLocal.getTime() - startLocal.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const dateText = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return `${dateText}（入职第 ${days} 天）`;
}

export default function ProfilePage() {
  const { name: userName, department: userDept, position: userPosition, entryDate, firstChar, subtitle: deptSubtitle } = useCurrentUser();

  const fields = [
    [User, "员工身份", "新员工"],
    [Building2, "所属部门", userDept || "未设置"],
    [BriefcaseBusiness, "当前岗位", userPosition || "待完善"],
    [CalendarDays, "入职时间", formatEntryDay(entryDate)],
  ];

  return (
    <div className="content-enter pb-10">
      <div className="page-heading">
        <p className="!mt-0 text-xs font-semibold uppercase tracking-[.13em] text-brand">Profile</p>
        <h2 className="mt-2">个人中心</h2>
        <p>身份、部门、岗位和入职时间会决定适用的新人版本与后续岗位学习路径。</p>
      </div>
      <section className="app-surface p-8">
        <div className="flex items-center gap-5 border-b border-border-faint pb-7">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-blue text-xl font-semibold text-accent-blue-dark">
            {firstChar}
          </span>
          <div>
            <h3 className="text-xl font-semibold text-text-primary">{userName}</h3>
            <p className="mt-1 text-sm text-text-secondary">{deptSubtitle}</p>
          </div>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {fields.map(([Icon, label, value]) => {
            const IconComponent = Icon as typeof User;
            return (
              <div key={String(label)} className="app-panel flex items-center gap-4 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg-subtle text-text-secondary">
                  <IconComponent size={18} />
                </span>
                <div>
                  <p className="text-xs text-text-tertiary">{String(label)}</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">{String(value)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
