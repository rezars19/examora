import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/theme/app_theme.dart';
import '../models/exam_model.dart';

class ExamHistoryScreen extends StatefulWidget {
  const ExamHistoryScreen({super.key});

  @override
  State<ExamHistoryScreen> createState() => _ExamHistoryScreenState();
}

class _ExamHistoryScreenState extends State<ExamHistoryScreen> {
  int _selectedFilter = 0; // 0: Semua, 1: Selesai, 2: Menunggu
  List<ExamModel> _exams = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchExams();
  }

  Future<void> _fetchExams() async {
    final list = await ApiService.getAvailableExams();
    if (!mounted) return;

    if (list.isEmpty) {
      list.addAll([
        ExamModel(
          id: '1',
          title: 'Ujian Tengah Semester',
          subjectName: 'Matematika',
          durationMinutes: 60,
          startTime: DateTime.now().subtract(const Duration(days: 2)),
          endTime: DateTime.now().subtract(const Duration(days: 2)),
          attemptStatus: 'SUBMITTED',
          score: null, // Menunggu
        ),
        ExamModel(
          id: '2',
          title: 'UTS - Kelas X',
          subjectName: 'Bahasa Indonesia',
          durationMinutes: 60,
          startTime: DateTime.now().subtract(const Duration(days: 5)),
          endTime: DateTime.now().subtract(const Duration(days: 5)),
          attemptStatus: 'SUBMITTED',
          score: 85.0,
        ),
        ExamModel(
          id: '3',
          title: 'UTS - Kelas X',
          subjectName: 'Bahasa Inggris',
          durationMinutes: 60,
          startTime: DateTime.now().subtract(const Duration(days: 7)),
          endTime: DateTime.now().subtract(const Duration(days: 7)),
          attemptStatus: 'SUBMITTED',
          score: 78.0,
        ),
        ExamModel(
          id: '4',
          title: 'UTS - Kelas X',
          subjectName: 'Fisika',
          durationMinutes: 60,
          startTime: DateTime.now().subtract(const Duration(days: 10)),
          endTime: DateTime.now().subtract(const Duration(days: 10)),
          attemptStatus: 'SUBMITTED',
          score: 92.0,
        ),
      ]);
    }

    setState(() {
      _exams = list;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        title: const Text('Hasil Ujian', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
        child: Column(
          children: [
            // Filter Tabs (Semua, Selesai, Menunggu)
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: Row(
                children: [
                  _buildFilterTab(0, 'Semua'),
                  _buildFilterTab(1, 'Selesai'),
                  _buildFilterTab(2, 'Menunggu'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Exam Results List
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.cyanAccent))
                  : ListView.builder(
                      itemCount: _exams.length,
                      itemBuilder: (context, index) {
                        final exam = _exams[index];
                        final hasScore = exam.score != null;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: AppTheme.borderDark),
                          ),
                          child: Row(
                            children: [
                              // Subject Icon
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppTheme.bgCardLight,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppTheme.borderDark),
                                ),
                                child: Icon(
                                  _getSubjectIcon(exam.subjectName),
                                  color: AppTheme.cyanAccent,
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 14),

                              // Title & Subtitle
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      exam.subjectName,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textWhite,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '${exam.title} • ${exam.startTime.day} ${_getMonthName(exam.startTime.month)} ${exam.startTime.year}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.textSubtle,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Score / Status Badge
                              if (hasScore)
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      exam.score!.toStringAsFixed(0),
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textWhite,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppTheme.successGreen.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        'Selesai',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.successGreen,
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              else
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.goldAccent.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'Menunggu',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.goldAccent,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterTab(int index, String label) {
    final isSelected = _selectedFilter == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedFilter = index),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.cyanAccent : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isSelected ? AppTheme.bgDark : AppTheme.textMuted,
            ),
          ),
        ),
      ),
    );
  }

  IconData _getSubjectIcon(String subject) {
    final s = subject.toLowerCase();
    if (s.contains('matematika')) return Icons.calculate_rounded;
    if (s.contains('indonesia')) return Icons.menu_book_rounded;
    if (s.contains('inggris')) return Icons.translate_rounded;
    if (s.contains('fisika') || s.contains('ipa')) return Icons.science_rounded;
    return Icons.assignment_rounded;
  }

  String _getMonthName(int month) {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return m[month - 1];
  }
}
