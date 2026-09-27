import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';
import '../core/services/security_service.dart';
import '../core/theme/app_theme.dart';
import '../models/exam_model.dart';
import '../models/question_model.dart';
import 'login_screen.dart';
import 'exam_runner_screen.dart';

class ExamListScreen extends StatefulWidget {
  const ExamListScreen({super.key});

  @override
  State<ExamListScreen> createState() => _ExamListScreenState();
}

class _ExamListScreenState extends State<ExamListScreen> {
  List<ExamModel> _exams = [];
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final user = await StorageService.getUser();
    final exams = await ApiService.getAvailableExams();
    if (mounted) {
      setState(() {
        _user = user;
        _exams = exams;
        _isLoading = false;
      });
    }
  }

  void _showTokenDialog(ExamModel exam) {
    final tokenController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.vpn_key_rounded, color: AppTheme.royalBlue, size: 20),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Konfirmasi Token Ujian',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    exam.title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Mata Pelajaran: ${exam.subjectName} • Durasi: ${exam.durationMinutes} Menit',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Warning Notice
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Perangkat akan terkunci dalam Mode Ujian Aman. Tombol navigasi dan screenshot dinonaktifkan.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF991B1B), height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: tokenController,
              textCapitalization: TextCapitalization.characters,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 4),
              decoration: const InputDecoration(
                labelText: 'Ketik Token Ujian',
                hintText: '6 KARAKTER',
                alignLabelWithHint: true,
                prefixIcon: Icon(Icons.key_outlined),
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
              _startExamSession(exam, token);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.royalBlue,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Mulai Ujian Sekarang', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _startExamSession(ExamModel exam, String token) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    final res = await ApiService.startExam(examId: exam.id, token: token);
    if (!mounted) return;
    Navigator.pop(context); // Close loading dialog

    if (!res.success || res.data == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.message),
          backgroundColor: const Color(0xFFEF4444),
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

    // Aktifkan Secure Exam Mode (LockTask + FLAG_SECURE)
    await SecurityService.enableSecureExamMode();

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ExamRunnerScreen(
            attemptId: attemptId,
            examTitle: exam.title,
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
      backgroundColor: AppTheme.bgLight,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: CustomScrollView(
                slivers: [
                  // App Bar with Student Profile Card
                  SliverToBoxAdapter(
                    child: Container(
                      padding: EdgeInsets.only(
                        top: MediaQuery.of(context).padding.top + 16,
                        bottom: 24,
                        left: 20,
                        right: 20,
                      ),
                      decoration: const BoxDecoration(
                        gradient: AppTheme.heroGradient,
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(28),
                          bottomRight: Radius.circular(28),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Top bar row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Image.asset(
                                'assets/images/logo.png',
                                height: 38,
                                fit: BoxFit.contain,
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                                    onPressed: _loadData,
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.logout_rounded, color: Colors.white),
                                    onPressed: () async {
                                      await StorageService.clearAuth();
                                      if (mounted) {
                                        Navigator.pushReplacement(
                                          context,
                                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                                        );
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // Profile Banner
                          Row(
                            children: [
                              Container(
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  gradient: AppTheme.cyanGradient,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppTheme.royalBlue.withOpacity(0.4),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  (_user?['fullName'] != null && _user!['fullName'].toString().isNotEmpty)
                                      ? _user!['fullName'][0].toUpperCase()
                                      : 'S',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _user?['fullName'] ?? 'Siswa Examora',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            'NISN: ${_user?['identifier'] ?? '-'}',
                                            style: const TextStyle(color: Colors.white70, fontSize: 11),
                                          ),
                                        ),
                                        if (_user?['className'] != null) ...[
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppTheme.cyanAccent.withOpacity(0.25),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              '${_user?['className']}',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Section Title
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 24, left: 20, right: 20, bottom: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Jadwal Ujian Aktif',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textMain,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${_exams.length} Ujian',
                              style: const TextStyle(
                                color: AppTheme.royalBlue,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Exam Cards List
                  if (_exams.isEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(Icons.assignment_turned_in_outlined, size: 64, color: Colors.grey.shade300),
                              const SizedBox(height: 16),
                              const Text(
                                'Tidak Ada Jadwal Ujian Aktif',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Jadwal ujian kelas Anda akan muncul di sini saat dirilis oleh guru.',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 13, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final exam = _exams[index];
                            final isSubmitted = exam.attemptStatus == 'SUBMITTED' || exam.attemptStatus == 'FORCE_SUBMITTED';
                            final isBlocked = exam.attemptStatus == 'BLOCKED';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppTheme.borderLight),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.03),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Subject Chip & Time Range
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEFF6FF),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          exam.subjectName,
                                          style: const TextStyle(
                                            color: AppTheme.royalBlue,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      Row(
                                        children: [
                                          const Icon(Icons.timer_outlined, size: 14, color: AppTheme.textMuted),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${exam.durationMinutes} Menit',
                                            style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),

                                  // Exam Title
                                  Text(
                                    exam.title,
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textMain,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  const Divider(height: 1, color: AppTheme.borderLight),
                                  const SizedBox(height: 16),

                                  // Status & Action Row
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      if (isSubmitted) ...[
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFECFDF5),
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(color: const Color(0xFFA7F3D0)),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.check_circle, color: Color(0xFF059669), size: 16),
                                              const SizedBox(width: 6),
                                              Text(
                                                'Selesai • Nilai: ${exam.score != null ? exam.score!.toStringAsFixed(1) : "Tersimpan"}',
                                                style: const TextStyle(
                                                  color: Color(0xFF059669),
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ] else if (isBlocked) ...[
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFEF2F2),
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(color: const Color(0xFFFECACA)),
                                          ),
                                          child: const Row(
                                            children: [
                                              Icon(Icons.lock_rounded, color: Color(0xFFDC2626), size: 16),
                                              SizedBox(width: 6),
                                              Text(
                                                'Terkunci (Hubungi Pengawas)',
                                                style: TextStyle(
                                                  color: Color(0xFFDC2626),
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ] else ...[
                                        Text(
                                          'Batas: ${exam.endTime.hour.toString().padLeft(2, '0')}:${exam.endTime.minute.toString().padLeft(2, '0')} WIB',
                                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                        ),
                                        ElevatedButton.icon(
                                          onPressed: () => _showTokenDialog(exam),
                                          icon: const Icon(Icons.play_arrow_rounded, size: 18),
                                          label: const Text('Mulai Ujian'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.royalBlue,
                                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                          childCount: _exams.length,
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
