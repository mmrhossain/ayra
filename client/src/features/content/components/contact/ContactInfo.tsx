import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { AiFillTikTok } from "react-icons/ai";
import Link from "next/link";

const ContactInfo: React.FC = () => {
    return (
        <div className="bg-primary text-white h-full p-5 sm:p-8 md:p-12 flex flex-col justify-between space-y-10 md:space-y-12">
            <div>
                <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight lg:tracking-tighter mb-6 md:mb-8">Contact Information</h2>
                
                <div className="space-y-6 md:space-y-8">
                    <div className="flex items-start gap-4 group">
                        <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-primary transition-all duration-300">
                            <FiPhone size={22} />
                        </div>
                        <div>
                            <p className="text-xs uppercase font-black tracking-widest text-white/60 mb-1">Call Us</p>
                            <Link href="tel:+01234567890" className="text-base md:text-lg font-bold hover:underline">+880 1703-581774</Link>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                        <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-primary transition-all duration-300">
                            <FiMail size={22} />
                        </div>
                        <div>
                            <p className="text-xs uppercase font-black tracking-widest text-white/60 mb-1">Email Us</p>
                            <Link href="mailto:info@raangalay.com" className="text-base md:text-lg font-bold hover:underline break-all">info@raangalay.com</Link>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                        <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-primary transition-all duration-300">
                            <FiMapPin size={22} />
                        </div>
                        <div>
                            <p className="text-xs uppercase font-black tracking-widest text-white/60 mb-1">Address</p>
                            <p className="text-sm lg:text-base font-medium leading-relaxed">
                                Gulshan-2, Dhaka<br /> Bangladesh
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] md:tracking-widest text-white/60 mb-4">Social Presence</p>
                <div className="flex gap-4">
                    {[
                        { icon: <FaFacebookF />, href: "https://facebook.com/raangalay" },
                        { icon: <AiFillTikTok />, href: "https://tiktok.com/@raangalay" },
                        { icon: <FaInstagram />, href: "https://instagram.com/raangalay" },
                        { icon: <FaYoutube />, href: "https://youtube.com/@raangalay" }
                    ].map((social, i) => (
                        <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white hover:text-primary transition-all duration-300" aria-label="Social link">
                            {social.icon}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default ContactInfo;
