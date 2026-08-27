import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

enum SuturaButtonVariant { primary, yellow, secondary, outline, dark, text }

enum SuturaButtonSize { large, medium, small, compact }

enum SuturaButtonState { idle, loading, success, disabled }

class SuturaButton extends StatefulWidget {
  const SuturaButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = SuturaButtonVariant.primary,
    this.size = SuturaButtonSize.large,
    this.state = SuturaButtonState.idle,
    this.leadingIcon,
    this.trailingIcon,
    this.fullWidth = true,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final SuturaButtonVariant variant;
  final SuturaButtonSize size;
  final SuturaButtonState state;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  final bool fullWidth;
  final String? semanticLabel;

  @override
  State<SuturaButton> createState() => _SuturaButtonState();
}

class _SuturaButtonState extends State<SuturaButton> {
  bool _pressed = false;

  bool get _isDisabled =>
      widget.state == SuturaButtonState.disabled ||
      widget.state == SuturaButtonState.loading ||
      widget.onPressed == null;

  @override
  Widget build(BuildContext context) {
    final colors = _colors(widget.variant);
    final height = _height(widget.size);
    final isText = widget.variant == SuturaButtonVariant.text;
    final labelStyle = Theme.of(context).textTheme.labelLarge?.copyWith(
          color: colors.foreground,
          fontWeight: FontWeight.w600,
        );

    final content = AnimatedOpacity(
      duration: const Duration(milliseconds: 100),
      opacity: _pressed ? 0.78 : 1,
      child: Row(
        mainAxisSize: widget.fullWidth ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (widget.state == SuturaButtonState.loading)
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(colors.foreground),
              ),
            )
          else if (widget.state == SuturaButtonState.success)
            SvgPicture.asset(
              'assets/icons/check.svg',
              width: 20,
              height: 20,
              colorFilter: ColorFilter.mode(colors.foreground, BlendMode.srcIn),
              semanticsLabel: 'Succès',
            )
          else if (widget.leadingIcon != null)
            IconTheme(data: IconThemeData(color: colors.foreground, size: 20), child: widget.leadingIcon!),
          if (!isText && (widget.leadingIcon != null || widget.state != SuturaButtonState.idle))
            const SizedBox(width: 10),
          Flexible(
            child: Text(widget.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: labelStyle),
          ),
          if (widget.trailingIcon != null) ...[
            const SizedBox(width: 10),
            IconTheme(data: IconThemeData(color: colors.foreground, size: 20), child: widget.trailingIcon!),
          ],
        ],
      ),
    );

    final surface = Material(
      color: isText ? Colors.transparent : colors.background,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: _isDisabled ? null : widget.onPressed,
        onHighlightChanged: (value) => setState(() => _pressed = value),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          constraints: BoxConstraints(minHeight: height),
          padding: EdgeInsets.symmetric(horizontal: _horizontalPadding(widget.size)),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: widget.variant == SuturaButtonVariant.outline
                ? Border.all(color: colors.foreground, width: 1.2)
                : null,
          ),
          alignment: Alignment.center,
          child: content,
        ),
      ),
    );

    return Semantics(
      button: true,
      enabled: !_isDisabled,
      label: widget.semanticLabel ?? widget.label,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 48),
        child: widget.fullWidth ? SizedBox(width: double.infinity, child: surface) : surface,
      ),
    );
  }

  double _height(SuturaButtonSize size) => switch (size) {
        SuturaButtonSize.large => 52,
        SuturaButtonSize.medium => 48,
        SuturaButtonSize.small => 40,
        SuturaButtonSize.compact => 32,
      };

  double _horizontalPadding(SuturaButtonSize size) => switch (size) {
        SuturaButtonSize.large => 20,
        SuturaButtonSize.medium => 18,
        SuturaButtonSize.small => 16,
        SuturaButtonSize.compact => 12,
      };

  _ButtonColors _colors(SuturaButtonVariant variant) {
    const framboise = Color(0xFFE90046);
    const jaune = Color(0xFFF5D500);
    const prune = Color(0xFF4A2630);
    const rosePale = Color(0xFFFCE8EB);
    const blanc = Color(0xFFFFFFFF);
    return switch (variant) {
      SuturaButtonVariant.primary => const _ButtonColors(framboise, blanc),
      SuturaButtonVariant.yellow => const _ButtonColors(jaune, prune),
      SuturaButtonVariant.secondary => const _ButtonColors(rosePale, prune),
      SuturaButtonVariant.outline => const _ButtonColors(Colors.transparent, prune),
      SuturaButtonVariant.dark => const _ButtonColors(prune, blanc),
      SuturaButtonVariant.text => const _ButtonColors(Colors.transparent, framboise),
    };
  }
}

class _ButtonColors {
  const _ButtonColors(this.background, this.foreground);
  final Color background;
  final Color foreground;
}

class SPrimaryButton extends StatelessWidget {
  const SPrimaryButton({super.key, required this.label, required this.onPressed, this.state = SuturaButtonState.idle, this.leadingIcon, this.trailingIcon});
  final String label;
  final VoidCallback? onPressed;
  final SuturaButtonState state;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  @override
  Widget build(BuildContext context) => SuturaButton(label: label, onPressed: onPressed, state: state, leadingIcon: leadingIcon, trailingIcon: trailingIcon);
}

class SSecondaryButton extends StatelessWidget {
  const SSecondaryButton({super.key, required this.label, required this.onPressed, this.state = SuturaButtonState.idle});
  final String label;
  final VoidCallback? onPressed;
  final SuturaButtonState state;
  @override
  Widget build(BuildContext context) => SuturaButton(label: label, onPressed: onPressed, variant: SuturaButtonVariant.secondary, size: SuturaButtonSize.medium, state: state);
}

class SOutlineButton extends StatelessWidget {
  const SOutlineButton({super.key, required this.label, required this.onPressed});
  final String label;
  final VoidCallback? onPressed;
  @override
  Widget build(BuildContext context) => SuturaButton(label: label, onPressed: onPressed, variant: SuturaButtonVariant.outline, size: SuturaButtonSize.medium);
}

class STextButton extends StatelessWidget {
  const STextButton({super.key, required this.label, required this.onPressed});
  final String label;
  final VoidCallback? onPressed;
  @override
  Widget build(BuildContext context) => SuturaButton(label: label, onPressed: onPressed, variant: SuturaButtonVariant.text, size: SuturaButtonSize.compact, fullWidth: false);
}

class SIconButton extends StatelessWidget {
  const SIconButton({super.key, required this.icon, required this.onPressed, this.semanticLabel});
  final Widget icon;
  final VoidCallback? onPressed;
  final String? semanticLabel;
  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: semanticLabel,
        child: SizedBox.square(
          dimension: 48,
          child: IconButton(onPressed: onPressed, icon: icon, padding: EdgeInsets.zero),
        ),
      );
}
