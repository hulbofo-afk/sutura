import 'package:flutter/material.dart';

class SBottomNavigation extends StatelessWidget {
  const SBottomNavigation({super.key, required this.currentIndex, required this.onChanged, required this.items});
  final int currentIndex; final ValueChanged<int> onChanged; final List<BottomNavigationBarItem> items;
  @override Widget build(BuildContext context) => NavigationBar(selectedIndex: currentIndex, onDestinationSelected: onChanged, backgroundColor: Colors.white, indicatorColor: const Color(0xFFFCE8EB), destinations: items.map((item) => NavigationDestination(icon: item.icon, selectedIcon: item.activeIcon ?? item.icon, label: item.label ?? '')).toList());
}

class SAppBar extends StatelessWidget implements PreferredSizeWidget {
  const SAppBar({super.key, this.title, this.leading, this.actions, this.showBack = false});
  final String? title; final Widget? leading; final List<Widget>? actions; final bool showBack;
  @override Widget build(BuildContext context) => AppBar(automaticallyImplyLeading: showBack, leading: leading, title: title == null ? null : Text(title!), actions: actions, backgroundColor: Colors.transparent, surfaceTintColor: Colors.transparent, elevation: 0, foregroundColor: const Color(0xFF101418));
  @override Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
