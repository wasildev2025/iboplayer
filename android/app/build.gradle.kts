import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

// Release signing pulls keystore details from android/keystore.properties
// (gitignored) so credentials never live in the repo. CI sets these via
// secrets; locally, copy keystore.properties.example and fill in real values
// after generating a keystore with:
//   keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 \
//           -validity 10000 -alias iboplayer
val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) {
        keystorePropsFile.inputStream().use { load(it) }
    }
}

android {
    namespace = "com.iboplayer.next"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.iboplayer.next"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        // Panel base URL baked into the APK. Override per build variant below.
        // Release builds inherit this; debug builds override to a LAN dev URL.
        buildConfigField(
            "String",
            "PANEL_BASE_URL",
            "\"https://iboplayer-pi.vercel.app\"",
        )
    }

    signingConfigs {
        create("release") {
            // Falls back to env vars if keystore.properties isn't present —
            // works locally OR in CI. Release builds without any keystore
            // configured will fail (intentional — better than shipping a
            // debug-signed APK by accident).
            val storeFilePath =
                keystoreProps.getProperty("storeFile")
                    ?: System.getenv("ANDROID_KEYSTORE_PATH")
            val pwd = keystoreProps.getProperty("storePassword")
                ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
            val alias = keystoreProps.getProperty("keyAlias")
                ?: System.getenv("ANDROID_KEY_ALIAS")
            val keyPwd = keystoreProps.getProperty("keyPassword")
                ?: System.getenv("ANDROID_KEY_PASSWORD")
            if (storeFilePath != null && pwd != null && alias != null && keyPwd != null) {
                storeFile = file(storeFilePath)
                storePassword = pwd
                keyAlias = alias
                keyPassword = keyPwd
            }
        }
    }

    buildTypes {
        debug {
            // Debug builds currently point at production Vercel so installs on
            // any device just work. To dev against a local Next.js server,
            // swap this to your LAN URL and run `npm run dev`:
            //   - Android emulator:  http://10.0.2.2:3000  (alias for host localhost)
            //   - Real device:       http://<dev-machine-LAN-IP>:3000  (e.g. 192.168.18.42)
            buildConfigField(
                "String",
                "PANEL_BASE_URL",
                "\"https://iboplayer-pi.vercel.app\"",
            )
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Use the release keystore when available; if env/properties
            // aren't set, fall back to debug signing only for local builds.
            // CI must set the env vars to produce a Play-Store-ready APK.
            val sc = signingConfigs.findByName("release")
            signingConfig =
                if (sc?.storeFile?.exists() == true) sc
                else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    implementation(libs.media3.exoplayer)
    implementation(libs.media3.exoplayer.hls)
    implementation(libs.media3.exoplayer.dash)
    implementation(libs.media3.ui)
    implementation(libs.media3.session)
    implementation(libs.media3.cast)
    implementation(libs.play.services.cast.framework)
    implementation(libs.androidx.mediarouter)

    implementation(libs.okhttp)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.coil.compose)
    implementation(libs.androidx.datastore.preferences)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    // Room
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    // Paging — channels are server-paginated, no local cache
    implementation(libs.androidx.paging.runtime)
    implementation(libs.androidx.paging.compose)

    // QR code generation
    implementation(libs.zxing.core)

    debugImplementation(libs.androidx.ui.tooling)
}
