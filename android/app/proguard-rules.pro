# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-screens & gesture-handler
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Razorpay
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-optimizations !class/merging/vertical*,!class/merging/horizontal*
-keepclasseswithmembers class * {
    public void onPayment*(...);
}

# Google Sign-In & Play Services
-keep class com.google.android.gms.auth.api.signin.** { *; }
-dontwarn com.google.android.gms.**

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }
