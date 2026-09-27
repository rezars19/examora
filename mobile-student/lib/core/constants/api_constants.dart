class ApiConstants {
  // URL backend domain resmi Examora
  static String baseUrl = 'http://admin-examora.rzdigital.my.id/api';

  // Endpoints Auth
  static String get login => '$baseUrl/auth/login';
  static String get registerStudent => '$baseUrl/auth/register-student';
  static String get schools => '$baseUrl/auth/schools';
  static String classes(String schoolId) => '$baseUrl/auth/schools/$schoolId/classes';
  static String get me => '$baseUrl/auth/me';

  // Endpoints Exam
  static String get studentAvailableExams => '$baseUrl/exams/student/available';
  static String get startExam => '$baseUrl/exams/student/start';
  static String studentAnswer(String attemptId) => '$baseUrl/exams/student/attempts/$attemptId/answer';
  static String studentLog(String attemptId) => '$baseUrl/exams/student/attempts/$attemptId/log';
  static String bypassPin(String attemptId) => '$baseUrl/exams/student/attempts/$attemptId/bypass-pin';
  static String submitExam(String attemptId) => '$baseUrl/exams/student/attempts/$attemptId/submit';
}
