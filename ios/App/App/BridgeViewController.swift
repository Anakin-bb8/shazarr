import Capacitor
import UIKit

/// The app's bridge view controller.
///
/// Capacitor 8 registers plugins from the generated `packageClassList`, which
/// only covers npm-installed plugins. The LiveActivity plugin lives in the app
/// target, so it is registered by hand here, once the bridge exists.
class BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(LiveActivityPlugin())
    }
}
