interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeader({ title, eyebrow, subtitle, centered = false }: SectionHeaderProps) {
  return (
    <div className={`mb-6 sm:mb-10 ${centered ? "text-center" : ""}`}>
      {eyebrow && (
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D91672]">
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-display mt-1.5 text-2xl font-extrabold text-foreground sm:text-3xl ${eyebrow ? "" : "mt-0"}`}
      >
        {title}
      </h2>
      {/* Traço decorativo */}
      <div className={`mt-3 flex items-center gap-2 ${centered ? "justify-center" : ""}`}>
        <div className="h-[2px] w-8 rounded-full bg-[#D91672]" />
        <div className="h-[2px] w-3 rounded-full bg-[#D91672]/30" />
      </div>
      {subtitle && (
        <p
          className={`mt-3 text-sm text-muted-foreground leading-relaxed max-w-lg ${centered ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
