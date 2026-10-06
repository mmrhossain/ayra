import ContactForm from "@/features/content/components/contact/ContactForm";
import FancyHeading from "@/components/shared/FancyHeading";
import ContactInfo from "@/features/content/components/contact/ContactInfo";

const Contact = () => {
  return (
    <div className="relative mt-8 md:mt-14 mb-12 md:mb-20 container">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[300px] h-[240px] sm:h-[300px] bg-primary/5 blur-[120px] -z-10 rounded-full" />

      <FancyHeading text={"Get In Touch"} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 mt-8 md:mt-10 max-w-7xl mx-auto shadow-2xl shadow-gray-200/50 rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden border border-gray-100">
        {/* Contact Info - Taking 4/12 columns */}
        <div className="lg:col-span-4 h-full">
          <ContactInfo />
        </div>

        {/* Contact Form - Taking 8/12 columns */}
        <div className="lg:col-span-8 bg-white h-full">
          <ContactForm />
        </div>
      </div>
    </div>
  );
};

export default Contact;
