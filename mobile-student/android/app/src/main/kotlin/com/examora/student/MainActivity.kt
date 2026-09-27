package com.examora.student

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.examora/security"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "enableKioskMode" -> {
                    try {
                        startLockTask()
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("LOCK_TASK_ERROR", e.message, null)
                    }
                }
                "disableKioskMode" -> {
                    try {
                        stopLockTask()
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("STOP_LOCK_TASK_ERROR", e.message, null)
                    }
                }
                "enableSecureScreen" -> {
                    try {
                        window.setFlags(
                            WindowManager.LayoutParams.FLAG_SECURE,
                            WindowManager.LayoutParams.FLAG_SECURE
                        )
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("FLAG_SECURE_ERROR", e.message, null)
                    }
                }
                "disableSecureScreen" -> {
                    try {
                        window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("FLAG_SECURE_CLEAR_ERROR", e.message, null)
                    }
                }
                "isKioskActive" -> {
                    val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
                    val isActive = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        activityManager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
                    } else {
                        false
                    }
                    result.success(isActive)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }
}
