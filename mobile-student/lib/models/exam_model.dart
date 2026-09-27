class ExamModel {
  final String id;
  final String title;
  final String? description;
  final String subjectName;
  final int durationMinutes;
  final DateTime startTime;
  final DateTime endTime;
  final String? attemptStatus;
  final double? score;

  ExamModel({
    required this.id,
    required this.title,
    this.description,
    required this.subjectName,
    required this.durationMinutes,
    required this.startTime,
    required this.endTime,
    this.attemptStatus,
    this.score,
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    String? status;
    double? sc;
    if (json['attempts'] != null && (json['attempts'] as List).isNotEmpty) {
      status = json['attempts'][0]['status'];
      sc = json['attempts'][0]['score'] != null
          ? (json['attempts'][0]['score'] as num).toDouble()
          : null;
    }

    return ExamModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      subjectName: json['subject'] != null ? json['subject']['name'] ?? '' : '',
      durationMinutes: json['durationMinutes'] ?? 0,
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      attemptStatus: status,
      score: sc,
    );
  }
}
