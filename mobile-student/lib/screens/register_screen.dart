import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
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
        const SnackBar(content: Text('Pilih sekolah terlebih dahulu.')),
      );
      return;
    }
    if (_selectedClass == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih kelas Anda.')),
      );
      return;
    }

    final identifier = _identifierController.text.trim();
    final fullName = _fullNameController.text.trim();
    final password = _passwordController.text.trim();

    if (identifier.isEmpty || fullName.isEmpty || password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Semua field wajib diisi dan password minimal 6 karakter.')),
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

    setState(() => _isSubmitting = false);

    if (res.success && mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const ExamListScreen()),
        (route) => false,
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.message), backgroundColor: Colors.red.shade700),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pendaftaran Siswa Baru')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Pilih Sekolah & Kelas Anda',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Dropdown Sekolah
            _isLoadingSchools
                ? const Center(child: CircularProgressIndicator())
                : DropdownButtonFormField<SchoolModel>(
                    value: _selectedSchool,
                    decoration: const InputDecoration(
                      labelText: 'Pilih Sekolah',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.school),
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
                ? const Center(child: Padding(padding: EdgeInsets.all(8.0), child: CircularProgressIndicator()))
                : DropdownButtonFormField<ClassModel>(
                    value: _selectedClass,
                    decoration: const InputDecoration(
                      labelText: 'Pilih Kelas',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.meeting_room),
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
            const SizedBox(height: 24),

            const Text(
              'Identitas Siswa',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _identifierController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'NISN (Nomor Induk Siswa Nasional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.badge_outlined),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _fullNameController,
              decoration: const InputDecoration(
                labelText: 'Nama Lengkap Siswa',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password (min. 6 karakter)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.lock_outline),
              ),
            ),
            const SizedBox(height: 28),

            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleRegister,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: _isSubmitting
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Daftar & Masuk', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
