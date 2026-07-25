import { BriefcaseBusiness, Building2, CalendarDays, User } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function ProfilePage() {
  const { name: userName, department: userDept, firstChar, subtitle: deptSubtitle } = useCurrentUser();

  const fields = [
    [User, "员工身份", "新员工"],
    [Building2, "所属部门", userDept || "未设置"],
    [BriefcaseBusiness, "当前岗位", "待与员工系统同步"],
    [CalendarDays, "入职时间", "入职第 12 天"],
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
