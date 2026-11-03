const fs = require('fs');
const path = require('path');
const { assemblePage, rootDir } = require('./page_assembler');

const srcDir = path.join(rootDir, 'design_boards');

// Helper to make mobile artboard fluid and clean
function makeMobileFluid(mobileHtml) {
  return mobileHtml
    .replace(/width:\s*390px;?\s*height:\s*[0-9]+px;?/gi, 'width: 100%; max-width: 460px; min-height: 100vh; height: auto; margin: 0 auto;')
    .replace(/overflow:\s*hidden;?/gi, 'overflow: visible;')
    .replace(/<header data-dc-tpl="5"[\s\S]*?<\/header>/gi, '') // mobile topbar is handled by wrapper
    .replace(/<nav[^>]*aria-label="Bottom"[\s\S]*?<\/nav>/gi, '') // bottom nav is handled by wrapper
    .replace(/href="([a-zA-Z0-9_]+)\.dc\.html"/gi, 'href="$1.html"') // clean .dc.html links to standard .html
    .replace(/href="Main\.html"/gi, 'href="home.html"')
    .replace(/href="Desktop\.html"/gi, 'href="portfolio.html"')
    .replace(/href="Earn\.html"/gi, 'href="tasks.html"');
}

// Common Vector Icons
const ICONS = {
  check: '<svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  telegram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>',
  youtube: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#4267B2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  lock: '<svg class="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
  shield: '<svg class="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>',
  timer: '<svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  bnb: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#F3BA2F"><path d="M12 3.2L16.2 7.4L18.4 5.2L12 0L5.6 5.2L7.8 7.4L12 3.2ZM20.8 7.6L18.6 9.8L20.8 12L23 9.8L20.8 7.6ZM12 8.4L15.6 12L12 15.6L8.4 12L12 8.4ZM3.2 7.6L1 9.8L3.2 12L5.4 9.8L3.2 7.6ZM12 16.6L7.8 12.4L5.6 14.6L12 21L18.4 14.6L16.2 12.4L12 16.6ZM20.8 12L18.6 14.2L20.8 16.4L23 14.2L20.8 12ZM3.2 12L1 14.2L3.2 16.4L5.4 14.2L3.2 12Z"/></svg>',
  alert: '<svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  trending: '<svg class="i" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
  target: '<svg class="i" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
  barChart: '<svg class="i" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
  arrowRight: '<svg class="i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
  book: '<svg class="i" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
  wallet: '<svg class="i" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>',
  flame: '<svg class="i" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
  gift: '<svg class="i" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M12 8v13"></path><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path></svg>',
  coins: '<svg class="i" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path><path d="M7 6h1v4"></path><path d="m16.71 13.88.7.71-2.82 2.82"></path></svg>',
  listChecks: '<svg class="i" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"></path><path d="m3 7 2 2 4-4"></path><path d="M13 6h8"></path><path d="M13 12h8"></path><path d="M13 18h8"></path></svg>',
  users: '<svg class="i" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  cart: '<svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>'
};

// 1. Live Production Portfolio Layout with Modernized UI/UX
const desktopPortfolioMain = `
  <div class="portfolio-container" style="max-width: 1400px; margin: 0 auto; padding-bottom: 40px;">
    <!-- Top Header & Tabs -->
    <div class="portfolio-header" style="margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px;">
      <div>
        <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 6px; color: var(--tx);">Portfolio</h1>
        <p style="font-size: 14px; color: var(--mut); margin: 0;">Your $OKN at a glance: activity, holdings, and earnings.</p>
      </div>
      <!-- Activity / Holdings Tabs -->
      <div style="display: inline-flex; align-items: center; background: var(--s2); padding: 4px; border-radius: 12px; border: 1px solid var(--line);">
        <a href="activity.html" style="padding: 6px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; color: #FFF; background: var(--vio); text-decoration: none; ">Activity</a>
        <a href="wallet.html" style="padding: 6px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--mut); text-decoration: none; transition: color 0.2s;">Holdings</a>
      </div>
    </div>

    <!-- 4 Stat Cards Grid -->
    <div class="resp-grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
      <!-- Card 1: OK Points earned -->
      <div class="stat-card" style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
          <span style="display: flex; width: 44px; height: 44px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(122, 18, 245, 0.12); color: var(--vio-l); flex: 0 0 auto;">
            ${ICONS.gift}
          </span>
          <div style="min-width: 0;">
            <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mut); margin: 0;">OK Points earned</p>
            <p class="num" style="font-size: 26px; font-weight: 800; color: var(--tx); margin: 2px 0 0; line-height: 1.1;">135</p>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--mut); margin: 0;">Awaiting Merkle commit</p>
      </div>

      <!-- Card 2: $OKN balance -->
      <div class="stat-card" style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
          <span style="display: flex; width: 44px; height: 44px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(9, 180, 255, 0.12); color: var(--cyan); flex: 0 0 auto;">
            ${ICONS.coins}
          </span>
          <div style="min-width: 0;">
            <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mut); margin: 0;">$OKN balance</p>
            <p class="num" style="font-size: 26px; font-weight: 800; color: var(--tx); margin: 2px 0 0; line-height: 1.1;">—</p>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--mut); margin: 0;">On-chain balance</p>
      </div>

      <!-- Card 3: Tasks done -->
      <div class="stat-card" style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
          <span style="display: flex; width: 44px; height: 44px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(47, 189, 142, 0.12); color: var(--ok); flex: 0 0 auto;">
            ${ICONS.listChecks}
          </span>
          <div style="min-width: 0;">
            <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mut); margin: 0;">Tasks done</p>
            <p class="num" style="font-size: 26px; font-weight: 800; color: var(--tx); margin: 2px 0 0; line-height: 1.1;">0 / 11</p>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--mut); margin: 0;">Verified and pending</p>
      </div>

      <!-- Card 4: Referrals -->
      <div class="stat-card" style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
          <span style="display: flex; width: 44px; height: 44px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(255, 170, 0, 0.12); color: #FFAA00; flex: 0 0 auto;">
            ${ICONS.users}
          </span>
          <div style="min-width: 0;">
            <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mut); margin: 0;">Referrals</p>
            <p class="num" style="font-size: 26px; font-weight: 800; color: var(--tx); margin: 2px 0 0; line-height: 1.1;">0</p>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--mut); margin: 0;">0 OK Points earned</p>
      </div>
    </div>

    <!-- Daily Streak Card with Modern 7-Day Capsule Visualizer -->
    <div class="streak-card" style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <span style="display: flex; width: 48px; height: 48px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(255, 170, 0, 0.15); color: #FFAA00; flex: 0 0 auto;">
          ${ICONS.flame}
        </span>
        <div style="min-width: 0;">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mut); margin: 0;">Daily streak</p>
          <div style="display: flex; align-items: baseline; gap: 12px; margin-top: 2px; flex-wrap: wrap;">
            <p class="num" style="font-size: 24px; font-weight: 800; color: var(--tx); margin: 0;">6 days</p>
            <p style="font-size: 13px; color: var(--mut); margin: 0;">Checked in. Longest streak: 6.</p>
          </div>
        </div>
      </div>

      <!-- Modern Streak Capsules -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <div title="Day 1" style="width: 14px; height: 36px; border-radius: 7px; background: linear-gradient(180deg, #8C38F7, #7A12F5); "></div>
        <div title="Day 2" style="width: 14px; height: 36px; border-radius: 7px; background: linear-gradient(180deg, #8C38F7, #7A12F5); "></div>
        <div title="Day 3" style="width: 14px; height: 36px; border-radius: 7px; background: linear-gradient(180deg, #8C38F7, #7A12F5); "></div>
        <div title="Day 4" style="width: 14px; height: 36px; border-radius: 7px; background: linear-gradient(180deg, #8C38F7, #7A12F5); "></div>
        <div title="Day 5" style="width: 14px; height: 36px; border-radius: 7px; background: linear-gradient(180deg, #8C38F7, #7A12F5); "></div>
        <div title="Day 6 (Today)" style="width: 14px; height: 36px; border-radius: 7px; background: linear-gradient(180deg, #8C38F7, #7A12F5); "></div>
        <div title="Day 7 (Upcoming)" style="width: 14px; height: 36px; border-radius: 7px; background: var(--s2); border: 1.5px dashed var(--line); opacity: 0.6;"></div>
      </div>
    </div>

    <!-- Two-Column Split Grid (3fr : 2fr) -->
    <div class="portfolio-split-grid" style="display: grid; grid-template-columns: 3fr 2fr; gap: 24px; align-items: start;">
      <!-- Left Column: Claim + Buy -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Claim your $OKN Card with Merkle Stepper -->
        <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 800; color: var(--tx); margin: 0 0 6px;">Claim your $OKN</h3>
              <p style="font-size: 13px; color: var(--mut); line-height: 1.5; margin: 0;">OK Points convert to $OKN when the admin commits a Merkle root. A $3 BNB fee applies at claim time.</p>
            </div>
            <span style="font-size: 11px; font-weight: 700; color: #FFAA00; background: rgba(255, 170, 0, 0.12); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255, 170, 0, 0.25); white-space: nowrap; flex: 0 0 auto;">Not open yet</span>
          </div>

          <!-- Modern Merkle Progress Stepper -->
          <div style="margin: 20px 0 22px; padding: 18px 20px; background: var(--s2); border-radius: 16px; border: 1px solid var(--line);">
            <div style="display: flex; align-items: center; justify-content: space-between; position: relative;">
              <!-- Connecting Line -->
              <div style="position: absolute; top: 14px; left: 32px; right: 32px; height: 2px; background: var(--line); z-index: 1;">
                <div style="width: 50%; height: 100%; background: linear-gradient(90deg, #09B4FF, #FFD60A);"></div>
              </div>

              <!-- Step 1: Earn points -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; z-index: 2;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #09B4FF; color: #000; display: flex; align-items: center; justify-content: center; ">
                  <svg class="i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: var(--tx);">Earn points</span>
              </div>

              <!-- Step 2: Merkle commit (Active) -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; z-index: 2;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--s1); border: 2px solid #FFD60A; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 9px; height: 9px; border-radius: 50%; background: #FFD60A;"></div>
                </div>
                <span style="font-size: 11px; font-weight: 800; color: #FFD60A;">Merkle commit</span>
              </div>

              <!-- Step 3: Claim on-chain (Pending) -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; z-index: 2;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--s2); border: 2px dashed var(--mut); display: flex; align-items: center; justify-content: center; opacity: 0.65;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--mut);"></div>
                </div>
                <span style="font-size: 11px; font-weight: 600; color: var(--mut);">Claim on-chain</span>
              </div>
            </div>
          </div>

          <!-- Bottom Row: Metrics & Button -->
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding-top: 14px; border-top: 1px solid rgba(255, 170, 0, 0.15);">
            <div>
              <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mut); margin: 0 0 4px;">Claimable OK Points</p>
              <p class="num" style="font-size: 32px; font-weight: 800; color: #ffb800; margin: 0; line-height: 1;">135</p>
            </div>
            <a href="claim.html" style="display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 22px; border-radius: 12px; background: #ffb800; color: #000; font-weight: 800; font-size: 13px; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.15); transition: transform 0.2s cubic-bezier(0.16,1,0.3,1);">
              <span>Go to claim</span>
              ${ICONS.arrowRight}
            </a>
          </div>
        </div>

        <!-- Buy $OKN with BNB Card -->
        <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <div style="margin-bottom: 18px;">
            <h3 style="font-size: 18px; font-weight: 800; color: var(--tx); margin: 0 0 6px;">Buy $OKN with BNB</h3>
            <p style="font-size: 13px; color: var(--mut); line-height: 1.5; margin: 0;">Fixed rate: 0 $OKN per BNB (sale paused)</p>
          </div>
          <a href="buy.html" style="display: inline-flex; align-items: center; gap: 10px; height: 42px; padding: 0 20px; border-radius: 12px; background: var(--s2); border: 1px solid var(--line); color: var(--tx); font-weight: 800; font-size: 13px; text-decoration: none; transition: background 0.2s ease;">
            ${ICONS.cart}
            <span>Open the sale</span>
          </a>
        </div>

      </div>

      <!-- Right Column: Modernized Tasks Card with Branded Squircle Icons -->
      <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <h3 style="font-size: 18px; font-weight: 800; color: var(--tx); margin: 0;">Tasks</h3>
          <a href="tasks.html" style="font-size: 12px; font-weight: 700; color: var(--vio-l); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            <span>See all</span>
            ${ICONS.arrowRight}
          </a>
        </div>
        <p style="font-size: 13px; color: var(--mut); margin: 0 0 18px;">Earn OK Points toward your next claim.</p>

        <!-- Task List Items -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          
          <!-- Task 1: Telegram -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: var(--s2); border: 1px solid var(--line); border-radius: 14px; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1);">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
              <span style="width: 36px; height: 36px; border-radius: 10px; background: rgba(9, 180, 255, 0.15); color: var(--cyan); display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">
                ${ICONS.telegram}
              </span>
              <div style="min-width: 0;">
                <p style="font-size: 13px; font-weight: 700; color: var(--tx); margin: 0;">Join our Telegram</p>
                <p style="font-size: 11px; font-weight: 600; color: var(--ok); margin: 2px 0 0;">+50 OK Points</p>
              </div>
            </div>
            <a href="tasks.html" style="padding: 6px 16px; border-radius: 10px; background: var(--vio); color: #fff; font-size: 12px; font-weight: 700; text-decoration: none;  transition: all 0.2s ease;">Claim</a>
          </div>

          <!-- Task 2: Follow us on X -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: var(--s2); border: 1px solid var(--line); border-radius: 14px; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1);">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
              <span style="width: 36px; height: 36px; border-radius: 10px; background: var(--s1); color: var(--tx); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">
                ${ICONS.x}
              </span>
              <div style="min-width: 0;">
                <p style="font-size: 13px; font-weight: 700; color: var(--tx); margin: 0;">Follow us on X</p>
                <p style="font-size: 11px; font-weight: 600; color: var(--ok); margin: 2px 0 0;">+70 OK Points</p>
              </div>
            </div>
            <a href="tasks.html" style="padding: 6px 16px; border-radius: 10px; background: var(--vio); color: #fff; font-size: 12px; font-weight: 700; text-decoration: none;  transition: all 0.2s ease;">Claim</a>
          </div>

          <!-- Task 3: Follow on Facebook -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: var(--s2); border: 1px solid var(--line); border-radius: 14px; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1);">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
              <span style="width: 36px; height: 36px; border-radius: 10px; background: rgba(66, 103, 178, 0.15); color: #4267B2; display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">
                ${ICONS.facebook}
              </span>
              <div style="min-width: 0;">
                <p style="font-size: 13px; font-weight: 700; color: var(--tx); margin: 0;">Follow $OKN on Facebook</p>
                <p style="font-size: 11px; font-weight: 600; color: var(--ok); margin: 2px 0 0;">+50 OK Points</p>
              </div>
            </div>
            <a href="tasks.html" style="padding: 6px 16px; border-radius: 10px; background: var(--vio); color: #fff; font-size: 12px; font-weight: 700; text-decoration: none;  transition: all 0.2s ease;">Claim</a>
          </div>

        </div>
      </div>
    </div>

    <!-- Transaction History Table Section (From Modern UI/UX Guide) -->
    <div style="margin-top: 28px; background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 800; color: var(--tx); margin: 0 0 4px;">Transaction history</h3>
          <p style="font-size: 13px; color: var(--mut); margin: 0;">Every OK Points and $OKN movement on your account.</p>
        </div>
        <!-- Filter Pills -->
        <div style="display: inline-flex; align-items: center; background: var(--s2); padding: 4px; border-radius: 12px; border: 1px solid var(--line); gap: 4px;">
          <button style="padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #FFF; background: var(--vio); border: none; cursor: pointer; ">All</button>
          <button style="padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--mut); background: transparent; border: none; cursor: pointer;">OK Points</button>
          <button style="padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--mut); background: transparent; border: none; cursor: pointer;">$OKN</button>
        </div>
      </div>

      <!-- Table Container -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 640px; text-align: left; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--line); color: var(--mut); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
              <th style="padding: 12px 14px 12px 4px;">Description</th>
              <th style="padding: 12px 14px;">Date</th>
              <th style="padding: 12px 14px;">Asset</th>
              <th style="padding: 12px 14px; text-align: right;">Amount</th>
              <th style="padding: 12px 4px 12px 14px; text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            <!-- Row 1 -->
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
              <td style="padding: 14px 14px 14px 4px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(47,189,142,0.12); color: var(--ok); display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">${ICONS.check}</div>
                <div>
                  <div style="font-weight: 700; color: var(--tx);">Daily check-in</div>
                  <div style="font-size: 11px; color: var(--mut); margin-top: 1px;">Day 6 of streak</div>
                </div>
              </td>
              <td style="padding: 14px; color: var(--mut); font-weight: 500;">Nov 2, 2026</td>
              <td style="padding: 14px; font-weight: 600; color: var(--tx);">OK Points</td>
              <td style="padding: 14px; text-align: right; font-weight: 800; color: var(--ok);">+20 pts</td>
              <td style="padding: 14px 4px 14px 14px; text-align: right;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: rgba(255, 170, 0, 0.12); color: #FFAA00; border: 1px solid rgba(255, 170, 0, 0.25);">Awaiting commit</span>
              </td>
            </tr>
            <!-- Row 2 -->
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
              <td style="padding: 14px 14px 14px 4px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(47,189,142,0.12); color: var(--ok); display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">${ICONS.check}</div>
                <div>
                  <div style="font-weight: 700; color: var(--tx);">Daily check-in</div>
                  <div style="font-size: 11px; color: var(--mut); margin-top: 1px;">Day 5 of streak</div>
                </div>
              </td>
              <td style="padding: 14px; color: var(--mut); font-weight: 500;">Nov 1, 2026</td>
              <td style="padding: 14px; font-weight: 600; color: var(--tx);">OK Points</td>
              <td style="padding: 14px; text-align: right; font-weight: 800; color: var(--ok);">+20 pts</td>
              <td style="padding: 14px 4px 14px 14px; text-align: right;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: rgba(255, 170, 0, 0.12); color: #FFAA00; border: 1px solid rgba(255, 170, 0, 0.25);">Awaiting commit</span>
              </td>
            </tr>
            <!-- Row 3 -->
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
              <td style="padding: 14px 14px 14px 4px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(47,189,142,0.12); color: var(--ok); display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">${ICONS.check}</div>
                <div>
                  <div style="font-weight: 700; color: var(--tx);">Daily check-in</div>
                  <div style="font-size: 11px; color: var(--mut); margin-top: 1px;">Day 4 of streak</div>
                </div>
              </td>
              <td style="padding: 14px; color: var(--mut); font-weight: 500;">Oct 31, 2026</td>
              <td style="padding: 14px; font-weight: 600; color: var(--tx);">OK Points</td>
              <td style="padding: 14px; text-align: right; font-weight: 800; color: var(--ok);">+20 pts</td>
              <td style="padding: 14px 4px 14px 14px; text-align: right;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: rgba(255, 170, 0, 0.12); color: #FFAA00; border: 1px solid rgba(255, 170, 0, 0.25);">Awaiting commit</span>
              </td>
            </tr>
            <!-- Row 4 -->
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
              <td style="padding: 14px 14px 14px 4px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(47,189,142,0.12); color: var(--ok); display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">${ICONS.check}</div>
                <div>
                  <div style="font-weight: 700; color: var(--tx);">Daily check-in</div>
                  <div style="font-size: 11px; color: var(--mut); margin-top: 1px;">Day 3 of streak</div>
                </div>
              </td>
              <td style="padding: 14px; color: var(--mut); font-weight: 500;">Oct 30, 2026</td>
              <td style="padding: 14px; font-weight: 600; color: var(--tx);">OK Points</td>
              <td style="padding: 14px; text-align: right; font-weight: 800; color: var(--ok);">+20 pts</td>
              <td style="padding: 14px 4px 14px 14px; text-align: right;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: rgba(255, 170, 0, 0.12); color: #FFAA00; border: 1px solid rgba(255, 170, 0, 0.25);">Awaiting commit</span>
              </td>
            </tr>
            <!-- Row 5 -->
            <tr>
              <td style="padding: 14px 14px 14px 4px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(47,189,142,0.12); color: var(--ok); display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">${ICONS.check}</div>
                <div>
                  <div style="font-weight: 700; color: var(--tx);">Daily check-in</div>
                  <div style="font-size: 11px; color: var(--mut); margin-top: 1px;">Day 2 of streak</div>
                </div>
              </td>
              <td style="padding: 14px; color: var(--mut); font-weight: 500;">Oct 29, 2026</td>
              <td style="padding: 14px; font-weight: 600; color: var(--tx);">OK Points</td>
              <td style="padding: 14px; text-align: right; font-weight: 800; color: var(--ok);">+20 pts</td>
              <td style="padding: 14px 4px 14px 14px; text-align: right;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: rgba(255, 170, 0, 0.12); color: #FFAA00; border: 1px solid rgba(255, 170, 0, 0.25);">Awaiting commit</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
`;

// 2. Read all mobile boards directly from srcDir (pristine artboards)
function getMobileBoard(file) {
  const p = path.join(srcDir, file);
  if (!fs.existsSync(p)) return '';
  const c = fs.readFileSync(p, 'utf8');
  const m = c.match(/<div id="dc-root">([\s\S]*?)<\/body>/i);
  if (m) {
    let inner = m[1];
    const scriptIdx = inner.indexOf('<script');
    if (scriptIdx !== -1) inner = inner.substring(0, scriptIdx);
    inner = inner.trim().replace(/(<\/div>\s*)+$/, '');
    // Clean logo blobs
    inner = inner.replace(/src="blob:[^"]+"/gi, 'src="assets/okn-logo.png"');
    inner = inner.replace(/<img[^>]*alt="OKN logo"[^>]*>/gi, '<img src="assets/okn-logo.png" alt="OKN logo" style="width: 42px; height: 42px; border-radius: 12px; object-fit: cover; background: #000; display: block; flex: 0 0 auto;">');
    return makeMobileFluid(inner);
  }
  return '';
}

const mobileHomeRaw = getMobileBoard('Home.html');
// Remove slider announcements from mobile Home
let mobileHome = mobileHomeRaw.replace(/<section[^>]*aria-label="Announcements"[\s\S]*?<\/section>/gi, '');
mobileHome = mobileHome.replace(/href="Earn\.dc\.html"/gi, 'href="tasks.html"');
mobileHome = mobileHome.replace(/href="Claim\.dc\.html"/gi, 'href="claim.html"');
mobileHome = mobileHome.replace(/href="Buy\.dc\.html"/gi, 'href="buy.html"');
mobileHome = mobileHome.replace(/href="Referral\.dc\.html"/gi, 'href="referral.html"');
mobileHome = mobileHome.replace(/href="Agents\.dc\.html"/gi, 'href="agents.html"');
mobileHome = mobileHome.replace(/href="Activity\.dc\.html"/gi, 'href="activity.html"');
mobileHome = mobileHome.replace(
  />✓<\/div>/g,
  `><svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`
);
// Match current design numbers on mobile Home
mobileHome = mobileHome.replace(/>100<\/div>/g, '>135</div>');
mobileHome = mobileHome.replace(/100 pts/g, '135 pts');
mobileHome = mobileHome.replace(/5-day streak/g, '6-day streak');
mobileHome = mobileHome.replace(/5 days\. Longest: 5/g, '6 days. Longest: 6');
// Connect wallet modal handler on mobile Home
mobileHome = mobileHome.replace(
  /<button[^>]*data-dc-tpl="34"[^>]*>[\s\S]*?<\/button>/i,
  `<button onclick="openWalletModal()" style="display: flex; align-items: center; justify-content: space-between; height: 52px; width: 100%; border-radius: 26px; background: #FFFFFF; color: #0A0A0C; font-weight: 800; font-size: 14px; border: none; cursor: pointer; padding: 0 16px 0 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.2); transition: all 0.2s cubic-bezier(0.16,1,0.3,1); margin-top: 20px;">
    <span style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #000; color: #fff;">
      <svg class="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </span>
    <span style="font-weight: 800; font-size: 15px;">Connect wallet</span>
    <svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
  </button>`
);


const mobileEarn = getMobileBoard('Earn.html')
  .replace(/href="[a-zA-Z0-9_]+\.dc\.html"/gi, m => m.replace('.dc.html', '.html'));
const mobileClaim = getMobileBoard('Claim.html')
  .replace(/href="[a-zA-Z0-9_]+\.dc\.html"/gi, m => m.replace('.dc.html', '.html'))
  .replace(/>100<\/div>/g, '>135</div>')
  .replace(/100 pts/g, '135 pts')
  .replace(/100<\/span>/g, '135</span>')
  .replace(
    /<button[^>]*>\s*<span[^>]*>[\s\S]*?<\/span>\s*Connect wallet\s*<span[^>]*>[\s\S]*?<\/span>\s*<\/button>/i,
    `<button onclick="openWalletModal()" style="display: flex; align-items: center; justify-content: space-between; height: 52px; width: 100%; border-radius: 26px; background: #FFFFFF; color: #0A0A0C; font-weight: 800; font-size: 14px; border: none; cursor: pointer; padding: 0 16px 0 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.2); transition: all 0.2s cubic-bezier(0.16,1,0.3,1); margin-top: 20px;">
      <span style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #000; color: #fff;">
        <svg class="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </span>
      <span style="font-weight: 800; font-size: 15px;">Connect wallet</span>
      <svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
    </button>`
  );

const mobileBuy = getMobileBoard('Buy.html')
  .replace(/href="[a-zA-Z0-9_]+\.dc\.html"/gi, m => m.replace('.dc.html', '.html'));
const mobileAgents = getMobileBoard('Agents.html')
  .replace(/href="[a-zA-Z0-9_]+\.dc\.html"/gi, m => m.replace('.dc.html', '.html'))
  .replace(/<span data-dc-tpl="56"[^>]*>.*?<\/span><div data-dc-tpl="60"/s, '<img src="assets/polymarket.png" alt="Polymarket" style="width: 44px; height: 44px; border-radius: 14px; object-fit: contain; box-shadow: 0 4px 14px rgba(9, 180, 255, 0.25); flex: 0 0 auto;"><div data-dc-tpl="60"');

// Referral mobile card
const mobileReferralRaw = getMobileBoard('Referral.html');
const mobileReferralCard = `
  <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 18px 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 12px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 15px; font-weight: 800; color: var(--tx);">Your Referral Link</div>
      <span style="font-size: 11px; font-weight: 700; color: var(--mut); background: var(--s2); padding: 4px 10px; border-radius: 8px;">Code: <strong style="color: var(--tx);">DE-71C49</strong></span>
    </div>
    <div style="background: var(--s2); border: 1px solid var(--line); border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
      <input type="text" readonly value="https://app.okntoken.com/ref/DE-71C49" style="background: transparent; border: none; color: var(--tx); font-size: 13px; font-weight: 700; font-family: Sora, monospace; width: 100%; outline: none;">
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="copyReferralLink()" class="copy-ref-btn" style="flex: 1; height: 44px; border-radius: 14px; background: var(--vio); color: #fff; font-weight: 800; font-size: 14px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease;">
        <svg class="i" width="16" height="16" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>Copy link</span>
      </button>
      <a href="https://twitter.com/intent/tweet?text=Join%20the%20$OKN%20ecosystem!&url=https%3A%2F%2Fapp.okntoken.com%2Fref%2FDE-71C49" target="_blank" rel="noopener noreferrer" style="width: 44px; height: 44px; border-radius: 14px; background: var(--s2); border: 1px solid var(--line); color: var(--tx); display: flex; align-items: center; justify-content: center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href="https://t.me/share/url?url=https%3A%2F%2Fapp.okntoken.com%2Fref%2FDE-71C49&text=Join%20the%20OKN%20ecosystem!" target="_blank" rel="noopener noreferrer" style="width: 44px; height: 44px; border-radius: 14px; background: var(--s2); border: 1px solid var(--line); color: var(--cyan); display: flex; align-items: center; justify-content: center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
      </a>
    </div>
  </div>
`;
const mobileReferral = mobileReferralRaw.includes('<main')
  ? mobileReferralRaw.replace(/<main[^>]*>/, m => m + mobileReferralCard)
  : (mobileReferralCard + mobileReferralRaw);
const mobileActivity = getMobileBoard('Activity.html');

const logoImgDesktop = '<img src="assets/okn-logo.png" alt="OKN logo" style="width: 20px; height: 20px; border-radius: 6px; object-fit: cover; display: inline-block; vertical-align: middle;">';



// 1. Tasks / Earn Desktop
const desktopEarnMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Earn OK Points</div>
    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
      <div>
        <div style="font-size: 14px; opacity: 0.85;">Available to earn</div>
        <div class="num" style="font-size: 42px; font-weight: 800; line-height: 1.1; margin-top: 4px;">555 <span style="font-size: 20px; font-weight: 700; opacity: 0.85;">OK Points</span></div>
      </div>
      <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 16px;">
        <div style="font-size: 12px; opacity: 0.85;">Task Progress</div>
        <div style="font-size: 16px; font-weight: 800; margin-top: 2px;">0 / 11 tasks completed</div>
        <div style="width: 160px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-top: 8px; overflow: hidden;">
          <div style="width: 12%; height: 100%; background: #fff; border-radius: 3px;"></div>
        </div>
      </div>
    </div>
  </section>

  <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px;">
    <button style="height: 38px; padding: 0 18px; border-radius: 19px; background: var(--vio); color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer;">All</button>
    <button style="height: 38px; padding: 0 18px; border-radius: 19px; background: var(--s2); color: var(--mut); font-size: 13px; font-weight: 700; border: 1px solid var(--line); cursor: pointer;">Social</button>
    <button style="height: 38px; padding: 0 18px; border-radius: 19px; background: var(--s2); color: var(--mut); font-size: 13px; font-weight: 700; border: 1px solid var(--line); cursor: pointer;">Daily</button>
    <button style="height: 38px; padding: 0 18px; border-radius: 19px; background: var(--s2); color: var(--mut); font-size: 13px; font-weight: 700; border: 1px solid var(--line); cursor: pointer;">Referral</button>
  </div>

  <div class="resp-grid-2" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(9,180,255,0.15); color: var(--cyan); display: flex; align-items: center; justify-content: center;">${ICONS.telegram}</div>
        <div>
          <div style="font-weight: 800; font-size: 15px;">Join our Telegram</div>
          <div style="font-size: 12px; font-weight: 700; color: var(--ok); margin-top: 2px;">+50 OK Points</div>
        </div>
      </div>
      <button style="height: 36px; padding: 0 16px; border-radius: 18px; background: var(--vio); color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer;">Claim</button>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--s2); color: var(--tx); display: flex; align-items: center; justify-content: center;">${ICONS.x}</div>
        <div>
          <div style="font-weight: 800; font-size: 15px;">Follow us on X</div>
          <div style="font-size: 12px; font-weight: 700; color: var(--ok); margin-top: 2px;">+70 OK Points</div>
        </div>
      </div>
      <button style="height: 36px; padding: 0 16px; border-radius: 18px; background: var(--vio); color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer;">Claim</button>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(66,103,178,0.15); color: #4267B2; display: flex; align-items: center; justify-content: center;">${ICONS.facebook}</div>
        <div>
          <div style="font-weight: 800; font-size: 15px;">Follow $OKN on Facebook</div>
          <div style="font-size: 12px; font-weight: 700; color: var(--ok); margin-top: 2px;">+50 OK Points</div>
        </div>
      </div>
      <button style="height: 36px; padding: 0 16px; border-radius: 18px; background: var(--vio); color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer;">Claim</button>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(255,0,0,0.15); display: flex; align-items: center; justify-content: center;">${ICONS.youtube}</div>
        <div>
          <div style="font-weight: 800; font-size: 15px;">Subscribe on YouTube</div>
          <div style="font-size: 12px; font-weight: 700; color: var(--ok); margin-top: 2px;">+65 OK Points</div>
        </div>
      </div>
      <button style="height: 36px; padding: 0 16px; border-radius: 18px; background: var(--vio); color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer;">Claim</button>
    </div>
  </div>

  <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
    <div>
      <div style="font-size: 18px; font-weight: 800;">Invite friends, earn more points</div>
      <div style="font-size: 13px; color: var(--mut); margin-top: 4px;">Earn 10–15% commission and escalating point multipliers for every invited friend.</div>
    </div>
    <a href="referral.html" style="height: 42px; padding: 0 24px; border-radius: 12px; background: var(--vio); color: #fff; font-weight: 800; font-size: 13px; display: flex; align-items: center; text-decoration: none;">Invite friends</a>
  </div>
`;

// 2. Claim Desktop
const desktopClaimMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Token Distribution</div>
    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
      <div>
        <div style="font-size: 14px; opacity: 0.85;">Claimable OK Points</div>
        <div style="display: flex; align-items: center; gap: 14px; margin-top: 4px;">
          <span class="num" style="font-size: 42px; font-weight: 800; line-height: 1.1;">100</span>
          <span style="font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 12px; background: rgba(0,0,0,0.25); color: #fff; display: inline-flex; align-items: center; gap: 6px;">${ICONS.timer} Not open yet</span>
        </div>
      </div>
      <button onclick="openWalletModal()" style="height: 44px; padding: 0 24px; border-radius: 14px; background: #fff; color: #000; font-weight: 800; font-size: 13px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;">
        <span>Connect wallet</span>
        ${ICONS.arrowRight}
      </button>
    </div>
  </section>

  <div class="resp-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 16px; font-weight: 800; margin-bottom: 20px;">Claim Summary</div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Claimable OK Points</span>
        <span class="num" style="font-weight: 800; font-size: 16px;">100 pts</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Claim fee (paid in BNB)</span>
        <span class="num" style="font-weight: 800; font-size: 16px;">$3 USD</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">You receive</span>
        <span class="num" style="font-weight: 800; font-size: 16px; color: var(--vio-l);">0 $OKN</span>
      </div>
      <button onclick="openWalletModal()" style="width: 100%; margin-top: 24px; height: 48px; border-radius: 14px; background: var(--vio); color: #fff; font-weight: 800; border: none; cursor: pointer;">Connect wallet to claim</button>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 16px; font-weight: 800; margin-bottom: 20px;">How Claiming Works</div>
      <div style="display: flex; gap: 16px; margin-bottom: 20px;">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--ok); color: #fff; display: flex; align-items: center; justify-content: center; flex: 0 0 auto;">${ICONS.check}</div>
        <div>
          <div style="font-weight: 800; font-size: 14px;">Earn OK Points</div>
          <div style="font-size: 12px; color: var(--mut); margin-top: 2px;">Complete tasks and invite friends to build your allocation.</div>
        </div>
      </div>
      <div style="display: flex; gap: 16px; margin-bottom: 20px;">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(255,214,10,0.2); border: 2px solid var(--yel); color: var(--yel); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; flex: 0 0 auto;">2</div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; font-size: 14px;">Wait for the commit</span>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: var(--yel); color: #000;">You are here</span>
          </div>
          <div style="font-size: 12px; color: var(--mut); margin-top: 2px;">The admin commits a cryptographic Merkle root to BNB Smart Chain.</div>
        </div>
      </div>
      <div style="display: flex; gap: 16px;">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--s2); border: 2px dashed var(--line); color: var(--mut); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex: 0 0 auto;">3</div>
        <div>
          <div style="font-weight: 800; font-size: 14px;">Claim on-chain</div>
          <div style="font-size: 12px; color: var(--mut); margin-top: 2px;">Pay the $3 BNB gas fee and $OKN tokens arrive in your wallet instantly.</div>
        </div>
      </div>
    </div>
  </div>

  <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 20px; padding: 20px 24px; display: flex; align-items: center; gap: 14px;">
    <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(47,189,142,0.15); color: var(--ok); display: flex; align-items: center; justify-content: center;">${ICONS.shield}</div>
    <div style="font-size: 13px; color: var(--mut);"><strong style="color: var(--tx);">Cryptographic Verification:</strong> Claims are verified on-chain via Merkle proofs directly on BNB Smart Chain.</div>
  </div>
`;

// 3. Buy Desktop
const desktopBuyMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Presale Allocation</div>
    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
      <div>
        <div style="font-size: 14px; opacity: 0.85;">Fixed Sale Rate</div>
        <div class="num" style="font-size: 38px; font-weight: 800; line-height: 1.1; margin-top: 4px;">1,000,000 <span style="font-size: 18px; font-weight: 700; opacity: 0.85;">$OKN per 1 BNB</span></div>
      </div>
      <div style="font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 12px; background: rgba(0,0,0,0.25); color: #fff; display: flex; align-items: center; gap: 8px;">
        ${ICONS.lock}
        <span>Private test: buying is open to admins only</span>
      </div>
    </div>
  </section>

  <div class="resp-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 16px; font-weight: 800; margin-bottom: 20px;">Buy $OKN</div>
      
      <div style="background: var(--s2); border: 1px solid var(--line); border-radius: 18px; padding: 16px; margin-bottom: 12px;">
        <div style="font-size: 12px; color: var(--mut); margin-bottom: 6px; font-weight: 600;">You pay</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <input type="text" value="0.1" style="background: transparent; border: none; color: var(--tx); font-size: 24px; font-weight: 800; width: 60%; outline: none;">
          <span style="font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 8px;">${ICONS.bnb} BNB</span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button style="flex: 1; padding: 6px 0; border-radius: 8px; background: var(--s1); border: 1px solid var(--line); color: var(--tx); font-size: 11px; font-weight: 700; cursor: pointer;">0.1</button>
          <button style="flex: 1; padding: 6px 0; border-radius: 8px; background: var(--s1); border: 1px solid var(--line); color: var(--tx); font-size: 11px; font-weight: 700; cursor: pointer;">0.5</button>
          <button style="flex: 1; padding: 6px 0; border-radius: 8px; background: var(--s1); border: 1px solid var(--line); color: var(--tx); font-size: 11px; font-weight: 700; cursor: pointer;">1</button>
          <button style="flex: 1; padding: 6px 0; border-radius: 8px; background: var(--s1); border: 1px solid var(--line); color: var(--tx); font-size: 11px; font-weight: 700; cursor: pointer;">Max 10</button>
        </div>
      </div>

      <div style="background: var(--s2); border: 1px solid var(--line); border-radius: 18px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: var(--mut); margin-bottom: 6px; font-weight: 600;">You receive</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="num" style="font-size: 24px; font-weight: 800; color: var(--vio-l);">~100,000</div>
          <span style="font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 6px;">${logoImgDesktop} $OKN</span>
        </div>
      </div>

      <button onclick="openWalletModal()" style="width: 100%; height: 48px; border-radius: 14px; background: var(--vio); color: #fff; font-weight: 800; border: none; cursor: pointer;">Connect wallet to buy</button>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 16px; font-weight: 800; margin-bottom: 20px;">Sale Parameters</div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Network</span>
        <span style="font-weight: 700; font-size: 14px;">BSC Testnet (Chain 97)</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Wallet Cap</span>
        <span class="num" style="font-weight: 800; font-size: 15px;">10 BNB</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Total Raised</span>
        <span class="num" style="font-weight: 800; font-size: 15px; color: var(--ok);">0 BNB</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Allocation Remaining</span>
        <span class="num" style="font-weight: 800; font-size: 15px;">1,249,998,000 $OKN</span>
      </div>
    </div>
  </div>

  <div style="background: rgba(255,170,0,0.12); border: 1px solid rgba(255,170,0,0.3); border-radius: 20px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
    <div style="font-size: 14px; font-weight: 700; color: var(--org-t); display: flex; align-items: center; gap: 8px;">
      ${ICONS.alert}
      <span>Testnet is active. Use test BNB only.</span>
    </div>
    <a href="https://testnet.bnbchain.org/faucet-smart" target="_blank" style="padding: 8px 18px; border-radius: 12px; background: var(--s1); border: 1px solid var(--line); color: var(--tx); font-weight: 700; font-size: 13px; text-decoration: none; display: flex; align-items: center; gap: 6px;">
      <span>Get faucet BNB</span>
      ${ICONS.arrowRight}
    </a>
  </div>
`;

// 4. Agents Desktop
const desktopAgentsMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Protocol Roadmap</div>
    <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em;">Coming to OKN</h1>
    <p style="font-size: 15px; opacity: 0.85; margin: 0; max-width: 650px;">Four flagship Web3 AI and staking features are currently being built. Nothing on this page trades or stakes yet.</p>
  </section>

  <div class="resp-grid-2" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 14px; background: var(--s2); color: var(--tx); display: flex; align-items: center; justify-content: center;">${ICONS.lock}</div>
          <div>
            <div style="font-size: 18px; font-weight: 800;">Staking</div>
            <div style="font-size: 13px; color: var(--mut);">Lock $OKN, earn APY.</div>
          </div>
        </div>
        <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: var(--s2); color: var(--mut);">Coming soon</span>
      </div>
      <div style="font-size: 13px; color: var(--mut); margin-bottom: 18px;">Longer lock durations yield higher staking multipliers.</div>
      <div style="display: flex; gap: 8px;">
        <span style="flex: 1; text-align: center; padding: 8px 0; border-radius: 12px; background: var(--s2); font-weight: 800; font-size: 13px;">30d</span>
        <span style="flex: 1; text-align: center; padding: 8px 0; border-radius: 12px; background: var(--s2); font-weight: 800; font-size: 13px;">90d</span>
        <span style="flex: 1; text-align: center; padding: 8px 0; border-radius: 12px; background: var(--s2); font-weight: 800; font-size: 13px;">180d</span>
        <span style="flex: 1; text-align: center; padding: 8px 0; border-radius: 12px; background: var(--s2); font-weight: 800; font-size: 13px;">365d</span>
      </div>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(255,170,0,0.15); color: var(--org); display: flex; align-items: center; justify-content: center;">${ICONS.trending}</div>
          <div>
            <div style="font-size: 18px; font-weight: 800;">AI Trading Agent</div>
            <div style="font-size: 13px; color: var(--mut);">Your AI co-pilot for crypto signals</div>
          </div>
        </div>
        <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: rgba(255,170,0,0.15); color: var(--org);">In development</span>
      </div>
      <p style="font-size: 13px; color: var(--mut); line-height: 1.6; margin: 0;">24/7 autonomous market scanning, entry/target levels, and stop loss execution with risk-managed sizing.</p>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="assets/polymarket.png" alt="Polymarket" style="width: 44px; height: 44px; border-radius: 14px; object-fit: contain; box-shadow: 0 4px 14px rgba(9, 180, 255, 0.25); flex-shrink: 0;">
          <div>
            <div style="font-size: 18px; font-weight: 800;">Polymarket Agent</div>
            <div style="font-size: 13px; color: var(--mut);">Automated prediction positioning</div>
          </div>
        </div>
        <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: rgba(255,170,0,0.15); color: var(--org);">In development</span>
      </div>
      <p style="font-size: 13px; color: var(--mut); line-height: 1.6; margin: 0;">Continuous probability tracking, news-velocity sentiment monitoring, and automated hedging.</p>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(201,166,255,0.15); color: var(--vio-l); display: flex; align-items: center; justify-content: center;">${ICONS.barChart}</div>
          <div>
            <div style="font-size: 18px; font-weight: 800;">Prediction Markets</div>
            <div style="font-size: 13px; color: var(--mut);">Outcome markets across protocols</div>
          </div>
        </div>
        <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: var(--s2); color: var(--mut);">Coming soon</span>
      </div>
      <p style="font-size: 13px; color: var(--mut); line-height: 1.6; margin: 0;">Direct access to decentralized outcome pools with zero-slippage settlement and native $OKN fee discounts.</p>
    </div>
  </div>
`;

// 5. Referral Desktop
const desktopReferralMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Affiliate & Partner Program</div>
    <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.02em;">Partner Package</h1>
    <div style="display: flex; gap: 14px; flex-wrap: wrap;">
      <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 16px;">
        <div style="font-size: 20px; font-weight: 800;">10–15%</div>
        <div style="font-size: 12px; opacity: 0.85;">Direct Commission</div>
      </div>
      <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 16px;">
        <div style="font-size: 20px; font-weight: 800;">$200,000</div>
        <div style="font-size: 12px; opacity: 0.85;">Marketing Budget</div>
      </div>
      <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 16px;">
        <div style="font-size: 20px; font-weight: 800;">Tier 1 CEX</div>
        <div style="font-size: 12px; opacity: 0.85;">Confirmed Listing</div>
      </div>
    </div>
  </section>

  <!-- Interactive Referral Copy Link Card -->
  <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 24px 28px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 16px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 18px; font-weight: 800;">Your Unique Referral Link</div>
        <div style="font-size: 13px; color: var(--mut); margin-top: 4px;">Share your personal link to earn instant commissions and ascending tier multipliers.</div>
      </div>
      <span style="font-size: 12px; font-weight: 800; color: var(--mut); background: var(--s2); padding: 6px 14px; border-radius: 10px;">Referral Code: <strong style="color: var(--tx);">DE-71C49</strong></span>
    </div>
    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 280px; background: var(--s2); border: 1px solid var(--line); border-radius: 14px; padding: 12px 18px; display: flex; align-items: center;">
        <input type="text" readonly value="https://app.okntoken.com/ref/DE-71C49" style="background: transparent; border: none; color: var(--tx); font-size: 14px; font-weight: 700; font-family: Sora, monospace; width: 100%; outline: none;">
      </div>
      <button onclick="copyReferralLink()" class="copy-ref-btn" style="height: 48px; padding: 0 24px; border-radius: 14px; background: var(--vio); color: #fff; font-weight: 800; font-size: 14px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;">
        <svg class="i" width="16" height="16" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>Copy link</span>
      </button>
      <a href="https://twitter.com/intent/tweet?text=Join%20the%20$OKN%20ecosystem!&url=https%3A%2F%2Fapp.okntoken.com%2Fref%2FDE-71C49" target="_blank" rel="noopener noreferrer" style="height: 48px; padding: 0 18px; border-radius: 14px; background: var(--s2); border: 1px solid var(--line); color: var(--tx); display: flex; align-items: center; justify-content: center; text-decoration: none;">
        ${ICONS.x}
      </a>
      <a href="https://t.me/share/url?url=https%3A%2F%2Fapp.okntoken.com%2Fref%2FDE-71C49&text=Join%20the%20OKN%20ecosystem!" target="_blank" rel="noopener noreferrer" style="height: 48px; padding: 0 18px; border-radius: 14px; background: var(--s2); border: 1px solid var(--line); color: var(--cyan); display: flex; align-items: center; justify-content: center; text-decoration: none;">
        ${ICONS.telegram}
      </a>
    </div>
  </div>

  <div class="resp-grid-2" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 16px; font-weight: 800; margin-bottom: 20px;">Your Referral Statistics</div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Total Referrals</span>
        <span class="num" style="font-weight: 800; font-size: 16px;">0 friends</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Total Commission Earned</span>
        <span class="num" style="font-weight: 800; font-size: 16px; color: var(--ok);">0.00 BNB</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <span style="color: var(--mut); font-size: 14px;">Point Multiplier</span>
        <span class="num" style="font-weight: 800; font-size: 16px; color: var(--yel-t);">1.0x</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0;">
        <span style="color: var(--mut); font-size: 14px;">Tier Status</span>
        <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; background: var(--s2); color: var(--tx);">Bronze Partner</span>
      </div>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 16px; font-weight: 800; margin-bottom: 20px;">Commission Tiers</div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="background: var(--s2); border-radius: 14px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 14px;">Tier 1 · Starter</div>
            <div style="font-size: 12px; color: var(--mut);">1–10 active referrals</div>
          </div>
          <span class="num" style="font-weight: 800; font-size: 15px; color: var(--vio-l);">10%</span>
        </div>
        <div style="background: var(--s2); border-radius: 14px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 14px;">Tier 2 · Growth</div>
            <div style="font-size: 12px; color: var(--mut);">11–50 active referrals</div>
          </div>
          <span class="num" style="font-weight: 800; font-size: 15px; color: var(--ok);">12.5%</span>
        </div>
        <div style="background: var(--s2); border-radius: 14px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 14px;">Tier 3 · Ambassador</div>
            <div style="font-size: 12px; color: var(--mut);">51+ active referrals</div>
          </div>
          <span class="num" style="font-weight: 800; font-size: 15px; color: var(--yel-t);">15%</span>
        </div>
      </div>
    </div>
  </div>
`;

// 6. Activity Desktop
const desktopActivityMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Audit Trail</div>
    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
      <div>
        <div style="font-size: 14px; opacity: 0.85;">Historical Records</div>
        <div class="num" style="font-size: 42px; font-weight: 800; line-height: 1.1; margin-top: 4px;">Activity Log</div>
      </div>
      <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 16px;">
        <div style="font-size: 12px; opacity: 0.85;">Transaction Count</div>
        <div style="font-size: 16px; font-weight: 800; margin-top: 2px;">5 verified movements</div>
      </div>
    </div>
  </section>

  <div style="display: flex; gap: 8px; margin-bottom: 20px;">
    <button style="height: 38px; padding: 0 18px; border-radius: 19px; background: var(--vio); color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer;">All</button>
    <button style="height: 38px; padding: 0 18px; border-radius: 19px; background: var(--s2); color: var(--mut); font-size: 13px; font-weight: 700; border: 1px solid var(--line); cursor: pointer;">OK Points</button>
    <button style="height: 38px; padding: 0 18px; border-radius: 19px; background: var(--s2); color: var(--mut); font-size: 13px; font-weight: 700; border: 1px solid var(--line); cursor: pointer;">$OKN</button>
  </div>

  <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 24px 28px;">
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--s2); color: var(--ok); display: flex; align-items: center; justify-content: center;">${ICONS.check}</div>
          <div>
            <div style="font-weight: 800; font-size: 14px;">Daily check-in</div>
            <div style="font-size: 12px; color: var(--mut);">Day 5 of streak · Nov 2, 2026</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span class="num" style="font-weight: 800; font-size: 15px; color: var(--ok);">+20 pts</span>
          <span style="font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; background: rgba(255,170,0,0.16); color: var(--org-t);">Awaiting commit</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--s2); color: var(--ok); display: flex; align-items: center; justify-content: center;">${ICONS.check}</div>
          <div>
            <div style="font-weight: 800; font-size: 14px;">Daily check-in</div>
            <div style="font-size: 12px; color: var(--mut);">Day 4 of streak · Nov 1, 2026</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span class="num" style="font-weight: 800; font-size: 15px; color: var(--ok);">+20 pts</span>
          <span style="font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; background: rgba(255,170,0,0.16); color: var(--org-t);">Awaiting commit</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--s2); color: var(--ok); display: flex; align-items: center; justify-content: center;">${ICONS.check}</div>
          <div>
            <div style="font-weight: 800; font-size: 14px;">Daily check-in</div>
            <div style="font-size: 12px; color: var(--mut);">Day 3 of streak · Oct 31, 2026</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span class="num" style="font-weight: 800; font-size: 15px; color: var(--ok);">+20 pts</span>
          <span style="font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; background: rgba(255,170,0,0.16); color: var(--org-t);">Awaiting commit</span>
        </div>
      </div>
    </div>
  </div>
`;

// 7. Wallet Desktop & Mobile
const desktopWalletMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Web3 Custody</div>
    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
      <div>
        <div style="font-size: 14px; opacity: 0.85;">Connected Address</div>
        <div class="num" style="font-size: 32px; font-weight: 800; line-height: 1.1; margin-top: 4px;">0x71C...49A1</div>
      </div>
      <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 12px; display: flex; align-items: center; gap: 8px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--ok); "></span>
        <span style="font-size: 13px; font-weight: 700;">BNB Smart Chain (Testnet)</span>
      </div>
    </div>
  </section>

  <div class="resp-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 16px; font-weight: 800; margin-bottom: 20px;">Asset Balances</div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${ICONS.bnb}
          <span style="color: var(--mut); font-size: 14px; font-weight: 700;">BNB (Native Gas)</span>
        </div>
        <span class="num" style="font-weight: 800; font-size: 16px;">1.45 BNB</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line);">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${logoImgDesktop}
          <span style="color: var(--mut); font-size: 14px; font-weight: 700;">$OKN Token</span>
        </div>
        <span class="num" style="font-weight: 800; font-size: 16px; color: var(--vio-l);">0 $OKN</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 14px 0;">
        <span style="color: var(--mut); font-size: 14px;">OK Points Balance</span>
        <span class="num" style="font-weight: 800; font-size: 16px; color: var(--ok);">100 pts</span>
      </div>
      <button onclick="openWalletModal()" style="width: 100%; margin-top: 20px; height: 48px; border-radius: 14px; background: var(--s2); border: 1px solid var(--line); color: var(--tx); font-weight: 800; cursor: pointer;">Switch Wallet</button>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 16px; font-weight: 800; margin-bottom: 14px;">Deposit & Withdraw</div>
      <p style="font-size: 14px; color: var(--mut); line-height: 1.6; margin: 0 0 24px;">Deposit BNB to participate in the presale allocation or withdraw claimable $OKN allocations to your personal non-custodial wallet.</p>
      <div style="display: flex; gap: 12px;">
        <a href="buy.html" style="flex: 1; height: 46px; border-radius: 14px; background: var(--vio); color: #fff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; text-decoration: none;">Buy $OKN</a>
        <a href="claim.html" style="flex: 1; height: 46px; border-radius: 14px; background: var(--s2); border: 1px solid var(--line); color: var(--tx); font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; text-decoration: none;">Claim $OKN</a>
      </div>
    </div>
  </div>
`;

// 8. Leaderboard Desktop & Mobile
const desktopLeaderboardMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Community Standings</div>
    <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em;">OK Points Leaderboard</h1>
    <p style="font-size: 15px; opacity: 0.85; margin: 0; max-width: 600px;">Rankings update dynamically as community members complete tasks and onboard referrals.</p>
  </section>

  <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 24px 28px;">
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: 16px; background: var(--s2);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,214,10,0.18); color: #FFD60A; font-weight: 900; font-size: 14px; border: 1px solid rgba(255,214,10,0.4); ">1</span>
          <div>
            <div style="font-weight: 800; font-size: 15px;">0x82A...9F21</div>
            <div style="font-size: 12px; color: var(--mut);">34 referrals · Level 7</div>
          </div>
        </div>
        <span class="num" style="font-weight: 800; font-size: 16px; color: #FFD60A;">1,420 pts</span>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: 16px; background: var(--s2);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: rgba(180,185,200,0.18); color: #B4B9C8; font-weight: 900; font-size: 14px; border: 1px solid rgba(180,185,200,0.4);">2</span>
          <div>
            <div style="font-weight: 800; font-size: 15px;">0x39F...11C4</div>
            <div style="font-size: 12px; color: var(--mut);">28 referrals · Level 6</div>
          </div>
        </div>
        <span class="num" style="font-weight: 800; font-size: 16px; color: #B4B9C8;">1,180 pts</span>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: 16px; background: var(--s2);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,170,0,0.18); color: #FFAA00; font-weight: 900; font-size: 14px; border: 1px solid rgba(255,170,0,0.4);">3</span>
          <div>
            <div style="font-weight: 800; font-size: 15px;">0xD41...88E0</div>
            <div style="font-size: 12px; color: var(--mut);">19 referrals · Level 5</div>
          </div>
        </div>
        <span class="num" style="font-weight: 800; font-size: 16px; color: #FFAA00;">940 pts</span>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: 16px; background: var(--s1); border-top: 1px solid var(--line);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--s2); color: var(--mut); font-weight: 800; font-size: 13px;">4</span>
          <div>
            <div style="font-weight: 800; font-size: 15px;">DE (You)</div>
            <div style="font-size: 12px; color: var(--mut);">0 referrals · Level 3</div>
          </div>
        </div>
        <span class="num" style="font-weight: 800; font-size: 16px; color: var(--ok);">100 pts</span>
      </div>
    </div>
  </div>
`;

// 9. Missions Desktop
const desktopMissionsMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Ecosystem Bounties</div>
    <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em;">Missions & Rewards</h1>
    <p style="font-size: 15px; opacity: 0.85; margin: 0; max-width: 600px;">Unlock exclusive points, early tester badges, and future token airdrop multipliers.</p>
  </section>

  <div class="resp-grid-2" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Testnet Pioneer</div>
      <p style="font-size: 13px; color: var(--mut); line-height: 1.6; margin: 0 0 18px;">Execute a test purchase on BSC Testnet with faucet BNB.</p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="num" style="font-weight: 800; font-size: 15px; color: var(--ok);">+250 OK Points</span>
        <a href="buy.html" style="padding: 8px 18px; border-radius: 12px; background: var(--vio); color: #fff; font-size: 13px; font-weight: 700; text-decoration: none;">Start</a>
      </div>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Community Builder</div>
      <p style="font-size: 13px; color: var(--mut); line-height: 1.6; margin: 0 0 18px;">Invite 3 friends to the OKN platform using your unique referral code.</p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="num" style="font-weight: 800; font-size: 15px; color: var(--ok);">+500 OK Points</span>
        <a href="referral.html" style="padding: 8px 18px; border-radius: 12px; background: var(--s2); border: 1px solid var(--line); color: var(--tx); font-size: 13px; font-weight: 700; text-decoration: none;">Invite</a>
      </div>
    </div>
  </div>
`;

// 10. News Desktop
const desktopNewsMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Official Updates</div>
    <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em;">Ecosystem News</h1>
    <p style="font-size: 15px; opacity: 0.85; margin: 0; max-width: 600px;">Direct dispatches from the OKN core development team.</p>
  </section>

  <div style="display: flex; flex-direction: column; gap: 16px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; background: rgba(9,180,255,0.15); color: var(--cyan);">Protocol</span>
        <span style="font-size: 12px; color: var(--mut);">Nov 2, 2026</span>
      </div>
      <div style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">BSC Testnet Smart Contracts Deployed</div>
      <p style="font-size: 14px; color: var(--mut); line-height: 1.6; margin: 0;">Presale, staking, and Merkle claim distribution contracts have been verified on BSC Testnet. Testing is currently underway.</p>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; background: rgba(255,214,10,0.15); color: var(--yel-t);">Community</span>
        <span style="font-size: 12px; color: var(--mut);">Oct 28, 2026</span>
      </div>
      <div style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">Affiliate Partner Program Launch</div>
      <p style="font-size: 14px; color: var(--mut); line-height: 1.6; margin: 0;">Partners can now access up to 15% direct commission and custom tracking links through the partner package dashboard.</p>
    </div>
  </div>
`;

// 11. Learn Desktop
const desktopLearnMain = `
  <section style="background: var(--vio); color: #fff; border-radius: 28px; padding: 32px 36px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px;">Documentation & Guides</div>
    <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em;">Learn OKN</h1>
    <p style="font-size: 15px; opacity: 0.85; margin: 0; max-width: 600px;">Architecture, smart contracts, cryptographic verification, and tokenomics.</p>
  </section>

  <div class="resp-grid-2" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(122,18,245,0.15); color: var(--vio-l); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">${ICONS.book}</div>
      <div style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Technical Whitepaper</div>
      <p style="font-size: 13px; color: var(--mut); line-height: 1.6; margin: 0 0 18px;">Detailed specifications on the on-chain Merkle tree distribution and gas-optimized claims.</p>
      <a href="claim.html" style="font-size: 13px; font-weight: 700; color: var(--vio-l); display: flex; align-items: center; gap: 6px; text-decoration: none;">
        <span>Read whitepaper</span>
        ${ICONS.arrowRight}
      </a>
    </div>

    <div style="background: var(--s1); border: 1px solid var(--line); border-radius: 24px; padding: 28px;">
      <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(47,189,142,0.15); color: var(--ok); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">${ICONS.shield}</div>
      <div style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Smart Contract Audits</div>
      <p style="font-size: 13px; color: var(--mut); line-height: 1.6; margin: 0 0 18px;">Open-source bytecode verification, test coverage reports, and security disclosures.</p>
      <a href="https://testnet.bscscan.com" target="_blank" style="font-size: 13px; font-weight: 700; color: var(--ok); display: flex; align-items: center; gap: 6px; text-decoration: none;">
        <span>View on BscScan</span>
        ${ICONS.arrowRight}
      </a>
    </div>
  </div>
`;

// Helper for mobile versions of secondary pages
function makeSubpageMobile(title, mainContent) {
  return `
    <div style="padding: 16px 16px 90px; width: 100%; max-width: 540px; margin: 0 auto; box-sizing: border-box;">
      ${mainContent}
    </div>
  `;
}

// Build all responsive pages
const pagesToBuild = [
  {
    title: 'Portfolio',
    activeNav: 'Portfolio',
    activeBottomTab: 'Home',
    desktopMain: desktopPortfolioMain,
    mobile: makeSubpageMobile('Portfolio', desktopPortfolioMain),
    filenames: ['portfolio.html', 'Desktop.dc.html', 'index.html', 'desktop.html', 'DesktopCollapsed.dc.html', 'Desktop__Portfolio__sidebar_collapsed.html']
  },
  {
    title: 'Tasks',
    activeNav: 'Tasks',
    activeBottomTab: 'Earn',
    desktopMain: desktopEarnMain,
    mobile: mobileEarn,
    filenames: ['tasks.html', 'Earn.dc.html', 'earn.html', 'Earn.html']
  },
  {
    title: 'Claim',
    activeNav: 'Claim',
    activeBottomTab: 'Claim',
    desktopMain: desktopClaimMain,
    mobile: mobileClaim,
    filenames: ['claim.html', 'Claim.dc.html', 'Claim.html']
  },
  {
    title: 'Buy',
    activeNav: 'Buy',
    activeBottomTab: 'Buy',
    desktopMain: desktopBuyMain,
    mobile: mobileBuy,
    filenames: ['buy.html', 'Buy.dc.html', 'Buy.html']
  },
  {
    title: 'Agents',
    activeNav: 'AI Trading Agent',
    activeBottomTab: 'Agents',
    desktopMain: desktopAgentsMain,
    mobile: mobileAgents,
    filenames: ['agents.html', 'Agents.dc.html', 'Agents.html']
  },
  {
    title: 'Referral',
    activeNav: 'Referral',
    activeBottomTab: 'Home',
    desktopMain: desktopReferralMain,
    mobile: mobileReferral,
    filenames: ['referral.html', 'Referral.dc.html', 'Referral.html']
  },
  {
    title: 'Activity',
    activeNav: 'Portfolio',
    activeBottomTab: 'Home',
    desktopMain: desktopActivityMain,
    mobile: mobileActivity,
    filenames: ['activity.html', 'Activity.dc.html', 'Activity.html']
  },
  {
    title: 'Home',
    activeNav: 'Portfolio',
    activeBottomTab: 'Home',
    desktopMain: desktopPortfolioMain,
    mobile: makeSubpageMobile('Home', desktopPortfolioMain),
    filenames: ['home.html', 'Main.dc.html', 'Home.dc.html', 'Main.html', 'mobile.html']
  },

  {
    title: 'Wallet',
    activeNav: 'Wallet',
    activeBottomTab: 'Home',
    desktopMain: desktopWalletMain,
    mobile: makeSubpageMobile('Wallet', desktopWalletMain),
    filenames: ['wallet.html']
  },
  {
    title: 'Leaderboard',
    activeNav: 'Leaderboard',
    activeBottomTab: 'Home',
    desktopMain: desktopLeaderboardMain,
    mobile: makeSubpageMobile('Leaderboard', desktopLeaderboardMain),
    filenames: ['leaderboard.html']
  },
  {
    title: 'Missions',
    activeNav: 'Missions',
    activeBottomTab: 'Home',
    desktopMain: desktopMissionsMain,
    mobile: makeSubpageMobile('Missions', desktopMissionsMain),
    filenames: ['missions.html']
  },
  {
    title: 'News',
    activeNav: 'News',
    activeBottomTab: 'Home',
    desktopMain: desktopNewsMain,
    mobile: makeSubpageMobile('News', desktopNewsMain),
    filenames: ['news.html']
  },
  {
    title: 'Learn',
    activeNav: 'Learn',
    activeBottomTab: 'Home',
    desktopMain: desktopLearnMain,
    mobile: makeSubpageMobile('Learn', desktopLearnMain),
    filenames: ['learn.html']
  }
];

pagesToBuild.forEach(p => {
  const fullHtml = assemblePage({
    title: p.title,
    activeNav: p.activeNav,
    activeBottomTab: p.activeBottomTab,
    desktopMainContent: p.desktopMain,
    mobileContent: p.mobile
  });

  p.filenames.forEach(fn => {
    fs.writeFileSync(path.join(rootDir, fn), fullHtml, 'utf8');
    console.log(`Wrote full responsive: ${fn} (${fullHtml.length} bytes)`);
  });
});

console.log('Finished rebuilding all 35+ routes with 100% SVG icons and unified responsive architecture!');
