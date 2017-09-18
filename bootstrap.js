/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "OnboardingTourType",
  "resource://onboarding/modules/OnboardingTourType.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Preferences",
  "resource://gre/modules/Preferences.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");

const PREF_WHITELIST = [
  "browser.onboarding.enabled",
  "browser.onboarding.hidden",
  "browser.onboarding.notification.finished",
  "browser.onboarding.notification.lastPrompted",
  "browser.onboarding.tourset-version",
  "browser.onboarding.tour-type",
  "browser.onboarding.seen-tourset-version",
  "browser.onboarding.firstLaunch"
];

[
  "onboarding-tour-private-browsing",
  "onboarding-tour-addons",
  "onboarding-tour-customize",
  "onboarding-tour-search",
  "onboarding-tour-default-browser",
  "onboarding-tour-sync",
].forEach(tourId => PREF_WHITELIST.push(`browser.onboarding.tour.${tourId}.completed`));


const PREF_BRANCH = "browser.onboarding.";
const PREFS = {
  "enabled": true,
  "tourset-version": 1,
  "firstLaunch": true
};

function setDefaultPrefs() {
  let branch = Services.prefs.getDefaultBranch(PREF_BRANCH);
  for (let [key, val] in Iterator(PREFS)) {
    switch (typeof val) {
      case "boolean":
        branch.setBoolPref(key, val);
        break;
      case "number":
        branch.setIntPref(key, val);
        break;
      case "string":
        branch.setCharPref(key, val);
        break;
    }
  }
}

/**
 * Set pref. Why no `getPrefs` function is due to the priviledge level.
 * We cannot set prefs inside a framescript but can read.
 * For simplicity and effeciency, we still read prefs inside the framescript.
 *
 * @param {Array} prefs the array of prefs to set.
 *   The array element carrys info to set pref, should contain
 *   - {String} name the pref name, such as `browser.onboarding.hidden`
 *   - {*} value the value to set
 **/
function setPrefs(prefs) {
  prefs.forEach(pref => {
    if (PREF_WHITELIST.includes(pref.name)) {
      Preferences.set(pref.name, pref.value);
    }
  });
}

function initContentMessageListener() {
  Services.mm.addMessageListener("Onboarding:OnContentMessage", msg => {
    switch (msg.data.action) {
      case "set-prefs":
        setPrefs(msg.data.params);
        break;
    }
  });
}

function install(aData, aReason) {
  setDefaultPrefs();
}

function uninstall(aData, aReason) {}

function startup(aData, reason) {
  OnboardingTourType.check();
  Services.mm.loadFrameScript("resource://onboarding/onboarding.js", true);
  initContentMessageListener();
}

function shutdown(aData, reason) {}
