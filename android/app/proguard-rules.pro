-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keep,includedescriptorclasses class com.iboplayer.next.**$$serializer { *; }
-keepclassmembers class com.iboplayer.next.** {
    *** Companion;
}
-keepclasseswithmembers class com.iboplayer.next.** {
    kotlinx.serialization.KSerializer serializer(...);
}
