import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _keyToken = 'auth_token';
  static const String _keyUser = 'auth_user';
  static const String _keyServerUrl = 'server_base_url';

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  static Future<void> saveUser(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(userData));
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(_keyUser);
    if (userStr == null) return null;
    return jsonDecode(userStr);
  }

  static Future<void> saveServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyServerUrl, url);
  }

  static Future<String?> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyServerUrl);
  }

  static Future<void> clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    await prefs.remove(_keyUser);
  }
}
