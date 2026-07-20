// ==UserScript==
// @name         YouTube Hide Members Videos
// @version      1.2.2
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
    ".badge-style-type-members-only, .badge-style-type-members-first, .yt-badge-shape--membership, .yt-badge-shape--commerce, .ytBadgeShapeMembership, badge-shape.ytBadgeShapeMembership";

  const RICH_ITEM_SELECTOR = "ytd-rich-item-renderer";
  const VIDEO_CONTAINER_SELECTOR =
    "ytd-grid-video-renderer, ytd-video-renderer, yt-lockup-view-model";

  const MEMBER_PROMO_SELECTOR = "ytd-brand-video-singleton-renderer";
  const SECTION_CONTAINER_SELECTOR = "ytd-rich-section-renderer";
  const SHELF_SELECTOR = "ytd-shelf-renderer";
  const SHELF_TEXT_SELECTOR = "#title, #subtitle, a[title]";

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
    "メンバー限定", // Japanese
    "会员专享", // Chinese
    "membros exclusivos", // Portuguese
    "nur für kanalmitglieder", // German
    "abonnés uniquement", // French
    "solo abbonati", // Italian
    "miembros del canal", // Spanish
    "members-only",
  ];

  function isMemberText(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return (
      MEMBER_TEXTS.some((memberText) => lower.includes(memberText)) ||
      lower.includes("videos available to members")
    );
  }

  function removeElement(element) {
    if (element && element.isConnected) {
      element.remove();
    }
  }

  function getHideContainer(element) {
    const promo = element.closest(MEMBER_PROMO_SELECTOR);
    if (promo) {
      return promo.closest(SECTION_CONTAINER_SELECTOR) || promo;
    }

    return (
      element.closest(RICH_ITEM_SELECTOR) ||
      element.closest(VIDEO_CONTAINER_SELECTOR)
    );
  }

  function removeMemberShelves() {
    const shelves = document.querySelectorAll(SHELF_SELECTOR);
    for (const shelf of shelves) {
      const text = Array.from(shelf.querySelectorAll(SHELF_TEXT_SELECTOR))
        .map(
          (element) =>
            `${element.textContent || ""} ${element.getAttribute("title") || ""}`
        )
        .join(" ");

      if (isMemberText(text)) {
        removeElement(shelf);
      }
    }
  }

  function hideMembersVideos() {
    removeMemberShelves();

    // Find the regular badge elements first
    const badges = document.querySelectorAll(BADGE_SELECTORS);
    for (const badge of badges) {
      const container = getHideContainer(badge);
      removeElement(container);
    }

    // Find yt-badge-view-model elements with member text
    const textBadges = document.querySelectorAll("yt-badge-view-model");
    for (const badge of textBadges) {
      const text = badge.textContent;
      if (isMemberText(text)) {
        const container = getHideContainer(badge);
        removeElement(container);
      }
    }

    // Find badge shapes with member text (newer structures)
    const badgeShapes = document.querySelectorAll("badge-shape, yt-badge-shape");
    for (const badgeShape of badgeShapes) {
      const text = `${badgeShape.textContent || ""} ${
        badgeShape.getAttribute("aria-label") || ""
      }`;
      if (
        badgeShape.classList.contains("ytBadgeShapeMembership") ||
        isMemberText(text)
      ) {
        const container = getHideContainer(badgeShape);
        removeElement(container);
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
          removeElement(wrapper);
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
