import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';
import 'register_screen.dart';
import 'exam_list_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _schoolCodeController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _loadSavedServerUrl();
  }

  Future<void> _loadSavedServerUrl() async {
    final savedUrl = await StorageService.getServerUrl();
    if (savedUrl != null && savedUrl.isNotEmpty) {
      ApiConstants.baseUrl = savedUrl;
    }
  }

  void _showServerSettings() {
    final urlController = TextEditingController(text: ApiConstants.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Pengaturan Alamat Server'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Masukkan URL Backend API (contoh: http://103.175.49.96:3000/api)',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'Base API URL',
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
              final newUrl = urlController.text.trim();
              if (newUrl.isNotEmpty) {
                ApiConstants.baseUrl = newUrl;
                await StorageService.saveServerUrl(newUrl);
              }
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Alamat server diperbarui.')),
              );
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogin() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text.trim();
    final schoolCode = _schoolCodeController.text.trim();

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('NISN dan password wajib diisi.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final res = await ApiService.login(
      identifier: identifier,
      password: password,
      schoolCode: schoolCode.isNotEmpty ? schoolCode : null,
    );

    setState(() => _isLoading = false);

    if (res.success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const ExamListScreen()),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.message),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Examora Siswa'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Server Setting',
            onPressed: _showServerSettings,
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                Icons.security_rounded,
                size: 72,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(height: 16),
              const Text(
                'Selamat Datang',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const Text(
                'Aplikasi Ujian Digital Aman Terpadu',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _identifierController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'NISN / No. Induk Siswa',
                  prefixIcon: Icon(Icons.person_outline),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _schoolCodeController,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: 'Kode Sekolah (Opsional jika NISN unik)',
                  prefixIcon: Icon(Icons.school_outlined),
                  border: OutlineInputBorder(),
                  helperText: 'Contoh: SMK1JKT',
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Masuk Ujian', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RegisterScreen()),
                  );
                },
                child: const Text('Belum punya akun? Daftar Siswa Mandiri'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
