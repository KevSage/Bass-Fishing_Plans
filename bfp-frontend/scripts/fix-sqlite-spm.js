/**
 * This script adds Swift Package Manager (SPM) support to @capacitor-community/sqlite
 * The plugin doesn't include a Package.swift, which is required for Capacitor 7's SPM-based iOS builds.
 * This script creates the necessary Package.swift after npm install.
 */

const fs = require('fs');
const path = require('path');

const sqlitePath = path.join(__dirname, '..', 'node_modules', '@capacitor-community', 'sqlite');
const packageSwiftPath = path.join(sqlitePath, 'Package.swift');

const packageSwiftContent = `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorCommunitySqlite",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "CapacitorCommunitySqlite",
            targets: ["CapacitorCommunitySqlitePlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "CapacitorCommunitySqlitePlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Plugin",
            exclude: ["Info.plist"],
            publicHeadersPath: "."
        )
    ]
)
`;

// Only create if the sqlite package exists
if (fs.existsSync(sqlitePath)) {
  fs.writeFileSync(packageSwiftPath, packageSwiftContent);
  console.log('[fix-sqlite-spm] Created Package.swift for @capacitor-community/sqlite');
} else {
  console.log('[fix-sqlite-spm] @capacitor-community/sqlite not found, skipping');
}
