import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';
import '../core/services/security_service.dart';
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
        title: Text('Mulai Ujian: ${exam.title}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mata Pelajaran: ${exam.subjectName}'),
            Text('Durasi: ${exam.durationMinutes} Menit'),
            const SizedBox(height: 16),
            const Text(
              'PERINGATAN: Memulai ujian akan mengunci perangkat dalam Secure Exam Mode. Tombol navigasi dan tangkapan layar akan dimatikan.',
              style: TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: tokenController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Ketik Token Ujian (6 Karakter)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.key),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () async {
              final token = tokenController.text.trim();
              if (token.isEmpty) return;

              Navigator.pop(ctx);
              _startExamSession(exam, token);
            },
            child: const Text('Mulai Sekarang'),
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
        SnackBar(content: Text(res.message), backgroundColor: Colors.red.shade700),
      );
      return;
    }

    final data = res.data!;
    final attemptId = data['attemptId'] as String;
    final serverEndTime = DateTime.parse(data['serverEndTime'] as String);
    final questionsRaw = data['questions'] as List;
    final questions = questionsRaw.map((q) => QuestionModel.fromJson(q)).toList();

    // Map saved answers if reconnecting
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
      appBar: AppBar(
        title: const Text('Daftar Ujian'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16.0),
                children: [
                  if (_user != null)
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      color: Colors.blue.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 26,
                              backgroundColor: Colors.blue.shade700,
                              child: const Icon(Icons.person, color: Colors.white, size: 28),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _user!['fullName'] ?? 'Siswa',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                  Text('NISN: ${_user!['identifier'] ?? '-'}'),
                                  if (_user!['className'] != null)
                                    Text('Kelas: ${_user!['className']}'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  const Text(
                    'Jadwal Ujian Aktif',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  if (_exams.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: Text(
                          'Belum ada jadwal ujian aktif untuk kelas Anda.',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    )
                  else
                    ..._exams.map((exam) {
                      final isSubmitted = exam.attemptStatus == 'SUBMITTED' || exam.attemptStatus == 'FORCE_SUBMITTED';
                      final isBlocked = exam.attemptStatus == 'BLOCKED';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 1,
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          title: Text(
                            exam.title,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text('Mapel: ${exam.subjectName} • Durasi: ${exam.durationMinutes}m'),
                              const SizedBox(height: 6),
                              if (isSubmitted)
                                Text(
                                  'Selesai • Nilai: ${exam.score ?? "Terkirim"}',
                                  style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
                                )
                              else if (isBlocked)
                                const Text(
                                  'Terkunci (Pelanggaran). Hubungi Pengawas.',
                                  style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                                )
                              else
                                Text(
                                  'Batas: ${exam.endTime.hour.toString().padLeft(2, '0')}:${exam.endTime.minute.toString().padLeft(2, '0')}',
                                  style: const TextStyle(color: Colors.blue),
                                ),
                            ],
                          ),
                          trailing: isSubmitted
                              ? const Icon(Icons.check_circle, color: Colors.green)
                              : isBlocked
                                  ? const Icon(Icons.lock, color: Colors.red)
                                  : ElevatedButton(
                                      onPressed: () => _showTokenDialog(exam),
                                      child: const Text('Mulai'),
                                    ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
