import ActivityKit
import SwiftUI
import WidgetKit

private let shazarrAccent = Color(red: 0.039, green: 0.518, blue: 1.0) // #0A84FF
private let shazarrTeal = Color(red: 0.082, green: 0.231, blue: 0.302) // #153B50

@main
struct ShazarrWidgetBundle: WidgetBundle {
    var body: some Widget {
        ShazarrLiveActivity()
    }
}

struct ShazarrLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ShazarrActivityAttributes.self) { context in
            LockScreenView(state: context.state)
                .activityBackgroundTint(shazarrTeal.opacity(0.55))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let state = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 9) {
                        LeadingIcon(state: state, size: 30)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(primaryText(state))
                                .font(.system(size: 14, weight: .semibold))
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                                .foregroundStyle(.white)
                            if state.phase == "result", !state.artist.isEmpty {
                                Text(state.artist)
                                    .font(.system(size: 11))
                                    .lineLimit(1)
                                    .foregroundStyle(.white.opacity(0.7))
                            }
                        }
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    HStack(spacing: 8) {
                        if state.phase == "result" {
                            DownloadPill(state: state)
                        } else if state.phase == "listening" {
                            Waveform(levels: state.levels, tint: .white.opacity(0.92), maxHeight: 18)
                                .frame(width: 34)
                        }
                        StopButton()
                    }
                    .padding(.trailing, 2)
                }
            } compactLeading: {
                LeadingIcon(state: state, size: 22)
            } compactTrailing: {
                if state.phase == "result" {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(shazarrAccent)
                } else {
                    Waveform(levels: state.levels, tint: shazarrAccent, maxHeight: 16)
                        .frame(width: 40)
                }
            } minimal: {
                Image(systemName: "music.note")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(shazarrAccent)
            }
            .keylineTint(shazarrAccent)
        }
    }
}

// MARK: - Lock screen

private struct LockScreenView: View {
    let state: ShazarrActivityAttributes.ContentState

    var body: some View {
        HStack(spacing: 12) {
            LeadingIcon(state: state, size: 44)

            VStack(alignment: .leading, spacing: 2) {
                Text(primaryText(state))
                    .font(.system(size: 16, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                Text(secondaryText(state))
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(1)
            }

            Spacer(minLength: 6)

            if state.phase == "result" {
                DownloadPill(state: state)
            } else {
                Waveform(levels: state.levels, tint: .white.opacity(0.9), maxHeight: 22)
                    .frame(width: 40)
            }

            StopButton()
        }
        .padding(16)
    }
}

// MARK: - Pieces

private struct Waveform: View {
    let levels: [Double]
    let tint: Color
    var maxHeight: CGFloat = 22

    var body: some View {
        HStack(alignment: .center, spacing: 3) {
            ForEach(Array(levels.enumerated()), id: \.offset) { _, level in
                Capsule()
                    .fill(tint)
                    .frame(
                        width: 3,
                        height: max(4, maxHeight * CGFloat(min(max(level, 0), 1)))
                    )
            }
        }
        .frame(maxHeight: maxHeight)
    }
}

private struct LeadingIcon: View {
    let state: ShazarrActivityAttributes.ContentState
    let size: CGFloat

    var body: some View {
        Group {
            if state.phase == "result", let image = artworkImage(state.artworkBase64) {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: size, height: size)
                    .clipShape(RoundedRectangle(cornerRadius: size * 0.28, style: .continuous))
            } else {
                Image(systemName: "music.note")
                    .font(.system(size: size * 0.46, weight: .semibold))
                    .foregroundStyle(.white)
            }
        }
        .frame(width: size, height: size)
        .background {
            if state.phase != "result" || artworkImage(state.artworkBase64) == nil {
                Circle().fill(
                    LinearGradient(
                        colors: [shazarrAccent, shazarrAccent.opacity(0.72)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            }
        }
        .accessibilityHidden(true)
    }
}

private struct StopButton: View {
    var body: some View {
        Link(destination: link("shazarr://stop")) {
            Image(systemName: "xmark")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white.opacity(0.85))
                .frame(width: 28, height: 28)
                .background(Circle().fill(Color.white.opacity(0.16)))
        }
        .accessibilityLabel("Interrompi riconoscimento")
    }
}

private struct DownloadPill: View {
    let state: ShazarrActivityAttributes.ContentState

    var body: some View {
        Link(destination: link(state.downloadURL, fallback: "shazarr://track")) {
            HStack(spacing: 5) {
                Image(systemName: "arrow.down")
                    .font(.system(size: 11, weight: .bold))
                Text(state.serviceName.isEmpty ? "Scarica" : state.serviceName)
                    .font(.system(size: 13, weight: .semibold))
                    .lineLimit(1)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(Capsule().fill(shazarrAccent))
        }
        .accessibilityLabel("Scarica il brano")
    }
}

// MARK: - Helpers

private func primaryText(_ state: ShazarrActivityAttributes.ContentState) -> String {
    switch state.phase {
    case "result":
        return state.title.isEmpty ? "Trovato!" : state.title
    case "error":
        return "Nessun brano"
    default:
        return "In ascolto…"
    }
}

private func secondaryText(_ state: ShazarrActivityAttributes.ContentState) -> String {
    switch state.phase {
    case "result":
        return state.artist
    case "error":
        return "Riprova"
    default:
        return "Shazarr sta ascoltando"
    }
}

private func artworkImage(_ base64: String) -> UIImage? {
    guard !base64.isEmpty, let data = Data(base64Encoded: base64) else { return nil }
    return UIImage(data: data)
}

private func link(_ raw: String, fallback: String = "shazarr://stop") -> URL {
    if !raw.isEmpty, let url = URL(string: raw) { return url }
    return URL(string: fallback)!
}
