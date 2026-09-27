import 'package:flutter_test/flutter_test.dart';
import 'package:examora_student/main.dart';

void main() {
  testWidgets('Examora student smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ExamoraApp());
    expect(find.text('Examora Siswa'), findsOneWidget);
  });
}
