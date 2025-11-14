/**
 * Homebrew Auto-Update GitHub Action
 *
 * This action automatically updates Homebrew formulas when a project is released.
 * It supports multiple versioning strategies and handles the complete workflow:
 * - Generate version based on strategy (date-based, semver, custom)
 * - Create GitHub release with tag
 * - Update Homebrew formula with new version and SHA256
 * - Commit and push changes to tap repository
 */
export {};
