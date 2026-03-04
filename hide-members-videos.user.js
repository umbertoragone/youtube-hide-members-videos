// ==UserScript==
// @name         YouTube Hide Members Videos
// @version      1.2.0
// @description  Hide all "Members only" or "Members first" videos from YouTube sections, including filter chips and international languages
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
    ".badge-style-type-members-only, .badge-style-type-members-first, .yt-badge-shape--membership, .yt-badge-shape--commerce";

  const CONTAINER_SELECTOR =
    "ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, yt-lockup-view-model";

  const MEMBERS_CHIP_SELECTOR = "ytChipBarViewModelChipWrapper";

  // International member badge texts (lowercase for matching)
  const MEMBER_TEXTS = [
    "members only",
    "members first",
    "anteprima per abbonati", // Italian
    "solo per abbonati", // Italian alternative
    "membri", // Italian "members"
    "abbonati", // Italian "subscribers/members"
    "solo miembros", // Spanish
    "membres uniquement", // French
    "nur für mitglieder", // German
    "membros", // Portuguese
    "члены канала", // Russian
    "チャンネル メンバー", // Japanese
    "会员专享", // Chinese
  ];

  function isMemberText(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return MEMBER_TEXTS.some((memberText) => lower.includes(memberText));
  }

  function hideElement(element) {
    if (element && element.style.display !== "none") {
      element.style.display = "none";
    }
  }

  function hideMembersVideos() {
    // Find the regular badge elements first
    const badges = document.querySelectorAll(BADGE_SELECTORS);
    for (const badge of badges) {
      const container = badge.closest(CONTAINER_SELECTOR);
      hideElement(container);
    }

    // Find yt-badge-view-model elements with member text
    const textBadges = document.querySelectorAll("yt-badge-view-model");
    for (const badge of textBadges) {
      const text = badge.textContent;
      if (isMemberText(text)) {
        const container = badge.closest(CONTAINER_SELECTOR);
        hideElement(container);
      }
    }

    // Find yt-badge-shape elements with member text (newer structure)
    const badgeShapes = document.querySelectorAll(
      "yt-badge-shape .yt-badge-shape__text"
    );
    for (const badgeText of badgeShapes) {
      if (isMemberText(badgeText.textContent)) {
        const container = badgeText.closest(CONTAINER_SELECTOR);
        hideElement(container);
      }
    }

    // Hide "Members only" filter chips in the chip bar
    const chipWrappers = document.querySelectorAll(`.${MEMBERS_CHIP_SELECTOR}`);
    for (const wrapper of chipWrappers) {
      const chipButton = wrapper.querySelector('button[role="tab"]');
      if (chipButton) {
        const ariaLabel = chipButton.getAttribute("aria-label");
        const chipText = chipButton.textContent;
        if (isMemberText(ariaLabel) || isMemberText(chipText)) {
          hideElement(wrapper);
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