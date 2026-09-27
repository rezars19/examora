import 'package:flutter/services.dart';

class SecurityService {
  static const MethodChannel _channel = MethodChannel('com.examora/security');

  /// Mengaktifkan Kiosk LockTask & FLAG_SECURE (anti screenshot & screen record)
  static Future<bool> enableSecureExamMode() async {
    try {
      await _channel.invokeMethod('enableSecureScreen');
      await _channel.invokeMethod('enableKioskMode');
      return true;
    } catch (e) {
      print('Mode aman dilewati di platform ini (Web/Desktop): $e');
      return false;
    }
  }

  /// Menonaktifkan LockTask & FLAG_SECURE setelah ujian diserahkan atau PIN pengawas
  static Future<bool> disableSecureExamMode() async {
    try {
      await _channel.invokeMethod('disableKioskMode');
      await _channel.invokeMethod('disableSecureScreen');
      return true;
    } catch (e) {
      print('Gagal menonaktifkan mode aman: $e');
      return false;
    }
  }

  /// Cek apakah LockTask sedang aktif
  static Future<bool> isLockActive() async {
    try {
      final bool isActive = await _channel.invokeMethod('isKioskActive');
      return isActive;
    } catch (_) {
      return false;
    }
  }
}
