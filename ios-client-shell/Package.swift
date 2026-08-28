// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "LegalClient",
    platforms: [
        .iOS(.v14)
    ],
    targets: [
        .executableTarget(
            name: "LegalClient",
            path: "Sources/LegalClient"
        )
    ]
)
