import FancyHeading from "@/components/shared/FancyHeading";
import ContactForm from "@/features/content/components/contact/ContactForm";
import ContactInfo from "@/features/content/components/contact/ContactInfo";

const Contact = () => {
  return (
    <div className="relative mt-8 md:mt-14 mb-12 md:mb-20 container">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[300px] h-[240px] sm:h-[300px] bg-primary/5 blur-[120px] -z-10 rounded-full" />

      <FancyHeading text={"Get In Touch"} as="h1" className="text-2xl lg:text-3xl" />

      <div className="mx-auto mt-8 grid min-w-0 max-w-7xl grid-cols-1 overflow-hidden rounded-md border border-gray-100 shadow-2xl shadow-gray-200/50 lg:mt-10 lg:grid-cols-12">
        {/* Contact Info - Taking 4/12 columns */}
        <div className="min-w-0 lg:col-span-4">
          <ContactInfo />
        </div>

        {/* Contact Form - Taking 8/12 columns */}
        <div className="min-w-0 bg-white lg:col-span-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
};

export default Contact;
