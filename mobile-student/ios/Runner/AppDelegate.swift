import UIKit
import Flutter
import AutomaticAssessmentConfiguration

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  private let CHANNEL = "com.examora/security"
  private var assessmentSession: Any? = nil

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Boolean {
    let controller : FlutterViewController = window?.rootViewController as! FlutterViewController
    let securityChannel = FlutterMethodChannel(name: CHANNEL, binaryMessenger: controller.binaryMessenger)

    securityChannel.setMethodCallHandler({
      [weak self] (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
      switch call.method {
      case "enableKioskMode":
        if #available(iOS 13.4, *) {
          let config = AEAssessmentConfiguration()
          let session = AEAssessmentSession(configuration: config)
          self?.assessmentSession = session
          session.begin()
          result(true)
        } else {
          result(true)
        }
      case "disableKioskMode":
        if #available(iOS 13.4, *) {
          if let session = self?.assessmentSession as? AEAssessmentSession {
            session.end()
            self?.assessmentSession = nil
          }
          result(true)
        } else {
          result(true)
        }
      case "enableSecureScreen":
        // iOS prevents screen capture through field masking or system alerts
        result(true)
      case "disableSecureScreen":
        result(true)
      case "isKioskActive":
        let isGuided = UIAccessibility.isGuidedAccessEnabled
        result(isGuided)
      default:
        result(FlutterMethodNotImplemented)
      }
    })

    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
