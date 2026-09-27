import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../models/exam_model.dart';
import 'security_check_screen.dart';

class ExamDetailScreen extends StatelessWidget {
  final ExamModel exam;

  const ExamDetailScreen({super.key, required this.exam});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        title: const Text('Detail Ujian', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Subject Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: Row(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: AppTheme.cyanAccent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.cyanAccent.withValues(alpha: 0.4)),
                    ),
                    child: const Icon(Icons.calculate_rounded, color: AppTheme.cyanAccent, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exam.subjectName,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          exam.title,
                          style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Kelas X - Semester 1',
                          style: TextStyle(fontSize: 12, color: AppTheme.textSubtle),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 4-Grid Specs
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      _buildSpecItem(Icons.calendar_today_rounded, 'Tanggal', '${exam.startTime.day} ${_getMonthName(exam.startTime.month)} ${exam.startTime.year}'),
                      _buildSpecItem(Icons.access_time_rounded, 'Waktu', '08:00 - 09:00'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildSpecItem(Icons.timer_outlined, 'Durasi', '${exam.durationMinutes} Menit'),
                      _buildSpecItem(Icons.description_outlined, 'Jumlah Soal', '40 Soal'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: AppTheme.borderDark, height: 1),
                  const SizedBox(height: 14),

                  // Tipe Soal
                  const Row(
                    children: [
                      Icon(Icons.format_list_bulleted_rounded, color: AppTheme.cyanAccent, size: 18),
                      SizedBox(width: 10),
                      Text('Tipe Soal: ', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                      Text(
                        'Pilihan Ganda & Essay',
                        style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Informasi Penting Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Informasi Penting',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 14),
                  _buildRuleItem(1, 'Pastikan koneksi internet stabil saat memulai dan mengirimkan ujian.'),
                  _buildRuleItem(2, 'Jangan keluar dari aplikasi saat ujian. Perangkat akan mengunci sistem secara otomatis.'),
                  _buildRuleItem(3, 'Jawaban Anda tersimpan otomatis setiap kali Anda memilih opsi.'),
                  _buildRuleItem(4, 'Timer menggunakan sinkronisasi waktu server sekolah.'),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // CTA Button "Mulai Ujian"
            Container(
              width: double.infinity,
              height: 52,
              decoration: BoxDecoration(
                gradient: AppTheme.cyanGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.cyanAccent.withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => SecurityCheckScreen(exam: exam),
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
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.bgDark),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecItem(IconData icon, String label, String value) {
    return Expanded(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.bgCardLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppTheme.cyanAccent, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: AppTheme.textSubtle, fontSize: 11)),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRuleItem(int number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              color: AppTheme.goldAccent.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              '$number',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.goldAccent),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  String _getMonthName(int month) {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return m[month - 1];
  }
}
