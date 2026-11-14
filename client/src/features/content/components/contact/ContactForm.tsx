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
import { ContactFormData, contactFormSchema } from "@/features/content/schemas";
import { errorToast, successToast } from "@/helpers";
import { submitContactMessage } from "@/features/content/api";
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

  const onSubmit = async (data: ContactFormData): Promise<void> => {
    try {
      await submitContactMessage(data);
      successToast("Message submitted successfully.");
      form.reset();
    } catch (error) {
      errorToast(error instanceof Error ? error.message : "Could not submit your message.");
    }
  };

  // Helper to format labels from camelCase (e.g., firstName -> First Name)
  const formatLabel = (name: string) =>
    name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  return (
    <div className="h-full min-w-0 bg-white">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="min-w-0 space-y-8 p-5 md:space-y-10 sm:p-8 md:p-12 lg:p-16"
        >
          <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 md:gap-x-10 md:gap-y-8">
            {(["firstName", "lastName", "phone", "email"] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="mb-1.5 inline-block text-sm font-medium text-slate-700">
                      {formatLabel(name)} <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter ${formatLabel(name)}`}
                        className="h-11 rounded-none border-0 border-b-2 border-gray-100 px-0 text-base font-normal text-foreground transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 sm:h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-normal capitalize" />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="mb-1.5 inline-block text-sm font-medium text-slate-700">
                  Your Message
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your message here..."
                    className="min-h-[140px] resize-none rounded-2xl border-2 border-gray-100 bg-gray-50/50 p-4 text-base font-normal text-foreground transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 sm:min-h-[150px] sm:p-5"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-sm font-normal capitalize" />
              </FormItem>
            )}
          />

          <div className="flex justify-start pt-4">
            <CustomButton
              ctaText={form.formState.isSubmitting ? "Sending..." : "Send Message"}
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full md:w-auto h-11 sm:h-14 px-8 sm:px-12 bg-black text-white hover:bg-primary transition-all duration-300 font-black uppercase text-xs sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] rounded-md shadow-lg hover:shadow-primary/20"
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ContactForm;
