"use client";

import CustomButton from "@/components/shared/CustomButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ContactFormData,
  contactFormSchema,
} from "@/features/content/schemas";
import { successToast } from "@/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";

const ContactForm: React.FC = () => {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (): void => {
    successToast("Message submitted successfully.");
    form.reset();
  };

  // Helper to format labels from camelCase (e.g., firstName -> First Name)
  const formatLabel = (name: string) =>
    name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  return (
    <div className="bg-white h-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-5 sm:p-8 md:p-12 lg:p-16 space-y-8 md:space-y-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 md:gap-x-10 gap-y-6 md:gap-y-8">
            {(["firstName", "lastName", "phone", "email"] as const).map(
              (name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] uppercase font-black tracking-[0.12em] md:tracking-[0.15em] text-gray-400">
                        {formatLabel(name)}{" "}
                        <span className="text-primary">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`Enter ${formatLabel(name)}`}
                          className="h-11 sm:h-12 border-0 border-b-2 border-gray-100 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-gray-200 font-bold text-secondary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-tight" />
                    </FormItem>
                  )}
                />
              ),
            )}
          </div>

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] uppercase font-black tracking-[0.12em] md:tracking-[0.15em] text-gray-400">
                  Your Message
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your message here..."
                    className="min-h-[140px] sm:min-h-[150px] bg-gray-50/50 border-gray-100 border-2 rounded-2xl p-4 sm:p-5 focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-gray-300 resize-none font-medium"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-bold uppercase tracking-tight" />
              </FormItem>
            )}
          />

          <div className="flex justify-start pt-4">
            <CustomButton
              ctaText="Send Message"
              type="submit"
              className="w-full md:w-auto h-11 sm:h-14 px-8 sm:px-12 bg-black text-white hover:bg-primary transition-all duration-300 font-black uppercase text-[10px] sm:text-[11px] tracking-[0.1em] sm:tracking-[0.2em] rounded-full shadow-lg hover:shadow-primary/20"
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ContactForm;
