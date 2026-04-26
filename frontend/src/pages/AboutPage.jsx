import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-600 px-6 py-16 text-white shadow-xl lg:px-12">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About Prescripto</h1>
          <p className="mt-6 text-lg leading-relaxed text-cyan-50 md:text-xl">
            Prescripto is an innovative online healthcare platform designed to simplify the way people access medical services. We bridge the gap between patients and doctors with technology.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      </section>

      {/* Main Content */}
      <div className="grid gap-12 lg:grid-cols-2">
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">Our Journey</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              In today’s fast-paced world, finding the right doctor and booking an appointment can often be time-consuming and stressful. Prescripto aims to eliminate these challenges by providing a seamless, reliable, and user-friendly solution for patients and healthcare professionals.
            </p>
            <p>
              Our platform allows patients to easily search for qualified doctors, explore their specialties, view availability, and book appointments in just a few clicks. Whether it’s a routine check-up or a specialist consultation, Prescripto ensures that healthcare is always within your reach.
            </p>
            <p>
              We are committed to maintaining high standards of quality and trust. Every doctor on our platform goes through a verification process to ensure patients receive care from experienced and certified professionals.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">What We Offer</h2>
          <ul className="space-y-4">
            {[
              "Easy and quick online appointment booking",
              "Access to verified and experienced doctors",
              "Multiple medical specialties in one platform",
              "Secure and user-friendly interface",
              "Time-saving and hassle-free experience"
            ].map((offer, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                  ✓
                </span>
                {offer}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Vision & Mission */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl bg-slate-900 p-10 text-white shadow-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-2xl">
            👁️
          </div>
          <h2 className="text-2xl font-bold">Our Vision</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Our vision is to become a trusted digital healthcare partner by making medical services accessible to everyone, anytime and anywhere.
          </p>
        </div>
        <div className="rounded-3xl bg-brand-600 p-10 text-white shadow-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
            🚀
          </div>
          <h2 className="text-2xl font-bold">Our Mission</h2>
          <p className="mt-4 text-brand-50 leading-relaxed">
            Our mission is to improve patient experience by providing a smart, reliable, and efficient healthcare booking system that connects people with the right medical professionals without delay.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-10">
        <h2 className="text-2xl font-bold text-slate-900">Ready to book your first appointment?</h2>
        <div className="mt-6 flex justify-center gap-4">
          <Link to="/" className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white shadow-lg hover:bg-brand-700">
            Find a Doctor
          </Link>
          <Link to="/auth" className="rounded-xl border border-slate-200 bg-white px-8 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            Join Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
