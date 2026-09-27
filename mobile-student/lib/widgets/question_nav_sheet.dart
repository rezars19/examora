import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../models/question_model.dart';

class QuestionNavSheet extends StatelessWidget {
  final List<QuestionModel> questions;
  final Map<String, StudentAnswerState> answers;
  final int currentIndex;
  final Function(int) onSelectQuestion;

  const QuestionNavSheet({
    super.key,
    required this.questions,
    required this.answers,
    required this.currentIndex,
    required this.onSelectQuestion,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      height: MediaQuery.of(context).size.height * 0.72,
      decoration: const BoxDecoration(
        color: AppTheme.bgDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                onPressed: () => Navigator.pop(context),
              ),
              const Text(
                'Daftar Soal',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(width: 40),
            ],
          ),
          const SizedBox(height: 16),

          // Legend Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildLegend(AppTheme.successGreen, 'Sudah dijawab'),
                const SizedBox(width: 14),
                _buildLegend(AppTheme.bgCardLight, 'Belum dijawab'),
                const SizedBox(width: 14),
                _buildLegend(AppTheme.goldAccent, 'Ditandai'),
                const SizedBox(width: 14),
                _buildLegend(AppTheme.cyanAccent, 'Aktif'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Divider(color: AppTheme.borderDark, height: 1),
          const SizedBox(height: 16),

          // 5-Column Grid of Question Numbers
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 5,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.0,
              ),
              itemCount: questions.length,
              itemBuilder: (context, index) {
                final q = questions[index];
                final ans = answers[q.id];
                final isCurrent = index == currentIndex;

                Color bg = AppTheme.bgCard;
                Color borderColor = AppTheme.borderDark;
                Color textColor = AppTheme.textMuted;

                if (ans != null) {
                  if (ans.isDoubtful) {
                    bg = AppTheme.goldAccent.withValues(alpha: 0.2);
                    borderColor = AppTheme.goldAccent;
                    textColor = AppTheme.goldAccent;
                  } else if (ans.selectedOptionIds.isNotEmpty ||
                      (ans.essayText != null && ans.essayText!.isNotEmpty)) {
                    bg = AppTheme.successGreen.withValues(alpha: 0.2);
                    borderColor = AppTheme.successGreen;
                    textColor = AppTheme.successGreen;
                  }
                }

                if (isCurrent) {
                  borderColor = AppTheme.cyanAccent;
                  bg = AppTheme.cyanAccent.withValues(alpha: 0.25);
                  textColor = AppTheme.cyanAccent;
                }

                return InkWell(
                  onTap: () {
                    onSelectQuestion(index);
                    Navigator.pop(context);
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: borderColor,
                        width: isCurrent ? 2 : 1.2,
                      ),
                      boxShadow: isCurrent
                          ? [
                              BoxShadow(
                                color: AppTheme.cyanAccent.withValues(alpha: 0.3),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${index + 1}',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),

          // Bottom Action: Kembali ke Ujian
          Container(
            width: double.infinity,
            height: 48,
            decoration: BoxDecoration(
              gradient: AppTheme.cyanGradient,
              borderRadius: BorderRadius.circular(14),
            ),
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                foregroundColor: AppTheme.bgDark,
              ),
              child: const Text(
                'Kembali ke Ujian',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.bgDark),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegend(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
      ],
    );
  }
}
