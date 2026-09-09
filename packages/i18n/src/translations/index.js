/**
 * translations/index.js — per-domain translation modules.
 *
 * Each module default-exports a plain object whose keys are merged into the
 * root translations object (see ../translations.js). Split per UI domain so
 * the namespaces stay navigable as the copy grows.
 */
import ocean from './ocean.js';
import assessmentCard from './assessmentCard.js';
import assessmentIntroExtra from './assessmentIntroExtra.js';
import profile from './profile.js';
import directory from './directory.js';
import clientOrb from './clientOrb.js';
import reportLegal from './reportLegal.js';
import eyedentityReport from './eyedentityReport.js';
import auth from './auth.js';
import misc from './misc.js';
import filosofie from './filosofie.js';
import shell from './shell.js';
import charts from './charts.js';
import resultsModal from './resultsModal.js';
import admin from './admin.js';

export default {
  ...ocean,
  ...assessmentCard,
  ...assessmentIntroExtra,
  ...profile,
  ...directory,
  ...clientOrb,
  ...reportLegal,
  ...eyedentityReport,
  ...auth,
  ...misc,
  ...filosofie,
  ...shell,
  ...charts,
  ...resultsModal,
  ...admin,
};
