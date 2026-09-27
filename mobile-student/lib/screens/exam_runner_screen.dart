import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';
import '../core/services/security_service.dart';
import '../models/question_model.dart';
import '../widgets/proctor_pin_dialog.dart';
import '../widgets/question_nav_sheet.dart';
import 'exam_result_screen.dart';

class ExamRunnerScreen extends StatefulWidget {
  final String attemptId;
  final String examTitle;
  final List<QuestionModel> questions;
  final DateTime serverEndTime;
  final Map<String, StudentAnswerState> initialAnswers;

  const ExamRunnerScreen({
    super.key,
    required this.attemptId,
    required this.examTitle,
    required this.questions,
    required this.serverEndTime,
    required this.initialAnswers,
  });

  @override
  State<ExamRunnerScreen> createState() => _ExamRunnerScreenState();
}

class _ExamRunnerScreenState extends State<ExamRunnerScreen> with WidgetsBindingObserver {
  int _currentIndex = 0;
  late Map<String, StudentAnswerState> _answers;
  late Timer _countdownTimer;
  Duration _remainingTime = Duration.zero;

  bool _isSubmitting = false;
  bool _isBlocked = false;
  int _violationCount = 0;

  // Debouncer untuk autosave ke backend
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _answers = Map<String, StudentAnswerState>.from(widget.initialAnswers);

    // Pastikan setiap soal memiliki state jawaban di memori
    for (final q in widget.questions) {
      _answers.putIfAbsent(q.id, () => StudentAnswerState(questionId: q.id));
    }

    _calculateRemainingTime();
    _startCountdown();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _countdownTimer.cancel();
    _debounceTimer?.cancel();
    super.dispose();
  }

  // --- 1. DETEKSI KELUAR APLIKASI / SPLIT SCREEN / HOME ---
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _handleViolationEvent('APP_BACKGROUND');
    }
  }

  Future<void> _handleViolationEvent(String eventType) async {
    final res = await ApiService.logViolation(
      attemptId: widget.attemptId,
      eventType: eventType,
      payload: {'timestamp': DateTime.now().toIso8601String()},
    );

    if (res != null && mounted) {
      setState(() {
        _violationCount = res['violationCount'] ?? (_violationCount + 1);
        if (res['isBlocked'] == true) {
          _isBlocked = true;
        }
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'PERINGATAN! Keluar dari aplikasi tercatat sebagai pelanggaran ($_violationCount).',
          ),
          backgroundColor: Colors.red.shade800,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  // --- 2. TIMER SERVER COUNTDOWN ---
  void _calculateRemainingTime() {
    final now = DateTime.now();
    if (widget.serverEndTime.isAfter(now)) {
      _remainingTime = widget.serverEndTime.difference(now);
    } else {
      _remainingTime = Duration.zero;
    }
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_remainingTime.inSeconds <= 1) {
        timer.cancel();
        setState(() => _remainingTime = Duration.zero);
        _handleTimeExpired();
      } else {
        setState(() {
          _remainingTime = _remainingTime - const Duration(seconds: 1);
        });
      }
    });
  }

  void _handleTimeExpired() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Waktu ujian telah habis! Mengirimkan jawaban otomatis...'),
        backgroundColor: Colors.orange,
      ),
    );
    _submitExam(autoSubmit: true);
  }

  String _formatDuration(Duration d) {
    final hours = d.inHours.toString().padLeft(2, '0');
    final minutes = (d.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  // --- 3. AUTOSAVE JAWABAN KE SERVER ---
  void _onAnswerChanged(String questionId, List<String> selectedOptionIds, {String? essayText}) {
    setState(() {
      final current = _answers[questionId]!;
      current.selectedOptionIds = selectedOptionIds;
      if (essayText != null) current.essayText = essayText;
    });

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      final current = _answers[questionId]!;
      ApiService.saveAnswer(
        attemptId: widget.attemptId,
        questionId: questionId,
        selectedOptionIds: current.selectedOptionIds,
        essayText: current.essayText,
        isDoubtful: current.isDoubtful,
      );
    });
  }

  void _toggleDoubtful(String questionId) {
    setState(() {
      final current = _answers[questionId]!;
      current.isDoubtful = !current.isDoubtful;
    });

    final current = _answers[questionId]!;
    ApiService.saveAnswer(
      attemptId: widget.attemptId,
      questionId: questionId,
      selectedOptionIds: current.selectedOptionIds,
      essayText: current.essayText,
      isDoubtful: current.isDoubtful,
    );
  }

  // --- 4. SUBMIT UJIAN ---
  Future<void> _submitExam({bool autoSubmit = false}) async {
    if (!autoSubmit) {
      int answered = 0;
      int doubtful = 0;
      for (final a in _answers.values) {
        if (a.isDoubtful) doubtful++;
        if (a.selectedOptionIds.isNotEmpty || (a.essayText != null && a.essayText!.isNotEmpty)) {
          answered++;
        }
      }

      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Kumpulkan Ujian?'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Total Soal: ${widget.questions.length}'),
              Text('Sudah Dijawab: $answered', style: const TextStyle(color: Colors.green)),
              Text('Ragu-ragu: $doubtful', style: TextStyle(color: Colors.amber.shade800)),
              Text('Belum Dijawab: ${widget.questions.length - answered}', style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
              const Text('Setelah dikumpulkan, Anda tidak dapat mengubah jawaban lagi.'),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Periksa Lagi')),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text('Ya, Kumpulkan', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );

      if (confirm != true) return;
    }

    setState(() => _isSubmitting = true);

    final res = await ApiService.submitExam(attemptId: widget.attemptId);

    // Lepas Kiosk LockTask & FLAG_SECURE
    await SecurityService.disableSecureExamMode();

    if (mounted) {
      setState(() => _isSubmitting = false);
      final score = res.data != null ? (res.data!['score'] as num?)?.toDouble() : null;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ExamResultScreen(
            examTitle: widget.examTitle,
            score: score,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isBlocked) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.block, size: 80, color: Colors.red),
                const SizedBox(height: 16),
                const Text(
                  'Ujian Diblokir',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Batas pelanggaran terlampaui ($_violationCount kali keluar aplikasi). Hubungi Pengawas untuk membuka sesi Anda.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => ProctorPinDialog(attemptId: widget.attemptId),
                    );
                  },
                  icon: const Icon(Icons.pin),
                  label: const Text('Input PIN Pengawas'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currentQuestion = widget.questions[_currentIndex];
    final currentAnswer = _answers[currentQuestion.id]!;
    final isLast = _currentIndex == widget.questions.length - 1;

    return PopScope(
      canPop: false, // Blokir tombol back Android
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Tombol kembali dinonaktifkan selama ujian.')),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: Text(
            'Soal ${_currentIndex + 1}/${widget.questions.length}',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          actions: [
            // Timer Badge
            Container(
              margin: const EdgeInsets.symmetric(vertical: 10),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: _remainingTime.inMinutes < 5 ? Colors.red.shade100 : Colors.blue.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
              alignment: Alignment.center,
              child: Row(
                children: [
                  Icon(
                    Icons.timer,
                    size: 16,
                    color: _remainingTime.inMinutes < 5 ? Colors.red.shade800 : Colors.blue.shade800,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDuration(_remainingTime),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: _remainingTime.inMinutes < 5 ? Colors.red.shade800 : Colors.blue.shade800,
                    ),
                  ),
                ],
              ),
            ),
            // Tombol PIN Pengawas Darurat
            IconButton(
              icon: const Icon(Icons.key, color: Colors.amber),
              tooltip: 'PIN Pengawas',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => ProctorPinDialog(attemptId: widget.attemptId),
                );
              },
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: _isSubmitting
            ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Menghitung nilai & menyerahkan ujian...'),
                  ],
                ),
              )
            : Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Teks Soal
                          Text(
                            currentQuestion.content,
                            style: const TextStyle(fontSize: 16, height: 1.5, fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 16),

                          // Gambar Soal jika ada
                          if (currentQuestion.mediaUrl != null && currentQuestion.mediaUrl!.isNotEmpty) ...[
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: CachedNetworkImage(
                                imageUrl: currentQuestion.mediaUrl!.startsWith('http')
                                    ? currentQuestion.mediaUrl!
                                    : '${ApiConstants.baseUrl.replaceAll("/api", "")}${currentQuestion.mediaUrl}',
                                placeholder: (context, url) => const SizedBox(
                                  height: 150,
                                  child: Center(child: CircularProgressIndicator()),
                                ),
                                errorWidget: (context, url, error) => Container(
                                  height: 100,
                                  color: Colors.grey.shade200,
                                  child: const Center(child: Text('Gambar tidak dapat dimuat.')),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          const Divider(),
                          const SizedBox(height: 8),

                          // Pilihan Jawaban
                          if (currentQuestion.type == 'SINGLE_CHOICE') ...[
                            ...currentQuestion.options.map((opt) {
                              final isSelected = currentAnswer.selectedOptionIds.contains(opt.id);
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  side: BorderSide(
                                    color: isSelected ? Colors.blue : Colors.grey.shade300,
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: RadioListTile<String>(
                                  value: opt.id,
                                  groupValue: currentAnswer.selectedOptionIds.isNotEmpty
                                      ? currentAnswer.selectedOptionIds.first
                                      : null,
                                  title: Text(opt.text),
                                  onChanged: (val) {
                                    if (val != null) {
                                      _onAnswerChanged(currentQuestion.id, [val]);
                                    }
                                  },
                                ),
                              );
                            }),
                          ] else if (currentQuestion.type == 'MULTIPLE_CHOICE') ...[
                            ...currentQuestion.options.map((opt) {
                              final isSelected = currentAnswer.selectedOptionIds.contains(opt.id);
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  side: BorderSide(
                                    color: isSelected ? Colors.blue : Colors.grey.shade300,
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: CheckboxListTile(
                                  value: isSelected,
                                  title: Text(opt.text),
                                  onChanged: (checked) {
                                    final list = List<String>.from(currentAnswer.selectedOptionIds);
                                    if (checked == true) {
                                      list.add(opt.id);
                                    } else {
                                      list.remove(opt.id);
                                    }
                                    _onAnswerChanged(currentQuestion.id, list);
                                  },
                                ),
                              );
                            }),
                          ] else ...[
                            TextField(
                              maxLines: 6,
                              decoration: const InputDecoration(
                                hintText: 'Ketik jawaban esai Anda di sini...',
                                border: OutlineInputBorder(),
                              ),
                              controller: TextEditingController(text: currentAnswer.essayText)
                                ..selection = TextSelection.collapsed(
                                  offset: (currentAnswer.essayText ?? '').length,
                                ),
                              onChanged: (txt) {
                                _onAnswerChanged(currentQuestion.id, [], essayText: txt);
                              },
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),

                  // Bottom Control Bar
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          offset: const Offset(0, -2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Soal Sebelumnya
                        ElevatedButton(
                          onPressed: _currentIndex > 0
                              ? () => setState(() => _currentIndex--)
                              : null,
                          child: const Text('Sebelumnya'),
                        ),

                        // Tombol Ragu-ragu
                        OutlinedButton.icon(
                          onPressed: () => _toggleDoubtful(currentQuestion.id),
                          icon: Icon(
                            currentAnswer.isDoubtful ? Icons.check_circle : Icons.help_outline,
                            color: currentAnswer.isDoubtful ? Colors.amber.shade800 : Colors.grey,
                            size: 18,
                          ),
                          label: Text(
                            'Ragu-ragu',
                            style: TextStyle(
                              color: currentAnswer.isDoubtful ? Colors.amber.shade800 : Colors.grey,
                              fontWeight: currentAnswer.isDoubtful ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ),

                        // Soal Selanjutnya atau Selesai
                        if (!isLast)
                          ElevatedButton(
                            onPressed: () => setState(() => _currentIndex++),
                            child: const Text('Selanjutnya'),
                          )
                        else
                          ElevatedButton(
                            onPressed: () => _submitExam(),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                            child: const Text('Selesai', style: TextStyle(color: Colors.white)),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
        bottomNavigationBar: BottomAppBar(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (_) => QuestionNavSheet(
                      questions: widget.questions,
                      answers: _answers,
                      currentIndex: _currentIndex,
                      onSelectQuestion: (idx) {
                        setState(() => _currentIndex = idx);
                      },
                    ),
                  );
                },
                icon: const Icon(Icons.grid_view),
                label: const Text('Daftar Soal'),
              ),
              ElevatedButton(
                onPressed: () => _submitExam(),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                child: const Text('Kumpulkan', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
