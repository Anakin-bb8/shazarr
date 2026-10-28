import ActivityKit
import Capacitor
import Foundation
import UIKit

/// Capacitor bridge that lets the web layer drive the Dynamic Island Live
/// Activity: start listening, push waveform levels + the matched track, stop.
@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "consumePendingRecognize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
    ]

    override public func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handlePendingRecognize),
            name: Notification.Name("ShazarrPendingRecognize"),
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func handlePendingRecognize() {
        notifyListeners("pendingRecognize", data: [:])
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 16.1, *) {
            call.resolve(["available": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["available": false])
        }
    }

    @objc func consumePendingRecognize(_ call: CAPPluginCall) {
        let defaults = UserDefaults.standard
        let stamp = defaults.double(forKey: RecognizeSongIntent.pendingKey)
        defaults.removeObject(forKey: RecognizeSongIntent.pendingKey)

        let age = Date().timeIntervalSince1970 - stamp
        let pending = stamp > 0 && age >= 0 && age < RecognizeSongIntent.freshnessWindow
        call.resolve(["pending": pending])
    }

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.resolve(["started": false])
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve(["started": false])
            return
        }

        let levels = call.getArray("levels", Double.self) ?? [0.35, 0.7, 1.0, 0.7, 0.35]
        let state = ShazarrActivityAttributes.ContentState(phase: "listening", levels: levels)

        if let existing = Activity<ShazarrActivityAttributes>.activities.first {
            Task {
                await existing.update(ActivityContent(state: state, staleDate: nil))
                call.resolve(["started": true, "id": existing.id])
            }
            return
        }

        do {
            let activity = try Activity.request(
                attributes: ShazarrActivityAttributes(),
                content: ActivityContent(state: state, staleDate: nil),
                pushType: nil
            )
            call.resolve(["started": true, "id": activity.id])
        } catch {
            call.resolve(["started": false, "error": error.localizedDescription])
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *), let activity = Activity<ShazarrActivityAttributes>.activities.first else {
            call.resolve()
            return
        }

        var state = ShazarrActivityAttributes.ContentState(
            phase: call.getString("phase") ?? "listening",
            levels: call.getArray("levels", Double.self) ?? [0.14, 0.14, 0.14, 0.14, 0.14],
            title: call.getString("title") ?? "",
            artist: call.getString("artist") ?? "",
            artworkBase64: "",
            downloadURL: call.getString("downloadURL") ?? "",
            serviceName: call.getString("serviceName") ?? ""
        )

        if let artworkURL = call.getString("artworkURL"), !artworkURL.isEmpty,
           let url = URL(string: artworkURL) {
            downloadArtwork(url) { base64 in
                state.artworkBase64 = base64 ?? ""
                Task {
                    await activity.update(ActivityContent(state: state, staleDate: nil))
                    call.resolve()
                }
            }
            return
        }

        Task {
            await activity.update(ActivityContent(state: state, staleDate: nil))
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.resolve()
            return
        }
        Task {
            for activity in Activity<ShazarrActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            call.resolve()
        }
    }

    // MARK: - Artwork

    /// Album art has to travel inside the activity state (Live Activities get no
    /// network at render time and there is no App Group to share a file), so we
    /// shrink it to a tiny JPEG and keep the payload under the 4 KB budget.
    private func downloadArtwork(_ url: URL, completion: @escaping (String?) -> Void) {
        URLSession.shared.dataTask(with: url) { data, _, _ in
            var encoded: String?
            if let data = data, let image = UIImage(data: data) {
                encoded = Self.encodeThumbnail(image)
            }
            DispatchQueue.main.async { completion(encoded) }
        }.resume()
    }

    private static func encodeThumbnail(_ image: UIImage) -> String? {
        let side: CGFloat = 48
        let thumbnail = image.preparingThumbnail(of: CGSize(width: side, height: side)) ?? image
        guard let data = thumbnail.jpegData(compressionQuality: 0.4) else { return nil }
        let base64 = data.base64EncodedString()
        // Hard ceiling keeps us well inside the state size limit.
        if base64.count > 3000 { return nil }
        return base64
    }
}
