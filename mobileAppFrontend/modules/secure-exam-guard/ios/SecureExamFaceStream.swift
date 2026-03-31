import AVFoundation
import Foundation
import ImageIO
import Vision

final class SecureExamFaceStream: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  private let session = AVCaptureSession()
  private let sessionQueue = DispatchQueue(label: "SecureExamGuard.FaceStream.Session")
  private let visionQueue = DispatchQueue(label: "SecureExamGuard.FaceStream.Vision")
  private let eventHandler: (Int, Double) -> Void
  private let sampleIntervalMs: Double = 500

  private var configured = false
  private var running = false
  private var processingFrame = false
  private var lastSampleStartedAt = 0.0
  private var recentFaceCounts: [Int] = []
  private var lastStableFaceCount: Int?

  init(eventHandler: @escaping (Int, Double) -> Void) {
    self.eventHandler = eventHandler
    super.init()
  }

  deinit {
    stop()
  }

  func start() {
    sessionQueue.async { [weak self] in
      guard let self else {
        return
      }

      let authorizationStatus = AVCaptureDevice.authorizationStatus(for: .video)

      switch authorizationStatus {
      case .authorized:
        self.startAuthorizedSession()
      case .notDetermined:
        AVCaptureDevice.requestAccess(for: .video) { granted in
          guard let self else {
            return
          }

          guard granted else {
            self.emitPermissionUnavailable()
            return
          }

          self.sessionQueue.async {
            self.startAuthorizedSession()
          }
        }
      default:
        self.emitPermissionUnavailable()
        return
      }
    }
  }

  func stop() {
    running = false
    processingFrame = false

    sessionQueue.async { [weak self] in
      guard let self else {
        return
      }

      self.lastSampleStartedAt = 0
      self.recentFaceCounts.removeAll()
      self.lastStableFaceCount = nil

      if self.session.isRunning {
        self.session.stopRunning()
      }
      self.session.inputs.forEach { self.session.removeInput($0) }
      self.session.outputs.forEach { self.session.removeOutput($0) }
      self.configured = false
    }
  }

  private func startAuthorizedSession() {
    guard !running else {
      return
    }

    do {
      try configureSessionIfNeeded()
      running = true
      processingFrame = false
      recentFaceCounts.removeAll()
      lastStableFaceCount = nil
      lastSampleStartedAt = 0
      if !session.isRunning {
        session.startRunning()
      }
    } catch {
      running = false
      emitPermissionUnavailable()
    }
  }

  private func configureSessionIfNeeded() throws {
    guard !configured else {
      return
    }

    session.beginConfiguration()
    session.sessionPreset = .medium

    defer {
      session.commitConfiguration()
    }

    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) else {
      throw FaceStreamError.cameraUnavailable
    }

    let input = try AVCaptureDeviceInput(device: device)
    guard session.canAddInput(input) else {
      throw FaceStreamError.inputUnavailable
    }
    session.addInput(input)

    let output = AVCaptureVideoDataOutput()
    output.alwaysDiscardsLateVideoFrames = true
    output.videoSettings = [
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
    ]
    output.setSampleBufferDelegate(self, queue: visionQueue)

    guard session.canAddOutput(output) else {
      throw FaceStreamError.outputUnavailable
    }
    session.addOutput(output)

    if let connection = output.connection(with: .video) {
      if connection.isVideoOrientationSupported {
        connection.videoOrientation = .portrait
      }
      if connection.isVideoMirroringSupported {
        connection.isVideoMirrored = true
      }
    }

    configured = true
  }

  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection,
  ) {
    guard running else {
      return
    }

    let now = SecureExamTime.currentTimestampMs()
    guard now - lastSampleStartedAt >= sampleIntervalMs else {
      return
    }

    guard !processingFrame else {
      return
    }

    lastSampleStartedAt = now
    processingFrame = true
    let request = VNDetectFaceRectanglesRequest { [weak self] request, _ in
      guard let self else {
        return
      }

      defer {
        self.processingFrame = false
      }

      guard self.running else {
        return
      }

      let faces = (request.results as? [VNFaceObservation]) ?? []
      let normalizedCount = min(max(faces.count, 0), 2)
      self.handleRawFaceCount(normalizedCount, at: SecureExamTime.currentTimestampMs())
    }

    do {
      try VNImageRequestHandler(
        cmSampleBuffer: sampleBuffer,
        orientation: .leftMirrored,
        options: [:],
      ).perform([request])
    } catch {
      processingFrame = false
    }
  }

  private func emitPermissionUnavailable() {
    recentFaceCounts.removeAll()
    emitFaceCountIfChanged(-1, at: SecureExamTime.currentTimestampMs())
  }

  private func handleRawFaceCount(_ rawCount: Int, at timestamp: Double) {
    let clampedCount = min(max(rawCount, 0), 2)
    recentFaceCounts.append(clampedCount)
    if recentFaceCounts.count > 3 {
      recentFaceCounts.removeFirst(recentFaceCounts.count - 3)
    }

    let stabilizedFaceCount: Int?

    if recentFaceCounts.count >= 3 && recentFaceCounts.suffix(3).allSatisfy({ $0 == 0 }) {
      stabilizedFaceCount = 0
    } else if recentFaceCounts.count >= 2 && recentFaceCounts.suffix(2).allSatisfy({ $0 >= 2 }) {
      stabilizedFaceCount = 2
    } else if recentFaceCounts.count >= 2 && recentFaceCounts.suffix(2).allSatisfy({ $0 == 1 }) {
      stabilizedFaceCount = 1
    } else {
      stabilizedFaceCount = nil
    }

    guard let stabilizedFaceCount else {
      return
    }

    emitFaceCountIfChanged(stabilizedFaceCount, at: timestamp)
  }

  private func emitFaceCountIfChanged(_ faceCount: Int, at timestamp: Double) {
    guard lastStableFaceCount != faceCount else {
      return
    }

    lastStableFaceCount = faceCount

    DispatchQueue.main.async { [eventHandler] in
      eventHandler(faceCount, timestamp)
    }
  }
}

private enum FaceStreamError: Error {
  case cameraUnavailable
  case inputUnavailable
  case outputUnavailable
}
