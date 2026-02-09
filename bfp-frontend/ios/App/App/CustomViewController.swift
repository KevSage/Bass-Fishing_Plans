import UIKit
import Capacitor
import WebKit

class CustomViewController: CAPBridgeViewController {

    override func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)

        // Use default (persistent) data store to share cookies with Safari
        config.websiteDataStore = WKWebsiteDataStore.default()

        // Allow inline media playback
        config.allowsInlineMediaPlayback = true

        // Set preferences for better compatibility
        config.preferences.javaScriptEnabled = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true

        // Allow cross-origin requests
        if #available(iOS 14.0, *) {
            config.defaultWebpagePreferences.allowsContentJavaScript = true
        }

        return config
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Enable web inspector for debugging
        if #available(iOS 16.4, *) {
            webView?.isInspectable = true
        }

        // Set dark background to prevent white flash on overscroll/bounce
        let darkColor = UIColor(red: 10/255, green: 10/255, blue: 10/255, alpha: 1) // #0a0a0a
        view.backgroundColor = darkColor
        webView?.backgroundColor = darkColor
        webView?.scrollView.backgroundColor = darkColor
        webView?.isOpaque = false
    }
}
