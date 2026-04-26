const TermsPage = () => {
  const sections = [
    {
      title: "Introduction",
      content: "Welcome to Prescripto (“we”, “our”, “us”). These Terms and Conditions govern your use of our website, mobile platform, and services. By accessing or using Prescripto, you agree to comply with and be legally bound by these terms. If you do not agree with any part of these Terms, you should not use our services."
    },
    {
      title: "Eligibility",
      content: "To use Prescripto, you must be at least 18 years old, or using the platform under parental/guardian supervision. You must provide accurate, complete, and truthful information during registration and comply with all applicable local, national, and international laws."
    },
    {
      title: "Account Registration",
      content: "To access certain features, users may need to create an account. You agree to provide correct and updated information, maintain confidentiality of your login credentials, and accept responsibility for all activities under your account."
    },
    {
      title: "Use of Services",
      content: "Prescripto provides an online system for searching doctors, booking appointments, managing medical consultations, and viewing doctor profiles. Any misuse, including fraudulent bookings, spamming, or system abuse, is strictly prohibited."
    },
    {
      title: "Doctor Listings and Verification",
      content: "We strive to ensure all doctors are qualified and verified. However, we do not guarantee absolute accuracy of all credentials. Doctors are independent professionals and final responsibility of medical consultation lies with the doctor and patient."
    },
    {
      title: "Appointment Booking System",
      content: "Appointments are subject to doctor availability and confirmation is not guaranteed until approved. Users must arrive on time or follow the cancellation policy. Prescripto is not responsible for delays or rescheduling by doctors."
    },
    {
      title: "Cancellations and Rescheduling",
      content: "Cancellations must be made within the allowed time frame. Late cancellations may result in partial or no refund. Doctors may also cancel or reschedule appointments due to emergencies."
    },
    {
      title: "Payments (If Applicable)",
      content: "If paid services are introduced, all payments must be made through authorized methods. Prices may vary depending on doctor and service type. Refunds will be processed according to platform policy."
    },
    {
      title: "Medical Disclaimer",
      content: "Prescripto is not a medical service provider. We do not provide medical advice or treatment. Any diagnosis or treatment is the responsibility of the doctor. Always consult qualified medical professionals."
    },
    {
      title: "User Responsibilities",
      content: "Users agree to use the platform responsibly and ethically, provide accurate medical information, and respect healthcare professionals. Any violation may result in account suspension or legal action."
    },
    {
      title: "Prohibited Activities",
      content: "Users are strictly prohibited from creating fake accounts, misusing the booking system, harassing doctors, attempting to hack the platform, or sharing false information."
    },
    {
      title: "Privacy and Data Protection",
      content: "We collect and store personal data to improve services. We ensure secure storage and limited access, but users acknowledge that no system is 100% secure."
    },
    {
      title: "Third-Party Services",
      content: "Prescripto may integrate third-party tools like payment gateways or analytics. We are not responsible for the content, policies, or actions of these third-party services."
    },
    {
      title: "Limitation of Liability",
      content: "Prescripto shall not be held responsible for medical outcomes, errors in doctor availability, technical issues, downtime, or loss of data. Use of the platform is at your own risk."
    },
    {
      title: "Platform Availability",
      content: "We strive for 24/7 availability, but do not guarantee uninterrupted service. Maintenance or updates may temporarily affect availability, and we may suspend services for operational reasons."
    },
    {
      title: "Intellectual Property Rights",
      content: "All content including logos, design, text, software, and graphics is the property of Prescripto. Users are not allowed to copy, modify, or distribute any content without permission."
    },
    {
      title: "Termination of Account",
      content: "We reserve the right to suspend or terminate accounts without prior notice for violations of terms, misuse, fraud, or legal reasons."
    },
    {
      title: "Changes to Terms",
      content: "Prescripto may update these Terms at any time. Users will be notified of major changes. Continued use of the platform means acceptance of the updated terms."
    },
    {
      title: "Governing Law",
      content: "These Terms shall be governed by applicable laws of the jurisdiction in which Prescripto operates. Any disputes will be handled according to legal procedures."
    },
    {
      title: "Contact Information",
      content: "For any questions regarding these Terms, contact support at mawaisacu@gmail.com or visit www.prescripto.com."
    }
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section - Matching AboutPage */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-20 text-white shadow-2xl lg:px-16">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-4 py-2 text-sm font-bold text-brand-400 backdrop-blur-md border border-brand-500/20">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
            Legal Documentation
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">Terms and Conditions</h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300 md:text-xl">
            Please read these terms carefully before using our platform. By accessing Prescripto, you agree to be bound by these legal guidelines.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-600/20 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-cyan-600/10 blur-[100px]" />
      </section>

      {/* Content Section */}
      <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              id={`section-${index + 1}`}
              className="group rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-brand-200 hover:shadow-xl"
            >
              <div className="flex items-start gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-lg font-bold text-slate-400 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  {index + 1}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {section.title}
                  </h2>
                  <p className="mt-4 leading-relaxed text-slate-600">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Navigation */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm custom-scrollbar">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Quick Navigation</h3>
            <nav className="flex flex-col gap-2.5">
              {sections.map((section, i) => (
                <a
                  key={i}
                  href={`#section-${i + 1}`}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
                >
                  <span className="mr-2 text-[10px] text-slate-300">0{i + 1}</span>
                  {section.title}
                </a>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="rounded-2xl bg-brand-50 p-5 text-center">
                <p className="text-xs font-bold text-brand-600 mb-1">Need help?</p>
                <p className="text-[10px] text-brand-500 mb-3">Our support team is here for you 24/7.</p>
                <a href="mailto:mawaisacu@gmail.com" className="text-xs font-bold text-brand-700 underline">Contact Support</a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Note */}
      <section className="rounded-[2rem] bg-slate-50 p-12 text-center border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900">Acceptance of Terms</h2>
        <p className="mt-4 mx-auto max-w-2xl text-slate-600">
          By continuing to use Prescripto, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
        </p>
        <div className="mt-8 text-sm text-slate-400 font-medium">
          Last Updated: April 26, 2026
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
