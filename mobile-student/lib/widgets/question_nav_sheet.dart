import 'package:flutter/material.dart';
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
      padding: const EdgeInsets.all(20),
      height: MediaQuery.of(context).size.height * 0.65,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Daftar Nomor Soal',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Legend
          Row(
            children: [
              _buildLegend(Colors.green, 'Dijawab'),
              const SizedBox(width: 16),
              _buildLegend(Colors.amber.shade700, 'Ragu-ragu'),
              const SizedBox(width: 16),
              _buildLegend(Colors.grey.shade400, 'Belum'),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 8),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 5,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.0,
              ),
              itemCount: questions.length,
              itemBuilder: (context, index) {
                final q = questions[index];
                final ans = answers[q.id];
                final isCurrent = index == currentIndex;

                Color bg = Colors.grey.shade200;
                Color textColor = Colors.black87;

                if (ans != null) {
                  if (ans.isDoubtful) {
                    bg = Colors.amber.shade600;
                    textColor = Colors.white;
                  } else if (ans.selectedOptionIds.isNotEmpty ||
                      (ans.essayText != null && ans.essayText!.isNotEmpty)) {
                    bg = Colors.green.shade600;
                    textColor = Colors.white;
                  }
                }

                return InkWell(
                  onTap: () {
                    onSelectQuestion(index);
                    Navigator.pop(context);
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(8),
                      border: isCurrent
                          ? Border.all(color: Colors.blue.shade700, width: 3)
                          : Border.all(color: Colors.grey.shade300),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${index + 1}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                  ),
                );
              },
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
          width: 14,
          height: 14,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}
