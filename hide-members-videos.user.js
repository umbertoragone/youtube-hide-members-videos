// ==UserScript==
// @name         YouTube Hide Members Videos
// @version      1.2.7
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
  const HOME_PROMO_SECTION_SELECTOR =
    "ytd-rich-grid-renderer > #contents > ytd-rich-section-renderer";
  const HOME_PROMO_SHELF_SELECTOR =
    ":scope > #content > ytd-brand-video-shelf-renderer";
  const SECTION_CONTAINER_SELECTOR = "ytd-rich-section-renderer";
  const SHELF_SELECTOR = "ytd-shelf-renderer";
  const SHELF_TEXT_SELECTOR = "#title, #subtitle, a[title]";

  const CHANNEL_ATTRIBUTION_SELECTOR =
    "yt-attribution-view-model.ytPageHeaderViewModelAttribution";
  const WATCH_PAGE_JOIN_BUTTON_SELECTOR =
    "ytd-watch-metadata #owner #sponsor-button";
  const CHANNEL_ACTIONS_SELECTOR =
    "yt-flexible-actions-view-model.ytPageHeaderViewModelFlexibleActions";
  const MEMBER_RECOGNITION_SELECTOR = "ytd-recognition-shelf-renderer";
  const CHANNEL_SECTION_SELECTOR =
    'ytd-item-section-renderer[page-subtype="channels"]';
  const memberSections = new WeakSet();

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
        removeMemberShelf(shelf);
      }
    }
  }

  function removeHomeMembershipPromos() {
    const sections = document.querySelectorAll(HOME_PROMO_SECTION_SELECTOR);
    for (const section of sections) {
      const shelf = section.querySelector(HOME_PROMO_SHELF_SELECTOR);
      if (!shelf) continue;

      // Brand shelves also promote other content. The memberships destination
      // identifies this promotion without relying on translated text or labels.
      const hasMembershipLink = Array.from(shelf.querySelectorAll("a[href]"))
        .some((link) => {
          try {
            const url = new URL(link.getAttribute("href"), window.location.href);
            return (
              url.origin === window.location.origin &&
              url.pathname === "/channel_memberships"
            );
          } catch {
            return false;
          }
        });
      // Some live variants omit the memberships CTA entirely. Only treat a
      // badge-based shelf as a membership promotion when every video is marked.
      const videos = Array.from(shelf.querySelectorAll("ytd-rich-grid-media"));
      const hasOnlyMemberVideos = videos.length > 0 && videos.every((video) =>
        video.querySelector(".ytBadgeShapeMembership")
      );
      if (hasMembershipLink || hasOnlyMemberVideos) {
        removeElement(section);
      }
    }
  }

  function removeMemberShelf(shelf) {
    const section = shelf.closest(CHANNEL_SECTION_SELECTOR);
    const contents = section?.querySelector(":scope > #contents");
    if (contents?.contains(shelf)) {
      memberSections.add(section);
    }
    removeElement(shelf);
  }

  function hasMemberSectionData(section) {
    // YouTube retains renderer data after a shelf has been removed from the DOM.
    // This also identifies wrappers left by an earlier script execution.
    const items = section.data?.contents;
    if (!Array.isArray(items)) return false;
    return items.some((item) => {
      if (item.recognitionShelfRenderer) return true;
      const shelf = item.shelfRenderer;
      if (!shelf) return false;
      const text = [shelf.title, shelf.subtitle]
        .map((value) =>
          value?.simpleText ||
          (Array.isArray(value?.runs)
            ? value.runs.map((run) => run.text || "").join("")
            : "")
        )
        .join(" ");
      return isMemberText(text);
    });
  }

  function removeChannelMembershipPromos() {
    const attributions = document.querySelectorAll(CHANNEL_ATTRIBUTION_SELECTOR);
    for (const attribution of attributions) {
      if (attribution.querySelector("badge-shape.ytBadgeShapeCommerce")) {
        removeElement(attribution);
      }
    }

    // Subscribe has a dedicated host. The membership Join action is the
    // separate generic button-view-model, independent of its translated text.
    const actionRows = document.querySelectorAll(CHANNEL_ACTIONS_SELECTOR);
    for (const actionRow of actionRows) {
      const actions = actionRow.querySelectorAll(
        ".ytFlexibleActionsViewModelAction"
      );
      for (const action of actions) {
        const isGenericButtonAction =
          action.querySelector(":scope > button-view-model") &&
          !action.querySelector("yt-subscribe-button-view-model");
        const membershipLink = Array.from(
          action.querySelectorAll("a[href]")
        ).some((link) => {
          try {
            const url = new URL(link.getAttribute("href"), window.location.href);
            return (
              url.origin === window.location.origin &&
              (url.pathname === "/channel_memberships" ||
                url.pathname.endsWith("/join"))
            );
          } catch {
            return false;
          }
        });

        if (isGenericButtonAction || membershipLink) {
          removeElement(action);
        }
      }
    }

    const recognitionShelves = document.querySelectorAll(
      MEMBER_RECOGNITION_SELECTOR
    );
    for (const shelf of recognitionShelves) {
      removeMemberShelf(shelf);
    }
  }

  function removeWatchPageJoinButton() {
    if (window.location.pathname !== "/watch") return;

    const joinButtons = document.querySelectorAll(
      WATCH_PAGE_JOIN_BUTTON_SELECTOR
    );
    for (const button of joinButtons) {
      removeElement(button);
    }
  }

  function removeEmptyMemberSections() {
    const sections = document.querySelectorAll(CHANNEL_SECTION_SELECTOR);
    for (const section of sections) {
      // Remember the shelf's owner across asynchronous YouTube updates.
      // Other empty sections may still be loading and must stay untouched.
      const contents = section.querySelector(":scope > #contents");
      if (!contents || contents.textContent.trim()) continue;

      const hasContent = Array.from(contents.children).some((child) => {
        if (child.matches("template")) return false;
        if (child.matches("dom-repeat, ps-dom-repeat")) {
          return Array.from(child.children).some(
            (element) => !element.matches("template")
          );
        }
        return true;
      });
      if (
        !hasContent &&
        (memberSections.has(section) || hasMemberSectionData(section))
      ) {
        removeElement(section);
      }
    }
  }

  function hideMembersVideos() {
    removeHomeMembershipPromos();
    removeChannelMembershipPromos();
    removeWatchPageJoinButton();
    removeMemberShelves();

    // Hide member-only promotional lockups identified by both labels.
    const lockups = document.querySelectorAll("yt-lockup-view-model");
    for (const lockup of lockups) {
      const text = (lockup.textContent || "").toLowerCase();
      if (text.includes("youtube featured") && text.includes("try for")) {
        removeElement(lockup);
      }
    }

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

    removeEmptyMemberSections();
  }

  const observer = new MutationObserver(hideMembersVideos);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("yt-navigate-finish", hideMembersVideos);
  window.addEventListener("scroll", hideMembersVideos, { passive: true });

  console.log("[YouTube Hide Members Videos] Loaded and hiding member videos");
  hideMembersVideos();
})();
