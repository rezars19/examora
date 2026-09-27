class SchoolModel {
  final String id;
  final String code;
  final String name;

  SchoolModel({required this.id, required this.code, required this.name});

  factory SchoolModel.fromJson(Map<String, dynamic> json) {
    return SchoolModel(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
    );
  }
}
