import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/theme/app_theme.dart';
import '../models/school_model.dart';
import 'select_school_screen.dart';
import 'register_screen.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  final SchoolModel? selectedSchool;

  const LoginScreen({super.key, this.selectedSchool});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _rememberMe = true;
  bool _obscurePassword = true;
  bool _isLoading = false;

  late SchoolModel _currentSchool;

  @override
  void initState() {
    super.initState();
    _currentSchool = widget.selectedSchool ??
        SchoolModel(
          id: 'default',
          code: 'SMAN1',
          name: 'SMA Nusantara',
        );
  }

  Future<void> _handleLogin() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text.trim();

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('NIS / Username dan password wajib diisi.'),
          backgroundColor: AppTheme.dangerRed,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final res = await ApiService.login(
      identifier: identifier,
      password: password,
      schoolCode: _currentSchool.code,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res.success) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
        (route) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.message),
          backgroundColor: AppTheme.dangerRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Colors.white),
          onPressed: () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const SelectSchoolScreen()),
            );
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Column(
          children: [
            // Center Selected School Card
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.cyanAccent.withValues(alpha: 0.3)),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.cyanAccent.withValues(alpha: 0.12),
                    blurRadius: 24,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // School Badge Logo
                  Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.bgCardLight,
                      border: Border.all(color: AppTheme.cyanAccent.withValues(alpha: 0.5), width: 1.5),
                    ),
                    child: const Icon(Icons.school_rounded, color: AppTheme.cyanAccent, size: 36),
                  ),
                  const SizedBox(height: 12),

                  Text(
                    _currentSchool.name,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textWhite,
                    ),
                  ),
                  const SizedBox(height: 4),

                  Text(
                    'Kode: ${_currentSchool.code}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSubtle,
                    ),
                  ),
                  const SizedBox(height: 8),

                  InkWell(
                    onTap: () {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (_) => const SelectSchoolScreen()),
                      );
                    },
                    child: const Text(
                      'Ganti Sekolah',
                      style: TextStyle(
                        color: AppTheme.cyanAccent,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Form Inputs
            TextField(
              controller: _identifierController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'NIS / Username',
                prefixIcon: Icon(Icons.person_outline_rounded, color: AppTheme.textMuted),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Password',
                prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppTheme.textMuted),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    color: AppTheme.textMuted,
                  ),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Remember me & Forgot password
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    SizedBox(
                      height: 24,
                      width: 24,
                      child: Checkbox(
                        value: _rememberMe,
                        activeColor: AppTheme.cyanAccent,
                        checkColor: AppTheme.bgDark,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                        side: const BorderSide(color: AppTheme.borderDark),
                        onChanged: (v) => setState(() => _rememberMe = v ?? true),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text('Ingat saya', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                  ],
                ),
                TextButton(
                  onPressed: () {},
                  child: const Text(
                    'Lupa password?',
                    style: TextStyle(color: AppTheme.cyanAccent, fontSize: 13),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Button Masuk (Cyan Glow Gradient)
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
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  foregroundColor: AppTheme.bgDark,
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.2, color: AppTheme.bgDark),
                      )
                    : const Text(
                        'Masuk',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.bgDark),
                      ),
              ),
            ),
            const SizedBox(height: 24),

            // Divider
            const Row(
              children: [
                Expanded(child: Divider(color: AppTheme.borderDark)),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text('atau masuk dengan', style: TextStyle(color: AppTheme.textSubtle, fontSize: 12)),
                ),
                Expanded(child: Divider(color: AppTheme.borderDark)),
              ],
            ),
            const SizedBox(height: 20),

            // Google Button
            Container(
              width: double.infinity,
              height: 50,
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: TextButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.g_mobiledata_rounded, color: Colors.white, size: 28),
                label: const Text(
                  'Masuk dengan Google',
                  style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Register Link
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RegisterScreen()),
                );
              },
              child: const Text(
                'Belum punya akun? Daftar Siswa Mandiri',
                style: TextStyle(color: AppTheme.cyanAccent, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
