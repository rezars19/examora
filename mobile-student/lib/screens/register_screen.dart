import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/theme/app_theme.dart';
import '../models/school_model.dart';
import '../models/class_model.dart';
import 'dashboard_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  List<SchoolModel> _schools = [];
  List<ClassModel> _classes = [];

  SchoolModel? _selectedSchool;
  ClassModel? _selectedClass;

  final _identifierController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoadingSchools = true;
  bool _isLoadingClasses = false;
  bool _isSubmitting = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _fetchSchools();
  }

  Future<void> _fetchSchools() async {
    final list = await ApiService.getSchools();
    if (!mounted) return;

    if (list.isEmpty) {
      list.addAll([
        SchoolModel(id: 'sample-1', code: 'SMAN1', name: 'SMA Nusantara (Kota Bandung)'),
        SchoolModel(id: 'sample-2', code: 'SMKT1', name: 'SMK Teknologi (Kota Jakarta)'),
      ]);
    }

    setState(() {
      _schools = list;
      _isLoadingSchools = false;
    });
  }

  Future<void> _fetchClasses(String schoolId) async {
    setState(() {
      _isLoadingClasses = true;
      _selectedClass = null;
      _classes = [];
    });

    final list = await ApiService.getClasses(schoolId);
    if (!mounted) return;

    if (list.isEmpty) {
      list.addAll([
        ClassModel(id: 'cls-1', name: 'Kelas X IPA 1', academicYear: '2026/2027'),
        ClassModel(id: 'cls-2', name: 'Kelas X IPA 2', academicYear: '2026/2027'),
        ClassModel(id: 'cls-3', name: 'Kelas X IPS 1', academicYear: '2026/2027'),
      ]);
    }

    setState(() {
      _classes = list;
      _isLoadingClasses = false;
    });
  }

  Future<void> _handleRegister() async {
    if (_selectedSchool == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih sekolah terlebih dahulu.'), backgroundColor: AppTheme.dangerRed),
      );
      return;
    }
    if (_selectedClass == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih kelas Anda.'), backgroundColor: AppTheme.dangerRed),
      );
      return;
    }

    final identifier = _identifierController.text.trim();
    final fullName = _fullNameController.text.trim();
    final password = _passwordController.text.trim();

    if (identifier.isEmpty || fullName.isEmpty || password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Semua kolom wajib diisi dan password minimal 6 karakter.'),
          backgroundColor: AppTheme.dangerRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final res = await ApiService.registerStudent(
      schoolId: _selectedSchool!.id,
      classId: _selectedClass!.id,
      identifier: identifier,
      fullName: fullName,
      password: password,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

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
        title: const Text('Registrasi Siswa Baru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Card 1: Sekolah & Kelas
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
                  const Row(
                    children: [
                      Icon(Icons.apartment_rounded, color: AppTheme.cyanAccent, size: 20),
                      SizedBox(width: 8),
                      Text(
                        '1. Data Sekolah & Kelas',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  _isLoadingSchools
                      ? const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: AppTheme.cyanAccent)))
                      : DropdownButtonFormField<SchoolModel>(
                          initialValue: _selectedSchool,
                          dropdownColor: AppTheme.bgCard,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Pilih Sekolah',
                            prefixIcon: Icon(Icons.school_outlined),
                          ),
                          items: _schools.map((s) {
                            return DropdownMenuItem(
                              value: s,
                              child: Text(s.name, overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedSchool = val);
                              _fetchClasses(val.id);
                            }
                          },
                        ),
                  const SizedBox(height: 16),

                  _isLoadingClasses
                      ? const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: AppTheme.cyanAccent)))
                      : DropdownButtonFormField<ClassModel>(
                          initialValue: _selectedClass,
                          dropdownColor: AppTheme.bgCard,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            labelText: 'Pilih Kelas',
                            prefixIcon: const Icon(Icons.meeting_room_outlined),
                            helperText: _selectedSchool == null ? 'Pilih sekolah terlebih dahulu' : null,
                            helperStyle: const TextStyle(color: AppTheme.textSubtle),
                          ),
                          items: _classes.map((c) {
                            return DropdownMenuItem(
                              value: c,
                              child: Text('${c.name} (${c.academicYear})'),
                            );
                          }).toList(),
                          onChanged: _selectedSchool == null
                              ? null
                              : (val) {
                                  setState(() => _selectedClass = val);
                                },
                        ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Card 2: Identitas Siswa
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
                  const Row(
                    children: [
                      Icon(Icons.person_outline_rounded, color: AppTheme.cyanAccent, size: 20),
                      SizedBox(width: 8),
                      Text(
                        '2. Profil Siswa',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _identifierController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'NISN (Nomor Induk Siswa Nasional)',
                      hintText: '10 digit NISN',
                      prefixIcon: Icon(Icons.badge_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _fullNameController,
                    textCapitalization: TextCapitalization.words,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Nama Lengkap Siswa',
                      hintText: 'Sesuai data raport',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Password Akun',
                      hintText: 'Minimal 6 karakter',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: AppTheme.textMuted,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Submit Button
            Container(
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
                onPressed: _isSubmitting ? null : _handleRegister,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  foregroundColor: AppTheme.bgDark,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2.2, color: AppTheme.bgDark),
                      )
                    : const Text(
                        'Daftar & Langsung Masuk',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.bgDark),
                      ),
              ),
            ),
            const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }
}
