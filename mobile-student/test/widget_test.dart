import 'package:flutter_test/flutter_test.dart';
import 'package:examora_student/main.dart';

void main() {
  testWidgets('Examora student splash screen test', (WidgetTester tester) async {
    await tester.pumpWidget(const ExamoraApp());
    expect(find.text('Secure. Simple. Smarter Examination.'), findsOneWidget);
    await tester.pump(const Duration(seconds: 4));
  });
}
