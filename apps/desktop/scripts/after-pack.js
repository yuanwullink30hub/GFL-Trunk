/**
 * electron-builder afterPack: lock the packaged app with Electron fuses (switches compiled into the
 * executable, flipped before signing and before the installer is built).
 *
 * The app's code can be read — anything shipped can — but it must not be USABLE as anything other than
 * itself, and it must not run once modified:
 *   RunAsNode off                    — the executable cannot be used as a plain Node.js runtime
 *                                      (ELECTRON_RUN_AS_NODE=1 ran arbitrary scripts inside it)
 *   NodeOptions / inspect off        — no NODE_OPTIONS injection, no --inspect debugger attach
 *   Embedded asar integrity on       — the app refuses to start if app.asar was altered
 *   Only load app from asar          — no loose resources/app folder can replace the packaged code
 *   file:// extra privileges off     — the UI is served from app://gardenforlife, never file://
 *   Cookie encryption on             — cookies encrypted with the OS key store
 */
const path = require('path');
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');

exports.default = async function afterPack(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  const name = packager.appInfo.productFilename;
  const target = electronPlatformName === 'darwin'
    ? path.join(appOutDir, `${name}.app`)
    : electronPlatformName === 'win32'
      ? path.join(appOutDir, `${name}.exe`)
      : path.join(appOutDir, packager.executableName);

  await flipFuses(target, {
    version: FuseVersion.V1,
    resetAdHocDarwinSignature: electronPlatformName === 'darwin',
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
  });
  console.log(`  • fuses flipped  ${path.basename(target)}`);
};
