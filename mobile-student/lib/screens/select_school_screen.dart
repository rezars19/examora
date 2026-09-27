import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';
import '../core/theme/app_theme.dart';
import '../models/school_model.dart';
import 'login_screen.dart';

class SelectSchoolScreen extends StatefulWidget {
  const SelectSchoolScreen({super.key});

  @override
  State<SelectSchoolScreen> createState() => _SelectSchoolScreenState();
}

class _SelectSchoolScreenState extends State<SelectSchoolScreen> {
  final _searchController = TextEditingController();
  List<SchoolModel> _schools = [];
  List<SchoolModel> _filteredSchools = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSchools();
  }

  Future<void> _loadSchools() async {
    final list = await ApiService.getSchools();
    if (!mounted) return;

    // Tambahkan fallback sample jika API belum memiliki data awal
    if (list.isEmpty) {
      list.addAll([
        SchoolModel(id: 'sample-1', code: 'SMAN1', name: 'SMA Nusantara (Kota Bandung)'),
        SchoolModel(id: 'sample-2', code: 'SMKT1', name: 'SMK Teknologi (Kota Jakarta)'),
        SchoolModel(id: 'sample-3', code: 'SMPH1', name: 'SMP Harapan Bangsa (Kota Semarang)'),
      ]);
    }

    setState(() {
      _schools = list;
      _filteredSchools = list;
      _isLoading = false;
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      if (query.trim().isEmpty) {
        _filteredSchools = _schools;
      } else {
        _filteredSchools = _schools
            .where((s) =>
                s.name.toLowerCase().contains(query.toLowerCase()) ||
                s.code.toLowerCase().contains(query.toLowerCase()))
            .toList();
      }
    });
  }

  void _showHelpDialog() {
    final urlController = TextEditingController(text: ApiConstants.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: AppTheme.bgCard,
        title: const Row(
          children: [
            Icon(Icons.help_outline_rounded, color: AppTheme.cyanAccent),
            SizedBox(width: 10),
            Text('Bantuan & Pengaturan', style: TextStyle(color: Colors.white, fontSize: 17)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pastikan Anda terhubung ke jaringan sekolah atau internet aktif. Kode sekolah dapat ditanyakan kepada guru atau operator.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 16),
            const Text('Alamat Server Backend (IP/Domain):', style: TextStyle(color: Colors.white, fontSize: 12)),
            const SizedBox(height: 6),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.dns_rounded),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Tutup', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              final newUrl = urlController.text.trim();
              if (newUrl.isNotEmpty) {
                ApiConstants.baseUrl = newUrl;
                await StorageService.saveServerUrl(newUrl);
                _loadSchools();
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Simpan IP'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              // Header
              const Text(
                'Selamat Datang\ndi Examora',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textWhite,
                  height: 1.25,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Masukkan kode sekolah untuk\nmelanjutkan',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textMuted,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),

              // Search Bar
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: _onSearchChanged,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Kode Sekolah',
                    hintStyle: TextStyle(color: AppTheme.textSubtle),
                    prefixIcon: Icon(Icons.search_rounded, color: AppTheme.cyanAccent),
                    suffixIcon: Icon(Icons.chevron_right_rounded, color: AppTheme.cyanAccent),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // Section Label
              const Text(
                'atau pilih dari daftar',
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 14),

              // School Cards List
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: AppTheme.cyanAccent))
                    : _filteredSchools.isEmpty
                        ? const Center(
                            child: Text(
                              'Sekolah tidak ditemukan.',
                              style: TextStyle(color: AppTheme.textMuted),
                            ),
                          )
                        : ListView.builder(
                            itemCount: _filteredSchools.length,
                            itemBuilder: (context, index) {
                              final school = _filteredSchools[index];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: AppTheme.bgCard,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(color: AppTheme.borderDark),
                                ),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                  leading: Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: AppTheme.bgCardLight,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppTheme.borderDark),
                                    ),
                                    child: const Icon(
                                      Icons.school_rounded,
                                      color: AppTheme.cyanAccent,
                                      size: 24,
                                    ),
                                  ),
                                  title: Text(
                                    school.name,
                                    style: const TextStyle(
                                      color: AppTheme.textWhite,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                  subtitle: Text(
                                    'Kode: ${school.code}',
                                    style: const TextStyle(
                                      color: AppTheme.textSubtle,
                                      fontSize: 12,
                                    ),
                                  ),
                                  trailing: const Icon(
                                    Icons.arrow_forward_ios_rounded,
                                    color: AppTheme.textMuted,
                                    size: 16,
                                  ),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => LoginScreen(selectedSchool: school),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
              ),

              // Footer Button
              Center(
                child: TextButton(
                  onPressed: _showHelpDialog,
                  child: const Text(
                    'Butuh bantuan?',
                    style: TextStyle(
                      color: AppTheme.cyanAccent,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
