import 'dart:async';
import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/services/security_service.dart';
import '../core/theme/app_theme.dart';
import 'exam_result_screen.dart';

class SubmitProcessScreen extends StatefulWidget {
  final String attemptId;
  final String examTitle;

  const SubmitProcessScreen({
    super.key,
    required this.attemptId,
    required this.examTitle,
  });

  @override
  State<SubmitProcessScreen> createState() => _SubmitProcessScreenState();
}

class _SubmitProcessScreenState extends State<SubmitProcessScreen> {
  double _progress = 0.2;
  int _step = 0; // 0 to 3
  double? _score;

  @override
  void initState() {
    super.initState();
    _startProcess();
  }

  Future<void> _startProcess() async {
    // Step 0: Uploading answers
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() {
      _progress = 0.45;
      _step = 1;
    });

    // Step 1: Send API submit call
    final res = await ApiService.submitExam(attemptId: widget.attemptId);
    if (!mounted) return;
    setState(() {
      _progress = 0.78;
      _step = 2;
    });

    if (res.data != null && res.data!['score'] != null) {
      _score = (res.data!['score'] as num).toDouble();
    }

    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;
    setState(() {
      _progress = 1.0;
      _step = 3;
    });

    // Unlock Kiosk Exam Mode
    await SecurityService.disableSecureExamMode();

    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => ExamResultScreen(
          examTitle: widget.examTitle,
          score: _score,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Glowing Cloud Upload Icon
              Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.bgCard,
                  border: Border.all(color: AppTheme.cyanAccent.withValues(alpha: 0.4), width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.cyanAccent.withValues(alpha: 0.25),
                      blurRadius: 40,
                      spreadRadius: 6,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.cloud_upload_rounded,
                  size: 64,
                  color: AppTheme.cyanAccent,
                ),
              ),
              const SizedBox(height: 32),

              const Text(
                'Mengumpulkan Jawaban',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Mohon tetap di aplikasi hingga proses selesai.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 32),

              // Progress Bar with Percentage
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Proses', style: TextStyle(color: AppTheme.textSubtle, fontSize: 12)),
                  Text('${(_progress * 100).toInt()}%',
                      style: const TextStyle(color: AppTheme.cyanAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: _progress,
                  minHeight: 8,
                  backgroundColor: AppTheme.bgCard,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.cyanAccent),
                ),
              ),
              const SizedBox(height: 36),

              // Checklist Steps Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Column(
                  children: [
                    _buildStepRow('Mengunggah lembar jawaban', _step >= 1),
                    const SizedBox(height: 14),
                    _buildStepRow('Memverifikasi integritas data', _step >= 2),
                    const SizedBox(height: 14),
                    _buildStepRow('Menyimpan hasil ujian ke server', _step >= 3),
                    const SizedBox(height: 14),
                    _buildStepRow('Proses pengumpulan selesai', _step >= 3),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepRow(String text, bool isDone) {
    return Row(
      children: [
        Icon(
          isDone ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
          color: isDone ? AppTheme.successGreen : AppTheme.textSubtle,
          size: 20,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: isDone ? Colors.white : AppTheme.textSubtle,
              fontWeight: isDone ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ],
    );
  }
}
