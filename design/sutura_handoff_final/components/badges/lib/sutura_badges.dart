import 'package:flutter/material.dart';

enum SBadgeTone { framboise, jaune, prune, neutral, success, error }

class SBadge extends StatelessWidget {
  const SBadge({super.key, required this.label, this.tone = SBadgeTone.neutral, this.icon});
  final String label; final SBadgeTone tone; final Widget? icon;
  @override Widget build(BuildContext context) { final c = switch (tone) { SBadgeTone.framboise => const Color(0xFFE90046), SBadgeTone.jaune => const Color(0xFFF5D500), SBadgeTone.prune => const Color(0xFF4A2630), SBadgeTone.success => const Color(0xFF247A52), SBadgeTone.error => const Color(0xFFE90046), SBadgeTone.neutral => const Color(0xFFFCE8EB) }; final text = tone == SBadgeTone.jaune || tone == SBadgeTone.neutral ? const Color(0xFF4A2630) : Colors.white; return Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(999)), child: Row(mainAxisSize: MainAxisSize.min, children: [if (icon != null) IconTheme(data: IconThemeData(color: text, size: 14), child: icon!), if (icon != null) const SizedBox(width: 5), Text(label, style: TextStyle(color: text, fontSize: 12, fontWeight: FontWeight.w600))])); }
}

class SStatusBadge extends StatelessWidget { const SStatusBadge({super.key, required this.status}); final String status; @override Widget build(BuildContext context) => SBadge(label: status, tone: status.toLowerCase() == 'actif' ? SBadgeTone.success : SBadgeTone.neutral); }
class SChip extends StatelessWidget { const SChip({super.key, required this.label, this.onDeleted}); final String label; final VoidCallback? onDeleted; @override Widget build(BuildContext context) => Chip(label: Text(label), onDeleted: onDeleted, backgroundColor: const Color(0xFFFCE8EB), side: BorderSide.none, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))); }
