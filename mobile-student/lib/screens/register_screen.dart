import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import '../core/theme/app_theme.dart';
import '../models/school_model.dart';
import '../models/class_model.dart';
import 'exam_list_screen.dart';

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
    if (mounted) {
      setState(() {
        _schools = list;
        _isLoadingSchools = false;
      });
    }
  }

  Future<void> _fetchClasses(String schoolId) async {
    setState(() {
      _isLoadingClasses = true;
      _selectedClass = null;
      _classes = [];
    });

    final list = await ApiService.getClasses(schoolId);
    if (mounted) {
      setState(() {
        _classes = list;
        _isLoadingClasses = false;
      });
    }
  }

  Future<void> _handleRegister() async {
    if (_selectedSchool == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih sekolah terlebih dahulu.'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_selectedClass == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih kelas Anda.'), backgroundColor: Colors.red),
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
          backgroundColor: Colors.red,
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
        MaterialPageRoute(builder: (_) => const ExamListScreen()),
        (route) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.message),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Registrasi Siswa'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Info Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.royalBlue.withOpacity(0.08),
                    AppTheme.cyanAccent.withOpacity(0.06),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: AppTheme.royalBlue, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Pilih sekolah tempat Anda terdaftar. Akun ini akan digunakan untuk seluruh ujian digital sekolah.',
                      style: TextStyle(fontSize: 13, color: AppTheme.textMain, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Card 1: Sekolah & Kelas
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderLight),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.apartment_rounded, color: AppTheme.royalBlue, size: 20),
                      SizedBox(width: 8),
                      Text(
                        '1. Data Sekolah & Kelas',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Dropdown Sekolah
                  _isLoadingSchools
                      ? const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()))
                      : DropdownButtonFormField<SchoolModel>(
                          initialValue: _selectedSchool,
                          decoration: const InputDecoration(
                            labelText: 'Pilih Sekolah',
                            prefixIcon: Icon(Icons.school_outlined),
                          ),
                          items: _schools.map((s) {
                            return DropdownMenuItem(
                              value: s,
                              child: Text('${s.name} (${s.code})', overflow: TextOverflow.ellipsis),
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

                  // Dropdown Kelas
                  _isLoadingClasses
                      ? const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()))
                      : DropdownButtonFormField<ClassModel>(
                          initialValue: _selectedClass,
                          decoration: InputDecoration(
                            labelText: 'Pilih Kelas',
                            prefixIcon: const Icon(Icons.meeting_room_outlined),
                            helperText: _selectedSchool == null ? 'Pilih sekolah terlebih dahulu' : null,
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
            const SizedBox(height: 20),

            // Card 2: Identitas Siswa
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderLight),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.person_outline_rounded, color: AppTheme.royalBlue, size: 20),
                      SizedBox(width: 8),
                      Text(
                        '2. Profil Siswa',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _identifierController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'NISN (Nomor Induk Siswa Nasional)',
                      hintText: '10 Digit angka NISN',
                      prefixIcon: Icon(Icons.badge_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _fullNameController,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(
                      labelText: 'Nama Lengkap Siswa',
                      hintText: 'Sesuai data rapor / kartu ujian',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
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

            // Gradient Submit Button
            Container(
              height: 52,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.royalBlue.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _handleRegister,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                      )
                    : const Text(
                        'Daftar & Langsung Masuk',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
