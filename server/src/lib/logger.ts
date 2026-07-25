/**
 * 操作日志工具
 * 将管理员操作写入 admin_operation_logs 表
 */

import { prisma } from "../lib/prisma";

export async function logAdminAction(data: {
  adminId?: string;
  adminName: string;
  action: string;
  targetType: "employee" | "batch" | "admin" | "system";
  targetId?: string;
  targetName?: string;
  details?: string;
}) {
  try {
    await prisma.adminOperationLog.create({
      data: {
        adminId: data.adminId || null,
        adminName: data.adminName,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId || null,
        targetName: data.targetName || null,
        details: data.details || null,
      },
    });
  } catch (err) {
    console.error("[logAdminAction] 写入操作日志失败:", err);
  }
}

export async function logLearningEvent(data: {
  userId: string;
  eventType: string;
  stageId?: string;
  result?: string;
}) {
  try {
    await prisma.learningEvent.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        stageId: data.stageId || null,
        result: data.result || null,
      },
    });
  } catch (err) {
    console.error("[logLearningEvent] 写入学习事件失败:", err);
  }
}
