require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))

Pod::Spec.new do |s|
  s.name = "SecureExamGuard"
  s.version = package["version"]
  s.summary = package["description"]
  s.description = package["description"]
  s.license = package["license"]
  s.author = package["author"]
  s.homepage = "https://example.local/secure-exam-guard"
  s.platforms = {
    :ios => "15.1"
  }
  s.swift_version = "5.9"
  s.source = { git: "https://example.local/secure-exam-guard.git" }
  s.static_framework = true

  s.dependency "ExpoModulesCore"
  s.frameworks = ["AVFoundation", "Vision", "CoreMedia", "CoreVideo"]

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_COMPILATION_MODE" => "wholemodule"
  }

  s.source_files = "**/*.{h,m,swift}"
end
