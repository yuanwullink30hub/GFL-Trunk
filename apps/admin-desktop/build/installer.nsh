; Custom NSIS pieces for the Windows installer. electron-builder includes build/installer.nsh automatically.

; Finish page, "Start Garden For Life".
; electron-builder's default starts the app through Explorer (StdUtils ExecShellAsUser), which exists to
; shed administrator rights from an elevated installer. This installer is per-user and never elevated, so
; there is nothing to shed. That Explorer round-trip blocks the installer window while it runs (1.2 s
; measured for a trivial program), and users saw the installer freeze on the Finish button. Hide the
; installer window first, then start the app directly: Exec does not wait for it.
!macro customFinishPage
  Function StartApp
    HideWindow
    ${if} ${isUpdated}
      Exec '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --updated'
    ${else}
      Exec '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
    ${endif}
  FunctionEnd

  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !insertmacro MUI_PAGE_FINISH
!macroend
