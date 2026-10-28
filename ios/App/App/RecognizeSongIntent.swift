import AppIntents
import Foundation

/// "Riconosci un brano" — exposed to the Shortcuts app and to Siri as an App
/// Shortcut. Running it foregrounds Shazarr and leaves a short-lived flag; the
/// LiveActivity plugin picks the flag up (or, if the app is already alive,
/// receives the notification) and starts listening.
struct RecognizeSongIntent: AppIntent {
    static var title: LocalizedStringResource = "Riconosci un brano"
    static var description: IntentDescription = IntentDescription(
        "Apre Shazarr e avvia l'ascolto per riconoscere il brano in riproduzione.",
        categoryName: "Riconoscimento"
    )
    static var openAppWhenRun: Bool = true

    /// Flags younger than this are honoured; anything older is a leftover from
    /// a launch that never reached the web layer and is discarded.
    static let freshnessWindow: TimeInterval = 90
    static let pendingKey = "shazarr.pendingRecognizeAt"

    @MainActor
    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set(
            Date().timeIntervalSince1970,
            forKey: RecognizeSongIntent.pendingKey
        )
        NotificationCenter.default.post(
            name: Notification.Name("ShazarrPendingRecognize"),
            object: nil
        )
        return .result()
    }
}

struct ShazarrAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: RecognizeSongIntent(),
            phrases: [
                "Riconosci un brano con \(.applicationName)",
                "Avvia riconoscimento in \(.applicationName)",
            ],
            shortTitle: "Riconosci un brano",
            systemImageName: "music.note"
        )
    }
}
