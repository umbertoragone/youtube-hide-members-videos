// ==UserScript==
// @name         YouTube Hide Members Videos
// @version      1.0
// @description  Hide all "Members only" or "Members first" videos from YouTube sections
// @author       umbertoragone
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  // Will cover both "Members only" and "Members first"
  const MEMBER_BADGE_SELECTORS = [
    ".badge-style-type-members-only",
    ".badge-style-type-members-first",
  ];

  // Return the top-level video container for any given badge
  function getVideoContainer(el) {
    return el.closest(
      "ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, yt-lockup-view-model"
    );
  }

  function hideMembersVideos() {
    const badges = document.querySelectorAll(MEMBER_BADGE_SELECTORS.join(","));
    badges.forEach((badge) => {
      const container = getVideoContainer(badge);
      if (container && container.style.display !== "none") {
        container.style.display = "none";
      }
    });
  }

  // Observe new content loads (YouTube SPA dynamically inserts)
  const observer = new MutationObserver(() => hideMembersVideos());
  observer.observe(document.body, { childList: true, subtree: true });

  // Run initially
  window.addEventListener("yt-navigate-finish", hideMembersVideos);
  window.addEventListener("scroll", hideMembersVideos, { passive: true });

  console.log("[YouTube Hide Members Videos] ✅ Loaded and hiding on observe");
  hideMembersVideos();
})();
