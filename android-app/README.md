# GovJob India Android

Native Kotlin/Jetpack Compose client for the public GovJob India Cloudflare API.

## Architecture

The app uses Compose/Material 3, Navigation Compose, Hilt, Retrofit with Kotlin serialization, and Room. Room is the UI source of truth: cached jobs render immediately, refresh reconciles a complete snapshot transactionally, and Saved jobs remain locally available when removed from the latest snapshot. Details are cached independently. Search and filters run locally.

Only these public endpoints are used:

- `https://govjob-india.pages.dev/api/snapshot`
- `https://govjob-india.pages.dev/api/job_details?id=...`
- `https://govjob-india.pages.dev/api/meta`

No account, analytics, notification, location, storage, or private backend access exists.

## Build and test

Requirements: JDK 17 and Android SDK 35.

```text
gradlew.bat testDebugUnitTest lintDebug assembleDebug
```

For a signed release, create an ignored `signing.properties` beside this file:

```properties
storeFile=.signing/release.jks
storePassword=<local-secret>
keyAlias=govjob-india
keyPassword=<local-secret>
```

Then run `gradlew.bat assembleRelease`. Never commit this file or the keystore. R8 minification and resource shrinking are enabled for release.

## Behavior and limitations

- Min SDK 26; target/compile SDK 35.
- Swipe down on Home to refresh. Cached content remains visible if refresh fails.
- Saved state and cached data work offline. External official/source links require a browser and connectivity.
- The app displays only fields supplied by the API. Missing detail sections are omitted.
- Unsafe non-HTTP(S) links and unsupported important-link types are not shown.
- API-provided content is untrusted text; arbitrary HTML is not rendered.

## Release process

Run all quality gates, build with the ignored local keystore, verify using `apksigner verify --verbose --print-certs`, confirm package ID with `apkanalyzer manifest application-id`, copy the APK to root `build/govjob-india-v1.0.0.apk`, regenerate SHA-256 documentation, inspect tracked files for secrets, then tag and publish `v1.0.0`.
