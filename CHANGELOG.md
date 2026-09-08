# Changelog

## Unreleased

### Added

- Installation-wide language selection in administrator settings, persisted in PostgreSQL.
- English and Russian language packs for built-in interface text, emails, validation and reports.
- Runtime language-pack discovery, validation and recovery, with live updates that preserve form drafts.
- Localization API documentation and portable contract, context and rendering tests.

### Fixed

- Forward verified identity to protected request handlers and protect the current-user endpoint.

### Upgrade notes

- Apply the Prisma schema update before starting this version to create `system_settings`. English remains the default for new installations.
- See [localization documentation](docs/LOCALIZATION.md) for translation assets and multi-instance requirements.
- Earlier release notes: [v1.1.0](docs/CHANGELOG_V1.1.0.md).
