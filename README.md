# YouTube Hide Members Videos

[![GitHub release](https://img.shields.io/github/v/release/umbertoragone/youtube-hide-members-videos)](https://github.com/umbertoragone/youtube-hide-members-videos/releases)

A lightweight userscript that **automatically hides "Members only"** and **"Members first"** videos from all sections of YouTube — including the homepage, search results, subscriptions feed, channel video pages and related/suggested videos in the sidebar.

## Features

- Hides **"Members only"** and **"Members first"** videos, plus promotional cards labeled **"YouTube featured"** and **"Try for"**
- Hides the **"Discover members-only content"** YouTube featured section on the homepage
- Hides the entire **"Get more from memberships"** homepage banner using its renderer structure and membership links or badge classes, independently of the interface language
- Hides **"Members-only videos"** and **"Our members"** sections on channel pages
- Hides channel membership pricing and **Join** buttons on channel and video pages across localized YouTube interfaces
- Multilingual support — works in 10+ languages
- Works dynamically with YouTube's modern **Single Page Application (SPA)** behavior
- Rechecks changed cards and sections as YouTube loads or recycles content
- Keeps YouTube's DOM nodes intact and restores recycled elements when they no longer contain membership content
- 100% client‑side — no API calls, no external dependencies

## How It Works

The script monitors YouTube's DOM for badges like:

```html
<div class="badge badge-style-type-members-only" aria-label="Members only"></div>
```

When one is found, it hides the parent video container (e.g. `<ytd-rich-item-renderer>`).
For YouTube's homepage **"Discover members-only content"** featured section, it hides the whole section container.
For the **"Get more from memberships"** banner, it hides the whole homepage grid section when its `ytd-brand-video-shelf-renderer` links to `/channel_memberships`, or contains videos that all have a `.ytBadgeShapeMembership` badge. This also handles variants without the membership button. Unrelated brand shelves are preserved; translated headings and aria-labels are not used for this check.
It keeps watching for new items as YouTube loads more videos dynamically via infinite scroll.

Changed cards and their enclosing sections are checked once per animation frame. Navigation events trigger a complete scan. Hiding uses a CSS attribute, so YouTube can keep managing its own nodes. Channel sections are hidden only when all their rendered children are membership content, including children inside `dom-repeat` and `ps-dom-repeat`.
If animation callbacks stall, a 100 ms timer runs the pending check.

## Installation

### Option 1. Using Tampermonkey (Recommended)

[![Install](https://img.shields.io/badge/Install-Tampermonkey-00485B?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/umbertoragone/youtube-hide-members-videos/main/hide-members-videos.user.js)

**Quick install:** Click the button above if you already have Tampermonkey installed.

Or install manually:

1. Install **[Tampermonkey](https://www.tampermonkey.net/)** for your browser.
2. Click **Create a new script**.
3. Paste the contents of [`hide-members-videos.user.js`](./hide-members-videos.user.js).
4. Save the script and refresh **YouTube**.

### Option 2. Using AdGuard

[![Install](https://img.shields.io/badge/Install-AdGuard-68BC71?style=for-the-badge&logo=adguard&logoColor=white)](https://raw.githubusercontent.com/umbertoragone/youtube-hide-members-videos/main/hide-members-videos.user.js)

**Quick install:** Click the button above if you already have AdGuard installed.

Or install manually:

1. Open AdGuard settings.
2. Navigate to **Extensions → Userscripts** (or **Filters → Custom** if using the extension).
3. Click **Add userscript**.
4. Enter the direct URL to the script: `https://raw.githubusercontent.com/umbertoragone/youtube-hide-members-videos/main/hide-members-videos.user.js`
5. AdGuard will download and manage the script automatically.
6. Refresh YouTube to activate it.

## Contributing

Pull requests are welcome. If YouTube changes its layout (again) or you can help add support for another language, please open an issue including an HTML snippet showing the updated badge element or the new section so the selectors can be updated quickly.
