/**
 * 请求限流中间件
 * 防止暴力破解登录接口
 */

import rateLimit from "express-rate-limit";

// 登录接口限流：每个 IP 15 分钟内最多 10 次尝试
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 最多 10 次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "登录尝试过于频繁，请 15 分钟后再试",
  },
});

// 通用 API 限流：每个 IP 每分钟最多 100 次请求
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 100, // 最多 100 次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "请求过于频繁，请稍后再试",
  },
});
