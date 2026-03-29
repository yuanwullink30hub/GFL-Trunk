// ═══════════════════════════════════════════════════════════════════════
//  ASSESSMENT SIZING — Separate breakpoint configs per component
//  Desktop(≥1441) / Laptop(≥1024) / Tablet(≥768) / Mobile(<768)
//
//  Each breakpoint is a standalone object. Editing one never touches another.
// ═══════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────
//  ASSESSMENT INTRO
// ─────────────────────────────────────────────────────────────────────

const introDesktop = {
  modalMaxWidth: '64.4vw',
  modalMinHeight: '82vh',
  modalMaxHeight: '99vh',
  padding: '1.8vh 2rem',
  headerMaxWidth: '22rem',
  headerMb: '2vh',
  descFontSize: '0.875rem',
  descMt: '0.5vh',
  featureGap: '0.5vh',
  featureMb: '1.1vh',
  contentShiftUp: '-1.5vh',
  referentiesMt: '-1vh',
  featurePadding: '0.875vh 0.75rem',
  featureIconSize: '5.85vh',
  featureIconFont: '1.14rem',
  featureTitleFont: '0.875rem',
  featureDescFont: '0.75rem',
  featureItemGap: '0.6rem',
  pyramidMb: '1.8vh',
  pyramidGap: '0.56vh',
  pyramidBaseWidth: 336, pyramidStepWidth: 67,
  pyramidPadY: '0.7vh', pyramidPadX: '1.25rem',
  pyramidDotSize: '0.56rem',
  pyramidLabelFont: '1.05rem',
  pyramidDescFont: '0.84rem',
  pyramidLabelGap: '0.5rem',
  pyramidItemGap: '0.75rem',
  levelsMb: '1.2vh',
  levelsTitleFont: '0.875rem',
  levelsTitleMb: '1vh',
  levelsGap: '1rem',
  levelPadding: '0.8vh 1rem',
  levelTitleFont: '0.875rem',
  levelDescFont: '0.7rem',
  footerPt: '0.8vh',
  footerFont: '0.625rem',
  footerBtnPad: '0.5vh 1.25rem',
  footerBtnFont: '0.75rem',
};

const introLaptop = (windowWidth) => ({
  modalMaxWidth: '75vw',
  modalMinHeight: '82vh',
  modalMaxHeight: '99vh',
  padding: '1.4vh 1.05vw',
  headerMaxWidth: '17.0vw',
  headerMb: '1.6vh',
  descFontSize: '1.0vw',
  descMt: '0.3vh',
  featureGap: '0.4vh',
  featureMb: '0.8vh',
  contentShiftUp: '-1.2vh',
  referentiesMt: '-0.8vh',
  featurePadding: '0.75vh 0.52vw',
  featureIconSize: '4.94vh',
  featureIconFont: '0.92vw',
  featureTitleFont: '0.93vw',
  featureDescFont: '0.86vw',
  featureItemGap: '0.4vw',
  pyramidMb: '1.4vh',
  pyramidGap: '0.49vh',
  pyramidBaseWidth: Math.round(windowWidth * 0.1874), pyramidStepWidth: Math.round(windowWidth * 0.0374),
  pyramidPadY: '0.56vh', pyramidPadX: '0.84vw',
  pyramidDotSize: '0.41vw',
  pyramidLabelFont: '0.8vw',
  pyramidDescFont: '0.8vw',
  pyramidLabelGap: '0.42vw',
  pyramidItemGap: '0.65vw',
  levelsMb: '1.0vh',
  levelsTitleFont: '0.78vw',
  levelsTitleMb: '0.8vh',
  levelsGap: '0.65vw',
  levelPadding: '0.7vh 0.84vw',
  levelTitleFont: '0.99vw',
  levelDescFont: '0.78vw',
  footerPt: '0.6vh',
  footerFont: '0.57vw',
  footerBtnPad: '0.4vh 0.84vw',
  footerBtnFont: '0.71vw',
});

const introTablet = {
  modalMaxWidth: '39.6rem',
  modalMinHeight: '82vh',
  modalMaxHeight: '99vh',
  padding: '1.4vh 1.2rem',
  headerMaxWidth: '17rem',
  headerMb: '1.6vh',
  descFontSize: '0.75rem',
  descMt: '0.3vh',
  featureGap: '0.4vh',
  featureMb: '0.8vh',
  contentShiftUp: '-1vh',
  referentiesMt: '-0.8vh',
  featurePadding: '0.75vh 0.49rem',
  featureIconSize: '4.55vh',
  featureIconFont: '0.85rem',
  featureTitleFont: '0.65rem',
  featureDescFont: '0.55rem',
  featureItemGap: '0.36rem',
  pyramidMb: '1.4vh',
  pyramidGap: '0.49vh',
  pyramidBaseWidth: 136.5, pyramidStepWidth: 27.3,
  pyramidPadY: '0.56vh', pyramidPadX: '0.975rem',
  pyramidDotSize: '0.46rem',
  pyramidLabelFont: '0.91rem',
  pyramidDescFont: '0.77rem',
  pyramidLabelGap: '0.5rem',
  pyramidItemGap: '0.6rem',
  levelsMb: '1.0vh',
  levelsTitleFont: '0.65rem',
  levelsTitleMb: '0.8vh',
  levelsGap: '0.6rem',
  levelPadding: '0.7vh 0.975rem',
  levelTitleFont: '0.75rem',
  levelDescFont: '0.6rem',
  footerPt: '0.6vh',
  footerFont: '0.5rem',
  footerBtnPad: '0.4vh 0.975rem',
  footerBtnFont: '0.6rem',
};

const introMobile = {
  modalMaxWidth: '97vw',
  modalMinHeight: '80vh',
  modalMaxHeight: '99vh',
  padding: '1.2vh 0.85rem',
  headerMaxWidth: '11rem',
  headerMb: '1.2vh',
  descFontSize: '0.72rem',
  descMt: '0.2vh',
  featureGap: '0.35vh',
  featureMb: '0.2vh',
  contentShiftUp: '-0.5vh',
  referentiesMt: '-0.5rem',
  featurePadding: '0.625vh 0.5rem',
  featureIconSize: '4.16vh',
  featureIconFont: '0.85rem',
  featureTitleFont: '0.65rem',
  featureDescFont: '0.55rem',
  featureItemGap: '0.35rem',
  pyramidMb: '0.9vh',
  pyramidGap: '0.35vh',
  pyramidBaseWidth: 140, pyramidStepWidth: 28,
  pyramidPadY: '0.49vh', pyramidPadX: '0.75rem',
  pyramidDotSize: '0.42rem',
  pyramidLabelFont: '0.84rem',
  pyramidDescFont: '0.7rem',
  pyramidLabelGap: '0.4rem',
  pyramidItemGap: '0.5rem',
  levelsMb: '0.8vh',
  levelsTitleFont: '0.7rem',
  levelsTitleMb: '0.5vh',
  levelsGap: '0.5rem',
  levelPadding: '0.5vh 0.75rem',
  levelTitleFont: '0.8rem',
  levelDescFont: '0.65rem',
  footerPt: '0.4vh',
  footerFont: '0.5rem',
  footerBtnPad: '0.35vh 0.85rem',
  footerBtnFont: '0.6rem',
};

export function getIntroSizes(windowWidth) {
  if (windowWidth >= 1441) return introDesktop;
  if (windowWidth >= 1024) return introLaptop(windowWidth);
  if (windowWidth >= 768)  return introTablet;
  return introMobile;
}


// ─────────────────────────────────────────────────────────────────────
//  ASSESSMENT CARD
// ─────────────────────────────────────────────────────────────────────

const cardDesktop = {
  cardMaxWidth: '46.2rem',
  cardBaseWidth: '42rem',
  maxH: '82vh',
  headerPad: '0.75rem 1.25rem',
  badgeSize: '2.25rem',
  badgeFont: '0.875rem',
  contentMinH: '32rem',
  contentPad: '1rem 1.25rem',
  questionFont: '1rem',
  questionMinH: '4.5rem',
  answerMinH: '3.5rem',
  answerFont: '0.875rem',
  letterBadgeW: '2.5rem',
  footerPad: '0.75rem 1.25rem',
  indicatorSize: '1.75rem',
  // Intro overlay sizes (Subject 0 / Layer intros)
  introPad: '2rem 2rem 1.5rem',
  introGap: '1rem',
  introTitleFont: '1rem',
  introDescFont: '0.875rem',
  introItalicFont: '0.875rem',
  introBtnFont: '1rem',
  layerIntroPad: '2rem 2rem 1.5rem',
  layerIntroGap: '0.75rem',
  layerTitleFont: '1rem',
  layerTimerFont: '0.875rem',
  layerDescFont: '0.875rem',
  layerBtnFont: '1rem',
  layerStartBtnFont: '1rem',
};

const cardLaptop = {
  cardMaxWidth: '44.28vw',
  cardBaseWidth: '40.25vw',
  maxH: '90vh',
  headerPad: '0.63vw 1.04vw',
  badgeSize: '1.88vw',
  badgeFont: '0.73vw',
  contentMinH: '29.34vw',
  contentPad: '0.83vw 1.04vw',
  questionFont: '1.04vw',
  questionMinH: '4.13vw',
  answerMinH: '3.21vw',
  answerFont: '0.94vw',
  letterBadgeW: '2.08vw',
  footerPad: '0.63vw 1.04vw',
  indicatorSize: '1.46vw',
  // Intro overlay sizes (Subject 0 / Layer intros)
  introPad: '1.67vw 1.67vw 1.25vw',
  introGap: '0.83vw',
  introTitleFont: '1.04vw',
  introDescFont: '0.94vw',
  introItalicFont: '0.94vw',
  introBtnFont: '1.04vw',
  layerIntroPad: '1.67vw 1.67vw 1.25vw',
  layerIntroGap: '0.63vw',
  layerTitleFont: '1.04vw',
  layerTimerFont: '0.94vw',
  layerDescFont: '0.94vw',
  layerBtnFont: '1.04vw',
  layerStartBtnFont: '1.04vw',
};

const cardTablet = {
  cardMaxWidth: '29.7rem',
  cardBaseWidth: '27rem',
  maxH: '80vh',
  headerPad: '0.5rem 0.8rem',
  badgeSize: '1.5rem',
  badgeFont: '0.65rem',
  contentMinH: '21rem',
  contentPad: '0.65rem 0.8rem',
  questionFont: '0.8rem',
  questionMinH: '3rem',
  answerMinH: '2.3rem',
  answerFont: '0.7rem',
  letterBadgeW: '1.6rem',
  footerPad: '0.5rem 0.8rem',
  indicatorSize: '1.15rem',
  // Intro overlay sizes
  introPad: '1.5rem 1.25rem 1rem',
  introGap: '0.75rem',
  introTitleFont: '0.8rem',
  introDescFont: '0.7rem',
  introItalicFont: '0.7rem',
  introBtnFont: '0.8rem',
  layerIntroPad: '1.5rem 1.25rem 1rem',
  layerIntroGap: '0.5rem',
  layerTitleFont: '0.8rem',
  layerTimerFont: '0.7rem',
  layerDescFont: '0.7rem',
  layerBtnFont: '0.8rem',
  layerStartBtnFont: '0.8rem',
};

const cardMobile = {
  cardMaxWidth: '94vw',
  cardBaseWidth: '94vw',
  maxH: '82vh',
  headerPad: '0.5rem 0.65rem',
  badgeSize: '1.6rem',
  badgeFont: '0.7rem',
  contentMinH: '0',
  contentPad: '0.5rem 0.65rem',
  questionFont: '0.82rem',
  questionMinH: '2.5rem',
  answerMinH: '2.6rem',
  answerFont: '0.75rem',
  letterBadgeW: '1.75rem',
  footerPad: '0.45rem 0.65rem',
  indicatorSize: '1.25rem',
  // Intro overlay sizes
  introPad: '1.5rem 1.25rem 1rem',
  introGap: '0.75rem',
  introTitleFont: '0.82rem',
  introDescFont: '0.75rem',
  introItalicFont: '0.75rem',
  introBtnFont: '0.82rem',
  layerIntroPad: '1.5rem 1.25rem 1rem',
  layerIntroGap: '0.5rem',
  layerTitleFont: '0.82rem',
  layerTimerFont: '0.75rem',
  layerDescFont: '0.75rem',
  layerBtnFont: '0.82rem',
  layerStartBtnFont: '0.82rem',
};

export function getCardSizes(windowWidth) {
  if (windowWidth >= 1441) return cardDesktop;
  if (windowWidth >= 1024) return cardLaptop;
  if (windowWidth >= 768)  return cardTablet;
  return cardMobile;
}


// ─────────────────────────────────────────────────────────────────────
//  ASSESSMENT RESULTS MODAL
// ─────────────────────────────────────────────────────────────────────

const resultsDesktop = {
  poetryWidth: '24rem',
  poetryPad: '1.5rem',
  modalMaxWidth: '56rem',
  modalMaxHeight: '85vh',
  scrollPad: '1.5rem 2rem',
  profileImgSize: '25rem',
  profileTextMaxW: '40rem',
  titleFont: 'clamp(1.8rem, 4vw, 3rem)',
  radarHeight: '380px',
  sectionPad: '1.5rem',
  cardPad: '1.25rem',
  btnMinWidth: '200px',
  btnPad: '1rem 1.5rem',
  btnFont: '0.85rem',
};

const resultsLaptop = {
  // 0.56x of desktop rem, then modalMaxWidth +15%, then +25%
  poetryWidth: '13.4rem',
  poetryPad: '0.84rem',
  modalMaxWidth: '45.14rem',   // 36.11rem × 1.25
  modalMaxHeight: '86.9vh',    // 79vh × 1.10
  modalMarginTop: '3rem',
  scrollPad: '0.84rem 1.12rem',
  profileImgSize: '14rem',
  profileTextMaxW: '22.4rem',
  titleFont: '1.4rem',
  radarHeight: '213px',
  sectionPad: '0.84rem',
  cardPad: '0.7rem',
  btnMinWidth: '112px',
  btnPad: '0.56rem 0.84rem',
  btnFont: '0.6rem',
};

const resultsTablet = {
  poetryWidth: '15.6rem',
  poetryPad: '0.975rem',
  modalMaxWidth: '36.4rem',
  modalMaxHeight: '85vh',
  scrollPad: '0.975rem 1.3rem',
  profileImgSize: '16.25rem',
  profileTextMaxW: '26rem',
  titleFont: '1.6rem',
  radarHeight: '247px',
  sectionPad: '0.975rem',
  cardPad: '0.8rem',
  btnMinWidth: '130px',
  btnPad: '0.65rem 0.975rem',
  btnFont: '0.7rem',
};

const resultsMobile = {
  poetryWidth: '90vw',
  poetryPad: '1rem',
  modalMaxWidth: '95vw',
  modalMaxHeight: '85vh',
  scrollPad: '0.75rem 1rem',
  profileImgSize: '80vw',
  profileTextMaxW: '90vw',
  titleFont: '1.5rem',
  radarHeight: '260px',
  sectionPad: '0.75rem',
  cardPad: '0.65rem',
  btnMinWidth: '100%',
  btnPad: '0.75rem 1rem',
  btnFont: '0.8rem',
};

export function getResultsSizes(windowWidth) {
  if (windowWidth >= 1441) return resultsDesktop;
  if (windowWidth >= 1024) return resultsLaptop;
  if (windowWidth >= 768)  return resultsTablet;
  return resultsMobile;
}


// ─────────────────────────────────────────────────────────────────────
//  ADMIN DASHBOARD MODAL
// ─────────────────────────────────────────────────────────────────────

const adminDesktop = {
  shellWidth: '90vw',
  shellMaxWidth: '88.89vw',
  shellHeight: '85vh',
  shellPad: '0',
  titleBarPad: '0.21vw 0.49vw',
  contentPad: '1.04vw',
  contentGap: '1.04vw',
  headerPb: '0.56vw',
  headerFont: 'max(22px, 1.53vw)',
  tabGap: '0.28vw',
  avatarSize: '2.43vw',
  avatarFont: '1.04vw',
  infoGap: '0.28vw',
  infoMt: '0.35vw',
  rowPb: '0.24vw',
  noteListMaxH: '15.28vw',
  noteGap: '0.24vw',
  notePad: '0.28vw 0.42vw',
  noteInputPad: '0.28vw 0.42vw',
  borderRadius: 'max(4px, 0.5vw)',
};

const adminLaptop = {
  shellWidth: '90vw',
  shellMaxWidth: '88.89vw',
  shellHeight: '85vh',
  shellPad: '0',
  titleBarPad: '0.21vw 0.49vw',
  contentPad: '1.04vw',
  contentGap: '1.04vw',
  headerPb: '0.56vw',
  headerFont: 'max(18px, 1.53vw)',
  tabGap: '0.28vw',
  avatarSize: '2.43vw',
  avatarFont: '1.04vw',
  infoGap: '0.28vw',
  infoMt: '0.35vw',
  rowPb: '0.24vw',
  noteListMaxH: '15.28vw',
  noteGap: '0.24vw',
  notePad: '0.28vw 0.42vw',
  noteInputPad: '0.28vw 0.42vw',
  borderRadius: 'max(4px, 0.5vw)',
};

const adminTablet = {
  shellWidth: '94vw',
  shellMaxWidth: '94vw',
  shellHeight: '84vh',
  shellPad: '0',
  titleBarPad: '0.39vw 0.78vw',
  contentPad: '1.56vw',
  contentGap: '1.3vw',
  headerPb: '0.78vw',
  headerFont: 'max(16px, 1.76vw)',
  tabGap: '0.39vw',
  avatarSize: '3.52vw',
  avatarFont: '1.37vw',
  infoGap: '0.39vw',
  infoMt: '0.49vw',
  rowPb: '0.34vw',
  noteListMaxH: '19.53vw',
  noteGap: '0.34vw',
  notePad: '0.39vw 0.59vw',
  noteInputPad: '0.39vw 0.59vw',
  borderRadius: 'max(4px, 0.5vw)',
};

const adminMobile = {
  shellWidth: '96vw',
  shellMaxWidth: '96vw',
  shellHeight: '82vh',
  shellPad: '0.6rem',
  titleBarPad: 'max(0.4rem, 0.55vw) max(0.7rem, 1vw)',
  contentPad: 'max(1rem, 1.5vw) max(1.4rem, 2.5vw)',
  contentGap: 'max(1rem, 1.5vw)',
  headerPb: 'max(0.8rem, 1.2vw)',
  headerFont: 'max(18px, 1.4vw)',
  tabGap: '0.9rem',
  avatarSize: 'max(2.5rem, 3.5vw)',
  avatarFont: 'max(1rem, 1.5vw)',
  infoGap: 'max(0.25rem, 0.4vw)',
  infoMt: 'max(0.3rem, 0.5vw)',
  rowPb: 'max(0.25rem, 0.35vw)',
  noteListMaxH: '30vh',
  noteGap: 'max(0.25rem, 0.35vw)',
  notePad: 'max(0.3rem, 0.4vw) max(0.4rem, 0.6vw)',
  noteInputPad: 'max(0.6rem, 0.8vw) max(0.6rem, 0.9vw)',
  borderRadius: 'max(4px, 0.5vw)',
};

export function getAdminSizes(windowWidth) {
  if (windowWidth >= 1441) return adminDesktop;
  if (windowWidth >= 1024) return adminLaptop;
  if (windowWidth >= 768)  return adminTablet;
  return adminMobile;
}


// ─────────────────────────────────────────────────────────────────────
//  ASSESSMENT LAYER PANEL
// ─────────────────────────────────────────────────────────────────────

const layerPanelDesktop = {
  cardWrapperWidth: '46.2rem',
  cardMaxWidth: '46.2rem',
};

const layerPanelLaptop = {
  cardWrapperWidth: '44.28vw',
  cardMaxWidth: '44.28vw',
};

const layerPanelTablet = {
  cardWrapperWidth: '29.7rem',
  cardMaxWidth: '29.7rem',
};

const layerPanelMobile = {
  cardWrapperWidth: '94vw',
  cardMaxWidth: '95vw',
};

export function getLayerPanelSizes(windowWidth) {
  if (windowWidth >= 1441) return layerPanelDesktop;
  if (windowWidth >= 1024) return layerPanelLaptop;
  if (windowWidth >= 768)  return layerPanelTablet;
  return layerPanelMobile;
}
