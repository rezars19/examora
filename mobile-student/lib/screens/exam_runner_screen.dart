import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';
import '../core/services/security_service.dart';
import '../core/theme/app_theme.dart';
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

  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _answers = Map<String, StudentAnswerState>.from(widget.initialAnswers);

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
            'PERINGATAN! Keluar dari aplikasi dicatat sebagai pelanggaran ($_violationCount).',
          ),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

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
        content: Text('Waktu ujian telah berakhir. Mengirimkan jawaban otomatis...'),
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

  int get _answeredCount {
    int count = 0;
    for (final a in _answers.values) {
      if (a.selectedOptionIds.isNotEmpty || (a.essayText != null && a.essayText!.isNotEmpty)) {
        count++;
      }
    }
    return count;
  }

  Future<void> _submitExam({bool autoSubmit = false}) async {
    if (!autoSubmit) {
      int doubtful = 0;
      for (final a in _answers.values) {
        if (a.isDoubtful) doubtful++;
      }

      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Kumpulkan Lembar Ujian?'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSummaryRow('Total Soal', '${widget.questions.length}', Colors.black87),
              const SizedBox(height: 6),
              _buildSummaryRow('Sudah Dijawab', '$_answeredCount', const Color(0xFF059669)),
              const SizedBox(height: 6),
              _buildSummaryRow('Ragu-ragu', '$doubtful', const Color(0xFFD97706)),
              const SizedBox(height: 6),
              _buildSummaryRow('Belum Dijawab', '${widget.questions.length - _answeredCount}', const Color(0xFFDC2626)),
              const SizedBox(height: 16),
              const Text(
                'Perhatian: Lembar jawaban akan langsung dinilai oleh sistem dan tidak dapat diubah lagi.',
                style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Periksa Kembali'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669)),
              child: const Text('Ya, Kumpulkan Sekarang', style: TextStyle(color: Colors.white)),
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

  Widget _buildSummaryRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 14)),
        Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isBlocked) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFFECACA), width: 2),
                  ),
                  child: const Icon(Icons.lock_rounded, size: 40, color: Color(0xFFDC2626)),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Sesi Ujian Dikunci',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                ),
                const SizedBox(height: 8),
                Text(
                  'Aktivitas keluar aplikasi terdeteksi sebanyak $_violationCount kali. Hubungi Pengawas untuk verifikasi PIN darurat.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.4),
                ),
                const SizedBox(height: 28),
                ElevatedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => ProctorPinDialog(attemptId: widget.attemptId),
                    );
                  },
                  icon: const Icon(Icons.key),
                  label: const Text('Buka Kunci dengan PIN Pengawas'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
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
    final progressFraction = widget.questions.isNotEmpty ? (_answeredCount / widget.questions.length) : 0.0;

    final isUrgentTime = _remainingTime.inMinutes < 5;
    final isWarningTime = _remainingTime.inMinutes < 10 && !isUrgentTime;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Tombol kembali dinonaktifkan dalam mode ujian aman.'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF1F5F9),
        appBar: AppBar(
          automaticallyImplyLeading: false,
          backgroundColor: Colors.white,
          elevation: 0,
          titleSpacing: 16,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.examTitle,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 2),
              Text(
                'Soal ${_currentIndex + 1} dari ${widget.questions.length}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMain),
              ),
            ],
          ),
          actions: [
            // Timer Badge
            Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isUrgentTime
                    ? const Color(0xFFFEF2F2)
                    : isWarningTime
                        ? const Color(0xFFFFFBEB)
                        : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isUrgentTime
                      ? const Color(0xFFFECACA)
                      : isWarningTime
                          ? const Color(0xFFFDE68A)
                          : const Color(0xFFBFDBFE),
                ),
              ),
              alignment: Alignment.center,
              child: Row(
                children: [
                  Icon(
                    Icons.timer_outlined,
                    size: 16,
                    color: isUrgentTime
                        ? const Color(0xFFDC2626)
                        : isWarningTime
                            ? const Color(0xFFD97706)
                            : AppTheme.royalBlue,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _formatDuration(_remainingTime),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: isUrgentTime
                          ? const Color(0xFFDC2626)
                          : isWarningTime
                              ? const Color(0xFFD97706)
                              : AppTheme.royalBlue,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),

            // Proctor Emergency Key
            IconButton(
              icon: const Icon(Icons.key_rounded, color: AppTheme.goldAccent),
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
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(4),
            child: LinearProgressIndicator(
              value: progressFraction,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.cyanAccent),
              minHeight: 4,
            ),
          ),
        ),
        body: _isSubmitting
            ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Menghitung nilai & menyerahkan lembar ujian...'),
                  ],
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Question Card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.borderLight),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Points Pill
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Bobot: ${currentQuestion.points} Poin',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                                ),
                              ),
                              if (currentAnswer.isDoubtful)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Row(
                                    children: [
                                      Icon(Icons.flag_rounded, size: 13, color: Color(0xFFD97706)),
                                      SizedBox(width: 4),
                                      Text(
                                        'Ragu-ragu',
                                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Text Content
                          Text(
                            currentQuestion.content,
                            style: const TextStyle(
                              fontSize: 16,
                              height: 1.6,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.textMain,
                            ),
                          ),

                          // Media Image
                          if (currentQuestion.mediaUrl != null && currentQuestion.mediaUrl!.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: CachedNetworkImage(
                                imageUrl: currentQuestion.mediaUrl!.startsWith('http')
                                    ? currentQuestion.mediaUrl!
                                    : '${ApiConstants.baseUrl.replaceAll("/api", "")}${currentQuestion.mediaUrl}',
                                placeholder: (context, url) => const SizedBox(
                                  height: 160,
                                  child: Center(child: CircularProgressIndicator()),
                                ),
                                errorWidget: (context, url, error) => Container(
                                  height: 100,
                                  color: Colors.grey.shade100,
                                  child: const Center(child: Text('Gambar tidak dapat dimuat.')),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Options List
                    if (currentQuestion.type == 'SINGLE_CHOICE') ...[
                      ...currentQuestion.options.map((opt) {
                        final isSelected = currentAnswer.selectedOptionIds.contains(opt.id);
                        return InkWell(
                          onTap: () => _onAnswerChanged(currentQuestion.id, [opt.id]),
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSelected ? AppTheme.royalBlue : AppTheme.borderLight,
                                width: isSelected ? 1.8 : 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.015),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: isSelected ? AppTheme.royalBlue : const Color(0xFFF1F5F9),
                                    shape: BoxShape.circle,
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    opt.id,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: isSelected ? Colors.white : AppTheme.textMain,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    opt.text,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                      color: isSelected ? AppTheme.royalBlue : AppTheme.textMain,
                                      height: 1.4,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ] else if (currentQuestion.type == 'MULTIPLE_CHOICE') ...[
                      ...currentQuestion.options.map((opt) {
                        final isSelected = currentAnswer.selectedOptionIds.contains(opt.id);
                        return InkWell(
                          onTap: () {
                            final list = List<String>.from(currentAnswer.selectedOptionIds);
                            if (isSelected) {
                              list.remove(opt.id);
                            } else {
                              list.add(opt.id);
                            }
                            _onAnswerChanged(currentQuestion.id, list);
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSelected ? AppTheme.royalBlue : AppTheme.borderLight,
                                width: isSelected ? 1.8 : 1.2,
                              ),
                            ),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: isSelected,
                                  activeColor: AppTheme.royalBlue,
                                  onChanged: (_) {},
                                ),
                                const SizedBox(width: 8),
                                Expanded(child: Text(opt.text, style: const TextStyle(fontSize: 15))),
                              ],
                            ),
                          ),
                        );
                      }),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.borderLight),
                        ),
                        child: TextField(
                          maxLines: 7,
                          decoration: const InputDecoration(
                            hintText: 'Tuliskan jawaban lengkap Anda di sini...',
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                          ),
                          controller: TextEditingController(text: currentAnswer.essayText)
                            ..selection = TextSelection.collapsed(
                              offset: (currentAnswer.essayText ?? '').length,
                            ),
                          onChanged: (txt) {
                            _onAnswerChanged(currentQuestion.id, [], essayText: txt);
                          },
                        ),
                      ),
                    ],
                    const SizedBox(height: 80),
                  ],
                ),
              ),

        // Bottom Navigation Bar
        bottomNavigationBar: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Row(
            children: [
              // Prev
              IconButton.outlined(
                onPressed: _currentIndex > 0 ? () => setState(() => _currentIndex--) : null,
                icon: const Icon(Icons.arrow_back_ios_new, size: 16),
              ),
              const SizedBox(width: 8),

              // Ragu-ragu Toggle
              OutlinedButton.icon(
                onPressed: () => _toggleDoubtful(currentQuestion.id),
                icon: Icon(
                  currentAnswer.isDoubtful ? Icons.flag : Icons.flag_outlined,
                  size: 16,
                  color: currentAnswer.isDoubtful ? const Color(0xFFD97706) : AppTheme.textMuted,
                ),
                label: Text(
                  'Ragu',
                  style: TextStyle(
                    fontSize: 13,
                    color: currentAnswer.isDoubtful ? const Color(0xFFD97706) : AppTheme.textMuted,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  backgroundColor: currentAnswer.isDoubtful ? const Color(0xFFFEF3C7) : Colors.transparent,
                  side: BorderSide(
                    color: currentAnswer.isDoubtful ? const Color(0xFFFDE68A) : AppTheme.borderLight,
                  ),
                ),
              ),
              const Spacer(),

              // Grid Modal Button
              TextButton.icon(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
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
                icon: const Icon(Icons.grid_view_rounded, size: 18),
                label: Text('$_answeredCount/${widget.questions.length}'),
              ),
              const Spacer(),

              // Next / Submit
              if (!isLast)
                ElevatedButton.icon(
                  onPressed: () => setState(() => _currentIndex++),
                  icon: const Icon(Icons.arrow_forward_ios, size: 14),
                  label: const Text('Lanjut'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.royalBlue,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                )
              else
                ElevatedButton.icon(
                  onPressed: () => _submitExam(),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Selesai'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
