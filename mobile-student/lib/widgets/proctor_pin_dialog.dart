import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/services/security_service.dart';
import '../core/theme/app_theme.dart';
import '../screens/dashboard_screen.dart';

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

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res.success) {
      await SecurityService.disableSecureExamMode();
      if (!mounted) return;
      Navigator.pop(context); // Close dialog
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
        (route) => false,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PIN Pengawas berhasil. Mode aman dibuka.')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.message), backgroundColor: AppTheme.dangerRed),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.bgCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Row(
        children: [
          Icon(Icons.admin_panel_settings_rounded, color: AppTheme.goldAccent),
          SizedBox(width: 10),
          Text('PIN Pengawas Darurat', style: TextStyle(color: Colors.white, fontSize: 17)),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Hanya boleh diisi oleh Pengawas Ujian untuk membuka kunci perangkat dalam kondisi darurat.',
            style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _pinController,
            keyboardType: TextInputType.number,
            obscureText: true,
            maxLength: 6,
            style: const TextStyle(color: Colors.white),
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
          child: const Text('Batal', style: TextStyle(color: AppTheme.textMuted)),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleBypass,
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.goldAccent, foregroundColor: Colors.black),
          child: _isLoading
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                )
              : const Text('Buka Kunci', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
