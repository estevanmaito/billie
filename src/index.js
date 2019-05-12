import axe from "axe-core";
import "./billie.css";

(async function() {
  const _violations = await getViolations();
  const _errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/></svg>`;
  const _closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>`;

  /**
   * Get all accessibility violations in the current page
   * @return {object} An object containing all element violations
   */
  async function getViolations() {
    let violations = {};
    let results = await axe.run();
    results.violations.forEach(el => {
      el.nodes.forEach(node => {
        violations[node.target] = {
          message: el.help,
          impact: el.impact,
          any: node.any,
          all: node.all,
          none: node.none
        };
      });
    });
    return violations;
  }

  /**
   * Get elements' position and size
   * @param {string} selector - a CSS selector
   * @return {ClientRect} Bounding Client Rect
   */
  function getElementMeasures(selector) {
    return document.querySelector(selector).getBoundingClientRect();
  }

  /**
   * Draw an alert element over every violation in the document
   * @param {string} selector a CSS selector
   * @param {function} onClick click handler
   */
  function drawAlert(selector, onClick) {
    const { width, height, top, left } = getElementMeasures(selector);

    const div = document.createElement("div");
    div.onclick = onClick;
    div.setAttribute("data-selector", selector);

    const totalTop = top + window.pageYOffset;
    const totalLeft = left + window.pageXOffset;

    div.style.cssText = `width:${width}px;height:${height}px;top:${totalTop}px;left:${totalLeft}px;`;
    div.classList.add(
      `billie--alert--${_violations[selector].impact}`,
      "billie--alert"
    );

    document.body.appendChild(div);
  }

  /**
   * Handle click events
   */
  function handleAlertClick() {
    removeTooltipIfExists();
    createTooltip(this.dataset.selector);
  }

  /**
   * Remove tooltip if it already exists
   */
  function removeTooltipIfExists() {
    const hasTooltip = document.querySelector(".billie--tooltip");
    if (hasTooltip) {
      document.body.removeChild(hasTooltip);
    }
  }

  /**
   * Create the comlete tooltip
   * @param {string} selector - a CSS selector
   */
  function createTooltip(selector) {
    const { top, left, height, width } = getElementMeasures(selector);
    const totalTop = top + window.pageYOffset + 8 + height;
    let totalSide = `left:${left + window.pageXOffset}px;`;
    const distanceFromRightSide = window.innerWidth - left;

    const tooltip = document.createElement("div");

    // if element is too close to right, draw tooltip to the left
    if (distanceFromRightSide < left && distanceFromRightSide < 500) {
      totalSide = `right:${distanceFromRightSide - width}px;`;
      tooltip.classList.add("billie--tooltip", "billie--tooltip--right");
    } else {
      tooltip.classList.add("billie--tooltip", "billie--tooltip--left");
    }

    tooltip.style.cssText = `top:${totalTop}px;${totalSide}`;

    const current = _violations[selector];

    const title = createTitle(current);
    const messageContainer = createMessageContainer(current, _errorIcon);
    const closeBtn = createCloseButton(_closeIcon, removeTooltipIfExists);
    const fixes = createFixesList(current);

    tooltip.append(title, messageContainer, closeBtn, fixes);

    document.body.appendChild(tooltip);
  }

  /**
   * Capitalized the first word
   * @param {string} word - a string to be capitalized
   * @return {string} A capitalized string
   */
  function capitalizeWord(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /**
   * Create the title element
   * @param {object} violation - a violatin object
   * @return {HTMLSpanElement} An HTML element
   */
  function createTitle(violation) {
    const title = document.createElement("span");
    title.innerHTML = `Accessibility ${capitalizeWord(
      violation.impact
    )} Violation`;
    title.classList.add("billie--tooltip__title");

    return title;
  }

  /**
   * Create the container for message and it's icon
   * @param {object} violation - a violation object
   * @param {string} icon - an SVG icon
   * @return {HTMLDivElement} An HTML element
   */
  function createMessageContainer(violation, icon) {
    const msgContainer = document.createElement("div");
    msgContainer.classList.add("billie--message__container");

    const msg = document.createElement("span");
    msg.textContent = violation.message;

    const icn = document.createElement("span");
    icn.classList.add(`billie--${violation.impact}`, "billie--tooltip__impact");
    icn.innerHTML = icon;
    icn.title = violation.impact;

    msgContainer.append(icn, msg);

    return msgContainer;
  }

  /**
   * Create the close button
   * @param {string} icon - an SVG icon
   * @param {*} onClick - click event handle
   * @return {HTMLSpanElement} An HTML element
   */
  function createCloseButton(icon, onClick) {
    const btn = document.createElement("span");
    btn.classList.add("billie--tooltip__close");
    btn.innerHTML = icon;
    btn.onclick = onClick;

    return btn;
  }

  /**
   * Create and unordered list
   * @return {HTMLUListElement} An HTML element
   */
  function createList() {
    return document.createElement("ul");
  }

  /**
   * Create a list item
   * @param {string} text - the content of the list item
   * @return {HTMLLIElement} An HTML element
   */
  function createListItem(text) {
    const li = document.createElement("li");
    li.textContent = text;
    return li;
  }

  /**
   * Create the hint over fixes lists
   * @param {string} type - the type of the fix hint
   * @return {HTMLParagraphElement} An HTML element
   */
  function fixHint(type) {
    const p = document.createElement("p");
    p.innerHTML = `Fix ${type === "none" ? "all" : type} of the following:`;
    return p;
  }

  /**
   * Create one to three lists of fixes
   * @param {object} violation - a violation object
   * @return {DocumentFragment} A document frament
   */
  function createFixesList(violation) {
    const fragment = document.createDocumentFragment();

    ["any", "all", "none"].forEach(type => {
      if (violation[type].length !== 0) {
        let list = createList();
        violation[type].forEach(fix => {
          let li = createListItem(fix.message);
          list.appendChild(li);
        });
        fragment.append(fixHint(type), list);
      }
    });

    return fragment;
  }

  /**
   * Initialize the validator, creating and alert over every violation
   */
  async function init() {
    Object.keys(_violations).forEach(el => {
      drawAlert(el, handleAlertClick);
    });
  }

  init();

  /**
   * Handle escape keyup event
   */
  window.addEventListener("keyup", function handleKeyUp(e) {
    if (e.key === "Escape") {
      removeTooltipIfExists();
    }
  });
})();
