class OptionModel {
  final String id;
  final String text;

  OptionModel({required this.id, required this.text});

  factory OptionModel.fromJson(Map<String, dynamic> json) {
    return OptionModel(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
    );
  }
}

class QuestionModel {
  final String id;
  final String type; // SINGLE_CHOICE, MULTIPLE_CHOICE, ESSAY
  final String content;
  final String? mediaUrl;
  final double points;
  final List<OptionModel> options;

  QuestionModel({
    required this.id,
    required this.type,
    required this.content,
    this.mediaUrl,
    required this.points,
    required this.options,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    var opts = <OptionModel>[];
    if (json['options'] != null && json['options'] is List) {
      opts = (json['options'] as List)
          .map((o) => OptionModel.fromJson(o))
          .toList();
    }

    return QuestionModel(
      id: json['id'] ?? '',
      type: json['type'] ?? 'SINGLE_CHOICE',
      content: json['content'] ?? '',
      mediaUrl: json['mediaUrl'],
      points: (json['points'] as num?)?.toDouble() ?? 1.0,
      options: opts,
    );
  }
}

class StudentAnswerState {
  final String questionId;
  List<String> selectedOptionIds;
  String? essayText;
  bool isDoubtful;

  StudentAnswerState({
    required this.questionId,
    List<String>? selectedOptionIds,
    this.essayText,
    this.isDoubtful = false,
  }) : selectedOptionIds = selectedOptionIds ?? [];
}
