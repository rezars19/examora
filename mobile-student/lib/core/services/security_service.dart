import 'package:flutter/services.dart';

class SecurityService {
  static const MethodChannel _channel = MethodChannel('com.examora/security');

  /// Mengaktifkan Kiosk LockTask & FLAG_SECURE (anti screenshot & screen record)
  static Future<bool> enableSecureExamMode() async {
    try {
      await _channel.invokeMethod('enableSecureScreen');
      await _channel.invokeMethod('enableKioskMode');
      return true;
    } on PlatformException catch (e) {
      print('Gagal mengaktifkan mode aman: ${e.message}');
      return false;
    }
  }

  /// Menonaktifkan LockTask & FLAG_SECURE setelah ujian diserahkan atau PIN pengawas
  static Future<bool> disableSecureExamMode() async {
    try {
      await _channel.invokeMethod('disableKioskMode');
      await _channel.invokeMethod('disableSecureScreen');
      return true;
    } on PlatformException catch (e) {
      print('Gagal menonaktifkan mode aman: ${e.message}');
      return false;
    }
  }

  /// Cek apakah LockTask sedang aktif
  static Future<bool> isLockActive() async {
    try {
      final bool isActive = await _channel.invokeMethod('isKioskActive');
      return isActive;
    } on PlatformException catch (_) {
      return false;
    }
  }
}
