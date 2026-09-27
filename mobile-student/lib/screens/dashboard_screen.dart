import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';
import '../core/theme/app_theme.dart';
import '../models/exam_model.dart';
import 'exam_detail_screen.dart';
import 'exam_history_screen.dart';
import 'profile_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;
  Map<String, dynamic>? _user;
  List<ExamModel> _exams = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    final user = await StorageService.getUser();
    final exams = await ApiService.getAvailableExams();

    if (!mounted) return;

    if (exams.isEmpty) {
      exams.addAll([
        ExamModel(
          id: 'exam-sample-1',
          title: 'Ujian Tengah Semester',
          description: 'Ujian Tengah Semester Ganjil Tahun Ajaran 2026/2027',
          subjectName: 'Matematika',
          durationMinutes: 60,
          startTime: DateTime.now(),
          endTime: DateTime.now().add(const Duration(hours: 4)),
        ),
        ExamModel(
          id: 'exam-sample-2',
          title: 'Kelas X - Semester 1',
          description: 'Penilaian Harian Bahasa Indonesia',
          subjectName: 'Bahasa Indonesia',
          durationMinutes: 40,
          startTime: DateTime.now().add(const Duration(days: 1)),
          endTime: DateTime.now().add(const Duration(days: 1, hours: 2)),
        ),
      ]);
    }

    setState(() {
      _user = user;
      _exams = exams;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildHomeTab(),
          _buildAllExamsTab(),
          const ExamHistoryScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.bgSurface,
          border: Border(top: BorderSide(color: AppTheme.borderDark, width: 1.2)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppTheme.cyanAccent,
          unselectedItemColor: AppTheme.textSubtle,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_filled),
              label: 'Beranda',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_outlined),
              activeIcon: Icon(Icons.assignment_rounded),
              label: 'Ujian',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.insert_chart_outlined_rounded),
              activeIcon: Icon(Icons.insert_chart_rounded),
              label: 'Hasil',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }

  // --- TAB 1: BERANDA ---
  Widget _buildHomeTab() {
    final fullName = _user?['fullName'] ?? 'Reza';
    final firstName = fullName.split(' ').first;
    final upcomingExam = _exams.isNotEmpty ? _exams.first : null;
    final otherExams = _exams.length > 1 ? _exams.sublist(1) : <ExamModel>[];

    return SafeArea(
      child: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.cyanAccent))
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Bar (School Badge, Avatar, Notification)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // School Mini Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.borderDark),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.school_rounded, color: AppTheme.cyanAccent, size: 16),
                              SizedBox(width: 8),
                              Text(
                                'SMA Nusantara (Bandung)',
                                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),

                        // Avatar
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppTheme.cyanGradient,
                            border: Border.all(color: AppTheme.cyanAccent.withValues(alpha: 0.6), width: 1.5),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            firstName.isNotEmpty ? firstName[0].toUpperCase() : 'R',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.bgDark),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Greeting
                    Text(
                      'Halo, $firstName',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textWhite,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Siap untuk ujian hari ini?',
                      style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 24),

                    // UPCOMING EXAM HERO CARD
                    if (upcomingExam != null)
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          gradient: AppTheme.heroCardGradient,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: AppTheme.cyanAccent.withValues(alpha: 0.35),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.cyanAccent.withValues(alpha: 0.12),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Badge Tag
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.cyanAccent.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'UPCOMING EXAM',
                                    style: TextStyle(
                                      color: AppTheme.cyanAccent,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ),
                                const Icon(Icons.arrow_forward_ios_rounded, color: AppTheme.textMuted, size: 14),
                              ],
                            ),
                            const SizedBox(height: 14),

                            // Exam Title
                            Text(
                              upcomingExam.subjectName,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${upcomingExam.title} • Kelas X - Semester 1',
                              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                            ),
                            const SizedBox(height: 16),

                            // Date & Time Row
                            Row(
                              children: [
                                const Icon(Icons.calendar_today_rounded, size: 14, color: AppTheme.cyanAccent),
                                const SizedBox(width: 6),
                                Text(
                                  '${upcomingExam.startTime.day} ${_getMonthName(upcomingExam.startTime.month)} ${upcomingExam.startTime.year}',
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                ),
                                const SizedBox(width: 16),
                                const Icon(Icons.access_time_rounded, size: 14, color: AppTheme.cyanAccent),
                                const SizedBox(width: 6),
                                const Text(
                                  '08:00 - 09:00',
                                  style: TextStyle(color: Colors.white, fontSize: 13),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Specs Pills
                            Row(
                              children: [
                                _buildSpecPill(Icons.description_outlined, '40 Soal'),
                                const SizedBox(width: 10),
                                _buildSpecPill(Icons.timer_outlined, '${upcomingExam.durationMinutes} Menit'),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // Action Button "Mulai Ujian"
                            Container(
                              width: double.infinity,
                              height: 48,
                              decoration: BoxDecoration(
                                gradient: AppTheme.cyanGradient,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.cyanAccent.withValues(alpha: 0.35),
                                    blurRadius: 14,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => ExamDetailScreen(exam: upcomingExam),
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  foregroundColor: AppTheme.bgDark,
                                ),
                                child: const Text(
                                  'Mulai Ujian',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.bgDark),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 28),

                    // Section Ujian Lainnya
                    const Text(
                      'Ujian Lainnya',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textWhite,
                      ),
                    ),
                    const SizedBox(height: 12),

                    if (otherExams.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.borderDark),
                        ),
                        child: const Center(
                          child: Text(
                            'Belum ada jadwal ujian tambahan lainnya.',
                            style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                          ),
                        ),
                      )
                    else
                      ...otherExams.map((exam) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: AppTheme.borderDark),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            leading: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppTheme.bgCardLight,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppTheme.borderDark),
                              ),
                              child: const Icon(Icons.assignment_rounded, color: AppTheme.cyanAccent, size: 22),
                            ),
                            title: Text(
                              exam.subjectName,
                              style: const TextStyle(
                                color: AppTheme.textWhite,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                            subtitle: Text(
                              '${exam.title} • 40 Soal • ${exam.durationMinutes} Menit',
                              style: const TextStyle(color: AppTheme.textSubtle, fontSize: 12),
                            ),
                            trailing: const Icon(
                              Icons.arrow_forward_ios_rounded,
                              color: AppTheme.textMuted,
                              size: 14,
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ExamDetailScreen(exam: exam),
                                ),
                              );
                            },
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ),
    );
  }

  // --- TAB 2: SEMUA UJIAN ---
  Widget _buildAllExamsTab() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Daftar Semua Ujian',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 6),
            const Text(
              'Seluruh jadwal ujian aktif untuk kelas Anda',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: ListView.builder(
                itemCount: _exams.length,
                itemBuilder: (context, index) {
                  final exam = _exams[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.borderDark),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      leading: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.bgCardLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.school_rounded, color: AppTheme.cyanAccent),
                      ),
                      title: Text(
                        exam.subjectName,
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      subtitle: Text(
                        '${exam.title} • Durasi: ${exam.durationMinutes} Menit',
                        style: const TextStyle(color: AppTheme.textSubtle, fontSize: 12),
                      ),
                      trailing: ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => ExamDetailScreen(exam: exam)),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.cyanAccent,
                          foregroundColor: AppTheme.bgDark,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Buka', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
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

  Widget _buildSpecPill(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.bgCardLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.borderDark),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppTheme.cyanAccent),
          const SizedBox(width: 6),
          Text(text, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
        ],
      ),
    );
  }

  String _getMonthName(int month) {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return m[month - 1];
  }
}
