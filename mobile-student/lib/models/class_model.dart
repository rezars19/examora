class ClassModel {
  final String id;
  final String name;
  final String academicYear;

  ClassModel({required this.id, required this.name, required this.academicYear});

  factory ClassModel.fromJson(Map<String, dynamic> json) {
    return ClassModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      academicYear: json['academicYear'] ?? '',
    );
  }
}
