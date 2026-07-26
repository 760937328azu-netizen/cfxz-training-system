"""验证科技馆重构后渲染正确（直接 localStorage 登录）"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

URL = "https://2d5329ea2e784d98938c627be139d66b.app.codebuddy.work"
OUT = Path("C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了/scripts/verify-out")
OUT.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        page.on("pageerror", lambda err: print(f"  [PAGE ERROR] {err}"))
        # 先打开域名以设置 localStorage
        await page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(500)
        # 设置登录态
        await page.evaluate("""() => {
            const keys = {
                'cfxz-user-session': '1',
                'cfxz-user-name': '小瑶',
                'cfxz-user-department': '品牌部',
            };
            Object.entries(keys).forEach(([k, v]) => localStorage.setItem(k, v));
        }""")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1500)
        # 通过 hash 跳到文化馆
        await page.evaluate("window.location.hash = '#/stage/culture'")
        await page.wait_for_timeout(1200)
        # 兜底：通过 evaluate 直接调内部 navigate 不行
        # 让我们看看实际 hash 路由
        await page.screenshot(path=str(OUT / "00-after-reload.png"), full_page=False)
        # 看侧边栏有没有"文化馆"按钮
        sidebar_buttons = page.locator("aside button, aside a").all()
        for b in sidebar_buttons:
            try:
                txt = await b.inner_text()
                if "文化" in txt:
                    print(f"  sidebar: {txt[:30]}")
            except Exception:
                pass
        # 用 evaluate 找页面上可点击的"进入展区"或"科技馆"按钮
        try:
            tab = page.locator("button:has-text('中国长发科技馆')").first
            await tab.click(timeout=3000)
            await page.wait_for_timeout(1000)
            print("  clicked 中国长发科技馆 tab")
        except Exception as e:
            print(f"  click 科技馆 tab failed: {e}")
        await page.screenshot(path=str(OUT / "00b-tab-clicked.png"), full_page=False)
        # 然后找 technology-museum tab
        try:
            tech_tabs = page.locator("button.culture-exhibit-tab")
            n = await tech_tabs.count()
            print(f"  culture-exhibit-tab count: {n}")
            for i in range(n):
                txt = await tech_tabs.nth(i).inner_text()
                if "科技馆" in txt or "长发科技" in txt or "中国长发" in txt:
                    await tech_tabs.nth(i).click()
                    print(f"  opened: {txt[:50]}")
                    break
            await page.wait_for_timeout(1500)
        except Exception as e:
            print(f"  tech tab open failed: {e}")
        await page.screenshot(path=str(OUT / "01-tech-entry.png"), full_page=False)
        # 6. 检查 acts
        acts = page.locator(".museum-act")
        n = await acts.count()
        print(f"  museum-act count: {n}")
        if n == 0:
            print("  FAILED: no museum-act rendered")
            await browser.close()
            return
        # 7. 序厅
        await page.evaluate("document.querySelector('.museum-act--prologue')?.scrollIntoView({behavior:'instant', block:'start'})")
        await page.wait_for_timeout(700)
        await page.screenshot(path=str(OUT / "02-prologue.png"), full_page=False)
        # 8. 一楼轮播 4 张
        for i in range(4):
            await page.evaluate("document.querySelector('.museum-act--floor.is-warm')?.scrollIntoView({behavior:'instant', block:'start'})")
            await page.wait_for_timeout(400)
            if i > 0:
                try:
                    await page.locator(".museum-act--floor.is-warm .museum-floor-arrow").nth(1).click(timeout=3000)
                    await page.wait_for_timeout(500)
                except Exception:
                    pass
            await page.screenshot(path=str(OUT / f"03-floor1-frame{i+1}.png"), full_page=False)
        # 9. 上楼转场
        await page.evaluate("document.querySelector('.museum-act--stairway')?.scrollIntoView({behavior:'instant', block:'start'})")
        await page.wait_for_timeout(600)
        await page.screenshot(path=str(OUT / "04-stairway.png"), full_page=False)
        # 10. 二楼 3 张
        for i in range(3):
            await page.evaluate("document.querySelector('.museum-act--floor.is-tech')?.scrollIntoView({behavior:'instant', block:'start'})")
            await page.wait_for_timeout(400)
            if i > 0:
                try:
                    await page.locator(".museum-act--floor.is-tech .museum-floor-arrow").nth(1).click(timeout=3000)
                    await page.wait_for_timeout(500)
                except Exception:
                    pass
            await page.screenshot(path=str(OUT / f"05-floor2-frame{i+1}.png"), full_page=False)
        # 11. 品牌
        await page.evaluate("document.querySelector('.museum-act--brand')?.scrollIntoView({behavior:'instant', block:'start'})")
        await page.wait_for_timeout(700)
        await page.screenshot(path=str(OUT / "06-brand.png"), full_page=False)
        # 12. 小瑶
        await page.evaluate("document.querySelector('.museum-act--xiaoyao')?.scrollIntoView({behavior:'instant', block:'start'})")
        await page.wait_for_timeout(700)
        await page.screenshot(path=str(OUT / "07-xiaoyao.png"), full_page=False)
        # 13. 全页
        await page.screenshot(path=str(OUT / "08-full.png"), full_page=True)
        # 14. 图片加载检查
        broken = []
        all_imgs = await page.locator("img").all()
        for img in all_imgs:
            try:
                src = await img.get_attribute("src")
                nw = await img.evaluate("el => el.naturalWidth")
                if src and "visitor" in src and nw == 0:
                    broken.append(src)
            except Exception:
                pass
        print(f"  broken visitor images: {len(broken)}")
        for b in broken:
            print(f"    - {b}")
        await browser.close()
        print("DONE")

asyncio.run(main())
