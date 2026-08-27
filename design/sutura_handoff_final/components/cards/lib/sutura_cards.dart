import 'package:flutter/material.dart';

class SCard extends StatelessWidget {
  const SCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(16), this.background = Colors.white});
  final Widget child; final VoidCallback? onTap; final EdgeInsetsGeometry padding; final Color background;
  @override Widget build(BuildContext context) => Material(color: background, borderRadius: BorderRadius.circular(20), child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(20), child: Padding(padding: padding, child: child)));
}

class SMetricCard extends StatelessWidget {
  const SMetricCard({super.key, required this.label, required this.value, this.caption, this.icon, this.accent = const Color(0xFFE90046)});
  final String label, value; final String? caption; final Widget? icon; final Color accent;
  @override Widget build(BuildContext context) => SCard(child: Row(children: [if (icon != null) Container(width: 44, height: 44, decoration: BoxDecoration(color: accent.withAlpha(24), borderRadius: BorderRadius.circular(14)), child: IconTheme(data: IconThemeData(color: accent), child: icon!)), if (icon != null) const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: Theme.of(context).textTheme.bodySmall), const SizedBox(height: 4), Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)), if (caption != null) Text(caption!, style: Theme.of(context).textTheme.bodySmall)]))]));
}

class SListTileCard extends StatelessWidget {
  const SListTileCard({super.key, required this.title, this.subtitle, this.leading, this.trailing, this.onTap});
  final String title; final String? subtitle; final Widget? leading, trailing; final VoidCallback? onTap;
  @override Widget build(BuildContext context) => SCard(onTap: onTap, padding: EdgeInsets.zero, child: ListTile(contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4), leading: leading, title: Text(title), subtitle: subtitle == null ? null : Text(subtitle!), trailing: trailing));
}
