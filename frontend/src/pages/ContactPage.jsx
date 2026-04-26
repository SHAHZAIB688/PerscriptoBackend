import { useState } from "react";
import toast from "react-hot-toast";
import { MailIcon, PhoneIcon, MapPinIcon, ClockIcon } from "../icons";

const ContactPage = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Construct WhatsApp Message
    const whatsappMsg = `Hi Prescripto Team! \n\nI am *${form.name}*.\n*Email:* ${form.email}\n*Subject:* ${form.subject}\n\n*Message:* ${form.message}`;
    const whatsappUrl = `https://wa.me/923081830956?text=${encodeURIComponent(whatsappMsg)}`;

    // Simulate API call and redirect to WhatsApp
    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
      toast.success("Redirecting to WhatsApp for notification...");
      setForm({ name: "", email: "", subject: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 px-8 py-24 text-white shadow-2xl lg:px-16">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-brand-300 backdrop-blur-md border border-white/10">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse"></span>
            Get In Touch
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">Contact Us</h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300 md:text-xl">
            Have questions about Prescripto? Our team is here to help you navigate your healthcare journey.
          </p>
        </div>
        {/* Decorations */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="space-y-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">How can we help?</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Whether you're a patient looking for care or a doctor interested in joining our platform, we're ready to assist you.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: MailIcon, label: "Email Us", val: "mawaisacu@gmail.com" },
              { icon: PhoneIcon, label: "Call Us", val: "+92 308 1830956" },
              { icon: MapPinIcon, label: "Visit Us", val: "Tufail Road Saddar Lahore Cantt." },
              { icon: ClockIcon, label: "Office Hours", val: "Mon - Fri, 9am - 6pm" }
            ].map((item, i) => (
              <div key={i} className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-brand-200 hover:shadow-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:scale-110 duration-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{item.label}</h4>
                <p className="mt-2 font-bold text-slate-900">{item.val}</p>
              </div>
            ))}
          </div>

          {/* Interactive Map */}
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 h-72 relative shadow-2xl group">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215707164172!2d-73.9878436!3d40.7579747!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1714144444444"
              className="w-full h-full grayscale-[0.5] transition-all duration-700 group-hover:grayscale-0 contrast-[1.1]"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Prescripto Location"
            ></iframe>
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem]" />
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-2xl md:p-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Send us a Message</h3>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="john@example.com"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Subject</label>
              <input
                name="subject"
                value={form.subject}
                onChange={onChange}
                placeholder="How can we help you?"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Your Message</label>
              <textarea
                name="message"
                rows="5"
                value={form.message}
                onChange={onChange}
                placeholder="Write your message here..."
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-50 resize-none"
              ></textarea>
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-2xl bg-brand-600 py-5 text-sm font-bold text-white shadow-xl shadow-brand-100 transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Sending Message..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
