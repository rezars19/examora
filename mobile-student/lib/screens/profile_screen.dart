import 'package:flutter/material.dart';
import '../core/services/storage_service.dart';
import '../core/theme/app_theme.dart';
import 'select_school_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final u = await StorageService.getUser();
    setState(() => _user = u);
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Keluar dari Akun?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Anda harus login kembali untuk mengikuti ujian digital berikutnya.',
          style: TextStyle(color: AppTheme.textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.dangerRed),
            child: const Text('Keluar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await StorageService.clearAuth();
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const SelectSchoolScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final fullName = _user?['fullName'] ?? 'Reza Riyadhusolihin';
    final nis = _user?['identifier'] ?? '20200001';
    final className = _user?['className'] ?? 'Kelas X IPA 1';

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              const SizedBox(height: 10),

              // Avatar with glowing ring
              Center(
                child: Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppTheme.cyanGradient,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.cyanAccent.withValues(alpha: 0.35),
                        blurRadius: 24,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: Container(
                    width: 90,
                    height: 90,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.bgCard,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      fullName.isNotEmpty ? fullName[0].toUpperCase() : 'R',
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.cyanAccent,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Name, NIS, Class
              Text(
                fullName,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textWhite,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'NIS: $nis',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.cyanAccent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  className,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.cyanAccent,
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Menu Card
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Column(
                  children: [
                    _buildMenuItem(
                      icon: Icons.account_balance_rounded,
                      title: 'Informasi Sekolah',
                      onTap: () {},
                    ),
                    const Divider(height: 1, color: AppTheme.borderDark),
                    _buildMenuItem(
                      icon: Icons.lock_outline_rounded,
                      title: 'Ubah Password',
                      onTap: () {},
                    ),
                    const Divider(height: 1, color: AppTheme.borderDark),
                    _buildMenuItem(
                      icon: Icons.settings_outlined,
                      title: 'Pengaturan',
                      onTap: () {},
                    ),
                    const Divider(height: 1, color: AppTheme.borderDark),
                    _buildMenuItem(
                      icon: Icons.info_outline_rounded,
                      title: 'Tentang Examora',
                      onTap: () {},
                    ),
                    const Divider(height: 1, color: AppTheme.borderDark),
                    _buildMenuItem(
                      icon: Icons.logout_rounded,
                      title: 'Keluar',
                      isDanger: true,
                      onTap: _handleLogout,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Version info
              Text(
                'Examora v1.0.0 (Secure Mode)',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.3),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    bool isDanger = false,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      leading: Icon(
        icon,
        color: isDanger ? AppTheme.dangerRed : AppTheme.cyanAccent,
        size: 22,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isDanger ? AppTheme.dangerRed : AppTheme.textWhite,
          fontWeight: isDanger ? FontWeight.bold : FontWeight.w500,
          fontSize: 14,
        ),
      ),
      trailing: isDanger
          ? null
          : const Icon(
              Icons.chevron_right_rounded,
              color: AppTheme.textSubtle,
              size: 20,
            ),
    );
  }
}
