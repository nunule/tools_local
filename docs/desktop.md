# Desktop builds

tools local uses Tauri 2 to bundle the existing React application for macOS and Windows. The web build remains available with `npm run dev` and `npm run build`.

## Development

Install Node.js 22, a current stable Rust toolchain, and the platform prerequisites:

- macOS: Xcode Command Line Tools (`xcode-select --install`). The application targets macOS 13.3 or later.
- Windows: Visual Studio C++ Build Tools with the **Desktop development with C++** workload, and WebView2.

Run these commands in the project directory:

```sh
npm ci
npm run desktop:dev
```

Tauri starts a separate Vite server at `http://localhost:1420` and opens the application window. The regular web development server continues to use port 3000. Rust build output is excluded from Vite's file watcher.

## Build an installer

On a Mac:

```sh
npm run desktop:build:mac -- --ci
```

Outputs:

- `src-tauri/target/release/bundle/macos/tools local.app`
- `src-tauri/target/release/bundle/dmg/*.dmg`

On Windows:

```sh
npm run desktop:build:win -- --ci
```

The NSIS installer is generated in `src-tauri/target/release/bundle/nsis/` as a `*-setup.exe` file. The installer offers English and Simplified Chinese. It can install WebView2 if required; that first-time runtime installation may need an internet connection.

Build each platform on its own OS, or use the workflow below. Output architecture follows the build machine. No automatic updater or publishing service is configured.

## Native file handling

Image selection uses the system file picker through the existing file inputs. Native drag-and-drop interception is disabled so the application's existing HTML image drop targets continue to work.

All image, ZIP and JSON exports use the system **Save As** dialog on desktop. Cancelling a dialog does not write a file or show a success effect. Saving errors are shown in the selected interface language. Browser exports continue to use regular downloads.

The filesystem capability allows the write operation but grants no global path access: the dialog plugin adds only the file explicitly selected by the user to the runtime scope. The application does not enable filesystem read, directory listing, shell execution, or arbitrary external network access.

The desktop application uses the OS window frame and application menu. The decorative web window frame is hidden inside Tauri.

## Offline resources and icons

Fonts are bundled locally using Fontsource; font licences are included under `public/licenses/`. The production content security policy permits local assets and native IPC, with no external font or script hosts.

The application identifier is `com.toolslocal.desktop`. Settings belong to this application's WebView storage and are separate from a browser's website storage.

To regenerate native icons from the shared SVG:

```sh
npm run desktop:icons
```

macOS uses `src-tauri/icons/icon.icns`; Windows uses `src-tauri/icons/icon.ico`.

## GitHub Actions

The **Desktop installers** workflow builds macOS and Windows packages separately. Run it from GitHub's **Actions → Desktop installers → Run workflow**. It also runs when pushing a tag matching `desktop-v*`.

The resulting installers are attached to the workflow run as downloadable artifacts for 14 days. The workflow does not create a release or publish the application. No signing secrets are required for test builds.

## Signing for public distribution

Local and CI macOS test builds use an ad-hoc signature (`signingIdentity: "-"`), with no trusted developer certificate or Apple notarization. For a public macOS release, replace that identity and configure Apple signing and notarization credentials. Windows signing is also recommended for public distribution. These credentials are not included in the repository.

## Verification

```sh
npm test
npm run build
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

The export tests cover browser downloads, native binary writes, cancellation, filename suggestions, JSON/ZIP filters and write failures. In the built application, also check image selection/drop, a processed image export, JSON export, a cancelled Save As dialog, and application relaunch without the development server.
