export const HOME = {
  emergentLink: "home-emergent-link",
};

export const ATLAS = {
  loadingScreen: "atlas-loading-screen",
  loadingProgress: "atlas-loading-progress",

  navbar: "atlas-navbar",
  navAtlas: "nav-link-atlas",
  navEcosystem: "nav-link-ecosystem",
  navCommittees: "nav-link-committees",
  navSignature: "nav-link-signature",
  navOperationRed: "nav-link-operation-red",
  navPassport: "nav-link-passport",
  navFaq: "nav-link-faq",
  navRequestAccess: "nav-request-access",

  hero: "atlas-hero",
  heroCta: "hero-cta-request-access",
  heroSecondary: "hero-cta-secondary",

  committee: (key) => `committee-card-${key}`,

  signature: (key) => `signature-card-${key}`,
  signatureEnter: (key) => `signature-enter-${key}`,

  operationRed: "operation-red-section",
  operationRedCta: "operation-red-cta",

  lockedCard: (key) => `locked-card-${key}`,
  unlockInput: "unlock-cipher-input",
  unlockSubmit: "unlock-cipher-submit",
  unlockedReveal: "unlocked-reveal",

  passport: "passport-card",
  passportNameInput: "passport-name-input",
  passportCommittee: "passport-committee-select",
  passportGenerate: "passport-generate-btn",
  passportDelegateId: "passport-delegate-id",

  accessDialog: "access-dialog",
  accessName: "access-name",
  accessEmail: "access-email",
  accessInstitution: "access-institution",
  accessInterest: "access-interest",
  accessMessage: "access-message",
  accessSubmit: "access-submit",

  faqItem: (i) => `faq-item-${i}`,
};
