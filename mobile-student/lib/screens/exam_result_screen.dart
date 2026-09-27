import 'package:flutter/material.dart';
import 'exam_list_screen.dart';

class ExamResultScreen extends StatelessWidget {
  final String examTitle;
  final double? score;

  const ExamResultScreen({super.key, required this.examTitle, this.score});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hasil Ujian'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.check_circle_outline,
                size: 96,
                color: Colors.green,
              ),
              const SizedBox(height: 20),
              const Text(
                'Ujian Berhasil Diserahkan!',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                examTitle,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 24),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Column(
                  children: [
                    const Text('Nilai Anda', style: TextStyle(fontSize: 14, color: Colors.black54)),
                    const SizedBox(height: 8),
                    Text(
                      score != null ? score!.toStringAsFixed(1) : '-',
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: Colors.green.shade800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const ExamListScreen()),
                    (route) => false,
                  );
                },
                icon: const Icon(Icons.home),
                label: const Text('Kembali ke Daftar Ujian'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
