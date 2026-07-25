# Phase 3 第一轮交付｜第三关数字文化馆

## 第二轮内容密度与中文排版升级

- 四个展区不再复用相同卡片模板，分别采用故事主视觉、Logo 记忆互动、微缩工艺路径和中心关系构图。
- 左侧参观路线加宽，事实审核面板移到主内容下方，避免压缩中央叙事空间。
- 新增全局中文排版规范与 `typography-regression.cjs`，1440 / 1600 / 1920 三档逐字符检测孤行与残行。
- 独立卡片边框显著减少，知识点改由留白、分割线、排版层级和大视觉组织。

## 完整用户流程

成长地图进入第三关 → 红瑶女性与长发文化 → Logo 故事 → 完成“发式轮廓与品牌 Logo”记忆互动 → 淘米水非遗技艺 → 按顺序完成“取米、淘洗、发酵、检查、提取” → 中国长发科技馆 → 点亮四类场馆角色 → 完成第三关 → 返回地图 → 第三枚徽章点亮 → 第四关开放。

## 场景语音映射

- `red_yao_culture`：第三关第一展区，可复用现有音色，正式音频文件待接入。
- `brand_logo_story`：第三关第二展区，需要根据 V4 Logo 故事重新录制。
- `rice_water`：第三关第三展区，可复用现有音色，正式音频文件待接入。
- `technology_museum`：第三关第四展区，可复用现有音色，正式音频文件待接入。
- `museum_entry`：保留配置，当前脚本需审核后再决定是否使用。
- `journey_map`：六关结构已变化，需要重新录制。
- `longshen_rice`、`spring_water`、`four_barriers`、`scalp_microbiome`、`company_history`：保留待配置，业务审核后再正式使用。

## pendingReview 内容

- 真实红瑶女性与不同人生阶段发式图片、准确文化说明。
- “乌龙盘发”与品牌 Logo 的正式视觉溯源材料。
- 淘米水发酵后的活性成分、科研功效和技术参数。
- 中国长发科技馆具体科研成果、社会项目与展陈资料。
- 桂林科技馆、广州营销公司、生产基地的 VR / 全景素材。

## 主要文件

- `src/pages/CultureMuseumPage.tsx`
- `src/data/cultureStageData.ts`
- `src/hooks/useLearningProgress.ts`
- `src/data/voiceCatalog.ts`
- `src/components/VoiceGuide.tsx`
- `src/components/GrowthMap.tsx`（仅接入状态，未调整地图结构）
- `src/components/WelcomeArea.tsx`
- `src/components/CurrentStation.tsx`
- `src/components/MyTasks.tsx`
- `src/App.tsx`
- `src/index.css`

## 验证结果

- TypeScript：通过。
- Vite production build：通过。
- 浏览器 Console error / warning：0。
- 第三关完整互动：通过。
- 关卡完成后地图状态更新：通过。
- 1440 / 1600 / 1920 第三关页面：无横向溢出。
- GrowthMap 回归：三档均通过；徽章、文字、路径边界正常，碰撞为 0。
