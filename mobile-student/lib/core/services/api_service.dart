import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import 'storage_service.dart';
import '../../models/school_model.dart';
import '../../models/class_model.dart';
import '../../models/exam_model.dart';

class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;

  ApiResponse({required this.success, required this.message, this.data});
}

class ApiService {
  static Future<Map<String, String>> _getHeaders() async {
    final token = await StorageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // 1. Ambil daftar sekolah aktif untuk registrasi siswa
  static Future<List<SchoolModel>> getSchools() async {
    try {
      final res = await http.get(Uri.parse(ApiConstants.schools));
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        return (json['data'] as List)
            .map((item) => SchoolModel.fromJson(item))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error getSchools: $e');
      return [];
    }
  }

  // 2. Ambil daftar kelas di sekolah terpilih
  static Future<List<ClassModel>> getClasses(String schoolId) async {
    try {
      final res = await http.get(Uri.parse(ApiConstants.classes(schoolId)));
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        return (json['data'] as List)
            .map((item) => ClassModel.fromJson(item))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error getClasses: $e');
      return [];
    }
  }

  // 3. Registrasi mandiri siswa
  static Future<ApiResponse<Map<String, dynamic>>> registerStudent({
    required String schoolId,
    required String classId,
    required String identifier, // NISN
    required String fullName,
    required String password,
  }) async {
    try {
      final res = await http.post(
        Uri.parse(ApiConstants.registerStudent),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'schoolId': schoolId,
          'classId': classId,
          'identifier': identifier,
          'fullName': fullName,
          'password': password,
        }),
      );
      final json = jsonDecode(res.body);
      if (json['success'] == true) {
        final token = json['data']['token'];
        final user = json['data']['user'];
        await StorageService.saveToken(token);
        await StorageService.saveUser(user);
        return ApiResponse(success: true, message: json['message'], data: json['data']);
      }
      return ApiResponse(success: false, message: json['message'] ?? 'Registrasi gagal.');
    } catch (e) {
      return ApiResponse(success: false, message: 'Koneksi ke server gagal: $e');
    }
  }

  // 4. Login Siswa
  static Future<ApiResponse<Map<String, dynamic>>> login({
    required String identifier,
    required String password,
    String? schoolCode,
  }) async {
    try {
      final res = await http.post(
        Uri.parse(ApiConstants.login),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': identifier,
          'password': password,
          if (schoolCode != null && schoolCode.isNotEmpty) 'schoolCode': schoolCode,
        }),
      );
      final json = jsonDecode(res.body);
      if (json['success'] == true) {
        final token = json['data']['token'];
        final user = json['data']['user'];
        await StorageService.saveToken(token);
        await StorageService.saveUser(user);
        return ApiResponse(success: true, message: json['message'], data: json['data']);
      }
      return ApiResponse(success: false, message: json['message'] ?? 'Login gagal.');
    } catch (e) {
      return ApiResponse(success: false, message: 'Koneksi ke server gagal: $e');
    }
  }

  // 5. Ambil Ujian yang Tersedia untuk Kelas Siswa
  static Future<List<ExamModel>> getAvailableExams() async {
    try {
      final headers = await _getHeaders();
      final res = await http.get(Uri.parse(ApiConstants.studentAvailableExams), headers: headers);
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        return (json['data'] as List)
            .map((item) => ExamModel.fromJson(item))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error getAvailableExams: $e');
      return [];
    }
  }

  // 6. Mulai Ujian (Validasi Token, Preload Soal)
  static Future<ApiResponse<Map<String, dynamic>>> startExam({
    required String examId,
    required String token,
  }) async {
    try {
      final headers = await _getHeaders();
      final res = await http.post(
        Uri.parse(ApiConstants.startExam),
        headers: headers,
        body: jsonEncode({
          'examId': examId,
          'token': token.trim().toUpperCase(),
        }),
      );
      final json = jsonDecode(res.body);
      if (json['success'] == true) {
        return ApiResponse(success: true, message: json['message'], data: json['data']);
      }
      return ApiResponse(success: false, message: json['message'] ?? 'Gagal memulai ujian.');
    } catch (e) {
      return ApiResponse(success: false, message: 'Koneksi gagal: $e');
    }
  }

  // 7. Autosave Jawaban Siswa
  static Future<bool> saveAnswer({
    required String attemptId,
    required String questionId,
    required List<String> selectedOptionIds,
    String? essayText,
    bool isDoubtful = false,
  }) async {
    try {
      final headers = await _getHeaders();
      final res = await http.put(
        Uri.parse(ApiConstants.studentAnswer(attemptId)),
        headers: headers,
        body: jsonEncode({
          'questionId': questionId,
          'selectedOptionIds': selectedOptionIds,
          'essayText': essayText,
          'isDoubtful': isDoubtful,
        }),
      );
      final json = jsonDecode(res.body);
      return json['success'] == true;
    } catch (e) {
      print('Autosave error: $e');
      return false;
    }
  }

  // 8. Catat Log Pelanggaran (Background, Home, dll)
  static Future<Map<String, dynamic>?> logViolation({
    required String attemptId,
    required String eventType,
    Map<String, dynamic>? payload,
  }) async {
    try {
      final headers = await _getHeaders();
      final res = await http.post(
        Uri.parse(ApiConstants.studentLog(attemptId)),
        headers: headers,
        body: jsonEncode({
          'eventType': eventType,
          'payload': payload ?? {},
        }),
      );
      return jsonDecode(res.body);
    } catch (e) {
      print('Log violation error: $e');
      return null;
    }
  }

  // 9. Bypass PIN Pengawas
  static Future<ApiResponse<bool>> bypassPin({
    required String attemptId,
    required String pin,
  }) async {
    try {
      final headers = await _getHeaders();
      final res = await http.post(
        Uri.parse(ApiConstants.bypassPin(attemptId)),
        headers: headers,
        body: jsonEncode({'pin': pin.trim()}),
      );
      final json = jsonDecode(res.body);
      return ApiResponse(
        success: json['success'] == true,
        message: json['message'] ?? 'Verifikasi PIN gagal.',
        data: json['success'] == true,
      );
    } catch (e) {
      return ApiResponse(success: false, message: 'Koneksi gagal: $e');
    }
  }

  // 10. Submit Ujian
  static Future<ApiResponse<Map<String, dynamic>>> submitExam({
    required String attemptId,
  }) async {
    try {
      final headers = await _getHeaders();
      final res = await http.post(
        Uri.parse(ApiConstants.submitExam(attemptId)),
        headers: headers,
      );
      final json = jsonDecode(res.body);
      if (json['success'] == true) {
        return ApiResponse(success: true, message: json['message'], data: json['data']);
      }
      return ApiResponse(success: false, message: json['message'] ?? 'Submit gagal.');
    } catch (e) {
      return ApiResponse(success: false, message: 'Koneksi gagal: $e');
    }
  }
}
