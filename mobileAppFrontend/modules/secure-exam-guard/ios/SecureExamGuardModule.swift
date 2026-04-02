import AVFoundation
import ExpoModulesCore
import Foundation
import UIKit

enum SecureExamTime {
  static func currentTimestampMs() -> Double {
    Date().timeIntervalSince1970 * 1000
  }
}

public final class SecureExamGuardModule: Module {
  private let captureEventName = "onCaptureStateChanged"
  private let faceEventName = "onFaceCountChanged"
  private let captureDebounceMs = 400.0

  private var captureObserver: NSObjectProtocol?
  private var captureMonitoringCount = 0
  private var captureDebounceWorkItem: DispatchWorkItem?
  private var lastEmittedCaptureState: Bool?

  private var snapshotProtectionCount = 0
  private var snapshotWillResignObserver: NSObjectProtocol?
  private var snapshotDidBecomeObserver: NSObjectProtocol?
  private var snapshotOverlay: UIView?

  private var sensitiveOverlay: UIVisualEffectView?
  private var faceStream: SecureExamFaceStream?
  private var lastEmittedNormalizedFaceCount: Int?

  private var keyWindow: UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .last(where: \.isKeyWindow)
  }

  public func definition() -> ModuleDefinition {
    Name("SecureExamGuard")

    Events(captureEventName, faceEventName)

    OnDestroy {
      self.stopMonitoringInternal(force: true)
      self.disableSecureSnapshotInternal(force: true)
      self.setSensitiveBlurEnabledInternal(false)
      self.stopFaceStreamInternal()
    }

    AsyncFunction("startMonitoring") { (_ payload: [String: String]) in
      self.startMonitoringInternal()
    }.runOnQueue(.main)

    AsyncFunction("stopMonitoring") {
      self.stopMonitoringInternal(force: false)
    }.runOnQueue(.main)

    Function("getCurrentCaptureState") { () -> [String: Any] in
      self.makeCapturePayload(isCaptured: UIScreen.main.isCaptured, ts: SecureExamTime.currentTimestampMs())
    }

    AsyncFunction("enableSecureSnapshot") {
      self.enableSecureSnapshotInternal()
    }.runOnQueue(.main)

    AsyncFunction("disableSecureSnapshot") {
      self.disableSecureSnapshotInternal(force: false)
    }.runOnQueue(.main)

    AsyncFunction("setSensitiveBlurEnabled") { (enabled: Bool) in
      self.setSensitiveBlurEnabledInternal(enabled)
    }.runOnQueue(.main)

    AsyncFunction("startFaceStream") {
      self.startFaceStreamInternal()
    }.runOnQueue(.main)

    AsyncFunction("stopFaceStream") {
      self.stopFaceStreamInternal()
    }.runOnQueue(.main)
  }

  private func startMonitoringInternal() {
    captureMonitoringCount += 1
    registerCaptureObserverIfNeeded()

    if captureMonitoringCount == 1 {
      lastEmittedCaptureState = UIScreen.main.isCaptured
      captureDebounceWorkItem?.cancel()
      captureDebounceWorkItem = nil
    }
  }

  private func stopMonitoringInternal(force: Bool) {
    if force {
      captureMonitoringCount = 0
    } else if captureMonitoringCount > 0 {
      captureMonitoringCount -= 1
    }

    guard captureMonitoringCount == 0 else {
      return
    }

    captureDebounceWorkItem?.cancel()
    captureDebounceWorkItem = nil
    unregisterCaptureObserver()
    lastEmittedCaptureState = nil
  }

  private func registerCaptureObserverIfNeeded() {
    guard captureObserver == nil else {
      return
    }

    captureObserver = NotificationCenter.default.addObserver(
      forName: UIScreen.capturedDidChangeNotification,
      object: nil,
      queue: nil,
    ) { [weak self] _ in
      self?.scheduleCaptureStateEmission()
    }
  }

  private func unregisterCaptureObserver() {
    guard let captureObserver else {
      return
    }

    NotificationCenter.default.removeObserver(captureObserver)
    self.captureObserver = nil
  }

  private func emitCaptureStateIfChanged() {
    let isCaptured = UIScreen.main.isCaptured
    guard lastEmittedCaptureState != isCaptured else {
      return
    }

    lastEmittedCaptureState = isCaptured
    sendEvent(captureEventName, makeCapturePayload(isCaptured: isCaptured, ts: SecureExamTime.currentTimestampMs()))
  }

  private func scheduleCaptureStateEmission() {
    captureDebounceWorkItem?.cancel()

    let workItem = DispatchWorkItem { [weak self] in
      self?.emitCaptureStateIfChanged()
    }

    captureDebounceWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + captureDebounceMs / 1000, execute: workItem)
  }

  private func makeCapturePayload(isCaptured: Bool, ts: Double) -> [String: Any] {
    [
      "state": isCaptured ? "active" : "inactive",
      "ts": ts,
    ]
  }

  private func enableSecureSnapshotInternal() {
    snapshotProtectionCount += 1

    guard snapshotWillResignObserver == nil, snapshotDidBecomeObserver == nil else {
      if UIApplication.shared.applicationState != .active {
        showSnapshotOverlay()
      }
      return
    }

    snapshotWillResignObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.willResignActiveNotification,
      object: nil,
      queue: nil,
    ) { [weak self] _ in
      self?.showSnapshotOverlay()
    }

    snapshotDidBecomeObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.didBecomeActiveNotification,
      object: nil,
      queue: nil,
    ) { [weak self] _ in
      self?.removeSnapshotOverlay()
    }

    if UIApplication.shared.applicationState != .active {
      showSnapshotOverlay()
    }
  }

  private func disableSecureSnapshotInternal(force: Bool) {
    if force {
      snapshotProtectionCount = 0
    } else if snapshotProtectionCount > 0 {
      snapshotProtectionCount -= 1
    }

    guard snapshotProtectionCount == 0 else {
      return
    }

    if let observer = snapshotWillResignObserver {
      NotificationCenter.default.removeObserver(observer)
      snapshotWillResignObserver = nil
    }

    if let observer = snapshotDidBecomeObserver {
      NotificationCenter.default.removeObserver(observer)
      snapshotDidBecomeObserver = nil
    }

    removeSnapshotOverlay()
  }

  private func showSnapshotOverlay() {
    guard snapshotOverlay == nil, let keyWindow else {
      return
    }

    let overlay = UIView(frame: keyWindow.bounds)
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    overlay.backgroundColor = .black
    overlay.isUserInteractionEnabled = false

    keyWindow.addSubview(overlay)
    keyWindow.bringSubviewToFront(overlay)
    snapshotOverlay = overlay
  }

  private func removeSnapshotOverlay() {
    snapshotOverlay?.removeFromSuperview()
    snapshotOverlay = nil
  }

  private func setSensitiveBlurEnabledInternal(_ enabled: Bool) {
    guard enabled else {
      sensitiveOverlay?.removeFromSuperview()
      sensitiveOverlay = nil
      return
    }

    guard sensitiveOverlay == nil, let keyWindow else {
      return
    }

    let effectView = UIVisualEffectView(effect: UIBlurEffect(style: .systemMaterialLight))
    effectView.frame = keyWindow.bounds
    effectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    effectView.isUserInteractionEnabled = false
    effectView.alpha = 0.98

    keyWindow.addSubview(effectView)
    keyWindow.bringSubviewToFront(effectView)
    sensitiveOverlay = effectView
  }

  private func startFaceStreamInternal() {
    if faceStream == nil {
      faceStream = SecureExamFaceStream { [weak self] faceCount, ts in
        guard let self = self else {
          return
        }

        let payload = self.makeFacePayload(faceCount: faceCount, ts: ts)
        self.sendEvent(self.faceEventName, payload)
      }
    }

    lastEmittedNormalizedFaceCount = nil
    faceStream?.start()
  }

  private func stopFaceStreamInternal() {
    faceStream?.stop()
    faceStream = nil
    lastEmittedNormalizedFaceCount = nil
  }

  private func makeFacePayload(faceCount: Int, ts: Double) -> [String: Any] {
    let isSupported = faceCount >= 0
    let normalizedFaceCount = isSupported ? min(max(faceCount, 0), 2) : 0
    let previousFaceCount = lastEmittedNormalizedFaceCount
    let integrityEvent: String?

    if !isSupported {
      integrityEvent = nil
      lastEmittedNormalizedFaceCount = nil
    } else if normalizedFaceCount == 0 {
      integrityEvent = "NO_FACE"
      lastEmittedNormalizedFaceCount = normalizedFaceCount
    } else if normalizedFaceCount >= 2 {
      integrityEvent = "MULTIPLE_FACES"
      lastEmittedNormalizedFaceCount = normalizedFaceCount
    } else if let previousFaceCount, previousFaceCount != 1 {
      integrityEvent = "FACE_RETURNED"
      lastEmittedNormalizedFaceCount = normalizedFaceCount
    } else {
      integrityEvent = nil
      lastEmittedNormalizedFaceCount = normalizedFaceCount
    }

    return [
      "faceCount": normalizedFaceCount,
      "supported": isSupported,
      "integrityEvent": integrityEvent ?? NSNull(),
      "ts": ts,
    ]
  }
}
