// ==UserScript==
// @name         YouTube Hide Members Videos
// @version      1.1.0
// @description  Hide all "Members only" or "Members first" videos from YouTube sections
// @author       umbertoragone
// @match        *://*.youtube.com/*
// @exclude      *://music.youtube.com/*
// @exclude      *://*.music.youtube.com/*
// @compatible   chrome
// @compatible   firefox
// @compatible   opera
// @compatible   safari
// @compatible   edge
// @downloadURL  https://github.com/umbertoragone/youtube-hide-members-videos/raw/main/hide-members-videos.user.js
// @updateURL    https://github.com/umbertoragone/youtube-hide-members-videos/raw/main/hide-members-videos.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {
  "use strict";

  const BADGE_SELECTORS =
    ".badge-style-type-members-only, .badge-style-type-members-first";

  const CONTAINER_SELECTOR =
    "ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, yt-lockup-view-model";

  function hideMembersVideos() {
    // Find the regular badge elements first
    const badges = document.querySelectorAll(BADGE_SELECTORS);
    for (const badge of badges) {
      const container = badge.closest(CONTAINER_SELECTOR);
      if (container && container.style.display !== "none") {
        container.style.display = "none";
      }
    }

    // Also find elements that have membership text (e.g. in the related videos sidebar)
    const textBadges = document.querySelectorAll("yt-badge-view-model");
    for (const badge of textBadges) {
      const text = badge.textContent?.toLowerCase().trim();
      if (
        text &&
        (text.includes("members only") || text.includes("members first"))
      ) {
        const container = badge.closest(CONTAINER_SELECTOR);
        if (container && container.style.display !== "none") {
          container.style.display = "none";
        }
      }
    }
  }

  const observer = new MutationObserver(hideMembersVideos);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("yt-navigate-finish", hideMembersVideos);
  window.addEventListener("scroll", hideMembersVideos, { passive: true });

  console.log("[YouTube Hide Members Videos] Loaded and hiding member videos");
  hideMembersVideos();
})();
