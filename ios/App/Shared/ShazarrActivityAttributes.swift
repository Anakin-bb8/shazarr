import ActivityKit
import Foundation

/// Shared between the app (which drives the activity) and the widget extension
/// (which renders it). Compiled into both targets from `ios/App/Shared`.
public struct ShazarrActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// "listening" | "result" | "error"
        public var phase: String
        /// Five normalized 0..1 bars for the listening waveform.
        public var levels: [Double]
        public var title: String
        public var artist: String
        /// Tiny (48pt) JPEG, base64, so album art travels inside the 4 KB budget
        /// without an App Group or network access at render time.
        public var artworkBase64: String
        /// Custom-scheme link opened by the "Scarica" pill.
        public var downloadURL: String
        public var serviceName: String

        public init(
            phase: String = "listening",
            levels: [Double] = [0.35, 0.7, 1.0, 0.7, 0.35],
            title: String = "",
            artist: String = "",
            artworkBase64: String = "",
            downloadURL: String = "",
            serviceName: String = ""
        ) {
            self.phase = phase
            self.levels = levels
            self.title = title
            self.artist = artist
            self.artworkBase64 = artworkBase64
            self.downloadURL = downloadURL
            self.serviceName = serviceName
        }
    }

    public var startedAt: Date

    public init(startedAt: Date = Date()) {
        self.startedAt = startedAt
    }
}
