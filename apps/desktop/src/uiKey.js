/**
 * The public half of the key that signs the app's UI builds (scripts/ui-keygen.js). A downloaded UI build
 * runs only when its manifest verifies against this key (uiBundle.js). The private half stays with the
 * publisher — never in this repository.
 */
module.exports = {
  UI_PUBLIC_KEY_PEM: `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAk/ehQA3BlXk5WbxsIBuI8ns81X46NGvRnbWc8sSdy/M=
-----END PUBLIC KEY-----
`,
};
