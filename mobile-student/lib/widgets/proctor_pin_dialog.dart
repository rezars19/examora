import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/services/security_service.dart';
import '../screens/exam_list_screen.dart';

class ProctorPinDialog extends StatefulWidget {
  final String attemptId;

  const ProctorPinDialog({super.key, required this.attemptId});

  @override
  State<ProctorPinDialog> createState() => _ProctorPinDialogState();
}

class _ProctorPinDialogState extends State<ProctorPinDialog> {
  final _pinController = TextEditingController();
  bool _isLoading = false;

  Future<void> _handleBypass() async {
    final pin = _pinController.text.trim();
    if (pin.isEmpty) return;

    setState(() => _isLoading = true);

    final res = await ApiService.bypassPin(attemptId: widget.attemptId, pin: pin);

    setState(() => _isLoading = false);

    if (res.success && mounted) {
      await SecurityService.disableSecureExamMode();
      Navigator.pop(context); // Close dialog
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const ExamListScreen()),
        (route) => false,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PIN Pengawas berhasil. Mode aman dibuka.')),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.message), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.admin_panel_settings, color: Colors.amber),
          SizedBox(width: 8),
          Text('PIN Pengawas Darurat'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Hanya boleh diisi oleh Pengawas Ujian untuk membuka kunci perangkat dalam kondisi darurat.',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _pinController,
            keyboardType: TextInputType.number,
            obscureText: true,
            maxLength: 6,
            decoration: const InputDecoration(
              labelText: '6 Digit PIN Pengawas',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.pin),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Batal'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleBypass,
          style: ElevatedButton.styleFrom(backgroundColor: Colors.amber.shade800),
          child: _isLoading
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Buka Kunci', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
