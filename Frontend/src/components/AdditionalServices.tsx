const AdditionalServices = () => {
  return (
    <section className="relative overflow-hidden py-16" style={{ background: "linear-gradient(180deg,rgb(202, 202, 202), #ffffff)" }}>
      {/* Subtle network dots/lines */}
      <div className="pointer-events-none absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 10% 20%, #000 1px, transparent 1px), radial-gradient(circle at 60% 80%, #000 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="ocl-container relative z-10">
        {/* Empty section - ready for content */}
      </div>
    </section>
  );
};

export default AdditionalServices;

