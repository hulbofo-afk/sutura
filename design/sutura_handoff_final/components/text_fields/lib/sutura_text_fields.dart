import 'package:flutter/material.dart';

class STextField extends StatelessWidget {
  const STextField({super.key, this.controller, this.label, this.hint, this.errorText, this.helperText, this.prefixIcon, this.suffixIcon, this.obscureText = false, this.keyboardType, this.onChanged, this.enabled = true, this.maxLines = 1});
  final TextEditingController? controller;
  final String? label, hint, errorText, helperText;
  final Widget? prefixIcon, suffixIcon;
  final bool obscureText, enabled;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final int maxLines;
  @override
  Widget build(BuildContext context) => TextField(
        controller: controller, enabled: enabled, obscureText: obscureText,
        keyboardType: keyboardType, onChanged: onChanged, maxLines: maxLines,
        decoration: InputDecoration(labelText: label, hintText: hint, errorText: errorText, helperText: helperText, prefixIcon: prefixIcon, suffixIcon: suffixIcon,
          filled: true, fillColor: const Color(0xFFFCE8EB), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE90046), width: 2)),
          errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE90046))),
        ),
      );
}

class SSearchField extends StatelessWidget {
  const SSearchField({super.key, this.controller, this.hint = 'Rechercher', this.onChanged, this.onSubmitted});
  final TextEditingController? controller;
  final String hint;
  final ValueChanged<String>? onChanged, onSubmitted;
  @override
  Widget build(BuildContext context) => STextField(controller: controller, hint: hint, onChanged: onChanged, keyboardType: TextInputType.text, prefixIcon: const Icon(Icons.search_rounded), suffixIcon: IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => controller?.clear()));
}
