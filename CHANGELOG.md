# Change Log

## 1.21.0 - December 6, 2023
- Pick up Mermaid 10.6.1. Thanks @jalmeter and @ebjornset!

## 1.20.0 - September 25, 2023
- Pick up Mermaid 10.4.0.

## 1.19.0 - June 21, 2023
- Pick up Mermaid 10.2.3.

## 1.18.1 - April 10, 2023
- Pick up Mermaid 10.1.0.
- Clear errors on re-render.

## 1.18.0 - March 29, 2023
- Pick up Mermaid 10.0.2.

## 1.17.7 - March 7, 2023
- Fix loading mindmap support.
- Fix rendering in notebooks after switch to `renderAsync`.

## 1.17.6 - March 7, 2023
- Fix rendering and removal of errors appended to body. Thanks @JoshStern!

## 1.17.5 - March 6, 2023
- Bump mermaid version to `9.4.0`.

## 1.17.4 - January 23, 2023
- Fix parse failures caused by trimming. Thanks @swalterd!

## 1.17.1-1.17.3 - December 19, 2022
- Version bump for failed marketplace publish due to badge in readme.

## 1.17.0 - December 19, 2022
- Pick up Mermaid 9.3.0. Thanks @apeacock1991!

## 1.16.0 - December 6, 2022
- Add support for markdown cells inside of notebooks.

## 1.15.3 - December 5, 2022
- Pick up Mermaid 9.2.2.

## 1.15.2 - August 24, 2022
- Re-render diagrams when the color theme changes. This fixes colors not updating when between light and dark color themes.

## 1.15.1 - August 23, 2022
- Rebuild

## 1.15.0 - August 23, 2022
- Added settings to control Mermaid themes. Thanks @Reisse!
- Improved syntax error reporting (https://github.com/mjbvz/vscode-markdown-mermaid/pull/140). Thanks @msafronov!
- Pick up mermaid 9.1.6.

## 1.14.3 - August 1, 2022
- Pick up mermaid 9.1.3. Thanks @devmount!

## 1.14.2 - June 22, 2022
- Republish with updated lockfile for new mermaid version.

## 1.14.1 - June 22, 2022
- Pick up mermaid 9.1.2. Thanks @k-pypin!

## 1.14.0 - May 17, 2022
- Pick up mermaid 9.1.1. Thanks @trongthanh!

## 1.13.2 - January 3, 2022
- Pick up mermaid 8.13.10. Thanks @lhyeung!

## 1.13.1 - January 3, 2022
- Pick up mermaid 8.13.8. Thanks @wuhkuh!

## 1.13.0 - November 1, 2021
- Pick up mermaid 8.13.

## 1.12.0 - August 31, 2021
- Add support for running in browsers.

## 1.11.0 - August 31, 2021
- Update to Mermaid 8.12.0: #114 Thanks @CoenraadS!
- Use a transparent background for diagrams: #113. Thanks @CoenraadS!

## 1.9.2 - February 10, 2021
- Update to Mermaid 8.9.0
- Fixes for `:::` rendering. Thanks @chkohner!

## 1.9.1 - January 11, 2021
- Update to Mermaid 8.8.4

## 1.9.0 - November 5, 2020
- Update to Mermaid 8.8.2

## 1.8.1 - August 20, 2020
- Fix `markdown-it-container` listed as a dev dependency instead of a regular one.

## 1.8.0 - August 19, 2020
- Support using `:::` style blocks. These are used on the Azure DevOps Wiki.

## 1.7.0 - August 17, 2020
- Update to mermaid 8.7.0
- Resolve [advisory-1548](https://npmjs.com/advisories/1548)
  - Update webpack to 4.44.1
  - Update terser-webpack-plugin to 2.3.8

## 1.6.0 - August 7, 2020
- Update to mermaid 8.6.4.

## 1.5.1 - May 26, 2020
- Update to mermaid 8.5.1.

## 1.4.2 - February 6, 2020
- Update to mermaid 8.4.6.

## 1.4.1 - November 8, 2019
- Fix mermaid class annotations.

## 1.4.0 - October 28, 2019
- Update to mermaid 8.4.0. Thanks @MrBramme!

## 1.3.0 - October 8, 2019
- Update to mermaid 8.3.1.
- Minify webpacked output.

## 1.2.0 - August 27, 2019
- Update to latest mermaid version. Thanks @jnnnnn!

## 1.1.4 - April 26, 2019
- Remove `extensionKind` as this is no longer required.

## 1.1.3 - April 18, 2019
- Set explicit `extensionKind` for VS Code compatability.

## 1.1.2 - January 3, 2019
- Remove dummy menu item

## 1.1.1 - January 3, 2019
- Remove dummy command

## 1.1.0 - January 2, 2019
- Pick up mermaid 8.0.0.

## 1.0.0 - May 16, 2018
- Pick up Mermaid 8.0

## 0.1.1 - November 3, 2017
- Multi-root ready

## 0.1.0 - October 9, 2017
- Support pandoc language identifiers for mermaid blocks. Thanks @larsw!
- Use webpack to bundle mermaid scripts

## 0.0.4 - August 23, 2017
- Fix mermaid styling for high contrast themes

## 0.0.2 - August 19, 2017
- Fix possible race condition.
- Added logo.
- Switch mermaid light or dark style based on VS Code theme

## 0.0.1 - August 10, 2017
- Initial release
