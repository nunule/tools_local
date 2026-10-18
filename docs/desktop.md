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

On a Mac (this script skips Finder-only DMG decoration, so no Automation permission is required):

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

## GitHub Releases

The repository is [nunule/tools_local](https://github.com/nunule/tools_local). Public installers are distributed through its [Releases page](https://github.com/nunule/tools_local/releases).

The **Desktop installers** workflow runs manually or on a tag matching `desktop-v*`. It builds macOS Apple Silicon and Windows x64 installers, runs the frontend tests, stages the files and creates a **draft** release. The tag must match `src-tauri/tauri.conf.json`, for example `desktop-v1.0.0` for version `1.0.0`.

To publish the first release:

1. Commit and push the workflow and download changes to the repository's default branch (`master`).
2. Open **Actions → Desktop installers → Run workflow**, selecting `master`. Alternatively, push the version tag.
3. Wait for **build** and **draft-release** to succeed. Open **Releases**, review the draft and its installers, then click **Publish release** as a normal release, not a prerelease. Mark it as the latest release.

The draft includes the installers and `manifest.json`, with version, byte size and SHA-256. Draft assets use stable names such as `tools-local-1.0.0-macos-arm64.dmg` and `tools-local-1.0.0-windows-x64.exe`. Rerunning the workflow updates the draft. An already published release is never overwritten: bump the application version for a new release.

The workflow also retains the native installers and **tools-local-web-with-downloads** as Actions artifacts for 14 days. Those temporary artifacts are separate from the public Release downloads. Creating a draft does not publish it; the frontend intentionally does not offer drafts or prereleases.

## Signing for public distribution

Local and CI macOS test builds use an ad-hoc signature (`signingIdentity: "-"`), with no trusted developer certificate or Apple notarization. For a public macOS release, replace that identity and configure Apple signing and notarization credentials. Windows signing is also recommended for public distribution. These credentials are not included in the repository.

## Verification

```sh
npm test
npm run build
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

The export tests cover browser downloads, native binary writes, cancellation, filename suggestions, JSON/ZIP filters and write failures. In the built application, also check image selection/drop, a processed image export, JSON export, a cancelled Save As dialog, and application relaunch without the development server.

## Website download button

The sidebar opens an installer picker with a permanent **Download on GitHub** link. The web app reads the public GitHub latest-release API when this picker opens. It uses only uploaded installers with recognized platform names for that release version. The website does not need to host the binaries, and publishing a new GitHub release updates the available downloads without rebuilding the site. No API token is included in the frontend.

If GitHub has no public release yet, the picker explains that the first installers have not been published. If the API is unavailable or rate limited, the Releases link remains available. Each lookup has a timeout; closing the picker cancels both requests. Image files are never sent in these requests.

Local downloads remain a fallback for development or a self-contained static deployment. `npm run dev` and `npm run build` run `npm run downloads:prepare`, collecting current-version installers from `src-tauri/target/release/bundle/` and `desktop-releases/` into the ignored `public/downloads/` folder. Default filenames include a content hash. A normal CI web build without local installers can still download the published GitHub assets.

For a local macOS build with an installer included in the website:

```sh
npm run desktop:build:mac -- --ci
npm run build
npm run preview
```

Deploy the entire `dist/` directory to the static host. Native builds use `dist-desktop/`, which excludes the website's downloadable binaries. The native window hides download entries. The current CI matrix builds Apple Silicon Mac and Windows x64; Intel Mac and Linux only appear as available if matching installers are uploaded to the release.

## GitHub link on the About page

The About link and desktop download source default to `https://github.com/nunule/tools_local`. Set `VITE_GITHUB_URL` to another public GitHub repository URL before building if needed (see `.env.example`). The desktop app uses the opener plugin to open this link in the default browser; its URL permission is limited to `https://github.com/` and its paths.
