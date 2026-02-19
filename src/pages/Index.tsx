const Index = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 text-center px-6">
        {/* Accent line */}
        <div
          className="mx-auto mb-8 h-1 w-20 rounded-full"
          style={{ background: "var(--gradient-accent)" }}
        />

        <h1
          className="text-5xl font-black tracking-tight sm:text-7xl md:text-8xl lg:text-9xl"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Fahrschul
          <span
            style={{
              backgroundImage: "var(--gradient-accent)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            verwaltung
          </span>
        </h1>

        {/* Accent line bottom */}
        <div
          className="mx-auto mt-8 h-1 w-20 rounded-full"
          style={{ background: "var(--gradient-accent)" }}
        />
      </div>
    </main>
  );
};

export default Index;
