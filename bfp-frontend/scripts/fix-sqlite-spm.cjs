/**
 * This script adds Swift Package Manager (SPM) support to @capacitor-community/sqlite
 * The plugin doesn't include a Package.swift, which is required for Capacitor 7's SPM-based iOS builds.
 *
 * Capacitor 7 uses pure Swift plugin registration (CAPBridgedPlugin protocol) instead of the old
 * ObjC CAP_PLUGIN macro approach. This script:
 * 1. Creates the necessary Package.swift
 * 2. Patches the Swift plugin file to use CAPBridgedPlugin
 */

const fs = require('fs');
const path = require('path');

const sqlitePath = path.join(__dirname, '..', 'node_modules', '@capacitor-community', 'sqlite');
const packageSwiftPath = path.join(sqlitePath, 'Package.swift');
const pluginSwiftPath = path.join(sqlitePath, 'ios', 'Plugin', 'CapacitorSQLitePlugin.swift');

// Package.swift with ZIPFoundation (uses system SQLite3 instead of SQLCipher)
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
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0"),
        .package(url: "https://github.com/weichsel/ZIPFoundation.git", from: "0.9.0")
    ],
    targets: [
        .target(
            name: "CapacitorCommunitySqlitePlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "ZIPFoundation", package: "ZIPFoundation")
            ],
            path: "ios/Plugin",
            exclude: ["Info.plist", "CapacitorSQLitePlugin.m", "CapacitorSQLitePlugin.h"]
        )
    ]
)
`;

// The CAPBridgedPlugin properties to add to the Swift class
const bridgedPluginCode = `
    // MARK: - CAPBridgedPlugin conformance for Capacitor 7 SPM support
    public let identifier = "CapacitorSQLitePlugin"
    public let jsName = "CapacitorSQLite"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createConnection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "closeConnection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createNCConnection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "closeNCConnection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getNCDatabasePath", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getUrl", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getVersion", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "execute", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "executeSet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "run", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "query", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isDBExists", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isDBOpen", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteDatabase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "importFromJson", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isJsonValid", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "exportToJson", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteExportedRows", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createSyncTable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSyncDate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSyncDate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addUpgradeStatement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "copyFromAssets", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isDatabase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isNCDatabase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isTableExists", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDatabaseList", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getTableList", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getMigratableDbList", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addSQLiteSuffix", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteOldDatabases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "moveDatabasesAndAddSuffix", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkConnectionsConsistency", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSecretStored", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setEncryptionSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "changeEncryptionSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearEncryptionSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getFromHTTPRequest", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkEncryptionSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isInConfigEncryption", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isInConfigBiometricAuth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isDatabaseEncrypted", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "beginTransaction", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "commitTransaction", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "rollbackTransaction", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isTransactionActive", returnType: CAPPluginReturnPromise)
    ]
`;

// Function to replace SQLCipher imports with SQLite3 in all Swift files
function patchSQLCipherImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      patchSQLCipherImports(fullPath);
    } else if (file.name.endsWith('.swift')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('import SQLCipher')) {
        content = content.replace(/import SQLCipher/g, 'import SQLite3');
        fs.writeFileSync(fullPath, content);
        console.log(`[fix-sqlite-spm] Replaced SQLCipher with SQLite3 in ${file.name}`);
      }
    }
  }
}

// Only run if the sqlite package exists
if (fs.existsSync(sqlitePath)) {
  // Create Package.swift
  fs.writeFileSync(packageSwiftPath, packageSwiftContent);
  console.log('[fix-sqlite-spm] Created Package.swift for @capacitor-community/sqlite');

  // Patch SQLCipher imports to use SQLite3 (no encryption needed)
  const pluginDir = path.join(sqlitePath, 'ios', 'Plugin');
  if (fs.existsSync(pluginDir)) {
    patchSQLCipherImports(pluginDir);
  }

  // Patch the Swift plugin file to add CAPBridgedPlugin conformance
  if (fs.existsSync(pluginSwiftPath)) {
    let swiftContent = fs.readFileSync(pluginSwiftPath, 'utf8');

    // Check if already patched
    if (!swiftContent.includes('CAPBridgedPlugin')) {
      // Add CAPBridgedPlugin to the class declaration
      swiftContent = swiftContent.replace(
        'public class CapacitorSQLitePlugin: CAPPlugin {',
        'public class CapacitorSQLitePlugin: CAPPlugin, CAPBridgedPlugin {'
      );

      // Add the required properties after the class opening brace
      // Find the line with the class declaration and insert after it
      const classLinePattern = /public class CapacitorSQLitePlugin: CAPPlugin, CAPBridgedPlugin \{/;
      swiftContent = swiftContent.replace(
        classLinePattern,
        `public class CapacitorSQLitePlugin: CAPPlugin, CAPBridgedPlugin {${bridgedPluginCode}`
      );

      fs.writeFileSync(pluginSwiftPath, swiftContent);
      console.log('[fix-sqlite-spm] Patched CapacitorSQLitePlugin.swift with CAPBridgedPlugin conformance');
    } else {
      console.log('[fix-sqlite-spm] Swift file already patched, skipping');
    }
  }

  console.log('[fix-sqlite-spm] SPM setup complete');
} else {
  console.log('[fix-sqlite-spm] @capacitor-community/sqlite not found, skipping');
}
