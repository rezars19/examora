import 'package:flutter/material.dart';
import 'core/services/storage_service.dart';
import 'screens/login_screen.dart';
import 'screens/exam_list_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final token = await StorageService.getToken();

  runApp(ExamoraApp(initialToken: token));
}

class ExamoraApp extends StatelessWidget {
  final String? initialToken;

  const ExamoraApp({super.key, this.initialToken});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Examora Siswa',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E40AF)),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          elevation: 0,
        ),
      ),
      home: initialToken != null && initialToken!.isNotEmpty
          ? const ExamListScreen()
          : const LoginScreen(),
    );
  }
}
