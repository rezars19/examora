import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/services/security_service.dart';
import '../core/theme/app_theme.dart';
import '../models/exam_model.dart';
import '../models/question_model.dart';
import 'exam_runner_screen.dart';

class SecurityCheckScreen extends StatefulWidget {
  final ExamModel exam;

  const SecurityCheckScreen({super.key, required this.exam});

  @override
  State<SecurityCheckScreen> createState() => _SecurityCheckScreenState();
}

class _SecurityCheckScreenState extends State<SecurityCheckScreen> {
  bool _agreed = true;
  bool _isChecking = false;

  void _showTokenInput() {
    final tokenController = TextEditingController();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: AppTheme.bgCard,
        title: const Row(
          children: [
            Icon(Icons.key_rounded, color: AppTheme.cyanAccent),
            SizedBox(width: 10),
            Text('Masukkan Token Ujian', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Mintalah 6 digit token ujian kepada Pengawas di ruangan Anda.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: tokenController,
              textCapitalization: TextCapitalization.characters,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 4),
              decoration: const InputDecoration(
                hintText: 'TOKEN',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              final token = tokenController.text.trim();
              if (token.isEmpty) return;
              Navigator.pop(ctx);
              _executeStartExam(token);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.cyanAccent,
              foregroundColor: AppTheme.bgDark,
            ),
            child: const Text('Mulai Ujian', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _executeStartExam(String token) async {
    setState(() => _isChecking = true);

    final res = await ApiService.startExam(examId: widget.exam.id, token: token);
    if (!mounted) return;
    setState(() => _isChecking = false);

    if (!res.success || res.data == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.message),
          backgroundColor: AppTheme.dangerRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final data = res.data!;
    final attemptId = data['attemptId'] as String;
    final serverEndTime = DateTime.parse(data['serverEndTime'] as String);
    final questionsRaw = data['questions'] as List;
    final questions = questionsRaw.map((q) => QuestionModel.fromJson(q)).toList();

    final savedAnswers = <String, StudentAnswerState>{};
    if (data['savedAnswers'] != null) {
      for (final a in data['savedAnswers'] as List) {
        final qid = a['questionId'] as String;
        final opts = (a['selectedOptionIds'] as List).cast<String>();
        savedAnswers[qid] = StudentAnswerState(
          questionId: qid,
          selectedOptionIds: opts,
          essayText: a['essayText'],
          isDoubtful: a['isDoubtful'] ?? false,
        );
      }
    }

    // Aktifkan Lock Task Kiosk & FLAG_SECURE
    await SecurityService.enableSecureExamMode();

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ExamRunnerScreen(
            attemptId: attemptId,
            examTitle: widget.exam.title,
            questions: questions,
            serverEndTime: serverEndTime,
            initialAnswers: savedAnswers,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: Column(
            children: [
              const SizedBox(height: 10),
              const Text(
                'Pemeriksaan Perangkat',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 24),

              // Shield Illustration Container
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.bgCard,
                  border: Border.all(color: AppTheme.cyanAccent.withValues(alpha: 0.3), width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.cyanAccent.withValues(alpha: 0.15),
                      blurRadius: 30,
                      spreadRadius: 4,
                    ),
                  ],
                ),
                child: const Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(Icons.phone_android_rounded, size: 68, color: AppTheme.textMuted),
                    Positioned(
                      bottom: 24,
                      right: 24,
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: AppTheme.successGreen,
                        child: Icon(Icons.check_rounded, color: Colors.white, size: 22),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 36),

              // Checklist Items
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Column(
                  children: [
                    _buildChecklistRow('Perangkat kompatibel & aman'),
                    const SizedBox(height: 14),
                    _buildChecklistRow('Tidak ada aplikasi mencurigakan'),
                    const SizedBox(height: 14),
                    _buildChecklistRow('Koneksi internet terhubung stabil'),
                    const SizedBox(height: 14),
                    _buildChecklistRow('Mode ujian siap dikunci otomatis'),
                  ],
                ),
              ),
              const Spacer(),

              // Agreement Checkbox
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 24,
                    height: 24,
                    child: Checkbox(
                      value: _agreed,
                      activeColor: AppTheme.cyanAccent,
                      checkColor: AppTheme.bgDark,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      side: const BorderSide(color: AppTheme.borderDark),
                      onChanged: (v) => setState(() => _agreed = v ?? false),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Saya sudah membaca dan memahami seluruh aturan ujian yang berlaku.',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.4),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // CTA Button "Masuk ke Mode Ujian"
              Container(
                width: double.infinity,
                height: 52,
                decoration: BoxDecoration(
                  gradient: _agreed ? AppTheme.cyanGradient : null,
                  color: _agreed ? null : AppTheme.bgCardLight,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: _agreed
                      ? [
                          BoxShadow(
                            color: AppTheme.cyanAccent.withValues(alpha: 0.35),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : null,
                ),
                child: ElevatedButton(
                  onPressed: (_agreed && !_isChecking) ? _showTokenInput : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    foregroundColor: AppTheme.bgDark,
                  ),
                  child: _isChecking
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.2, color: AppTheme.bgDark),
                        )
                      : const Text(
                          'Masuk ke Mode Ujian',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.bgDark),
                        ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChecklistRow(String text) {
    return Row(
      children: [
        const Icon(Icons.check_circle_rounded, color: AppTheme.successGreen, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }
}
